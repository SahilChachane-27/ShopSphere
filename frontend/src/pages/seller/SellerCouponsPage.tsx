import React, { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2 } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { Coupon } from '../../types';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';

export const SellerCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Coupon form modal
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderVal, setMinOrderVal] = useState<number>(500);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/coupons');
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        minimum_order_value: minOrderVal,
        start_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 100,
        per_user_limit: 1,
        is_active: true,
      };

      const res = await apiClient.post('/coupons', payload);
      if (res.data.success) {
        alert('Coupon created!');
        setShowModal(false);
        fetchCoupons();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    try {
      const res = await apiClient.delete(`/coupons/${id}`);
      if (res.data.success) {
        fetchCoupons();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <SidebarLayout type="seller" title="Store Coupon Codes">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Ticket className="text-amber-400" size={20} /> Active Promo Coupons
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
          >
            <Plus size={16} /> Create Coupon
          </button>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading coupons...</p>
          ) : coupons.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No active coupons created.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min Order</th>
                    <th className="py-3 px-4">Used Count</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">{c.code}</td>
                      <td className="py-3 px-4">{c.discount_type}</td>
                      <td className="py-3 px-4 font-bold text-white">
                        {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                      </td>
                      <td className="py-3 px-4 text-slate-400">₹{c.minimum_order_value}</td>
                      <td className="py-3 px-4 text-slate-400">{c.used_count} / {c.usage_limit}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Create New Coupon</h3>
              <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SALE20"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 mb-1">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="PERCENTAGE">PERCENTAGE (%)</option>
                      <option value="FIXED">FIXED (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Value</label>
                    <input
                      type="number"
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={minOrderVal}
                    onChange={(e) => setMinOrderVal(Number(e.target.value))}
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
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                    Save Coupon
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
