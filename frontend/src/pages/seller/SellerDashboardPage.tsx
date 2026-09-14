import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SidebarLayout } from '../../components/SidebarLayout';
import { DashboardMetrics, Order } from '../../types';
import { apiClient } from '../../api/client';

export const SellerDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recharts sample monthly trend data
  const revenueChartData = [
    { month: 'Jan', revenue: 18000, orders: 12 },
    { month: 'Feb', revenue: 24000, orders: 18 },
    { month: 'Mar', revenue: 32000, orders: 25 },
    { month: 'Apr', revenue: 45000, orders: 34 },
    { month: 'May', revenue: 58000, orders: 42 },
    { month: 'Jun', revenue: 79999, orders: 55 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [mRes, oRes] = await Promise.all([
        apiClient.get('/sellers/me/analytics'),
        apiClient.get('/orders/seller/list'),
      ]);

      if (mRes.data.success) {
        setMetrics(mRes.data.data);
      }
      if (oRes.data.success) {
        setRecentOrders(oRes.data.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch seller analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout type="seller" title="Seller Store Dashboard">
      <div className="space-y-8">
        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl glass-card border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Total Sales</span>
              <p className="text-2xl font-black text-white mt-1">
                ₹{(metrics?.total_sales || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Store Orders</span>
              <p className="text-2xl font-black text-white mt-1">{metrics?.total_orders || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Active Products</span>
              <p className="text-2xl font-black text-white mt-1">{metrics?.total_products || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Package size={24} />
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider">Low Stock Warnings</span>
              <p className="text-2xl font-black text-white mt-1">{metrics?.low_stock_count || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        {/* RECHARTS REVENUE GRAPH */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-amber-400" size={20} /> Revenue & Sales Trend
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time Performance</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT STORE ORDERS TABLE */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Orders for Your Store</h3>
            <Link to="/seller/orders" className="text-xs text-amber-400 font-semibold hover:underline">
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No orders received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-bold text-white">{o.order_number}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                          {o.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-300">₹{o.total.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <Link to="/seller/orders" className="text-amber-400 font-bold hover:underline">
                          Manage
                        </Link>
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
