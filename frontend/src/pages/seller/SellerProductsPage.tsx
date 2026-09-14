import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, Package, Search } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { Product } from '../../types';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';

export const SellerProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/products?limit=100');
      if (res.data.items) {
        setProducts(res.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch seller products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await apiClient.delete(`/products/${id}`);
      if (res.data.success) {
        alert('Product deleted successfully.');
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarLayout type="seller" title="My Store Products">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by title or SKU..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          </div>

          <Link
            to="/seller/products/add"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus size={16} /> Add New Product
          </Link>
        </div>

        {/* Products Table */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No products found in your store catalog.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.map((p) => {
                    const primaryImg = p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                    return (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img src={primaryImg} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-900" />
                          <div>
                            <p className="font-bold text-white line-clamp-1">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.brand}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{p.sku}</td>
                        <td className="py-3 px-4 font-bold text-amber-300">
                          ₹{(p.discount_price || p.price).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {p.stock_count || 0} pcs
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={p.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
