import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Shield, Truck, RefreshCw, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm mt-auto">
      {/* Features Banner */}
      <div className="border-b border-slate-800/60 py-8 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl glass-card">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Free Delivery</h4>
              <p className="text-xs text-slate-400">On orders over ₹1,000</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl glass-card">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Verified Sellers</h4>
              <p className="text-xs text-slate-400">100% Authentic products</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl glass-card">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <CreditCard size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Simulated Payments</h4>
              <p className="text-xs text-slate-400">Card, UPI & Cash on Delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl glass-card">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Easy Returns</h4>
              <p className="text-xs text-slate-400">Hassle-free 7-day policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand info */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white">
              <ShoppingBag size={18} />
            </div>
            <span className="text-lg font-bold text-white">ShopSphere</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            ShopSphere is a state-of-the-art multi-vendor e-commerce platform connecting buyers directly with verified sellers.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Explore Marketplace</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/products" className="hover:text-indigo-400 transition-colors">All Products</Link></li>
            <li><Link to="/products?category=electronics" className="hover:text-indigo-400 transition-colors">Electronics & Mobiles</Link></li>
            <li><Link to="/products?category=fashion" className="hover:text-indigo-400 transition-colors">Fashion & Wearables</Link></li>
            <li><Link to="/cart" className="hover:text-indigo-400 transition-colors">Shopping Cart</Link></li>
          </ul>
        </div>

        {/* Seller & Admin */}
        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Sell on ShopSphere</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/register?role=seller" className="hover:text-amber-400 transition-colors">Become a Seller</Link></li>
            <li><Link to="/seller/dashboard" className="hover:text-amber-400 transition-colors">Seller Dashboard</Link></li>
            <li><Link to="/admin/dashboard" className="hover:text-rose-400 transition-colors">Admin Portal</Link></li>
          </ul>
        </div>

        {/* Payment Simulation Note */}
        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Simulated Checkout</h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            ShopSphere features a realistic checkout flow with Card, UPI, and COD payment status controls. No real currency is processed.
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 font-medium">Card</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 font-medium">UPI</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 font-medium">COD</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} ShopSphere Multi-Vendor Platform. Built with FastAPI & React.</p>
          <div className="flex gap-4">
            <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-slate-300">Swagger API Docs</a>
            <a href="/redoc" target="_blank" rel="noreferrer" className="hover:text-slate-300">ReDoc API Specs</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
