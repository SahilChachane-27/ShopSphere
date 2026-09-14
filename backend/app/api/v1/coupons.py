from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user, get_current_seller
from app.models.models import Coupon, CouponUsage, DiscountType, SellerProfile, User, UserRole
from app.schemas.schemas import (
    StandardResponse, CouponCreate, CouponOut, CouponValidateRequest, CouponValidateResponse
)

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.get("", response_model=StandardResponse[List[CouponOut]])
async def list_active_coupons(db: AsyncSession = Depends(get_db)):
    stmt = select(Coupon).where(Coupon.is_active == True, Coupon.expiry_date >= datetime.utcnow())
    res = await db.execute(stmt)
    coupons = res.scalars().all()
    return StandardResponse(data=[CouponOut.model_validate(c) for c in coupons])

@router.post("", response_model=StandardResponse[CouponOut])
async def create_coupon(
    coupon_in: CouponCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in [UserRole.SELLER, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seller or Admin privileges required")

    stmt_check = select(Coupon).where(Coupon.code == coupon_in.code.upper())
    res_check = await db.execute(stmt_check)
    if res_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon code already exists")

    seller_id = None
    if current_user.role == UserRole.SELLER:
        stmt_s = select(SellerProfile).where(SellerProfile.user_id == current_user.id)
        res_s = await db.execute(stmt_s)
        seller = res_s.scalar_one_or_none()
        if seller:
            seller_id = seller.id

    coupon = Coupon(
        seller_id=seller_id,
        code=coupon_in.code.upper(),
        discount_type=coupon_in.discount_type,
        discount_value=coupon_in.discount_value,
        minimum_order_value=coupon_in.minimum_order_value,
        maximum_discount=coupon_in.maximum_discount,
        start_date=coupon_in.start_date,
        expiry_date=coupon_in.expiry_date,
        usage_limit=coupon_in.usage_limit,
        per_user_limit=coupon_in.per_user_limit,
        is_active=coupon_in.is_active
    )
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return StandardResponse(message="Coupon created successfully", data=CouponOut.model_validate(coupon))

@router.post("/validate", response_model=StandardResponse[CouponValidateResponse])
async def validate_coupon(
    req: CouponValidateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Coupon).where(Coupon.code == req.code.upper())
    res = await db.execute(stmt)
    coupon = res.scalar_one_or_none()

    if not coupon or not coupon.is_active:
        return StandardResponse(data=CouponValidateResponse(valid=False, message="Invalid or inactive coupon code.", code=req.code))

    now = datetime.utcnow()
    if coupon.start_date > now or coupon.expiry_date < now:
        return StandardResponse(data=CouponValidateResponse(valid=False, message="Coupon has expired or is not yet active.", code=req.code))

    if coupon.used_count >= coupon.usage_limit:
        return StandardResponse(data=CouponValidateResponse(valid=False, message="Coupon usage limit has been reached.", code=req.code))

    if req.cart_total < float(coupon.minimum_order_value):
        return StandardResponse(data=CouponValidateResponse(valid=False, message=f"Minimum order value of ₹{coupon.minimum_order_value} required for this coupon.", code=req.code))

    # Check user usage limit
    stmt_usage = select(func.count(CouponUsage.id)).where(CouponUsage.coupon_id == coupon.id, CouponUsage.user_id == current_user.id)
    u_res = await db.execute(stmt_usage)
    user_usage_count = u_res.scalar() or 0

    if user_usage_count >= coupon.per_user_limit:
        return StandardResponse(data=CouponValidateResponse(valid=False, message="You have reached the max usage limit for this coupon.", code=req.code))

    # Calculate discount
    calc_discount = 0.0
    if coupon.discount_type == DiscountType.PERCENTAGE:
        calc_discount = req.cart_total * (float(coupon.discount_value) / 100.0)
        if coupon.maximum_discount and calc_discount > float(coupon.maximum_discount):
            calc_discount = float(coupon.maximum_discount)
    else: # FIXED
        calc_discount = float(coupon.discount_value)
    
    calc_discount = min(calc_discount, req.cart_total)

    return StandardResponse(data=CouponValidateResponse(
        valid=True,
        message="Coupon applied successfully!",
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=float(coupon.discount_value),
        calculated_discount=round(calc_discount, 2)
    ))

@router.delete("/{coupon_id}", response_model=StandardResponse[dict])
async def delete_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Coupon).where(Coupon.id == coupon_id)
    res = await db.execute(stmt)
    coupon = res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    await db.delete(coupon)
    await db.commit()
    return StandardResponse(message="Coupon deleted", data={})
