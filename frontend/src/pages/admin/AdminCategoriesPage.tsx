import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Trash2 } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { Category } from '../../types';
import { apiClient } from '../../api/client';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [parentId, setParentId] = useState<number | ''>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/categories', {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        image_url: imageUrl,
        parent_id: parentId ? Number(parentId) : undefined,
      });

      if (res.data.success) {
        alert('Category created successfully!');
        setShowModal(false);
        fetchCategories();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await apiClient.delete(`/categories/${id}`);
      if (res.data.success) {
        fetchCategories();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  return (
    <SidebarLayout type="admin" title="Hierarchical Category Manager">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Boxes className="text-indigo-400" size={20} /> Category Hierarchy
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No categories created.</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">slug: {cat.slug}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Subcategories */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="pl-6 border-l-2 border-slate-800 space-y-1.5 pt-2">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="flex justify-between items-center text-xs text-slate-300">
                          <span>└ {sub.name} <span className="text-[10px] text-slate-500">({sub.slug})</span></span>
                          <button
                            onClick={() => handleDeleteCategory(sub.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Add Category</h3>
              <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="e.g. Smart Home"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Parent Category (Optional for subcategory)</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">None (Top Level Category)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
