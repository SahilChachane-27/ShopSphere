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
        print("Seeding initial users & sellers...")
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

        home_seller_user = User(
            email="homeplus@shopsphere.com",
            hashed_password=get_password_hash("Seller@123456"),
            full_name="Marcus Home",
            phone_number="+919876543215",
            role=UserRole.SELLER,
            is_active=True,
            is_verified=True
        )

        fit_seller_user = User(
            email="fitlife@shopsphere.com",
            hashed_password=get_password_hash("Seller@123456"),
            full_name="Elena Fitness",
            phone_number="+919876543216",
            role=UserRole.SELLER,
            is_active=True,
            is_verified=True
        )

        glow_seller_user = User(
            email="glow@shopsphere.com",
            hashed_password=get_password_hash("Seller@123456"),
            full_name="Chloe Beauty",
            phone_number="+919876543217",
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

        session.add_all([
            admin_user, tech_seller_user, fashion_seller_user, home_seller_user,
            fit_seller_user, glow_seller_user, john_customer, alice_customer
        ])
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
            store_description="Flagship smartphones, high-performance laptops, pro audio, and next-gen gaming accessories.",
            store_logo="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400",
            business_email="tech@shopsphere.com",
            business_phone="+919876543211",
            tax_id="GSTIN9988776655",
            approval_status=SellerApprovalStatus.APPROVED
        )

        fashion_seller = SellerProfile(
            user_id=fashion_seller_user.id,
            store_name="FashionHub Trends",
            store_description="Curated apparel, designer leather jackets, premium sneakers, and sleek timepieces.",
            store_logo="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
            business_email="fashion@shopsphere.com",
            business_phone="+919876543212",
            tax_id="GSTIN1122334455",
            approval_status=SellerApprovalStatus.APPROVED
        )

        home_seller = SellerProfile(
            user_id=home_seller_user.id,
            store_name="HomePlus Living",
            store_description="Smart appliances, artisan kitchenware, ergonomic decor, and ambient home lighting.",
            store_logo="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400",
            business_email="homeplus@shopsphere.com",
            business_phone="+919876543215",
            tax_id="GSTIN5566778899",
            approval_status=SellerApprovalStatus.APPROVED
        )

        fit_seller = SellerProfile(
            user_id=fit_seller_user.id,
            store_name="FitLife Athletic",
            store_description="Commercial-grade fitness equipment, pro gym gear, activewear, and hydration bottles.",
            store_logo="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400",
            business_email="fitlife@shopsphere.com",
            business_phone="+919876543216",
            tax_id="GSTIN3344556677",
            approval_status=SellerApprovalStatus.APPROVED
        )

        glow_seller = SellerProfile(
            user_id=glow_seller_user.id,
            store_name="Glow & Pure Cosmetics",
            store_description="Organic skincare serums, luxury fragrances, hydrating creams, and premium grooming kits.",
            store_logo="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
            business_email="glow@shopsphere.com",
            business_phone="+919876543217",
            tax_id="GSTIN7788990011",
            approval_status=SellerApprovalStatus.APPROVED
        )

        session.add_all([tech_seller, fashion_seller, home_seller, fit_seller, glow_seller])
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

        # 4. Categories & Subcategories
        cat_electronics = Category(name="Electronics & Gadgets", slug="electronics", description="Gadgets, computers, audio, and smart devices", image_url="https://images.unsplash.com/photo-1498049860654-af1a5c566976?w=600")
        cat_fashion = Category(name="Fashion & Apparel", slug="fashion", description="Men's and women's apparel, footwear, and accessories", image_url="https://images.unsplash.com/photo-1445205170230-053b83016050?w=600")
        cat_home = Category(name="Home & Kitchen", slug="home-kitchen", description="Smart appliances, cookware, lighting, and living decor", image_url="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600")
        cat_sports = Category(name="Sports & Fitness", slug="sports-fitness", description="Gym gear, activewear, outdoor, and training accessories", image_url="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600")
        cat_beauty = Category(name="Beauty & Personal Care", slug="beauty-care", description="Skincare serums, luxury perfumes, and personal care", image_url="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600")
        
        session.add_all([cat_electronics, cat_fashion, cat_home, cat_sports, cat_beauty])
        session.flush()

        # Subcategories
        sub_mobiles = Category(name="Mobiles & Smartphones", slug="mobiles", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600")
        sub_laptops = Category(name="Laptops & Computers", slug="laptops", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600")
        sub_audio = Category(name="Audio & Headphones", slug="audio", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600")
        sub_wearables = Category(name="Wearables & Smartwatches", slug="wearables", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600")
        sub_gaming = Category(name="Gaming & Consoles", slug="gaming", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600")
        sub_cameras = Category(name="Cameras & Photography", slug="cameras", parent_id=cat_electronics.id, image_url="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600")

        sub_men = Category(name="Men's Wear", slug="mens-wear", parent_id=cat_fashion.id, image_url="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600")
        sub_women = Category(name="Women's Wear", slug="womens-wear", parent_id=cat_fashion.id, image_url="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600")
        sub_footwear = Category(name="Footwear & Sneakers", slug="footwear", parent_id=cat_fashion.id, image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600")
        sub_accessories = Category(name="Watches & Accessories", slug="accessories", parent_id=cat_fashion.id, image_url="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600")

        sub_appliances = Category(name="Smart Home Appliances", slug="smart-appliances", parent_id=cat_home.id, image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600")
        sub_cookware = Category(name="Cookware & Dining", slug="cookware", parent_id=cat_home.id, image_url="https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600")
        sub_decor = Category(name="Lighting & Decor", slug="decor", parent_id=cat_home.id, image_url="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600")

        sub_gym = Category(name="Fitness & Gym Equipment", slug="gym-equipment", parent_id=cat_sports.id, image_url="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600")
        sub_outdoor = Category(name="Outdoor & Camping", slug="outdoor-gear", parent_id=cat_sports.id, image_url="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600")

        sub_skincare = Category(name="Skincare & Grooming", slug="skincare", parent_id=cat_beauty.id, image_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600")
        sub_fragrances = Category(name="Fragrances & Perfumes", slug="fragrances", parent_id=cat_beauty.id, image_url="https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600")

        session.add_all([
            sub_mobiles, sub_laptops, sub_audio, sub_wearables, sub_gaming, sub_cameras,
            sub_men, sub_women, sub_footwear, sub_accessories,
            sub_appliances, sub_cookware, sub_decor,
            sub_gym, sub_outdoor,
            sub_skincare, sub_fragrances
        ])
        session.flush()

        print("Seeding catalog products...")

        products_data = [
            # 1. Electronics - Mobiles
            {
                "seller": tech_seller, "category": sub_mobiles, "name": "Apex Pro 5G Smartphone",
                "slug": "apex-pro-5g-smartphone", "brand": "ApexTech", "sku": "APEX-PRO-5G",
                "price": 49999.00, "discount_price": 44999.00, "tax": 18.0, "rating": 4.8, "reviews": 34, "featured": True,
                "desc": "Ultra-fast 5G smartphone with 108MP quad camera, 120Hz AMOLED Display, 5000mAh battery, and 68W fast charging.",
                "images": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800"],
                "variants": [("256GB / Phantom Black", "Black", "256GB", 30), ("512GB / Silver White", "Silver", "512GB", 20)],
                "stock": 50
            },
            {
                "seller": tech_seller, "category": sub_mobiles, "name": "Nova Edge 5G Ultra Smartphone",
                "slug": "nova-edge-5g-ultra", "brand": "NovaMobile", "sku": "NOVA-EDGE-ULTRA",
                "price": 79999.00, "discount_price": 69999.00, "tax": 18.0, "rating": 4.9, "reviews": 42, "featured": True,
                "desc": "Flagship device with Snapdragon 8 Gen 3, titanium frame, 200MP periscope zoom lens, and 2K LTPO Curved OLED.",
                "images": ["https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800", "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800"],
                "variants": [("256GB / Titanium Gray", "Gray", "256GB", 25), ("512GB / Ocean Blue", "Blue", "512GB", 15)],
                "stock": 40
            },
            # 2. Electronics - Laptops
            {
                "seller": tech_seller, "category": sub_laptops, "name": "Zenith Pro 14 Ultrabook",
                "slug": "zenith-pro-14-ultrabook", "brand": "Zenith", "sku": "ZENITH-PRO-14",
                "price": 89999.00, "discount_price": 79999.00, "tax": 18.0, "rating": 4.7, "reviews": 28, "featured": True,
                "desc": "Slim 14-inch aluminum ultrabook featuring Intel Core i7 13th Gen, 16GB LPDDR5 RAM, 1TB NVMe SSD, and 14-hour battery life.",
                "images": ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"],
                "variants": [("Intel i7 / 16GB / 1TB SSD", "Space Gray", "14 inch", 20)],
                "stock": 25
            },
            {
                "seller": tech_seller, "category": sub_laptops, "name": "Predator Blade 16 Gaming Laptop",
                "slug": "predator-blade-16-gaming-laptop", "brand": "Predator", "sku": "PRED-BLADE-16",
                "price": 149999.00, "discount_price": 129999.00, "tax": 18.0, "rating": 4.9, "reviews": 19, "featured": True,
                "desc": "Extreme gaming performance powered by RTX 4080 12GB graphics, Intel i9 13900HX, 240Hz Mini-LED display, and RGB mechanical keyboard.",
                "images": ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800"],
                "variants": [("RTX 4080 / 32GB / 2TB SSD", "Matte Black", "16 inch", 12)],
                "stock": 15
            },
            # 3. Electronics - Audio
            {
                "seller": tech_seller, "category": sub_audio, "name": "SonicShield ANC Wireless Headphones",
                "slug": "sonicshield-anc-headphones", "brand": "SonicShield", "sku": "SONIC-ANC-01",
                "price": 12999.00, "discount_price": 9999.00, "tax": 18.0, "rating": 4.6, "reviews": 56, "featured": True,
                "desc": "Premium wireless over-ear headphones with active noise cancellation, Hi-Res audio drivers, multipoint bluetooth, and 40-hour playback.",
                "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800"],
                "variants": [("Midnight Black", "Black", "Standard", 35), ("Silver Platinum", "Silver", "Standard", 25)],
                "stock": 60
            },
            {
                "seller": tech_seller, "category": sub_audio, "name": "Aura Sound Studio Earbuds Pro",
                "slug": "aura-sound-studio-earbuds", "brand": "AuraSound", "sku": "AURA-EARBUDS-PRO",
                "price": 4999.00, "discount_price": 3499.00, "tax": 18.0, "rating": 4.5, "reviews": 48, "featured": False,
                "desc": "True wireless earbuds with spatial audio surround sound, IPX5 sweat resistance, low latency gaming mode, and wireless charging case.",
                "images": ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800"],
                "variants": [("Alpine White", "White", "Standard", 40)],
                "stock": 50
            },
            # 4. Electronics - Wearables
            {
                "seller": tech_seller, "category": sub_wearables, "name": "PulseWatch GT Pro Smartwatch",
                "slug": "pulsewatch-gt-pro-smartwatch", "brand": "PulseWatch", "sku": "PULSE-GT-PRO",
                "price": 8999.00, "discount_price": 6999.00, "tax": 18.0, "rating": 4.6, "reviews": 38, "featured": True,
                "desc": "Rugged smartwatch with sapphire glass, continuous SpO2 & ECG tracking, dual-band GPS, 100+ sports modes, and 12-day battery.",
                "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800"],
                "variants": [("Graphite Strap", "Black", "46mm", 30), ("Orange Sport Strap", "Orange", "46mm", 20)],
                "stock": 50
            },
            # 5. Electronics - Gaming & Consoles
            {
                "seller": tech_seller, "category": sub_gaming, "name": "Nexus VR Headset 3 Ultra",
                "slug": "nexus-vr-headset-3-ultra", "brand": "NexusVR", "sku": "NEXUS-VR-03",
                "price": 34999.00, "discount_price": 29999.00, "tax": 18.0, "rating": 4.7, "reviews": 22, "featured": False,
                "desc": "Next-generation standalone virtual reality headset with 4K resolution per eye, passthrough AR vision, and haptic touch controllers.",
                "images": ["https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=800"],
                "variants": [("128GB VR Kit", "White", "128GB", 15)],
                "stock": 20
            },
            {
                "seller": tech_seller, "category": sub_gaming, "name": "ProGamer Wireless Haptic Controller",
                "slug": "progamer-wireless-haptic-controller", "brand": "ProGamer", "sku": "PROG-PAD-W",
                "price": 5499.00, "discount_price": 4299.00, "tax": 18.0, "rating": 4.8, "reviews": 41, "featured": False,
                "desc": "Precision esports controller with Hall-effect magnetic joysticks, remappable back triggers, custom RGB lighting, and multi-platform compatibility.",
                "images": ["https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800"],
                "variants": [("Carbon Black", "Black", "Standard", 45)],
                "stock": 50
            },
            # 6. Electronics - Cameras
            {
                "seller": tech_seller, "category": sub_cameras, "name": "CineFrame 4K Mirrorless Camera",
                "slug": "cineframe-4k-mirrorless-camera", "brand": "CineFrame", "sku": "CINE-4K-MIRROR",
                "price": 74999.00, "discount_price": 64999.00, "tax": 18.0, "rating": 4.9, "reviews": 16, "featured": True,
                "desc": "Full-frame 33MP mirrorless camera capable of uncompressed 4K 60fps video, in-body 5-axis image stabilization, and AI eye tracking autofocus.",
                "images": ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800", "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800"],
                "variants": [("Body Only", "Black", "Body", 10), ("With 24-70mm Lens Kit", "Black", "Kit", 8)],
                "stock": 18
            },

            # 7. Fashion - Men's Wear
            {
                "seller": fashion_seller, "category": sub_men, "name": "Urban Biker Genuine Lambskin Leather Jacket",
                "slug": "urban-biker-leather-jacket", "brand": "UrbanBiker", "sku": "UB-JACKET-BLK",
                "price": 8499.00, "discount_price": 6999.00, "tax": 12.0, "rating": 4.9, "reviews": 29, "featured": True,
                "desc": "Handcrafted genuine lambskin leather jacket with asymmetrical heavy-duty zipper, quilted shoulder pads, and soft satin interior lining.",
                "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800"],
                "variants": [("Medium / Black", "Black", "M", 20), ("Large / Black", "Black", "L", 25)],
                "stock": 45
            },
            {
                "seller": fashion_seller, "category": sub_men, "name": "Classic Tailored Wool Blend Blazer",
                "slug": "classic-tailored-wool-blazer", "brand": "SavileRow", "sku": "SAVILE-BLAZER-NVY",
                "price": 6499.00, "discount_price": 4999.00, "tax": 12.0, "rating": 4.6, "reviews": 18, "featured": False,
                "desc": "Sophisticated slim-fit single-breasted blazer woven from fine Australian merino wool blend with lapel notch and double back vents.",
                "images": ["https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800"],
                "variants": [("40R / Navy Blue", "Navy", "40R", 15), ("42R / Navy Blue", "Navy", "42R", 12)],
                "stock": 27
            },
            {
                "seller": fashion_seller, "category": sub_men, "name": "Breeze Pure Linen Casual Shirt",
                "slug": "breeze-pure-linen-shirt", "brand": "BreezeFashion", "sku": "BRZ-SHIRT-WHT",
                "price": 1999.00, "discount_price": 1499.00, "tax": 12.0, "rating": 4.5, "reviews": 33, "featured": False,
                "desc": "Breathable 100% French linen button-down shirt ideal for summer beachwear, tropical vacations, and smart-casual outings.",
                "images": ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"],
                "variants": [("M / Pure White", "White", "M", 30), ("L / Olive Green", "Olive", "L", 25)],
                "stock": 55
            },
            # 8. Fashion - Women's Wear
            {
                "seller": fashion_seller, "category": sub_women, "name": "Floral Embroidered Silk Evening Gown",
                "slug": "floral-embroidered-silk-gown", "brand": "LuxeCouture", "sku": "LUXE-GOWN-FLR",
                "price": 7299.00, "discount_price": 5499.00, "tax": 12.0, "rating": 4.8, "reviews": 24, "featured": True,
                "desc": "Elegantly flowing Mulberry silk maxi evening gown featuring intricate floral thread embroidery, hidden zip back, and flare hem.",
                "images": ["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800"],
                "variants": [("S / Emerald Red", "Red", "S", 15), ("M / Emerald Red", "Red", "M", 20)],
                "stock": 35
            },
            {
                "seller": fashion_seller, "category": sub_women, "name": "Oversized Vintage Denim Trucker Jacket",
                "slug": "oversized-vintage-denim-jacket", "brand": "DenimCo", "sku": "DENIM-JKT-BLU",
                "price": 3999.00, "discount_price": 2999.00, "tax": 12.0, "rating": 4.7, "reviews": 31, "featured": False,
                "desc": "Heavyweight cotton washed denim jacket with distressed detailing, copper buttons, double flap pockets, and relaxed boyfriend fit.",
                "images": ["https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=800"],
                "variants": [("M / Vintage Blue", "Blue", "M", 25)],
                "stock": 25
            },
            # 9. Fashion - Footwear
            {
                "seller": fashion_seller, "category": sub_footwear, "name": "AeroStep Prime Knit Running Shoes",
                "slug": "aerostep-prime-knit-running-shoes", "brand": "AeroStep", "sku": "AERO-RUN-KNT",
                "price": 4999.00, "discount_price": 3799.00, "tax": 12.0, "rating": 4.7, "reviews": 52, "featured": True,
                "desc": "Ultra-lightweight mesh knit sneakers with responsive nitrogen-infused foam midsole, high-grip rubber outsole, and reflective heel trim.",
                "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"],
                "variants": [("UK 8 / Crimson Red", "Red", "UK 8", 20), ("UK 9 / Crimson Red", "Red", "UK 9", 25)],
                "stock": 45
            },
            {
                "seller": fashion_seller, "category": sub_footwear, "name": "Handcrafted Leather Oxford Dress Shoes",
                "slug": "handcrafted-leather-oxford-shoes", "brand": "Craftsman", "sku": "OXFORD-BRN-01",
                "price": 5999.00, "discount_price": 4499.00, "tax": 12.0, "rating": 4.8, "reviews": 27, "featured": False,
                "desc": "Full-grain Italian burnished calfskin leather Oxford formal shoes with Goodyear welted leather sole and cushioned memory foam footbed.",
                "images": ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800"],
                "variants": [("UK 8 / Tan Brown", "Brown", "UK 8", 15), ("UK 9 / Tan Brown", "Brown", "UK 9", 15)],
                "stock": 30
            },
            # 10. Fashion - Accessories
            {
                "seller": fashion_seller, "category": sub_accessories, "name": "Chronos Minimalist Sapphire Chronograph",
                "slug": "chronos-minimalist-chronograph-watch", "brand": "Chronos", "sku": "CHRONOS-CHRO-SLV",
                "price": 11999.00, "discount_price": 8999.00, "tax": 18.0, "rating": 4.9, "reviews": 36, "featured": True,
                "desc": "Swiss-movement minimalist analog chronograph featuring scratch-resistant sapphire crystal glass, 50m water resistance, and Italian leather strap.",
                "images": ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800", "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800"],
                "variants": [("Silver & Cognac Leather", "Brown", "40mm", 20)],
                "stock": 20
            },

            # 11. Home & Kitchen - Smart Appliances
            {
                "seller": home_seller, "category": sub_appliances, "name": "NutriChef Smart Digital Air Fryer 5.5L",
                "slug": "nutrichef-smart-air-fryer-5l", "brand": "NutriChef", "sku": "NUTRI-FRYER-5L",
                "price": 7999.00, "discount_price": 5999.00, "tax": 18.0, "rating": 4.8, "reviews": 64, "featured": True,
                "desc": "Oil-free 360° rapid air circulation technology with touch control LED panel, 12 preset recipes, non-stick dishwasher-safe basket, and WiFi mobile app sync.",
                "images": ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800"],
                "variants": [("Matte Black / 5.5L", "Black", "5.5L", 40)],
                "stock": 40
            },
            {
                "seller": home_seller, "category": sub_appliances, "name": "RoboClean Laser LiDAR Robot Vacuum Cleaner",
                "slug": "roboclean-laser-lidar-robot-vacuum", "brand": "RoboClean", "sku": "ROBO-VAC-LIDAR",
                "price": 24999.00, "discount_price": 19999.00, "tax": 18.0, "rating": 4.7, "reviews": 29, "featured": True,
                "desc": "Smart robotic vacuum and mop featuring 4000Pa intense suction, 360° LiDAR mapping, auto-empty dust dock, and custom no-go zones.",
                "images": ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800"],
                "variants": [("Robot + Auto Dock", "White", "Standard", 15)],
                "stock": 15
            },
            # 12. Home & Kitchen - Cookware
            {
                "seller": home_seller, "category": sub_cookware, "name": "Espresso Artisan Pump Coffee Machine",
                "slug": "espresso-artisan-coffee-machine", "brand": "ArtisanBrew", "sku": "ARTISAN-ESP-15B",
                "price": 15999.00, "discount_price": 12499.00, "tax": 18.0, "rating": 4.9, "reviews": 22, "featured": True,
                "desc": "15-bar professional Italian pump espresso maker with stainless steel steam wand for velvety cappuccino foam, 1.5L removable water tank.",
                "images": ["https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800", "https://images.unsplash.com/photo-1517668808822-9ebe02f2a6e8?w=800"],
                "variants": [("Brushed Stainless Steel", "Silver", "1.5L", 25)],
                "stock": 25
            },
            {
                "seller": home_seller, "category": sub_cookware, "name": "Non-Stick Granite Cookware 5-Piece Set",
                "slug": "non-stick-granite-cookware-5-piece-set", "brand": "ChefMaster", "sku": "CHEF-COOKSET-5P",
                "price": 4499.00, "discount_price": 3299.00, "tax": 18.0, "rating": 4.6, "reviews": 43, "featured": False,
                "desc": "Die-cast aluminum non-stick cookware set coated with 5-layer scratch-resistant granite stone finish. Includes fry pan, wok, casserole, and tempered lids.",
                "images": ["https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=800"],
                "variants": [("Granite Gray 5-Pcs", "Gray", "Set", 35)],
                "stock": 35
            },
            # 13. Home & Kitchen - Decor & Lighting
            {
                "seller": home_seller, "category": sub_decor, "name": "Ambient RGB Smart LED Corner Floor Lamp",
                "slug": "ambient-rgb-smart-led-floor-lamp", "brand": "Lumina", "sku": "LUMINA-LAMP-RGB",
                "price": 3799.00, "discount_price": 2799.00, "tax": 18.0, "rating": 4.7, "reviews": 39, "featured": False,
                "desc": "Minimalist Scandinavian corner lamp with 16M RGB colors, music sync mode, Alexa voice control, and dimmable warmth settings.",
                "images": ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"],
                "variants": [("Smart RGB Black", "Black", "140cm", 40)],
                "stock": 40
            },

            # 14. Sports & Fitness - Gym Equipment
            {
                "seller": fit_seller, "category": sub_gym, "name": "Adjustable SelectDumbbell Pair (2.5kg - 24kg)",
                "slug": "adjustable-selectdumbbell-pair-24kg", "brand": "FlexFit", "sku": "FLEX-DUMB-24KG",
                "price": 18999.00, "discount_price": 14999.00, "tax": 18.0, "rating": 4.9, "reviews": 51, "featured": True,
                "desc": "All-in-one dumbbell set replaces 15 pairs of weights. Quick dial weight selection from 2.5kg up to 24kg with heavy-duty molded steel plates.",
                "images": ["https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800"],
                "variants": [("24kg Pair Set", "Black/Red", "24kg", 20)],
                "stock": 20
            },
            {
                "seller": fit_seller, "category": sub_gym, "name": "ProGrip Eco-Friendly Non-Slip Yoga Mat 6mm",
                "slug": "progrip-eco-friendly-yoga-mat-6mm", "brand": "ZenFlow", "sku": "ZEN-MAT-6MM",
                "price": 1499.00, "discount_price": 999.00, "tax": 18.0, "rating": 4.6, "reviews": 68, "featured": False,
                "desc": "Extra thick 6mm TPE eco-friendly yoga mat with alignment guides, dual-sided non-slip texture, anti-tear mesh core, and carry strap.",
                "images": ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800"],
                "variants": [("Teal Blue", "Teal", "6mm", 50), ("Plum Purple", "Purple", "6mm", 40)],
                "stock": 90
            },
            # 15. Sports & Fitness - Outdoor
            {
                "seller": fit_seller, "category": sub_outdoor, "name": "HydroPro Insulated Stainless Water Bottle 1L",
                "slug": "hydropro-insulated-stainless-bottle-1l", "brand": "HydroPro", "sku": "HYDRO-BTL-1L",
                "price": 1599.00, "discount_price": 1199.00, "tax": 18.0, "rating": 4.8, "reviews": 45, "featured": False,
                "desc": "Vacuum double-wall stainless steel bottle keeps drinks ice-cold for 24 hours or piping hot for 12 hours. Sweat-free powder coat exterior with leakproof spout.",
                "images": ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800"],
                "variants": [("Matte Black 1000ml", "Black", "1000ml", 60), ("Pacific Blue 1000ml", "Blue", "1000ml", 40)],
                "stock": 100
            },

            # 16. Beauty & Personal Care - Skincare
            {
                "seller": glow_seller, "category": sub_skincare, "name": "Botanical Radiance 15% Vitamin C Face Serum",
                "slug": "botanical-radiance-vitamin-c-face-serum", "brand": "GlowBotanica", "sku": "GLOW-VITC-30ML",
                "price": 1199.00, "discount_price": 899.00, "tax": 18.0, "rating": 4.7, "reviews": 73, "featured": True,
                "desc": "Potent brightening facial serum enriched with 15% L-Ascorbic Acid, Ferulic Acid, and Hyaluronic Acid to fade dark spots and boost collagen.",
                "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800"],
                "variants": [("30ml Dropper Bottle", "Standard", "30ml", 80)],
                "stock": 80
            },
            {
                "seller": glow_seller, "category": sub_skincare, "name": "Velvet Night Peptide Hydrating Eye Cream",
                "slug": "velvet-night-peptide-eye-cream", "brand": "GlowBotanica", "sku": "GLOW-EYE-15ML",
                "price": 1699.00, "discount_price": 1299.00, "tax": 18.0, "rating": 4.6, "reviews": 38, "featured": False,
                "desc": "Nourishing eye contour repair cream with multi-peptides, caffeine extract, and niacinamide to visibly reduce dark circles and puffiness.",
                "images": ["https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800"],
                "variants": [("15ml Jar", "Standard", "15ml", 45)],
                "stock": 45
            },
            # 17. Beauty & Personal Care - Fragrances
            {
                "seller": glow_seller, "category": sub_fragrances, "name": "Oud Royale Luxury Eau De Parfum 100ml",
                "slug": "oud-royale-luxury-eau-de-parfum-100ml", "brand": "RoyalParfums", "sku": "ROYAL-OUD-100ML",
                "price": 4999.00, "discount_price": 3999.00, "tax": 18.0, "rating": 4.9, "reviews": 44, "featured": True,
                "desc": "Exquisite oriental wood fragrance opening with notes of Cambodian Oud, Amber resin, Rose petals, and Warm Vanilla.",
                "images": ["https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800"],
                "variants": [("100ml EDP Spray", "Gold Bottle", "100ml", 35)],
                "stock": 35
            }
        ]

        created_products = []
        all_product_images = []
        all_product_variants = []
        all_inventories = []

        for pdata in products_data:
            p = Product(
                seller_id=pdata["seller"].id,
                category_id=pdata["category"].id,
                name=pdata["name"],
                slug=pdata["slug"],
                description=pdata["desc"],
                brand=pdata["brand"],
                sku=pdata["sku"],
                price=pdata["price"],
                discount_price=pdata["discount_price"],
                tax_percent=pdata["tax"],
                status=ProductStatus.ACTIVE,
                rating_avg=pdata["rating"],
                review_count=pdata["reviews"],
                is_featured=pdata["featured"]
            )
            session.add(p)
            session.flush()
            created_products.append((p, pdata))

            # Images
            for idx, img_url in enumerate(pdata["images"]):
                all_product_images.append(
                    ProductImage(
                        product_id=p.id,
                        image_url=img_url,
                        is_primary=(idx == 0),
                        display_order=idx + 1
                    )
                )

            # Variants
            for var_name, var_color, var_size, var_stock in pdata["variants"]:
                v_sku = f"{p.sku}-{var_color[:3].upper()}-{var_size.replace(' ', '')}"
                all_product_variants.append(
                    ProductVariant(
                        product_id=p.id,
                        sku=v_sku,
                        name=var_name,
                        color=var_color,
                        size=var_size,
                        stock=var_stock,
                        is_active=True
                    )
                )

            # Inventory
            all_inventories.append(
                Inventory(
                    product_id=p.id,
                    current_stock=pdata["stock"],
                    reserved_stock=0,
                    sold_quantity=10,
                    min_threshold=5
                )
            )

        session.add_all(all_product_images)
        session.add_all(all_product_variants)
        session.add_all(all_inventories)
        session.flush()

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

        coupon3 = Coupon(
            seller_id=fashion_seller.id,
            code="FASHION15",
            discount_type=DiscountType.PERCENTAGE,
            discount_value=15.0,
            minimum_order_value=2000.0,
            maximum_discount=1000.0,
            start_date=datetime.utcnow() - timedelta(days=2),
            expiry_date=datetime.utcnow() + timedelta(days=45),
            usage_limit=200,
            per_user_limit=1,
            is_active=True
        )

        session.add_all([coupon1, coupon2, coupon3])
        session.flush()

        # 7. Sample Orders & Reviews
        sample_prod = created_products[4][0] # SonicShield Headphones
        sample_order = Order(
            order_number="ORD-20260915-SAMPLE1",
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
            product_id=sample_prod.id,
            product_name=sample_prod.name,
            price=9999.00,
            quantity=1,
            total_price=9999.00,
            status=OrderStatus.DELIVERED
        )
        session.add(sample_item)
        session.flush()

        # Verified Reviews
        review1 = Review(
            product_id=sample_prod.id,
            user_id=john_customer.id,
            order_item_id=sample_item.id,
            rating=5,
            title="Incredible sound quality and ANC!",
            comment="The active noise cancellation works like magic in noisy cafes. Battery lasts forever. Totally recommended!",
            seller_response="Thank you John! We are thrilled to hear you enjoy your SonicShield headphones.",
            seller_responded_at=datetime.utcnow() - timedelta(days=1)
        )
        review2 = Review(
            product_id=created_products[0][0].id, # Apex Pro
            user_id=alice_customer.id,
            order_item_id=None,
            rating=5,
            title="Super fast display and camera!",
            comment="The 120Hz display is buttery smooth and charging from 0 to 100% takes under 35 minutes.",
            seller_response=None
        )
        review3 = Review(
            product_id=created_products[10][0].id, # Leather jacket
            user_id=john_customer.id,
            order_item_id=None,
            rating=5,
            title="Genuine premium leather!",
            comment="High quality lambskin leather with perfect fit. Heavy duty zippers and feels expensive.",
            seller_response=None
        )

        session.add_all([review1, review2, review3])

        # Audit Log
        session.add(AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_INIT",
            entity="platform",
            entity_id="1",
            details_json={"message": f"ShopSphere database seeded successfully with {len(products_data)} products and {len(categories_data if 'categories_data' in locals() else [])} categories"}
        ))

        session.commit()
        print(f"Database seeded successfully with {len(products_data)} products!")

    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
