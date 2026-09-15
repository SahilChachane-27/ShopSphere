import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Tag,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Product, Category, PaginatedApiResponse } from '../../types';
import { apiClient } from '../../api/client';
import { ProductCard } from '../../components/ProductCard';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category_id') || '');
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('max_price') || '');
  const [minRating, setMinRating] = useState<string>(searchParams.get('min_rating') || '');
  const [sellerId, setSellerId] = useState<string>(searchParams.get('seller_id') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort_by') || 'newest');
  const [discountOnly, setDiscountOnly] = useState<boolean>(searchParams.get('discount_only') === 'true');
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams, page]);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (minRating) params.append('min_rating', minRating);
      if (sellerId) params.append('seller_id', sellerId);
      if (discountOnly) params.append('discount_only', 'true');
      if (sortBy) params.append('sort_by', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const res = await apiClient.get<PaginatedApiResponse<Product>>(`/products?${params.toString()}`);
      setProducts(res.data.items);
      setTotalPages(res.data.total_pages);
      setTotalItems(res.data.total);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.append('q', searchQuery);
    if (selectedCategory) newParams.append('category_id', selectedCategory);
    if (minPrice) newParams.append('min_price', minPrice);
    if (maxPrice) newParams.append('max_price', maxPrice);
    if (minRating) newParams.append('min_rating', minRating);
    if (sellerId) newParams.append('seller_id', sellerId);
    if (discountOnly) newParams.append('discount_only', 'true');
    if (sortBy) newParams.append('sort_by', sortBy);
    newParams.append('page', '1');
    setPage(1);
    setSearchParams(newParams);
    setMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSellerId('');
    setDiscountOnly(false);
    setSortBy('newest');
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const handlePricePreset = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  // Find category name if category is selected
  const activeCategoryObj = categories.find((c) => String(c.id) === selectedCategory) ||
    categories.flatMap((c) => c.subcategories || []).find((s) => String(s.id) === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Category Quick Filter Pill Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800 pb-4">
        <button
          onClick={() => {
            setSelectedCategory('');
            const p = new URLSearchParams(searchParams);
            p.delete('category_id');
            setSearchParams(p);
          }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            !selectedCategory
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          All Departments
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(String(cat.id));
              const p = new URLSearchParams(searchParams);
              p.set('category_id', String(cat.id));
              setSearchParams(p);
            }}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === String(cat.id)
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'glass-card text-slate-300 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            {activeCategoryObj ? activeCategoryObj.name : 'Explore All Products'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Showing <span className="text-indigo-400 font-bold">{totalItems}</span> items from verified sellers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300 flex items-center gap-2"
          >
            <Filter size={16} /> Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                const p = new URLSearchParams(searchParams);
                p.set('sort_by', e.target.value);
                setSearchParams(p);
              }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Sort by: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Bar */}
      {(searchQuery || selectedCategory || minPrice || maxPrice || minRating || discountOnly || sellerId) && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl glass-panel border border-slate-800 text-xs">
          <span className="font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Tag size={14} className="text-indigo-400" /> Active Filters:
          </span>
          {searchQuery && (
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              Search: "{searchQuery}"
              <X size={12} className="cursor-pointer" onClick={() => setSearchQuery('')} />
            </span>
          )}
          {activeCategoryObj && (
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              Category: {activeCategoryObj.name}
              <X size={12} className="cursor-pointer" onClick={() => setSelectedCategory('')} />
            </span>
          )}
          {discountOnly && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              Discounted Only
              <X size={12} className="cursor-pointer" onClick={() => setDiscountOnly(false)} />
            </span>
          )}
          {minRating && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              Rating: {minRating}★+
              <X size={12} className="cursor-pointer" onClick={() => setMinRating('')} />
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
          >
            <RotateCcw size={12} /> Clear All
          </button>
        </div>
      )}

      {/* Main Grid & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP SIDEBAR FILTERS */}
        <aside className="hidden lg:block space-y-6 glass-panel p-6 rounded-2xl border border-slate-800 sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-indigo-400" /> Filters
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Search Catalog</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                placeholder="Title, brand, SKU..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <React.Fragment key={c.id}>
                  <option value={c.id} className="font-bold">
                    {c.name}
                  </option>
                  {c.subcategories?.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      &nbsp;&nbsp;-- {sub.name}
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
            {/* Price Presets */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => handlePricePreset('0', '2000')}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-slate-700"
              >
                &lt; ₹2K
              </button>
              <button
                type="button"
                onClick={() => handlePricePreset('2000', '10000')}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-slate-700"
              >
                ₹2K - ₹10K
              </button>
              <button
                type="button"
                onClick={() => handlePricePreset('10000', '50000')}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-slate-700"
              >
                ₹10K - ₹50K
              </button>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Minimum Rating</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5 Stars & Above</option>
              <option value="4.0">4.0 Stars & Above</option>
              <option value="3.5">3.5 Stars & Above</option>
            </select>
          </div>

          {/* Discount Filter */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={discountOnly}
                onChange={(e) => setDiscountOnly(e.target.checked)}
                className="accent-indigo-500 rounded"
              />
              Discounted Items Only
            </label>
          </div>

          <button
            onClick={handleApplyFilters}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all hover:scale-105"
          >
            Apply Filters
          </button>
        </aside>

        {/* PRODUCTS GRID */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl animate-shimmer" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl space-y-4 border border-slate-800">
              <div className="w-16 h-16 rounded-full bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                <Search size={28} />
              </div>
              <h3 className="text-base font-bold text-white">No products found</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                We couldn't find any products matching your search query or filter selection.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-8 border-t border-slate-800">
              <button
                disabled={page <= 1}
                onClick={() => {
                  setPage(page - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                  page <= 1
                    ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'glass-card text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span className="text-xs text-slate-400 font-medium">
                Page <span className="text-white font-bold">{page}</span> of{' '}
                <span className="text-white font-bold">{totalPages}</span>
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => {
                  setPage(page + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                  page >= totalPages
                    ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'glass-card text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
