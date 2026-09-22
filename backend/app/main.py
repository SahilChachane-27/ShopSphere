import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.exceptions.handlers import (
    http_exception_handler, validation_exception_handler, global_exception_handler
)
from app.api.v1 import (
    auth, users, categories, products, cart, wishlist, inventory, coupons, orders, payments, reviews, notifications, sellers, admin
)

from contextlib import asynccontextmanager
from app.database.session import async_engine, Base
import app.models.models  # Ensure models are loaded

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist automatically on startup
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Database initialization error (will retry on connection): {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ShopSphere Multi-Vendor E-Commerce Platform REST API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)
# CORS Config - Allow all Vercel domains, preview URLs, localhost, and custom domains
allowed_origins = [
    "https://shop-sphere-one-gamma.vercel.app",
    "https://shop-sphere-58djq8w7g-sahil-chachanes-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

for origin in settings.BACKEND_CORS_ORIGINS:
    origin_clean = str(origin).strip().rstrip("/")
    if origin_clean and origin_clean != "*" and origin_clean not in allowed_origins:
        allowed_origins.append(origin_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Static Files for Uploaded Product Images
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

# Exception Handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(cart.router, prefix=settings.API_V1_STR)
app.include_router(wishlist.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(coupons.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(sellers.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }
