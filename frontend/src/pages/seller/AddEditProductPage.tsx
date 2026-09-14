import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { Category } from '../../types';
import { apiClient } from '../../api/client';

export const AddEditProductPage: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Variants list
  const [variants, setVariants] = useState<Array<{ sku: string; name: string; size: string; color: string; stock: number }>>([
    { sku: '', name: 'Standard / Black', size: 'M', color: 'Black', stock: 25 },
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
        if (res.data.data.length > 0) {
          setCategoryId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleAddVariant = () => {
    setVariants([...variants, { sku: '', name: '', size: '', color: '', stock: 10 }]);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !price) {
      alert('Please fill out all required product fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        category_id: Number(categoryId),
        name,
        slug: slug || `prod-${Date.now()}`,
        description,
        brand,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        price: Number(price),
        discount_price: discountPrice ? Number(discountPrice) : undefined,
        tax_percent: 18.0,
        status: 'ACTIVE',
        is_featured: false,
        images: imageUrl ? [{ image_url: imageUrl, is_primary: true, display_order: 1 }] : [],
        variants: variants.map((v, i) => ({
          sku: v.sku || `${sku || 'SKU'}-VAR-${i + 1}`,
          name: v.name || 'Standard',
          size: v.size || undefined,
          color: v.color || undefined,
          stock: v.stock || 10,
          is_active: true,
        })),
      };

      const res = await apiClient.post('/products', payload);
      if (res.data.success) {
        alert('Product created successfully!');
        navigate('/seller/products');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarLayout type="seller" title="Add New Product">
      <div className="max-w-4xl space-y-6">
        <button
          onClick={() => navigate('/seller/products')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to Products List
        </button>

        <form onSubmit={handleSubmit} className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Product Overview</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Apex 5G Smartphone"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. ApexTech"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="APEX-5G-01"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Regular Price (₹) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="49999"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Price (₹)</label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="44999"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a detailed description..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          {/* Variants section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Product Variants & Stock</h4>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> Add Variant
              </button>
            </div>

            {variants.map((v, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <input
                  type="text"
                  placeholder="Variant Title (e.g. 256GB / Black)"
                  value={v.name}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[i].name = e.target.value;
                    setVariants(updated);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Variant SKU"
                  value={v.sku}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[i].sku = e.target.value;
                    setVariants(updated);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
                <input
                  type="number"
                  placeholder="Stock Qty"
                  value={v.stock}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[i].stock = Number(e.target.value);
                    setVariants(updated);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(i)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center justify-end gap-1"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/20"
          >
            {isSubmitting ? 'Creating Product...' : 'Publish Product to Storefront'}
          </button>
        </form>
      </div>
    </SidebarLayout>
  );
};
