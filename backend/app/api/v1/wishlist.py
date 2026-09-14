from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.models import Wishlist, WishlistItem, Product, User
from app.schemas.schemas import StandardResponse, WishlistOut, WishlistItemOut

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

async def get_or_create_wishlist(user_id: int, db: AsyncSession) -> Wishlist:
    stmt = select(Wishlist).where(Wishlist.user_id == user_id).options(
        selectinload(Wishlist.items).selectinload(WishlistItem.product).selectinload(Product.images),
        selectinload(Wishlist.items).selectinload(WishlistItem.product).selectinload(Product.category)
    )
    res = await db.execute(stmt)
    wl = res.scalar_one_or_none()
    if not wl:
        wl = Wishlist(user_id=user_id)
        db.add(wl)
        await db.commit()
        await db.refresh(wl)
        return await get_or_create_wishlist(user_id, db)
    return wl

@router.get("", response_model=StandardResponse[WishlistOut])
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    wl = await get_or_create_wishlist(current_user.id, db)
    return StandardResponse(data=WishlistOut.model_validate(wl))

@router.post("/{product_id}", response_model=StandardResponse[WishlistOut])
async def add_to_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check product exists
    stmt_p = select(Product).where(Product.id == product_id)
    res_p = await db.execute(stmt_p)
    if not res_p.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    wl = await get_or_create_wishlist(current_user.id, db)

    # Check duplicate
    stmt_check = select(WishlistItem).where(WishlistItem.wishlist_id == wl.id, WishlistItem.product_id == product_id)
    res_check = await db.execute(stmt_check)
    if res_check.scalar_one_or_none():
        return StandardResponse(message="Product already in wishlist", data=WishlistOut.model_validate(wl))

    item = WishlistItem(wishlist_id=wl.id, product_id=product_id)
    db.add(item)
    await db.commit()

    wl = await get_or_create_wishlist(current_user.id, db)
    return StandardResponse(message="Added to wishlist", data=WishlistOut.model_validate(wl))

@router.delete("/{product_id}", response_model=StandardResponse[WishlistOut])
async def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    wl = await get_or_create_wishlist(current_user.id, db)
    stmt = select(WishlistItem).where(WishlistItem.wishlist_id == wl.id, WishlistItem.product_id == product_id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if item:
        await db.delete(item)
        await db.commit()
    
    wl = await get_or_create_wishlist(current_user.id, db)
    return StandardResponse(message="Removed from wishlist", data=WishlistOut.model_validate(wl))
