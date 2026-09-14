import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ProductsPage } from './pages/public/ProductsPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Customer Pages
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { WishlistPage } from './pages/customer/WishlistPage';

// Seller Pages
import { SellerDashboardPage } from './pages/seller/SellerDashboardPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { AddEditProductPage } from './pages/seller/AddEditProductPage';
import { SellerInventoryPage } from './pages/seller/SellerInventoryPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerCouponsPage } from './pages/seller/SellerCouponsPage';
import { SellerPayoutsPage } from './pages/seller/SellerPayoutsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSellersPage } from './pages/admin/AdminSellersPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles,
}) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-xs text-slate-400">Loading auth...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Storefront Routes */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />
      <Route
        path="/products"
        element={
          <MainLayout>
            <ProductsPage />
          </MainLayout>
        }
      />
      <Route
        path="/products/:id_or_slug"
        element={
          <MainLayout>
            <ProductDetailPage />
          </MainLayout>
        }
      />
      <Route
        path="/login"
        element={
          <MainLayout>
            <LoginPage />
          </MainLayout>
        }
      />
      <Route
        path="/register"
        element={
          <MainLayout>
            <RegisterPage />
          </MainLayout>
        }
      />

      {/* Protected Customer Routes */}
      <Route
        path="/cart"
        element={
          <MainLayout>
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <MainLayout>
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/orders"
        element={
          <MainLayout>
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <MainLayout>
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />
      <Route
        path="/wishlist"
        element={
          <MainLayout>
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />

      {/* Protected Seller Panel Routes */}
      <Route
        path="/seller/dashboard"
        element={
          <ProtectedRoute roles={['SELLER', 'ADMIN']}>
            <SellerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/products"
        element={
          <ProtectedRoute roles={['SELLER', 'ADMIN']}>
            <SellerProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/products/add"
        element={
          <ProtectedRoute roles={['SELLER', 'ADMIN']}>
            <AddEditProductPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/inventory"
        element={
          <ProtectedRoute roles={['SELLER', 'ADMIN']}>
            <SellerInventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/orders"
        element={
          <ProtectedRoute roles={['SELLER', 'ADMIN']}>
            <SellerOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/coupons"
        element={
          <ProtectedRoute roles={['SELLER', 'ADMIN']}>
            <SellerCouponsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/payouts"
        element={
          <ProtectedRoute roles={['SELLER', 'ADMIN']}>
            <SellerPayoutsPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Portal Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sellers"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminSellersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminCategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminAuditLogsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
