import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Minus, AlertTriangle, RefreshCw } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { Inventory } from '../../types';
import { apiClient } from '../../api/client';

export const SellerInventoryPage: React.FC = () => {
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Adjustment modal
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(10);
  const [notes, setNotes] = useState<string>('Restock inventory');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/inventory');
      if (res.data.success) {
        setInventoryList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/inventory/adjust/${selectedProductId}`, {
        quantity_change: quantityChange,
        notes: notes,
      });

      if (res.data.success) {
        alert('Stock updated successfully!');
        setSelectedProductId(null);
        fetchInventory();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarLayout type="seller" title="Inventory & Stock Management">
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Boxes className="text-amber-400" size={20} /> Current Stock Levels
          </h3>

          {isLoading ? (
            <p className="text-xs text-slate-400">Loading inventory data...</p>
          ) : inventoryList.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No inventory records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product ID</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Reserved Stock</th>
                    <th className="py-3 px-4">Available Stock</th>
                    <th className="py-3 px-4">Sold Quantity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {inventoryList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono text-white">PROD-{inv.product_id}</td>
                      <td className="py-3 px-4 font-bold text-white">{inv.current_stock} pcs</td>
                      <td className="py-3 px-4 text-amber-400">{inv.reserved_stock} pcs</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{inv.available_stock} pcs</td>
                      <td className="py-3 px-4 text-slate-400">{inv.sold_quantity} pcs</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedProductId(inv.product_id)}
                          className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock Adjustment Modal */}
        {selectedProductId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Adjust Stock (PROD-{selectedProductId})</h3>
              <form onSubmit={handleStockAdjust} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Quantity Change (Positive to restock, Negative to reduce)
                  </label>
                  <input
                    type="number"
                    required
                    value={quantityChange}
                    onChange={(e) => setQuantityChange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Notes / Reason</label>
                  <input
                    type="text"
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Restock shipment from supplier"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProductId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold"
                  >
                    Update Inventory
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
