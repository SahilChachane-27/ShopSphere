from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_admin
from app.models.models import (
    User, UserRole, SellerProfile, SellerApprovalStatus, Product, Order, OrderStatus,
    Payment, PaymentStatus, Inventory, AuditLog, NotificationType
)
from app.schemas.schemas import (
    StandardResponse, UserOut, SellerProfileOut, DashboardMetrics, AuditLogOut, SellerApprovalUpdate
)
from app.utils.helpers import create_notification, log_audit

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/dashboard", response_model=StandardResponse[dict])
async def get_admin_dashboard_metrics(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Total Users & Roles
    users_cnt = await db.execute(select(func.count(User.id)))
    total_users = users_cnt.scalar() or 0

    sellers_cnt = await db.execute(select(func.count(SellerProfile.id)))
    total_sellers = sellers_cnt.scalar() or 0

    pending_sellers_cnt = await db.execute(select(func.count(SellerProfile.id)).where(SellerProfile.approval_status == SellerApprovalStatus.PENDING))
    pending_sellers = pending_sellers_cnt.scalar() or 0

    # Total Products
    prod_cnt = await db.execute(select(func.count(Product.id)))
    total_products = prod_cnt.scalar() or 0

    # Total Orders & GMV Revenue
    orders_cnt = await db.execute(select(func.count(Order.id)))
    total_orders = orders_cnt.scalar() or 0

    rev_res = await db.execute(select(func.sum(Order.total)).where(Order.order_status != OrderStatus.CANCELLED))
    total_revenue = float(rev_res.scalar() or 0.0)

    pending_orders_res = await db.execute(select(func.count(Order.id)).where(Order.order_status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING])))
    pending_orders = pending_orders_res.scalar() or 0

    completed_orders_res = await db.execute(select(func.count(Order.id)).where(Order.order_status == OrderStatus.DELIVERED))
    completed_orders = completed_orders_res.scalar() or 0

    # Low stock
    low_stock_res = await db.execute(select(func.count(Inventory.id)).where(Inventory.current_stock <= Inventory.min_threshold))
    low_stock_count = low_stock_res.scalar() or 0

    return StandardResponse(data={
        "metrics": {
            "total_users": total_users,
            "total_sellers": total_sellers,
            "pending_sellers": pending_sellers,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "low_stock_count": low_stock_count
        }
    })

@router.get("/users", response_model=StandardResponse[List[UserOut]])
async def list_all_users(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).order_by(desc(User.created_at))
    res = await db.execute(stmt)
    users = res.scalars().all()
    return StandardResponse(data=[UserOut.model_validate(u) for u in users])

@router.put("/users/{user_id}/status", response_model=StandardResponse[UserOut])
async def toggle_user_status(
    user_id: int,
    status_in: dict,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    is_active = status_in.get("is_active", True)
    user.is_active = is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await log_audit(db, "USER_STATUS_TOGGLE", "users", user_id=admin.id, entity_id=str(user.id), details={"is_active": is_active})

    return StandardResponse(message=f"User status set to {'Active' if is_active else 'Suspended'}", data=UserOut.model_validate(user))

@router.get("/sellers", response_model=StandardResponse[List[SellerProfileOut]])
async def list_all_sellers(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SellerProfile).order_by(desc(SellerProfile.created_at))
    res = await db.execute(stmt)
    sellers = res.scalars().all()
    return StandardResponse(data=[SellerProfileOut.model_validate(s) for s in sellers])

@router.put("/sellers/{seller_id}/approval", response_model=StandardResponse[SellerProfileOut])
async def update_seller_approval(
    seller_id: int,
    approval_in: SellerApprovalUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SellerProfile).where(SellerProfile.id == seller_id)
    res = await db.execute(stmt)
    seller = res.scalar_one_or_none()
    if not seller:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seller profile not found")

    seller.approval_status = approval_in.approval_status
    db.add(seller)
    await db.commit()
    await db.refresh(seller)

    notif_type = NotificationType.SELLER_APPROVED if approval_in.approval_status == SellerApprovalStatus.APPROVED else NotificationType.SELLER_REJECTED
    await create_notification(
        db, seller.user_id, notif_type,
        f"Seller Application {approval_in.approval_status.value}",
        f"Your seller account application has been {approval_in.approval_status.value.lower()} by platform admin."
    )

    await log_audit(db, f"SELLER_{approval_in.approval_status.value}", "seller_profiles", user_id=admin.id, entity_id=str(seller.id))

    return StandardResponse(message=f"Seller status updated to {approval_in.approval_status.value}", data=SellerProfileOut.model_validate(seller))

@router.get("/audit-logs", response_model=StandardResponse[List[AuditLogOut]])
async def list_audit_logs(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(100)
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return StandardResponse(data=[AuditLogOut.model_validate(l) for l in logs])
