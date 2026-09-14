import os
import uuid
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.database.session import get_db
from app.dependencies.auth import get_current_user, get_current_seller
from app.models.models import (
    Product, ProductStatus, ProductImage, ProductVariant, Inventory, Category, SellerProfile, User, UserRole
)
from app.schemas.schemas import (
    StandardResponse, PaginatedResponse, ProductCreate, ProductUpdate, ProductOut, ProductVariantCreate, ProductVariantOut
)

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=PaginatedResponse[ProductOut])
async def search_and_list_products(
    q: Optional[str] = Query(None, description="Search keyword"),
    category_id: Optional[int] = Query(None),
    brand: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    seller_id: Optional[int] = Query(None),
    in_stock_only: Optional[bool] = Query(False),
    discount_only: Optional[bool] = Query(False),
    sort_by: Optional[str] = Query("newest", description="newest, price_asc, price_desc, rating, popularity"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.status == ProductStatus.ACTIVE).options(
        selectinload(Product.images),
        selectinload(Product.variants),
        selectinload(Product.category),
        selectinload(Product.seller),
        selectinload(Product.inventory)
    )

    if q:
        search_pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern),
                Product.brand.ilike(search_pattern),
                Product.sku.ilike(search_pattern)
            )
        )
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if brand:
        stmt = stmt.where(Product.brand.ilike(f"%{brand}%"))
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)
    if min_rating is not None:
        stmt = stmt.where(Product.rating_avg >= min_rating)
    if seller_id:
        stmt = stmt.where(Product.seller_id == seller_id)
    if discount_only:
        stmt = stmt.where(and_(Product.discount_price != None, Product.discount_price < Product.price))

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    # Sorting
    if sort_by == "price_asc":
        stmt = stmt.order_by(asc(Product.price))
    elif sort_by == "price_desc":
        stmt = stmt.order_by(desc(Product.price))
    elif sort_by == "rating":
        stmt = stmt.order_by(desc(Product.rating_avg))
    elif sort_by == "popularity":
        stmt = stmt.order_by(desc(Product.review_count))
    else: # newest
        stmt = stmt.order_by(desc(Product.created_at))

    # Pagination
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    res = await db.execute(stmt)
    products = res.scalars().all()

    items = []
    for p in products:
        p_out = ProductOut.model_validate(p)
        p_out.stock_count = p.inventory.current_stock if p.inventory else 0
        items.append(p_out)

    total_pages = math.ceil(total / limit) if limit > 0 else 1

    return PaginatedResponse(
        items=items,
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages
    )

@router.get("/{id_or_slug}", response_model=StandardResponse[ProductOut])
async def get_product_detail(id_or_slug: str, db: AsyncSession = Depends(get_db)):
    if id_or_slug.isdigit():
        stmt = select(Product).where(Product.id == int(id_or_slug))
    else:
        stmt = select(Product).where(Product.slug == id_or_slug)
    
    stmt = stmt.options(
        selectinload(Product.images),
        selectinload(Product.variants),
        selectinload(Product.category),
        selectinload(Product.seller),
        selectinload(Product.inventory)
    )
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    p_out = ProductOut.model_validate(product)
    p_out.stock_count = product.inventory.current_stock if product.inventory else 0
    return StandardResponse(data=p_out)

@router.post("", response_model=StandardResponse[ProductOut])
async def create_product(
    product_in: ProductCreate,
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    # Check duplicate SKU or slug
    stmt_check = select(Product).where(or_(Product.sku == product_in.sku, Product.slug == product_in.slug))
    res_check = await db.execute(stmt_check)
    if res_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product SKU or slug already exists")

    product = Product(
        seller_id=seller.id,
        category_id=product_in.category_id,
        name=product_in.name,
        slug=product_in.slug,
        description=product_in.description,
        brand=product_in.brand,
        sku=product_in.sku,
        price=product_in.price,
        discount_price=product_in.discount_price,
        tax_percent=product_in.tax_percent,
        status=product_in.status,
        is_featured=product_in.is_featured
    )
    db.add(product)
    await db.flush()

    # Images
    for idx, img in enumerate(product_in.images):
        p_img = ProductImage(
            product_id=product.id,
            image_url=img.image_url,
            is_primary=img.is_primary or (idx == 0),
            display_order=img.display_order
        )
        db.add(p_img)

    # Variants & Inventory
    total_stock = 0
    for var in product_in.variants:
        p_var = ProductVariant(
            product_id=product.id,
            sku=var.sku,
            name=var.name,
            size=var.size,
            color=var.color,
            price_override=var.price_override,
            stock=var.stock,
            is_active=var.is_active
        )
        db.add(p_var)
        total_stock += var.stock

    if not product_in.variants:
        total_stock = 50 # Default initial stock for simple product

    # Create Inventory record
    inv = Inventory(
        product_id=product.id,
        current_stock=total_stock,
        reserved_stock=0,
        sold_quantity=0,
        min_threshold=5
    )
    db.add(inv)

    await db.commit()
    await db.refresh(product)

    stmt_full = select(Product).where(Product.id == product.id).options(
        selectinload(Product.images), selectinload(Product.variants), selectinload(Product.inventory)
    )
    res_full = await db.execute(stmt_full)
    full_p = res_full.scalar_one()

    p_out = ProductOut.model_validate(full_p)
    p_out.stock_count = full_p.inventory.current_stock if full_p.inventory else 0
    return StandardResponse(message="Product created successfully", data=p_out)

@router.put("/{product_id}", response_model=StandardResponse[ProductOut])
async def update_product(
    product_id: int,
    product_in: ProductUpdate,
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == product_id)
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    # Check seller ownership
    if product.seller_id != seller.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own products")

    for k, v in product_in.model_dump(exclude_unset=True).items():
        setattr(product, k, v)

    db.add(product)
    await db.commit()
    await db.refresh(product)

    p_out = ProductOut.model_validate(product)
    return StandardResponse(message="Product updated", data=p_out)

@router.delete("/{product_id}", response_model=StandardResponse[dict])
async def delete_product(
    product_id: int,
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == product_id)
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.seller_id != seller.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own products")

    await db.delete(product)
    await db.commit()
    return StandardResponse(message="Product deleted", data={})

@router.post("/{product_id}/upload-image", response_model=StandardResponse[dict])
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == product_id, Product.seller_id == seller.id)
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or access denied")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"prod_{product_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    image_url = f"/static/{filename}"
    img = ProductImage(product_id=product.id, image_url=image_url, is_primary=False)
    db.add(img)
    await db.commit()

    return StandardResponse(message="Image uploaded", data={"image_url": image_url})
