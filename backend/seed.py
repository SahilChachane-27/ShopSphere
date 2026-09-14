import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import sync_engine, Base, SyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    User, UserRole, Address, SellerProfile, SellerApprovalStatus,
    Category, Product, ProductStatus, ProductImage, ProductVariant,
    Inventory, InventoryTransaction, InventoryTransactionType,
    Cart, Wishlist, Order, OrderItem, OrderStatus,
    Payment, PaymentStatus, PaymentMethod, Coupon, DiscountType,
    Review, Notification, NotificationType, AuditLog
)

def seed_database():
    print("Creating PostgreSQL database tables...")
    Base.metadata.drop_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)

    session = SyncSessionLocal()
    try:
        print("Seeding initial users...")
        # 1. Users
        admin_user = User(
            email="admin@shopsphere.com",
            hashed_password=get_password_hash("Admin@123456"),
            full_name="Platform Admin",
            phone_number="+919876543210",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )

        tech_seller_user = User(
            email="tech@shopsphere.com",
            hashed_password=get_password_hash("Seller@123456"),
            full_name="Alex Tech",
            phone_number="+919876543211",
            role=UserRole.SELLER,
            is_active=True,
            is_verified=True
        )

        fashion_seller_user = User(
            email="fashion@shopsphere.com",
            hashed_password=get_password_hash("Seller@123456"),
            full_name="Sarah Fashion",
            phone_number="+919876543212",
            role=UserRole.SELLER,
            is_active=True,
            is_verified=True
        )

        john_customer = User(
            email="john@example.com",
            hashed_password=get_password_hash("Customer@123456"),
            full_name="John Doe",
            phone_number="+919876543213",
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True
        )

        alice_customer = User(
            email="alice@example.com",
            hashed_password=get_password_hash("Customer@123456"),
            full_name="Alice Smith",
            phone_number="+919876543214",
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True
        )

        session.add_all([admin_user, tech_seller_user, fashion_seller_user, john_customer, alice_customer])
        session.flush()

        # Carts & Wishlists
        session.add_all([
            Cart(user_id=john_customer.id),
            Cart(user_id=alice_customer.id),
            Wishlist(user_id=john_customer.id),
            Wishlist(user_id=alice_customer.id)
        ])

        # 2. Seller Profiles
        tech_seller = SellerProfile(
            user_id=tech_seller_user.id,
            store_name="TechSphere Electronics",
            store_description="Premium smartphones, laptops, audio gear, and smart accessories.",
            store_logo="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400",
            business_email="tech@shopsphere.com",
            business_phone="+919876543211",
            tax_id="GSTIN9988776655",
            approval_status=SellerApprovalStatus.APPROVED
        )

        fashion_seller = SellerProfile(
            user_id=fashion_seller_user.id,
            store_name="FashionHub Trends",
            store_description="Trendy apparel, stylish footwear, and designer accessories.",
            store_logo="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
            business_email="fashion@shopsphere.com",
            business_phone="+919876543212",
            tax_id="GSTIN1122334455",
            approval_status=SellerApprovalStatus.APPROVED
        )

        session.add_all([tech_seller, fashion_seller])
        session.flush()

        # 3. Addresses
        john_addr = Address(
            user_id=john_customer.id,
            title="Home",
            full_name="John Doe",
            phone="+919876543213",
            street_address="123 Innovation Way, Tech Park",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560001",
            country="India",
            is_default=True
        )
        session.add(john_addr)
        session.flush()

        # 4. Categories
        cat_electronics = Category(name="Electronics", slug="electronics", description="Gadgets, computers, and electronics", image_url="https://images.unsplash.com/photo-1498049860654-af1a5c566976?w=600")
        cat_fashion = Category(name="Fashion & Apparel", slug="fashion", description="Men's and women's clothing and accessories", image_url="https://images.unsplash.com/photo-1445205170230-053b83016050?w=600")
        session.add_all([cat_electronics, cat_fashion])
        session.flush()

        sub_mobiles = Category(name="Mobiles & Smartphones", slug="mobiles", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600")
        sub_laptops = Category(name="Laptops & Computers", slug="laptops", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600")
        sub_audio = Category(name="Audio & Headphones", slug="audio", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600")
        sub_men = Category(name="Men's Wear", slug="mens-wear", parent_id=cat_fashion.id, image_url="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600")

        session.add_all([sub_mobiles, sub_laptops, sub_audio, sub_men])
        session.flush()

        # 5. Products
        # Prod 1: Pro Smartphone
        p1 = Product(
            seller_id=tech_seller.id,
            category_id=sub_mobiles.id,
            name="Apex Pro 5G Smartphone",
            slug="apex-pro-5g-smartphone",
            description="Ultra-fast 5G smartphone with 108MP quad camera, 120Hz AMOLED Display, 5000mAh battery, and 68W fast charging.",
            brand="ApexTech",
            sku="APEX-PRO-5G",
            price=49999.00,
            discount_price=44999.00,
            tax_percent=18.00,
            status=ProductStatus.ACTIVE,
            rating_avg=4.8,
            review_count=12,
            is_featured=True
        )

        # Prod 2: Ultrabook Laptop
        p2 = Product(
            seller_id=tech_seller.id,
            category_id=sub_laptops.id,
            name="Zenith Pro 14 Ultrabook",
            slug="zenith-pro-14-ultrabook",
            description="Slim 14-inch metal ultrabook featuring Intel Core i7 13th Gen, 16GB RAM, 1TB NVMe SSD, and 14-hour battery life.",
            brand="Zenith",
            sku="ZENITH-PRO-14",
            price=89999.00,
            discount_price=79999.00,
            tax_percent=18.00,
            status=ProductStatus.ACTIVE,
            rating_avg=4.7,
            review_count=8,
            is_featured=True
        )

        # Prod 3: ANC Headphones
        p3 = Product(
            seller_id=tech_seller.id,
            category_id=sub_audio.id,
            name="SonicShield ANC Wireless Headphones",
            slug="sonicshield-anc-headphones",
            description="Premium wireless over-ear headphones with active noise cancellation, Hi-Res audio drivers, and 40-hour playback.",
            brand="SonicShield",
            sku="SONIC-ANC-01",
            price=12999.00,
            discount_price=9999.00,
            tax_percent=18.00,
            status=ProductStatus.ACTIVE,
            rating_avg=4.6,
            review_count=15,
            is_featured=True
        )

        # Prod 4: Leather Jacket
        p4 = Product(
            seller_id=fashion_seller.id,
            category_id=sub_men.id,
            name="Urban Biker Genuine Leather Jacket",
            slug="urban-biker-leather-jacket",
            description="Handcrafted genuine lambskin leather jacket with asymmetrical zipper and soft interior lining.",
            brand="UrbanBiker",
            sku="UB-JACKET-BLK",
            price=8499.00,
            discount_price=6999.00,
            tax_percent=12.00,
            status=ProductStatus.ACTIVE,
            rating_avg=4.9,
            review_count=6,
            is_featured=False
        )

        session.add_all([p1, p2, p3, p4])
        session.flush()

        # Product Images
        session.add_all([
            ProductImage(product_id=p1.id, image_url="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", is_primary=True, display_order=1),
            ProductImage(product_id=p1.id, image_url="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800", is_primary=False, display_order=2),
            ProductImage(product_id=p2.id, image_url="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800", is_primary=True, display_order=1),
            ProductImage(product_id=p3.id, image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", is_primary=True, display_order=1),
            ProductImage(product_id=p4.id, image_url="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", is_primary=True, display_order=1)
        ])

        # Product Variants
        v1_p1 = ProductVariant(product_id=p1.id, sku="APEX-PRO-256-BLK", name="256GB / Phantom Black", color="Black", size="256GB", stock=30, is_active=True)
        v2_p1 = ProductVariant(product_id=p1.id, sku="APEX-PRO-512-SLV", name="512GB / Silver White", color="Silver", size="512GB", price_override=49999.00, stock=20, is_active=True)
        
        v1_p4 = ProductVariant(product_id=p4.id, sku="UB-JKT-M", name="Medium / Black", color="Black", size="M", stock=15, is_active=True)
        v2_p4 = ProductVariant(product_id=p4.id, sku="UB-JKT-L", name="Large / Black", color="Black", size="L", stock=25, is_active=True)

        session.add_all([v1_p1, v2_p1, v1_p4, v2_p4])
        session.flush()

        # Inventories
        session.add_all([
            Inventory(product_id=p1.id, current_stock=50, reserved_stock=0, sold_quantity=10, min_threshold=5),
            Inventory(product_id=p2.id, current_stock=25, reserved_stock=0, sold_quantity=5, min_threshold=3),
            Inventory(product_id=p3.id, current_stock=40, reserved_stock=0, sold_quantity=15, min_threshold=5),
            Inventory(product_id=p4.id, current_stock=40, reserved_stock=0, sold_quantity=8, min_threshold=5)
        ])

        # 6. Coupons
        coupon1 = Coupon(
            seller_id=None, # Global Admin coupon
            code="WELCOME10",
            discount_type=DiscountType.PERCENTAGE,
            discount_value=10.0,
            minimum_order_value=1000.0,
            maximum_discount=1500.0,
            start_date=datetime.utcnow() - timedelta(days=10),
            expiry_date=datetime.utcnow() + timedelta(days=90),
            usage_limit=500,
            per_user_limit=2,
            is_active=True
        )

        coupon2 = Coupon(
            seller_id=tech_seller.id,
            code="TECH2000",
            discount_type=DiscountType.FIXED,
            discount_value=2000.0,
            minimum_order_value=20000.0,
            start_date=datetime.utcnow() - timedelta(days=5),
            expiry_date=datetime.utcnow() + timedelta(days=60),
            usage_limit=100,
            per_user_limit=1,
            is_active=True
        )

        session.add_all([coupon1, coupon2])
        session.flush()

        # 7. Sample Delivered Order & Verified Review
        sample_order = Order(
            order_number="ORD-20260914-SAMPLE1",
            customer_id=john_customer.id,
            address_id=john_addr.id,
            shipping_address_json={
                "full_name": john_addr.full_name,
                "phone": john_addr.phone,
                "street_address": john_addr.street_address,
                "city": john_addr.city,
                "state": john_addr.state,
                "postal_code": john_addr.postal_code,
                "country": john_addr.country
            },
            subtotal=9999.00,
            discount=0.00,
            tax=1799.82,
            shipping_fee=0.00,
            total=11798.82,
            payment_status=PaymentStatus.PAID,
            order_status=OrderStatus.DELIVERED,
            created_at=datetime.utcnow() - timedelta(days=3)
        )
        session.add(sample_order)
        session.flush()

        sample_item = OrderItem(
            order_id=sample_order.id,
            seller_id=tech_seller.id,
            product_id=p3.id,
            product_name=p3.name,
            price=9999.00,
            quantity=1,
            total_price=9999.00,
            status=OrderStatus.DELIVERED
        )
        session.add(sample_item)
        session.flush()

        # Verified Review
        review = Review(
            product_id=p3.id,
            user_id=john_customer.id,
            order_item_id=sample_item.id,
            rating=5,
            title="Incredible sound quality and ANC!",
            comment="The active noise cancellation works like magic in noisy cafes. Battery lasts forever. Totally recommended!",
            seller_response="Thank you John! We are thrilled to hear you enjoy your SonicShield headphones.",
            seller_responded_at=datetime.utcnow() - timedelta(days=1)
        )
        session.add(review)

        # Audit Log
        session.add(AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_INIT",
            entity="platform",
            entity_id="1",
            details_json={"message": "ShopSphere database seeded successfully"}
        ))

        session.commit()
        print("Database seeded successfully!")

    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
