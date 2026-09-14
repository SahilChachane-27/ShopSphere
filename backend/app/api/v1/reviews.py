from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user, get_current_seller
from app.models.models import Review, Product, Order, OrderItem, OrderStatus, SellerProfile, User
from app.schemas.schemas import StandardResponse, ReviewCreate, ReviewOut, SellerReviewResponse

router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])

async def update_product_rating_stats(product_id: int, db: AsyncSession):
    stmt = select(func.count(Review.id), func.avg(Review.rating)).where(Review.product_id == product_id)
    res = await db.execute(stmt)
    cnt, avg_rating = res.one()

    stmt_p = select(Product).where(Product.id == product_id)
    res_p = await db.execute(stmt_p)
    product = res_p.scalar_one_or_none()

    if product:
        product.review_count = cnt or 0
        product.rating_avg = round(float(avg_rating or 0.0), 2)
        db.add(product)
        await db.commit()

@router.get("/product/{product_id}", response_model=StandardResponse[List[ReviewOut]])
async def get_product_reviews(product_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Review).where(Review.product_id == product_id).options(
        selectinload(Review.user)
    ).order_by(Review.created_at.desc())
    res = await db.execute(stmt)
    reviews = res.scalars().all()
    return StandardResponse(data=[ReviewOut.model_validate(r) for r in reviews])

@router.post("/product/{product_id}", response_model=StandardResponse[ReviewOut])
async def create_review(
    product_id: int,
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verified Purchase check: User must have purchased the product in a DELIVERED order
    stmt_purchased = select(OrderItem).join(Order, OrderItem.order_id == Order.id).where(
        Order.customer_id == current_user.id,
        OrderItem.product_id == product_id,
        Order.order_status == OrderStatus.DELIVERED
    )
    res_purchased = await db.execute(stmt_purchased)
    order_item = res_purchased.scalar_one_or_none()

    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only verified buyers of delivered items can submit reviews."
        )

    # Check duplicate review
    stmt_dup = select(Review).where(Review.product_id == product_id, Review.user_id == current_user.id)
    res_dup = await db.execute(stmt_dup)
    if res_dup.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already reviewed this product.")

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        order_item_id=order_item.id if order_item else None,
        rating=review_in.rating,
        title=review_in.title,
        comment=review_in.comment,
        images_json=review_in.images_json
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    await update_product_rating_stats(product_id, db)

    stmt_full = select(Review).where(Review.id == review.id).options(selectinload(Review.user))
    res_full = await db.execute(stmt_full)
    full_r = res_full.scalar_one()

    return StandardResponse(message="Review submitted successfully", data=ReviewOut.model_validate(full_r))

@router.post("/{review_id}/respond", response_model=StandardResponse[ReviewOut])
async def seller_respond_to_review(
    review_id: int,
    resp_in: SellerReviewResponse,
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Review).join(Product, Review.product_id == Product.id).where(
        Review.id == review_id,
        Product.seller_id == seller.id
    ).options(selectinload(Review.user))
    res = await db.execute(stmt)
    review = res.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found or access denied")

    review.seller_response = resp_in.seller_response
    review.seller_responded_at = datetime.utcnow()
    db.add(review)
    await db.commit()
    await db.refresh(review)

    return StandardResponse(message="Seller response added", data=ReviewOut.model_validate(review))

@router.delete("/{review_id}", response_model=StandardResponse[dict])
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Review).where(Review.id == review_id)
    res = await db.execute(stmt)
    review = res.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if review.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    product_id = review.product_id
    await db.delete(review)
    await db.commit()

    await update_product_rating_stats(product_id, db)
    return StandardResponse(message="Review deleted", data={})
