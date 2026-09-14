import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  Zap,
  Star,
  ShieldCheck,
  Store,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { Product, Category } from '../../types';
import { apiClient } from '../../api/client';
import { ProductCard } from '../../components/ProductCard';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/products?limit=8'),
        ]);

        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
        if (prodRes.data.items) {
          setFeaturedProducts(prodRes.data.items.slice(0, 4));
          setTrendingProducts(prodRes.data.items);
        }
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles size={14} className="text-amber-400" />
              The Next-Gen Multi-Vendor Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Discover Products From <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-amber-300 bg-clip-text text-transparent">Verified Sellers</span>
            </h1>

            <p className="text-base text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Explore thousands of tech gadgets, premium electronics, and fashion trends. Enjoy server-verified checkout, simulated online payments, and direct seller support.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/products"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                Shop All Products <ArrowRight size={18} />
              </Link>
              <Link
                to="/register?role=seller"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-700 hover:border-slate-500 bg-slate-900/60 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <Store size={18} className="text-amber-400" /> Become a Seller
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs text-slate-400">Verified Sellers</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">24/7</p>
                <p className="text-xs text-slate-400">Order Tracking</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">Instant</p>
                <p className="text-xs text-slate-400">Simulated Payment</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Collage */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-none grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-3xl glass-card p-3 overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600"
                    alt="Smartphone"
                    className="rounded-2xl h-48 w-full object-cover"
                  />
                  <div className="pt-3 px-2">
                    <span className="text-[10px] font-bold uppercase text-indigo-400">Flagship</span>
                    <p className="text-xs font-bold text-white">5G Smartphones</p>
                  </div>
                </div>
                <div className="rounded-3xl glass-card p-3 overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"
                    alt="Headphones"
                    className="rounded-2xl h-36 w-full object-cover"
                  />
                  <div className="pt-2 px-2">
                    <p className="text-xs font-bold text-white">Hi-Res Audio</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <div className="rounded-3xl glass-card p-3 overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"
                    alt="Laptop"
                    className="rounded-2xl h-36 w-full object-cover"
                  />
                  <div className="pt-2 px-2">
                    <p className="text-xs font-bold text-white">Ultrabooks</p>
                  </div>
                </div>
                <div className="rounded-3xl glass-card p-3 overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"
                    alt="Fashion"
                    className="rounded-2xl h-48 w-full object-cover"
                  />
                  <div className="pt-3 px-2">
                    <span className="text-[10px] font-bold uppercase text-amber-400">Apparel</span>
                    <p className="text-xs font-bold text-white">Designer Leather</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={24} /> Popular Categories
            </h2>
            <p className="text-xs text-slate-400">Browse items by category hierarchy</p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category_id=${cat.id}`}
              className="group relative rounded-2xl glass-card p-4 overflow-hidden flex flex-col justify-between h-40 transition-all hover:scale-105"
            >
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1498049860654-af1a5c566976?w=600'}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              <div className="relative z-10">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Category</span>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {cat.name}
                </h3>
              </div>

              <div className="relative z-10 text-xs text-slate-300 flex items-center gap-1 font-medium">
                Explore Items <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={24} /> Trending Products
            </h2>
            <p className="text-xs text-slate-400">Best-selling products from top verified sellers</p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            Browse Catalog →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* SELLER BANNER CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-panel p-8 sm:p-12 border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
              Grow Your Business
            </span>
            <h2 className="text-3xl font-black text-white leading-tight">
              Start Selling Your Products on ShopSphere Today
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reach thousands of buyers across the country with instant payout tracking, inventory adjustment tools, coupon management, and dedicated seller analytics dashboard.
            </p>
          </div>
          <Link
            to="/register?role=seller"
            className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 shrink-0 transition-all hover:scale-105"
          >
            Register Seller Account
          </Link>
        </div>
      </section>
    </div>
  );
};
