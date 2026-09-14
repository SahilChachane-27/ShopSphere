from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_admin
from app.models.models import Category, User
from app.schemas.schemas import StandardResponse, CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=StandardResponse[List[CategoryOut]])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Fetch top-level categories with subcategories."""
    stmt = select(Category).where(Category.parent_id == None, Category.is_active == True).options(
        selectinload(Category.subcategories)
    ).order_by(Category.name.asc())
    res = await db.execute(stmt)
    cats = res.scalars().all()
    return StandardResponse(data=[CategoryOut.model_validate(c) for c in cats])

@router.get("/{category_id_or_slug}", response_model=StandardResponse[CategoryOut])
async def get_category_by_id_or_slug(category_id_or_slug: str, db: AsyncSession = Depends(get_db)):
    if category_id_or_slug.isdigit():
        stmt = select(Category).where(Category.id == int(category_id_or_slug)).options(selectinload(Category.subcategories))
    else:
        stmt = select(Category).where(Category.slug == category_id_or_slug).options(selectinload(Category.subcategories))
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return StandardResponse(data=CategoryOut.model_validate(cat))

@router.post("", response_model=StandardResponse[CategoryOut])
async def create_category(
    cat_in: CategoryCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.slug == cat_in.slug)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category slug already exists")
    
    category = Category(**cat_in.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return StandardResponse(message="Category created", data=CategoryOut.model_validate(category))

@router.put("/{category_id}", response_model=StandardResponse[CategoryOut])
async def update_category(
    category_id: int,
    cat_in: CategoryCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.id == category_id)
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    for k, v in cat_in.model_dump().items():
        setattr(cat, k, v)
    
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return StandardResponse(message="Category updated", data=CategoryOut.model_validate(cat))

@router.delete("/{category_id}", response_model=StandardResponse[dict])
async def delete_category(
    category_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.id == category_id)
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    await db.delete(cat)
    await db.commit()
    return StandardResponse(message="Category deleted", data={})
