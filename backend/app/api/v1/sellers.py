from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_seller, get_current_user
from app.models.models import (
    SellerProfile, Product, Order, OrderItem, OrderStatus, Inventory, SellerPayout, User
)
from app.schemas.schemas import StandardResponse, SellerProfileOut, DashboardMetrics

router = APIRouter(prefix="/sellers", tags=["Seller Panel"])

@router.get("/me", response_model=StandardResponse[SellerProfileOut])
async def get_seller_profile(seller: SellerProfile = Depends(get_current_seller)):
    return StandardResponse(data=SellerProfileOut.model_validate(seller))

@router.put("/me", response_model=StandardResponse[SellerProfileOut])
async def update_seller_profile(
    profile_in: dict,
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    for k in ["store_description", "store_logo", "store_banner", "business_phone", "tax_id"]:
        if k in profile_in and profile_in[k] is not None:
            setattr(seller, k, profile_in[k])

    db.add(seller)
    await db.commit()
    await db.refresh(seller)
    return StandardResponse(message="Seller profile updated", data=SellerProfileOut.model_validate(seller))

@router.get("/me/analytics", response_model=StandardResponse[DashboardMetrics])
async def get_seller_dashboard_analytics(
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    # Total Products
    p_cnt_stmt = select(func.count(Product.id)).where(Product.seller_id == seller.id)
    p_cnt_res = await db.execute(p_cnt_stmt)
    total_products = p_cnt_res.scalar() or 0

    # Total Orders & Revenue belonging ONLY to this seller
    items_stmt = select(
        func.count(OrderItem.id),
        func.sum(OrderItem.total_price)
    ).where(OrderItem.seller_id == seller.id)
    items_res = await db.execute(items_stmt)
    total_orders, total_rev = items_res.one()

    # Pending & Completed orders
    pending_stmt = select(func.count(OrderItem.id)).where(OrderItem.seller_id == seller.id, OrderItem.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING]))
    pending_res = await db.execute(pending_stmt)
    pending_orders = pending_res.scalar() or 0

    completed_stmt = select(func.count(OrderItem.id)).where(OrderItem.seller_id == seller.id, OrderItem.status == OrderStatus.DELIVERED)
    completed_res = await db.execute(completed_stmt)
    completed_orders = completed_res.scalar() or 0

    # Low stock products
    low_stock_stmt = select(func.count(Inventory.id)).join(Product, Inventory.product_id == Product.id).where(
        Product.seller_id == seller.id,
        Inventory.current_stock <= Inventory.min_threshold
    )
    low_stock_res = await db.execute(low_stock_stmt)
    low_stock_count = low_stock_res.scalar() or 0

    metrics = DashboardMetrics(
        total_sales=float(total_rev or 0.0),
        total_orders=total_orders or 0,
        total_products=total_products,
        total_revenue=float(total_rev or 0.0),
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        low_stock_count=low_stock_count
    )
    return StandardResponse(data=metrics)

@router.get("/me/payouts", response_model=StandardResponse[List[dict]])
async def get_seller_payouts(
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SellerPayout).where(SellerPayout.seller_id == seller.id).order_by(desc(SellerPayout.created_at))
    res = await db.execute(stmt)
    payouts = res.scalars().all()
    out = [
        {
            "id": p.id,
            "amount": float(p.amount),
            "status": p.status,
            "reference_id": p.reference_id,
            "created_at": p.created_at.isoformat()
        } for p in payouts
    ]
    return StandardResponse(data=out)
