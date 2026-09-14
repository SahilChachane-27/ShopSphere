import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user, get_current_seller, get_current_admin
from app.models.models import (
    Order, OrderItem, OrderStatus, PaymentStatus, Address, Cart, CartItem, Product, ProductStatus,
    ProductVariant, Inventory, Coupon, CouponUsage, SellerProfile, User, UserRole, InventoryTransaction, InventoryTransactionType, NotificationType
)
from app.schemas.schemas import (
    StandardResponse, PaginatedResponse, CheckoutRequest, OrderOut, OrderStatusUpdate
)
from app.utils.helpers import create_notification, log_audit

router = APIRouter(prefix="/orders", tags=["Orders"])

def generate_order_number() -> str:
    today_str = datetime.utcnow().strftime("%Y%m%d")
    random_hex = uuid.uuid4().hex[:6].upper()
    return f"ORD-{today_str}-{random_hex}"

@router.post("/checkout", response_model=StandardResponse[OrderOut])
async def create_order_from_cart(
    req: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch address
    stmt_addr = select(Address).where(Address.id == req.address_id, Address.user_id == current_user.id)
    res_addr = await db.execute(stmt_addr)
    address = res_addr.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected delivery address not found.")

    addr_snapshot = {
        "full_name": address.full_name,
        "phone": address.phone,
        "street_address": address.street_address,
        "city": address.city,
        "state": address.state,
        "postal_code": address.postal_code,
        "country": address.country
    }

    # 2. Fetch Cart
    stmt_cart = select(Cart).where(Cart.user_id == current_user.id).options(
        selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.inventory),
        selectinload(Cart.items).selectinload(CartItem.variant)
    )
    res_cart = await db.execute(stmt_cart)
    cart = res_cart.scalar_one_or_none()

    if not cart or not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty.")

    # 3. Validate products & inventory, calculate subtotal and tax
    subtotal = 0.0
    total_tax = 0.0
    order_items_data = []

    for ci in cart.items:
        product = ci.product
        if not product or product.status != ProductStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product '{product.name if product else 'Item'}' is no longer available.")
        
        # Check stock
        available_stock = product.inventory.current_stock if product.inventory else 0
        if ci.variant:
            available_stock = ci.variant.stock
        
        if ci.quantity > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insufficient for product '{product.name}'. Available: {available_stock}, Requested: {ci.quantity}"
            )

        unit_price = float(product.discount_price if product.discount_price else product.price)
        if ci.variant and ci.variant.price_override:
            unit_price = float(ci.variant.price_override)

        line_total = unit_price * ci.quantity
        subtotal += line_total
        total_tax += line_total * (float(product.tax_percent) / 100.0)

        order_items_data.append({
            "seller_id": product.seller_id,
            "product_id": product.id,
            "variant_id": ci.variant_id,
            "product_name": product.name,
            "variant_name": ci.variant.name if ci.variant else None,
            "price": unit_price,
            "discount": 0.0,
            "quantity": ci.quantity,
            "total_price": line_total
        })

    # 4. Shipping & Coupon calculation
    shipping_fee = 50.0 if subtotal > 0 and subtotal < 1000.0 else 0.0
    discount_amount = 0.0

    if req.coupon_code:
        stmt_c = select(Coupon).where(Coupon.code == req.coupon_code.upper(), Coupon.is_active == True)
        res_c = await db.execute(stmt_c)
        coupon = res_c.scalar_one_or_none()
        if coupon and coupon.start_date <= datetime.utcnow() <= coupon.expiry_date and subtotal >= float(coupon.minimum_order_value):
            if coupon.discount_type == "PERCENTAGE":
                discount_amount = subtotal * (float(coupon.discount_value) / 100.0)
                if coupon.maximum_discount:
                    discount_amount = min(discount_amount, float(coupon.maximum_discount))
            else:
                discount_amount = float(coupon.discount_value)
            discount_amount = min(discount_amount, subtotal)
            coupon.used_count += 1
            db.add(coupon)

    grand_total = subtotal + total_tax + shipping_fee - discount_amount
    initial_payment_status = PaymentStatus.COD if req.payment_method.value == "COD" else PaymentStatus.UNPAID
    initial_order_status = OrderStatus.CONFIRMED if req.payment_method.value == "COD" else OrderStatus.PENDING

    # 5. Create Order
    order = Order(
        order_number=generate_order_number(),
        customer_id=current_user.id,
        address_id=address.id,
        shipping_address_json=addr_snapshot,
        subtotal=round(subtotal, 2),
        discount=round(discount_amount, 2),
        tax=round(total_tax, 2),
        shipping_fee=round(shipping_fee, 2),
        total=round(max(0.0, grand_total), 2),
        payment_status=initial_payment_status,
        order_status=initial_order_status,
        notes=req.notes
    )
    db.add(order)
    await db.flush()

    # Create OrderItems
    for oi in order_items_data:
        item = OrderItem(
            order_id=order.id,
            status=initial_order_status,
            **oi
        )
        db.add(item)

    # Record Coupon usage if applied
    if req.coupon_code and discount_amount > 0 and 'coupon' in locals() and coupon:
        usage = CouponUsage(
            coupon_id=coupon.id,
            user_id=current_user.id,
            order_id=order.id,
            discount_amount=discount_amount
        )
        db.add(usage)

    # For COD, reserve/reduce inventory immediately
    if req.payment_method.value == "COD":
        for oi in order_items_data:
            stmt_inv = select(Inventory).where(Inventory.product_id == oi["product_id"]).with_for_update()
            res_inv = await db.execute(stmt_inv)
            inv = res_inv.scalar_one_or_none()
            if inv:
                inv.current_stock = max(0, inv.current_stock - oi["quantity"])
                inv.sold_quantity += oi["quantity"]
                db.add(inv)
                # Tx record
                tx = InventoryTransaction(
                    inventory_id=inv.id,
                    transaction_type=InventoryTransactionType.SALE,
                    quantity_change=-oi["quantity"],
                    notes=f"COD Order {order.order_number}"
                )
                db.add(tx)

        # Clear cart for COD
        stmt_del_items = select(CartItem).where(CartItem.cart_id == cart.id)
        res_del = await db.execute(stmt_del_items)
        for citem in res_del.scalars().all():
            await db.delete(citem)

        await create_notification(
            db, current_user.id, NotificationType.ORDER_CONFIRMED,
            "Order Confirmed!", f"Your COD order {order.order_number} has been placed successfully."
        )

    await db.commit()

    # Load complete order
    stmt_full = select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    res_full = await db.execute(stmt_full)
    full_order = res_full.scalar_one()

    return StandardResponse(message="Order created successfully", data=OrderOut.model_validate(full_order))

@router.get("", response_model=StandardResponse[List[OrderOut]])
async def get_customer_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).where(Order.customer_id == current_user.id).options(
        selectinload(Order.items)
    ).order_by(desc(Order.created_at))
    res = await db.execute(stmt)
    orders = res.scalars().all()
    return StandardResponse(data=[OrderOut.model_validate(o) for o in orders])

@router.get("/{order_id}", response_model=StandardResponse[OrderOut])
async def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role == UserRole.CUSTOMER and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return StandardResponse(data=OrderOut.model_validate(order))

@router.post("/{order_id}/cancel", response_model=StandardResponse[OrderOut])
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).where(Order.id == order_id).options(selectinload(Order.items)).with_for_update()
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role == UserRole.CUSTOMER and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if order.order_status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Order cannot be cancelled in status '{order.order_status}'.")

    order.order_status = OrderStatus.CANCELLED
    for item in order.items:
        item.status = OrderStatus.CANCELLED
        # Restore stock if payment was made or COD confirmed
        if order.payment_status in [PaymentStatus.PAID, PaymentStatus.COD]:
            stmt_inv = select(Inventory).where(Inventory.product_id == item.product_id).with_for_update()
            res_inv = await db.execute(stmt_inv)
            inv = res_inv.scalar_one_or_none()
            if inv:
                inv.current_stock += item.quantity
                inv.sold_quantity = max(0, inv.sold_quantity - item.quantity)
                db.add(inv)
                tx = InventoryTransaction(
                    inventory_id=inv.id,
                    transaction_type=InventoryTransactionType.CANCELLATION,
                    quantity_change=item.quantity,
                    notes=f"Order Cancelled: {order.order_number}"
                )
                db.add(tx)

    db.add(order)
    await db.commit()
    await db.refresh(order)
    return StandardResponse(message="Order cancelled successfully", data=OrderOut.model_validate(order))

# Seller Order Management
@router.get("/seller/list", response_model=StandardResponse[List[OrderOut]])
async def get_seller_orders(
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).join(OrderItem, Order.id == OrderItem.order_id).where(
        OrderItem.seller_id == seller.id
    ).options(selectinload(Order.items)).distinct().order_by(desc(Order.created_at))
    res = await db.execute(stmt)
    orders = res.scalars().all()
    return StandardResponse(data=[OrderOut.model_validate(o) for o in orders])

@router.put("/seller/{order_id}/status", response_model=StandardResponse[OrderOut])
async def update_seller_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Update seller items in this order
    for item in order.items:
        if item.seller_id == seller.id:
            item.status = status_in.order_status
            db.add(item)
    
    # Update global order status if all items match or updated
    order.order_status = status_in.order_status
    db.add(order)
    await db.commit()
    await db.refresh(order)

    await create_notification(
        db, order.customer_id, NotificationType.ORDER_SHIPPED if status_in.order_status == OrderStatus.SHIPPED else NotificationType.SYSTEM_NOTIFICATION,
        f"Order Status Update: {status_in.order_status}", f"Your order {order.order_number} status is now {status_in.order_status}."
    )

    return StandardResponse(message="Order status updated", data=OrderOut.model_validate(order))
