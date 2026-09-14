import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Store,
  DollarSign,
  ShoppingBag,
  Package,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SidebarLayout } from '../../components/SidebarLayout';
import { apiClient } from '../../api/client';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Platform Recharts Data
  const platformChartData = [
    { month: 'Jan', gmv: 120000, orders: 120 },
    { month: 'Feb', gmv: 185000, orders: 190 },
    { month: 'Mar', gmv: 240000, orders: 250 },
    { month: 'Apr', gmv: 310000, orders: 320 },
    { month: 'May', gmv: 450000, orders: 480 },
    { month: 'Jun', gmv: 620000, orders: 610 },
  ];

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch admin metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout type="admin" title="Platform Executive Dashboard">
      <div className="space-y-8">
        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl glass-card border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Gross GMV Revenue</span>
              <p className="text-2xl font-black text-white mt-1">
                ₹{(metrics?.total_revenue || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Total Users</span>
              <p className="text-2xl font-black text-white mt-1">{metrics?.total_users || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users size={24} />
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Pending Seller Approvals</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{metrics?.pending_sellers || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Store size={24} />
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Total Platform Orders</span>
              <p className="text-2xl font-black text-white mt-1">{metrics?.total_orders || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        {/* RECHARTS GMV GRAPH */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={20} /> Platform GMV & Order Volume
            </h3>
            <span className="text-xs text-slate-400 font-mono">Platform Growth Trend</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformChartData}>
                <defs>
                  <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="gmv" stroke="#6366f1" fillOpacity={1} fill="url(#colorGmv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* QUICK LINK PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/sellers"
            className="p-6 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between h-36"
          >
            <div>
              <Store className="text-amber-400 mb-2" size={24} />
              <h4 className="text-sm font-bold text-white">Review Seller Applications</h4>
              <p className="text-xs text-slate-400">Approve or reject pending seller stores</p>
            </div>
            <span className="text-xs font-semibold text-indigo-400">Review Applications →</span>
          </Link>

          <Link
            to="/admin/users"
            className="p-6 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between h-36"
          >
            <div>
              <Users className="text-emerald-400 mb-2" size={24} />
              <h4 className="text-sm font-bold text-white">User Accounts Control</h4>
              <p className="text-xs text-slate-400">Manage user access and active states</p>
            </div>
            <span className="text-xs font-semibold text-indigo-400">Manage Users →</span>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="p-6 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between h-36"
          >
            <div>
              <FileText className="text-indigo-400 mb-2" size={24} />
              <h4 className="text-sm font-bold text-white">Security Audit Logs</h4>
              <p className="text-xs text-slate-400">Inspect system & administrative event logs</p>
            </div>
            <span className="text-xs font-semibold text-indigo-400">View Audit Logs →</span>
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
};
