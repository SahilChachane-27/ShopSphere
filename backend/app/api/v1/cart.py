from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.models import Cart, CartItem, Product, ProductStatus, ProductVariant, Inventory, User
from app.schemas.schemas import StandardResponse, CartOut, CartItemAdd, CartItemUpdate, CartItemOut

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])

async def get_or_create_cart(user_id: int, db: AsyncSession) -> Cart:
    stmt = select(Cart).where(Cart.user_id == user_id).options(
        selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
        selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.inventory),
        selectinload(Cart.items).selectinload(CartItem.variant)
    )
    res = await db.execute(stmt)
    cart = res.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
        return await get_or_create_cart(user_id, db)
    return cart

def calculate_cart_totals(cart: Cart) -> CartOut:
    items_out = []
    subtotal = 0.0
    total_tax = 0.0

    for ci in cart.items:
        prod = ci.product
        if not prod or prod.status != ProductStatus.ACTIVE:
            continue
        
        unit_price = float(prod.discount_price if prod.discount_price else prod.price)
        if ci.variant and ci.variant.price_override:
            unit_price = float(ci.variant.price_override)
        
        item_total = unit_price * ci.quantity
        subtotal += item_total
        tax_amt = item_total * (float(prod.tax_percent) / 100.0)
        total_tax += tax_amt

        c_item_out = CartItemOut(
            id=ci.id,
            product_id=ci.product_id,
            variant_id=ci.variant_id,
            quantity=ci.quantity,
            unit_price=unit_price,
            total_price=item_total,
            product=ci.product,
            variant=ci.variant
        )
        items_out.append(c_item_out)

    shipping = 50.0 if subtotal > 0 and subtotal < 1000.0 else 0.0
    discount = 0.0
    grand_total = subtotal + total_tax + shipping - discount

    return CartOut(
        id=cart.id,
        user_id=cart.user_id,
        items=items_out,
        subtotal=round(subtotal, 2),
        discount=round(discount, 2),
        tax=round(total_tax, 2),
        shipping=round(shipping, 2),
        total=round(max(0.0, grand_total), 2)
    )

@router.get("", response_model=StandardResponse[CartOut])
async def get_user_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(current_user.id, db)
    return StandardResponse(data=calculate_cart_totals(cart))

@router.post("/items", response_model=StandardResponse[CartOut])
async def add_item_to_cart(
    item_in: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(current_user.id, db)

    # Validate product
    stmt_p = select(Product).where(Product.id == item_in.product_id).options(selectinload(Product.inventory))
    res_p = await db.execute(stmt_p)
    product = res_p.scalar_one_or_none()

    if not product or product.status != ProductStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product is unavailable or inactive.")

    # Check inventory
    available_stock = product.inventory.current_stock if product.inventory else 0
    if item_in.variant_id:
        stmt_v = select(ProductVariant).where(ProductVariant.id == item_in.variant_id)
        res_v = await db.execute(stmt_v)
        variant = res_v.scalar_one_or_none()
        if not variant or not variant.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected variant is unavailable.")
        available_stock = variant.stock

    # Check existing item in cart
    stmt_item = select(CartItem).where(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item_in.product_id,
        CartItem.variant_id == item_in.variant_id
    )
    res_item = await db.execute(stmt_item)
    existing_item = res_item.scalar_one_or_none()

    new_qty = item_in.quantity
    if existing_item:
        new_qty += existing_item.quantity

    if new_qty > available_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity ({new_qty}) exceeds available stock ({available_stock})."
        )

    if existing_item:
        existing_item.quantity = new_qty
        db.add(existing_item)
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_in.product_id,
            variant_id=item_in.variant_id,
            quantity=item_in.quantity
        )
        db.add(cart_item)

    await db.commit()
    cart = await get_or_create_cart(current_user.id, db)
    return StandardResponse(message="Item added to cart", data=calculate_cart_totals(cart))

@router.put("/items/{item_id}", response_model=StandardResponse[CartOut])
async def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(current_user.id, db)
    stmt = select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id).options(
        selectinload(CartItem.product).selectinload(Product.inventory),
        selectinload(CartItem.variant)
    )
    res = await db.execute(stmt)
    cart_item = res.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    available_stock = cart_item.product.inventory.current_stock if cart_item.product.inventory else 0
    if cart_item.variant:
        available_stock = cart_item.variant.stock

    if item_in.quantity > available_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot set quantity to {item_in.quantity}. Only {available_stock} items available."
        )

    cart_item.quantity = item_in.quantity
    db.add(cart_item)
    await db.commit()
    cart = await get_or_create_cart(current_user.id, db)
    return StandardResponse(message="Cart item updated", data=calculate_cart_totals(cart))

@router.delete("/items/{item_id}", response_model=StandardResponse[CartOut])
async def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(current_user.id, db)
    stmt = select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    res = await db.execute(stmt)
    cart_item = res.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    await db.delete(cart_item)
    await db.commit()
    cart = await get_or_create_cart(current_user.id, db)
    return StandardResponse(message="Cart item removed", data=calculate_cart_totals(cart))

@router.delete("", response_model=StandardResponse[dict])
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(current_user.id, db)
    stmt = select(CartItem).where(CartItem.cart_id == cart.id)
    res = await db.execute(stmt)
    for ci in res.scalars().all():
        await db.delete(ci)
    await db.commit()
    return StandardResponse(message="Cart cleared", data={})
