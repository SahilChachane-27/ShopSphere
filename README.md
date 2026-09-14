# ShopSphere — Production-Style Multi-Vendor E-Commerce Platform

ShopSphere is a full-stack, multi-vendor e-commerce platform built with a **FastAPI** REST API, **PostgreSQL** relational database, **SQLAlchemy 2.x ORM**, **JWT Authentication** with **Role-Based Access Control (RBAC)**, and a modern **React + TypeScript + Vite + Tailwind CSS** frontend.

The platform provides dedicated, role-isolated portals for:
- **Customers**: Product search, category navigation, multi-faceted filtering & sorting, cart management, wishlist, checkout, simulated payment gateway with retry flows, order tracking, and verified reviews.
- **Sellers**: Store management, product CRUD with variants & image uploads, inventory stock adjustments & transaction logs, store order fulfillment, coupon creation, payout tracking, and analytics dashboards with Recharts.
- **Admins**: Platform oversight, seller application approvals/rejections, user activation/suspension toggling, hierarchical category management, platform-wide order & GMV analytics, and security audit logs.

---

## Technology Stack

### Backend
- **Framework**: Python 3.14 + FastAPI
- **Database**: PostgreSQL 18
- **ORM & Migrations**: SQLAlchemy 2.x (Async & Sync) + Alembic
- **Security & Auth**: PyJWT, Argon2/Bcrypt (`passlib`), OAuth2 Password Flow
- **Data Validation**: Pydantic v2 & Pydantic Settings
- **Testing**: Pytest & HTTPX AsyncClient

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Vanilla CSS glassmorphism & dark aesthetics)
- **Routing**: React Router v7
- **API Client**: Centralized Axios with JWT interceptors & token refresh
- **Data Visualization**: Recharts (GMV, Sales, Revenue charts)
- **Icons**: Lucide React

---

## Folder Structure

```
E-Commerce/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints (auth, users, products, cart, orders, etc.)
│   │   ├── core/            # Configuration and security routines
│   │   ├── database/        # Async/Sync SQLAlchemy engine & sessionmakers
│   │   ├── dependencies/    # FastAPI RBAC dependencies (get_current_user, get_current_seller, etc.)
│   │   ├── exceptions/      # Exception handlers for standard JSON error outputs
│   │   ├── models/          # Declarative SQLAlchemy 2.x ORM models
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── utils/           # Audit loggers & notification helpers
│   │   └── main.py          # FastAPI application entrypoint
│   ├── seed.py              # PostgreSQL database populator script
│   ├── tests/               # Pytest async test suite
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── api/             # Centralized Axios client
│   │   ├── components/      # UI components (Navbar, Footer, ProductCard, SimulatedPaymentModal, etc.)
│   │   ├── context/         # AuthContext & CartContext
│   │   ├── pages/           # Public, Customer, Seller, and Admin portal pages
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # Main router hierarchy
│   │   └── main.tsx         # React root renderer
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── README.md
```

---

## Development Credentials (Local Testing)

The database seed script generates pre-configured demo accounts for instant testing:

| Role | Email | Password | Store Name / Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@shopsphere.com` | `Admin@123456` | Platform Admin |
| **Seller 1** | `tech@shopsphere.com` | `Seller@123456` | TechSphere Electronics |
| **Seller 2** | `fashion@shopsphere.com` | `Seller@123456` | FashionHub Trends |
| **Customer 1** | `john@example.com` | `Customer@123456` | John Doe |
| **Customer 2** | `alice@example.com` | `Customer@123456` | Alice Smith |

> **Note:** The Login page includes **1-Click Demo Account** buttons to instantly fill in credentials for Customer, Seller, or Admin roles.

---

## Quick Start Guide

### 1. Database Setup (PostgreSQL)

Ensure PostgreSQL is running locally on port `5432` with database `shopsphere`:
```sql
CREATE DATABASE shopsphere;
```

### 2. Backend Setup & Seed

1. Navigate to `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the database seed script:
   ```bash
   python seed.py
   ```
5. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   FastAPI server will run on `http://127.0.0.1:8000`.
   - **Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **ReDoc Specs:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 3. Frontend Setup

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   Frontend web application will run on [http://localhost:5173](http://localhost:5173).

---

## Automated Backend Testing

Run the pytest test suite to verify authentication, authorization, API endpoints, cart, and search:
```bash
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest tests
```

---

## Key Platform Features & Workflow

### 1. Simulated Payment Gateway
- Supports **Credit/Debit Card**, **UPI**, and **Cash on Delivery (COD)** payment methods.
- Includes developer simulation controls on payment processing screens:
  - **[ Simulate Success ]**: Marks payment as `SUCCESS`, updates order to `CONFIRMED`, reduces inventory stock levels, clears customer cart, and sends notification.
  - **[ Simulate Failure ]**: Marks payment as `FAILED`, preserves customer cart items, and enables **Retry Payment** capability with unique transaction IDs (`SIM-TXN-YYYYMMDD-XXXXXX`).
  - **[ Simulate Pending ]**: Marks payment as `PENDING` allowing status polling.

### 2. Business Logic Enforcement
- Server-side calculation of subtotals, tax, shipping, and coupon discounts (never trusts frontend totals).
- Inventory reduction on online payment confirmation or COD placement.
- Stock restoration upon order cancellation.
- Strict seller isolation: Sellers can only view and manage their own products, inventory, and order line items.
