from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.core.security import verify_password, get_password_hash
from app.models.models import User, Address
from app.schemas.schemas import (
    StandardResponse, UserOut, UserUpdate, PasswordChange, AddressCreate, AddressOut
)

router = APIRouter(prefix="/users", tags=["Users & Addresses"])

@router.get("/me", response_model=StandardResponse[UserOut])
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return StandardResponse(data=UserOut.model_validate(current_user))

@router.put("/me", response_model=StandardResponse[UserOut])
async def update_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.phone_number is not None:
        current_user.phone_number = user_in.phone_number
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return StandardResponse(message="Profile updated", data=UserOut.model_validate(current_user))

@router.put("/me/password", response_model=StandardResponse[dict])
async def change_password(
    pwd_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(pwd_in.old_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect existing password.")
    
    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    db.add(current_user)
    await db.commit()
    return StandardResponse(message="Password updated successfully.", data={})

@router.get("/me/addresses", response_model=StandardResponse[List[AddressOut]])
async def get_user_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Address).where(Address.user_id == current_user.id).order_by(Address.is_default.desc(), Address.created_at.desc())
    res = await db.execute(stmt)
    addresses = res.scalars().all()
    return StandardResponse(data=[AddressOut.model_validate(a) for a in addresses])

@router.post("/me/addresses", response_model=StandardResponse[AddressOut])
async def create_address(
    addr_in: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if addr_in.is_default:
        # Reset other default addresses
        stmt_reset = select(Address).where(Address.user_id == current_user.id)
        res = await db.execute(stmt_reset)
        for a in res.scalars().all():
            a.is_default = False
            db.add(a)

    address = Address(
        user_id=current_user.id,
        **addr_in.model_dump()
    )
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return StandardResponse(message="Address added", data=AddressOut.model_validate(address))

@router.put("/me/addresses/{address_id}", response_model=StandardResponse[AddressOut])
async def update_address(
    address_id: int,
    addr_in: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    res = await db.execute(stmt)
    address = res.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    
    if addr_in.is_default:
        stmt_reset = select(Address).where(Address.user_id == current_user.id)
        r = await db.execute(stmt_reset)
        for a in r.scalars().all():
            a.is_default = False
            db.add(a)

    for field, val in addr_in.model_dump().items():
        setattr(address, field, val)

    db.add(address)
    await db.commit()
    await db.refresh(address)
    return StandardResponse(message="Address updated", data=AddressOut.model_validate(address))

@router.delete("/me/addresses/{address_id}", response_model=StandardResponse[dict])
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    res = await db.execute(stmt)
    address = res.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    
    await db.delete(address)
    await db.commit()
    return StandardResponse(message="Address deleted", data={})
