import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user, get_current_admin
from app.models.models import (
    Order, OrderItem, OrderStatus, Payment, PaymentAttempt, PaymentStatus, PaymentMethod,
    Cart, CartItem, Inventory, InventoryTransaction, InventoryTransactionType, User, UserRole, NotificationType
)
from app.schemas.schemas import (
    StandardResponse, PaymentCreateRequest, PaymentProcessRequest, PaymentOut
)
from app.utils.helpers import create_notification, log_audit

router = APIRouter(prefix="/payments", tags=["Simulated Payment Gateway"])

def generate_transaction_id() -> str:
    today_str = datetime.utcnow().strftime("%Y%m%d")
    rand_id = uuid.uuid4().hex[:6].upper()
    return f"SIM-TXN-{today_str}-{rand_id}"

@router.post("/create", response_model=StandardResponse[dict])
async def create_payment_intent(
    req: PaymentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Order).where(Order.id == req.order_id).options(selectinload(Order.items))
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role == UserRole.CUSTOMER and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    txn_id = generate_transaction_id()
    payment = Payment(
        order_id=order.id,
        user_id=current_user.id,
        payment_method=req.payment_method,
        transaction_id=txn_id,
        amount=order.total,
        currency="INR",
        status=PaymentStatus.PENDING
    )
    db.add(payment)
    await db.flush()

    # Record PaymentAttempt history
    attempt_count_stmt = select(PaymentAttempt).where(PaymentAttempt.order_id == order.id)
    attempt_res = await db.execute(attempt_count_stmt)
    attempts = attempt_res.scalars().all()
    attempt_no = len(attempts) + 1

    attempt = PaymentAttempt(
        order_id=order.id,
        payment_id=payment.id,
        attempt_number=attempt_no,
        payment_method=req.payment_method,
        status=PaymentStatus.PENDING,
        transaction_id=txn_id
    )
    db.add(attempt)
    await db.commit()

    return StandardResponse(
        message="Simulated payment initiated",
        data={
            "payment_id": payment.id,
            "order_id": order.id,
            "order_number": order.order_number,
            "transaction_id": txn_id,
            "status": "PENDING",
            "amount": float(order.total),
            "currency": "INR",
            "payment_method": req.payment_method.value
        }
    )

@router.post("/process", response_model=StandardResponse[dict])
async def process_simulated_payment(
    req: PaymentProcessRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Payment).where(Payment.id == req.payment_id).options(selectinload(Payment.order))
    res = await db.execute(stmt)
    payment = res.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")

    order = payment.order
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated order not found")

    # Fetch latest attempt
    stmt_att = select(PaymentAttempt).where(PaymentAttempt.payment_id == payment.id)
    att_res = await db.execute(stmt_att)
    attempt = att_res.scalar_one_or_none()

    if req.result == PaymentStatus.SUCCESS:
        payment.status = PaymentStatus.SUCCESS
        order.payment_status = PaymentStatus.PAID
        order.order_status = OrderStatus.CONFIRMED

        if attempt:
            attempt.status = PaymentStatus.SUCCESS

        # Reduce inventory for online payments
        stmt_items = select(OrderItem).where(OrderItem.order_id == order.id)
        items_res = await db.execute(stmt_items)
        items = items_res.scalars().all()

        for item in items:
            stmt_inv = select(Inventory).where(Inventory.product_id == item.product_id).with_for_update()
            inv_res = await db.execute(stmt_inv)
            inv = inv_res.scalar_one_or_none()
            if inv:
                inv.current_stock = max(0, inv.current_stock - item.quantity)
                inv.sold_quantity += item.quantity
                db.add(inv)
                tx = InventoryTransaction(
                    inventory_id=inv.id,
                    transaction_type=InventoryTransactionType.SALE,
                    quantity_change=-item.quantity,
                    notes=f"Simulated Payment Success Order: {order.order_number}"
                )
                db.add(tx)

        # Clear customer cart
        stmt_cart = select(Cart).where(Cart.user_id == order.customer_id)
        cart_res = await db.execute(stmt_cart)
        cart = cart_res.scalar_one_or_none()
        if cart:
            stmt_del = select(CartItem).where(CartItem.cart_id == cart.id)
            del_res = await db.execute(stmt_del)
            for ci in del_res.scalars().all():
                await db.delete(ci)

        await create_notification(
            db, order.customer_id, NotificationType.PAYMENT_SUCCESS,
            "Payment Successful!", f"Payment of ₹{order.total} for Order #{order.order_number} was successful."
        )

    elif req.result == PaymentStatus.FAILED:
        payment.status = PaymentStatus.FAILED
        payment.failure_reason = "User simulated payment failure"
        order.payment_status = PaymentStatus.FAILED
        if attempt:
            attempt.status = PaymentStatus.FAILED
            attempt.failure_reason = "User simulated payment failure"

        await create_notification(
            db, order.customer_id, NotificationType.PAYMENT_FAILED,
            "Payment Failed", f"Payment for Order #{order.order_number} failed. You can retry payment."
        )
    else: # PENDING
        payment.status = PaymentStatus.PENDING
        order.payment_status = PaymentStatus.PENDING
        if attempt:
            attempt.status = PaymentStatus.PENDING

    db.add(payment)
    db.add(order)
    if attempt:
        db.add(attempt)
    await db.commit()

    return StandardResponse(
        message=f"Simulated payment result recorded as {req.result.value}",
        data={
            "payment_id": payment.id,
            "order_id": order.id,
            "order_number": order.order_number,
            "transaction_id": payment.transaction_id,
            "payment_status": payment.status.value,
            "order_status": order.order_status.value,
            "amount": float(payment.amount)
        }
    )

@router.get("/order/{order_id}", response_model=StandardResponse[List[PaymentOut]])
async def get_order_payments(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Payment).where(Payment.order_id == order_id).order_by(Payment.created_at.desc())
    res = await db.execute(stmt)
    payments = res.scalars().all()
    return StandardResponse(data=[PaymentOut.model_validate(p) for p in payments])
