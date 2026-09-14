import React, { useEffect, useState } from 'react';
import { DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { apiClient } from '../../api/client';

export const SellerPayoutsPage: React.FC = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/sellers/me/payouts');
      if (res.data.success) {
        setPayouts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch payouts', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout type="seller" title="Seller Earnings & Payouts">
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="text-amber-400" size={20} /> Store Payout History
          </h3>

          {isLoading ? (
            <p className="text-xs text-slate-400">Loading payouts...</p>
          ) : payouts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-xs text-slate-400">No payout records generated yet.</p>
              <p className="text-[11px] text-slate-500">Payouts are calculated automatically upon order fulfillment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Payout ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-bold text-white">PAYOUT-{p.id}</td>
                      <td className="py-3 px-4 font-bold text-amber-300">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{p.reference_id || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
