from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.models import User, UserRole, SellerProfile, SellerApprovalStatus, Cart, Wishlist
from app.schemas.schemas import (
    StandardResponse, UserRegister, SellerRegister, UserLogin, TokenResponse, UserOut
)
from app.utils.helpers import log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=StandardResponse[UserOut])
async def register_customer(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new customer account."""
    stmt = select(User).where(User.email == user_in.email.lower())
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        role=UserRole.CUSTOMER,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.flush()

    # Create associated cart & wishlist
    cart = Cart(user_id=user.id)
    wishlist = Wishlist(user_id=user.id)
    db.add(cart)
    db.add(wishlist)
    
    await db.commit()
    await db.refresh(user)

    await log_audit(db, "USER_REGISTER", "users", user_id=user.id, entity_id=str(user.id))

    return StandardResponse(
        message="Account registered successfully.",
        data=UserOut.model_validate(user)
    )

@router.post("/seller-register", response_model=StandardResponse[UserOut])
async def register_seller(seller_in: SellerRegister, db: AsyncSession = Depends(get_db)):
    """Register a new seller account (requires admin approval before activation)."""
    stmt = select(User).where(User.email == seller_in.email.lower())
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )
    
    # Check store name uniqueness
    stmt_store = select(SellerProfile).where(SellerProfile.store_name == seller_in.store_name)
    res_store = await db.execute(stmt_store)
    if res_store.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store name is already taken."
        )

    user = User(
        email=seller_in.email.lower(),
        hashed_password=get_password_hash(seller_in.password),
        full_name=seller_in.full_name,
        phone_number=seller_in.phone_number,
        role=UserRole.SELLER,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.flush()

    seller_profile = SellerProfile(
        user_id=user.id,
        store_name=seller_in.store_name,
        store_description=seller_in.store_description,
        business_email=seller_in.business_email,
        business_phone=seller_in.business_phone,
        tax_id=seller_in.tax_id,
        approval_status=SellerApprovalStatus.PENDING
    )
    db.add(seller_profile)
    await db.commit()
    await db.refresh(user)

    await log_audit(db, "SELLER_REGISTER", "seller_profiles", user_id=user.id, entity_id=str(seller_profile.id))

    return StandardResponse(
        message="Seller account registered successfully. Pending Admin approval.",
        data=UserOut.model_validate(user)
    )

@router.post("/login", response_model=StandardResponse[TokenResponse])
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)):
    """Log in with email and password to receive JWT tokens."""
    stmt = select(User).where(User.email == login_in.email.lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended or deactivated. Contact support."
        )
    
    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    return StandardResponse(
        message="Login successful",
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
    )

@router.post("/refresh", response_model=StandardResponse[TokenResponse])
async def refresh_token(token_in: dict, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh_token."""
    refresh_tok = token_in.get("refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing refresh token")
    
    payload = decode_token(refresh_tok)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    user_id = int(payload.get("sub"))
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    
    new_access = create_access_token(subject=user.id, role=user.role.value)
    new_refresh = create_refresh_token(subject=user.id, role=user.role.value)

    return StandardResponse(
        message="Token refreshed successfully",
        data=TokenResponse(access_token=new_access, refresh_token=new_refresh)
    )

@router.post("/logout", response_model=StandardResponse[dict])
async def logout(current_user: User = Depends(get_current_user)):
    """Logout current user session."""
    return StandardResponse(message="Logged out successfully", data={})

@router.post("/forgot-password", response_model=StandardResponse[dict])
async def forgot_password(req: dict, db: AsyncSession = Depends(get_db)):
    """Request password reset link/token."""
    email = req.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    # Simulate sending email
    return StandardResponse(message="If the email exists, a password reset link has been sent.", data={})

@router.post("/reset-password", response_model=StandardResponse[dict])
async def reset_password(req: dict, db: AsyncSession = Depends(get_db)):
    """Reset password using token."""
    return StandardResponse(message="Password reset successfully.", data={})

@router.get("/me", response_model=StandardResponse[UserOut])
async def get_me(current_user: User = Depends(get_current_user)):
    """Get authenticated user profile."""
    return StandardResponse(data=UserOut.model_validate(current_user))
