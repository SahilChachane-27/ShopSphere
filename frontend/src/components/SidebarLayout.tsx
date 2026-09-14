import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Ticket,
  BarChart3,
  Users,
  ShieldCheck,
  Store,
  LogOut,
  FileText,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarLayoutProps {
  type: 'seller' | 'admin';
  title: string;
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ type, title, children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const sellerNav = [
    { label: 'Overview', path: '/seller/dashboard', icon: LayoutDashboard },
    { label: 'My Products', path: '/seller/products', icon: Package },
    { label: 'Inventory & Stock', path: '/seller/inventory', icon: Boxes },
    { label: 'Store Orders', path: '/seller/orders', icon: ShoppingBag },
    { label: 'Coupons', path: '/seller/coupons', icon: Ticket },
    { label: 'Seller Payouts', path: '/seller/payouts', icon: DollarSign },
  ];

  const adminNav = [
    { label: 'Platform Analytics', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Seller Approvals', path: '/admin/sellers', icon: Store },
    { label: 'Users & Roles', path: '/admin/users', icon: Users },
    { label: 'Categories', path: '/admin/categories', icon: Boxes },
    { label: 'All Products', path: '/admin/products', icon: Package },
    { label: 'All Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  const navItems = type === 'seller' ? sellerNav : adminNav;

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <Link to="/" className="flex items-center gap-2">
              <div className={`p-2 rounded-xl text-white ${type === 'seller' ? 'bg-amber-600' : 'bg-rose-600'}`}>
                {type === 'seller' ? <Store size={20} /> : <ShieldCheck size={20} />}
              </div>
              <div>
                <h2 className="font-bold text-white text-base leading-tight">
                  {type === 'seller' ? 'Seller Panel' : 'Admin Portal'}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">{user?.full_name}</p>
              </div>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? type === 'seller'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="p-6 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-indigo-400 hover:underline">
              ← Return to Main Storefront
            </Link>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
