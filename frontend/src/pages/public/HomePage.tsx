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
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  Truck,
  RotateCcw,
  Lock,
  Percent,
  Smartphone,
  Shirt,
  Home as HomeIcon,
  Dumbbell,
  Sparkle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Product, Category, SellerProfile } from '../../types';
import { apiClient } from '../../api/client';
import { ProductCard } from '../../components/ProductCard';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [flashDeals, setFlashDeals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'top_rated' | 'new_arrivals' | 'under_5k'>('trending');

  // Hero carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Flash deals countdown timer (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 24, seconds: 18 });

  const heroSlides = [
    {
      badge: 'Electronics Mega Festival',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      title: 'Next-Gen Tech & Flagship Smartphones',
      subtitle: 'Upgrade to 5G smartphones, ultra-sleek laptops, and spatial audio headphones with up to 40% discount.',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
      ctaText: 'Shop Electronics',
      link: '/products?category_id=1',
      tag: 'UP TO 40% OFF'
    },
    {
      badge: 'Fashion Summer Drop 2026',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      title: 'Handcrafted Apparel & Premium Sneakers',
      subtitle: 'Explore genuine lambskin leather jackets, tailored merino wool blazers, and high-performance knit running shoes.',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      ctaText: 'Explore Fashion',
      link: '/products?category_id=2',
      tag: 'TRENDING FASHION'
    },
    {
      badge: 'Smart Home & Living',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      title: 'Revolutionize Your Kitchen & Living Space',
      subtitle: 'Experience digital air fryers, LiDAR robot vacuums, and artisan Italian espresso coffee machines.',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
      ctaText: 'Upgrade Your Home',
      link: '/products?category_id=3',
      tag: 'SMART APPLIANCES'
    }
  ];

  // Verified Sellers static data fallback / showcase
  const topSellers = [
    {
      name: 'TechSphere Electronics',
      desc: 'Flagship smartphones, high-performance laptops, pro audio, and next-gen gaming accessories.',
      logo: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400',
      sellerId: 1,
      tag: 'Electronics Leader'
    },
    {
      name: 'FashionHub Trends',
      desc: 'Curated apparel, designer leather jackets, premium sneakers, and sleek timepieces.',
      logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      sellerId: 2,
      tag: 'Top Fashion House'
    },
    {
      name: 'HomePlus Living',
      desc: 'Smart appliances, artisan kitchenware, ergonomic decor, and ambient home lighting.',
      logo: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400',
      sellerId: 3,
      tag: 'Home & Kitchen'
    },
    {
      name: 'FitLife Athletic',
      desc: 'Commercial-grade fitness equipment, pro gym gear, activewear, and hydration bottles.',
      logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
      sellerId: 4,
      tag: 'Fitness Gear'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/products?limit=24'),
        ]);

        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
        if (prodRes.data.items) {
          const items: Product[] = prodRes.data.items;
          setAllProducts(items);

          // Flash deals: items with highest discount percentage
          const deals = items
            .filter((p) => p.discount_price && p.discount_price < p.price)
            .sort((a, b) => {
              const discA = ((a.price - (a.discount_price || a.price)) / a.price);
              const discB = ((b.price - (b.discount_price || b.price)) / b.price);
              return discB - discA;
            })
            .slice(0, 4);

          setFlashDeals(deals);
        }
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 5, minutes: 24, seconds: 18 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic hero slider cycle
  useEffect(() => {
    const sliderInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(sliderInterval);
  }, [heroSlides.length]);

  // Tab filtering logic
  const getDisplayedProducts = () => {
    switch (activeTab) {
      case 'top_rated':
        return [...allProducts].sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 8);
      case 'new_arrivals':
        return [...allProducts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
      case 'under_5k':
        return allProducts.filter((p) => (p.discount_price || p.price) <= 5000).slice(0, 8);
      case 'trending':
      default:
        return allProducts.slice(0, 8);
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'electronics':
        return <Smartphone size={18} className="text-indigo-400" />;
      case 'fashion':
        return <Shirt size={18} className="text-amber-400" />;
      case 'home-kitchen':
        return <HomeIcon size={18} className="text-emerald-400" />;
      case 'sports-fitness':
        return <Dumbbell size={18} className="text-rose-400" />;
      case 'beauty-care':
        return <Sparkle size={18} className="text-purple-400" />;
      default:
        return <Zap size={18} className="text-amber-400" />;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. TOP CATEGORY QUICK NAV BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          <Link
            to="/products"
            className="shrink-0 px-4 py-2.5 rounded-2xl glass-card border border-indigo-500/30 hover:border-indigo-500 bg-indigo-950/30 text-indigo-300 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
          >
            <Sparkles size={16} className="text-amber-400" /> All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category_id=${cat.id}`}
              className="shrink-0 px-4 py-2.5 rounded-2xl glass-card hover:border-slate-600 bg-slate-900/60 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-slate-800 hover:scale-105"
            >
              {getCategoryIcon(cat.slug)}
              <span>{cat.name}</span>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-bold">
                  {cat.subcategories.length}
                </span>
              )}
            </Link>
          ))}
          <Link
            to="/products?discount_only=true"
            className="shrink-0 px-4 py-2.5 rounded-2xl glass-card border border-rose-500/30 hover:border-rose-500 bg-rose-950/20 text-rose-300 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
          >
            <Flame size={16} className="text-rose-400" /> Mega Deals & Clearance
          </Link>
        </div>
      </section>

      {/* 2. HERO SLIDER CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl glass-panel border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50 shadow-2xl min-h-[440px] flex items-center">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 sm:p-12 transition-opacity duration-700 ${
                idx === currentSlide ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
            >
              <div className="space-y-6 text-center lg:text-left">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${slide.badgeColor}`}>
                  <Sparkles size={14} className="text-amber-400" />
                  {slide.badge}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  {slide.title}
                </h1>

                <p className="text-sm text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  {slide.subtitle}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    to={slide.link}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    {slide.ctaText} <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/products"
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-slate-700 bg-slate-900/60 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    Browse All Catalog
                  </Link>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="relative w-full max-w-md aspect-4/3 rounded-3xl overflow-hidden glass-card p-3 shadow-2xl border border-slate-700/60">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover rounded-2xl transition-transform duration-700 hover:scale-105"
                  />
                  <span className="absolute top-6 left-6 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-amber-400 font-black text-xs border border-amber-500/30 shadow-lg">
                    {slide.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Slider Controls & Indicators */}
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
              className="p-2 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentSlide ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
              className="p-2 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              aria-label="Next Slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. FLASH DEALS / LIGHTNING SALE SECTION */}
      {flashDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-rose-500/30 bg-gradient-to-r from-rose-950/30 via-slate-900 to-indigo-950/30 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Flame size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-white">Lightning Flash Deals</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                      Live Now
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Limited quantities at exclusive markdown prices</p>
                </div>
              </div>

              {/* Live Countdown Timer */}
              <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-2xl border border-rose-500/30">
                <Clock size={16} className="text-rose-400" />
                <span className="text-xs font-semibold text-slate-300">Ends In:</span>
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
                  <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    {String(timeLeft.hours).padStart(2, '0')}h
                  </span>
                  :
                  <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    {String(timeLeft.minutes).padStart(2, '0')}m
                  </span>
                  :
                  <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-rose-400">
                    {String(timeLeft.seconds).padStart(2, '0')}s
                  </span>
                </div>
              </div>
            </div>

            {/* Flash Deals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {flashDeals.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  {/* Stock Claim Progress Bar overlay inside card footer */}
                  <div className="mt-2 px-1">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
                      <span>Limited Stock</span>
                      <span className="text-amber-400 font-bold">82% Claimed</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full w-[82%]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. SHOP BY CATEGORY GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={24} /> Featured Departments
            </h2>
            <p className="text-xs text-slate-400">Explore items across root and subcategories</p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group relative rounded-3xl glass-card p-6 overflow-hidden flex flex-col justify-between border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02]"
            >
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1498049860654-af1a5c566976?w=600'}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-indigo-400">
                    {getCategoryIcon(cat.slug)}
                  </div>
                  <Link
                    to={`/products?category_id=${cat.id}`}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Browse <ArrowRight size={14} />
                  </Link>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-normal">
                    {cat.description || 'Explore high quality items from top verified sellers.'}
                  </p>
                </div>

                {/* Subcategory Chips */}
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/products?category_id=${sub.id}`}
                        className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TABBED PRODUCT DISCOVERY GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={24} /> Product Catalog Showcase
            </h2>
            <p className="text-xs text-slate-400">Handpicked items from top rated categories</p>
          </div>

          {/* Discovery Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'trending'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'glass-card text-slate-300 hover:text-white'
              }`}
            >
              🔥 Trending Now
            </button>
            <button
              onClick={() => setActiveTab('top_rated')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'top_rated'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'glass-card text-slate-300 hover:text-white'
              }`}
            >
              ⭐ Top Rated (4.8+ ★)
            </button>
            <button
              onClick={() => setActiveTab('new_arrivals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'new_arrivals'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'glass-card text-slate-300 hover:text-white'
              }`}
            >
              ✨ New Arrivals
            </button>
            <button
              onClick={() => setActiveTab('under_5k')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'under_5k'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'glass-card text-slate-300 hover:text-white'
              }`}
            >
              💰 Under ₹5,000
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {getDisplayedProducts().map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. VERIFIED SELLERS / BRAND SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Store className="text-amber-400" size={24} /> Verified Seller Stores
            </h2>
            <p className="text-xs text-slate-400">Buy directly from approved, authenticated sellers</p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            View All Stores →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topSellers.map((s, idx) => (
            <div
              key={idx}
              className="rounded-3xl glass-card p-5 border border-slate-800 hover:border-amber-500/40 transition-all hover:-translate-y-1 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={s.logo}
                  alt={s.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-bold text-white line-clamp-1">{s.name}</h3>
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{s.tag}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{s.desc}</p>

              <Link
                to={`/products?seller_id=${s.sellerId}`}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold text-center border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                Visit Store <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 7. E-COMMERCE VALUE PROPOSITION STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-8 rounded-3xl glass-panel border border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Free Express Shipping</h4>
              <p className="text-xs text-slate-400">On all orders over ₹999 across India</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Genuine Guarantee</h4>
              <p className="text-xs text-slate-400">Directly sourced from verified sellers</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">7-Day Easy Returns</h4>
              <p className="text-xs text-slate-400">Hassle-free replacement policy</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Lock size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Secure Checkout</h4>
              <p className="text-xs text-slate-400">Server-verified simulated payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SELLER REGISTRATION CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-panel p-8 sm:p-12 border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
              Grow Your Brand
            </span>
            <h2 className="text-3xl font-black text-white leading-tight">
              Start Selling Your Products on ShopSphere Today
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reach thousands of buyers nationwide. Enjoy real-time order notifications, custom coupon generation, payout tracking, and seller analytics.
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
