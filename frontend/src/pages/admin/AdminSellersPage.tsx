import React, { useEffect, useState } from 'react';
import { Store, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { SellerProfile } from '../../types';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';

export const AdminSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/sellers');
      if (res.data.success) {
        setSellers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sellers', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalUpdate = async (sellerId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await apiClient.put(`/admin/sellers/${sellerId}/approval`, {
        approval_status: status,
      });

      if (res.data.success) {
        alert(`Seller application status set to ${status}`);
        fetchSellers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update seller approval status');
    }
  };

  return (
    <SidebarLayout type="admin" title="Seller Approval & Store Oversight">
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Store className="text-amber-400" size={20} /> Registered Seller Applications
          </h3>

          {isLoading ? (
            <p className="text-xs text-slate-400">Loading sellers...</p>
          ) : sellers.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No seller stores registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Store Name</th>
                    <th className="py-3 px-4">Business Email</th>
                    <th className="py-3 px-4">Tax ID / GSTIN</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-white">{s.store_name}</td>
                      <td className="py-3 px-4 text-slate-400">{s.business_email}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{s.tax_id || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <Badge status={s.approval_status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {s.approval_status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprovalUpdate(s.id, 'APPROVED')}
                            className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30"
                          >
                            Approve
                          </button>
                        )}
                        {s.approval_status !== 'REJECTED' && (
                          <button
                            onClick={() => handleApprovalUpdate(s.id, 'REJECTED')}
                            className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30"
                          >
                            Reject
                          </button>
                        )}
                      </td>
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
