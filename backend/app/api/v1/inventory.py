from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_seller, get_current_user
from app.models.models import Inventory, InventoryTransaction, InventoryTransactionType, SellerProfile, Product, User, UserRole
from app.schemas.schemas import StandardResponse, InventoryOut, StockAdjustment

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

@router.get("", response_model=StandardResponse[List[InventoryOut]])
async def get_inventory_list(
    seller: SellerProfile = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Inventory).join(Product, Inventory.product_id == Product.id).where(Product.seller_id == seller.id)
    res = await db.execute(stmt)
    inv_list = res.scalars().all()

    out = []
    for inv in inv_list:
        inv_out = InventoryOut.model_validate(inv)
        inv_out.available_stock = max(0, inv.current_stock - inv.reserved_stock)
        out.append(inv_out)
    return StandardResponse(data=out)

@router.post("/adjust/{product_id}", response_model=StandardResponse[InventoryOut])
async def adjust_stock(
    product_id: int,
    adj_in: StockAdjustment,
    seller: SellerProfile = Depends(get_current_seller),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Inventory).where(Inventory.product_id == product_id).with_for_update()
    res = await db.execute(stmt)
    inv = res.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found")

    # Check seller ownership
    stmt_p = select(Product).where(Product.id == product_id)
    res_p = await db.execute(stmt_p)
    product = res_p.scalar_one_or_none()
    if not product or (product.seller_id != seller.id and current_user.role != UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    new_stock = inv.current_stock + adj_in.quantity_change
    if new_stock < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock cannot be negative")

    inv.current_stock = new_stock
    db.add(inv)

    tx_type = InventoryTransactionType.RESTOCK if adj_in.quantity_change > 0 else InventoryTransactionType.ADJUSTMENT
    tx = InventoryTransaction(
        inventory_id=inv.id,
        transaction_type=tx_type,
        quantity_change=adj_in.quantity_change,
        notes=adj_in.notes,
        created_by=current_user.id
    )
    db.add(tx)
    await db.commit()
    await db.refresh(inv)

    inv_out = InventoryOut.model_validate(inv)
    inv_out.available_stock = max(0, inv.current_stock - inv.reserved_stock)
    return StandardResponse(message="Stock adjusted", data=inv_out)
