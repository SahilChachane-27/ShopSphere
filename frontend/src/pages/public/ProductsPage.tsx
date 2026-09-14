import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
    if (discountOnly) newParams.append('discount_only', 'true');
    if (sortBy) newParams.append('sort_by', sortBy);
    newParams.append('page', '1');
    setPage(1);
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setDiscountOnly(false);
    setSortBy('newest');
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Mobile Filter Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Catalog</h1>
          <p className="text-xs text-slate-400">
            Showing {totalItems} verified products
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
            <label className="block text-xs font-semibold text-slate-300 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Product title or brand..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
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
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
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
            <div className="text-center py-16 glass-panel rounded-3xl space-y-4">
              <p className="text-slate-400 text-sm">No products found matching your search filters.</p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-800 text-indigo-400 text-xs font-semibold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span className="text-xs text-slate-400">
                Page <strong className="text-white">{page}</strong> of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300 disabled:opacity-40 flex items-center gap-1"
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
