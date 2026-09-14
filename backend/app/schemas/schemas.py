from datetime import datetime
from typing import Generic, List, Optional, TypeVar, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.models import (
    UserRole, SellerApprovalStatus, ProductStatus, OrderStatus,
    PaymentStatus, PaymentMethod, DiscountType, InventoryTransactionType, NotificationType
)

T = TypeVar("T")

# Response Wrapper Schemas
class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    limit: int
    total: int
    total_pages: int

# Auth & User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

class SellerRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone_number: str
    store_name: str
    store_description: Optional[str] = None
    business_email: EmailStr
    business_phone: str
    tax_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)

class AddressCreate(BaseModel):
    title: str = "Home"
    full_name: str
    phone: str
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

class AddressOut(AddressCreate):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Seller Profile Schemas
class SellerProfileOut(BaseModel):
    id: int
    user_id: int
    store_name: str
    store_description: Optional[str] = None
    store_logo: Optional[str] = None
    store_banner: Optional[str] = None
    business_email: str
    business_phone: str
    tax_id: Optional[str] = None
    approval_status: SellerApprovalStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SellerApprovalUpdate(BaseModel):
    approval_status: SellerApprovalStatus

# Category Schemas
class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool = True

class CategoryOut(CategoryCreate):
    id: int
    created_at: datetime
    subcategories: List["CategoryOut"] = []

    model_config = ConfigDict(from_attributes=True)

# Product Schemas
class ProductImageCreate(BaseModel):
    image_url: str
    is_primary: bool = False
    display_order: int = 0

class ProductImageOut(ProductImageCreate):
    id: int
    product_id: int

    model_config = ConfigDict(from_attributes=True)

class ProductVariantCreate(BaseModel):
    sku: str
    name: str
    size: Optional[str] = None
    color: Optional[str] = None
    price_override: Optional[float] = None
    stock: int = 0
    is_active: bool = True

class ProductVariantOut(ProductVariantCreate):
    id: int
    product_id: int

    model_config = ConfigDict(from_attributes=True)

class ProductCreate(BaseModel):
    category_id: int
    name: str
    slug: str
    description: str
    brand: str
    sku: str
    price: float = Field(gt=0)
    discount_price: Optional[float] = None
    tax_percent: float = 18.0
    status: ProductStatus = ProductStatus.ACTIVE
    is_featured: bool = False
    images: List[ProductImageCreate] = []
    variants: List[ProductVariantCreate] = []

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    tax_percent: Optional[float] = None
    status: Optional[ProductStatus] = None
    is_featured: Optional[bool] = None

class ProductOut(BaseModel):
    id: int
    seller_id: int
    category_id: int
    name: str
    slug: str
    description: str
    brand: str
    sku: str
    price: float
    discount_price: Optional[float] = None
    tax_percent: float
    status: ProductStatus
    rating_avg: float
    review_count: int
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    images: List[ProductImageOut] = []
    variants: List[ProductVariantOut] = []
    category: Optional[CategoryOut] = None
    seller: Optional[SellerProfileOut] = None
    stock_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# Cart Schemas
class CartItemAdd(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(gt=0, default=1)

class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)

class CartItemOut(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price: float
    total_price: float
    product: ProductOut
    variant: Optional[ProductVariantOut] = None

    model_config = ConfigDict(from_attributes=True)

class CartOut(BaseModel):
    id: int
    user_id: int
    items: List[CartItemOut] = []
    subtotal: float
    discount: float
    tax: float
    shipping: float
    total: float

# Wishlist Schemas
class WishlistItemOut(BaseModel):
    id: int
    product_id: int
    product: ProductOut
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WishlistOut(BaseModel):
    id: int
    user_id: int
    items: List[WishlistItemOut] = []

# Inventory Schemas
class InventoryOut(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    current_stock: int
    reserved_stock: int
    sold_quantity: int
    min_threshold: int
    available_stock: int

    model_config = ConfigDict(from_attributes=True)

class StockAdjustment(BaseModel):
    quantity_change: int
    notes: Optional[str] = "Manual stock adjustment"

# Coupon Schemas
class CouponCreate(BaseModel):
    code: str
    discount_type: DiscountType
    discount_value: float = Field(gt=0)
    minimum_order_value: float = 0.0
    maximum_discount: Optional[float] = None
    start_date: datetime
    expiry_date: datetime
    usage_limit: int = 100
    per_user_limit: int = 1
    is_active: bool = True

class CouponOut(CouponCreate):
    id: int
    seller_id: Optional[int] = None
    used_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CouponValidateRequest(BaseModel):
    code: str
    cart_total: float

class CouponValidateResponse(BaseModel):
    valid: bool
    message: str
    code: str
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = None
    calculated_discount: float = 0.0

# Order & Checkout Schemas
class CheckoutRequest(BaseModel):
    address_id: int
    coupon_code: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CARD
    notes: Optional[str] = None

class OrderItemOut(BaseModel):
    id: int
    seller_id: int
    product_id: int
    variant_id: Optional[int] = None
    product_name: str
    variant_name: Optional[str] = None
    price: float
    discount: float
    quantity: int
    total_price: float
    status: OrderStatus

    model_config = ConfigDict(from_attributes=True)

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_id: int
    address_id: Optional[int] = None
    shipping_address_json: dict
    subtotal: float
    discount: float
    tax: float
    shipping_fee: float
    total: float
    payment_status: PaymentStatus
    order_status: OrderStatus
    notes: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []

    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    order_status: OrderStatus

# Payment Schemas
class PaymentCreateRequest(BaseModel):
    order_id: int
    payment_method: PaymentMethod

class PaymentProcessRequest(BaseModel):
    payment_id: int
    result: PaymentStatus # SUCCESS, FAILED, PENDING

class PaymentOut(BaseModel):
    id: int
    order_id: int
    user_id: int
    payment_method: PaymentMethod
    transaction_id: str
    amount: float
    currency: str
    status: PaymentStatus
    failure_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Review Schemas
class ReviewCreate(BaseModel):
    order_item_id: Optional[int] = None
    rating: int = Field(ge=1, le=5)
    title: str
    comment: str
    images_json: Optional[list] = None

class SellerReviewResponse(BaseModel):
    seller_response: str

class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    title: str
    comment: str
    images_json: Optional[list] = None
    seller_response: Optional[str] = None
    seller_responded_at: Optional[datetime] = None
    created_at: datetime
    user: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Analytics Schemas
class DashboardMetrics(BaseModel):
    total_sales: float
    total_orders: int
    total_products: int
    total_customers: Optional[int] = None
    total_sellers: Optional[int] = None
    total_revenue: float
    pending_orders: int
    completed_orders: int
    low_stock_count: int

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    details_json: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
