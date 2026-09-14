import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Eye, RefreshCw, XCircle } from 'lucide-react';
import { Order } from '../../types';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customer orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await apiClient.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        alert('Order cancelled successfully.');
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="text-indigo-400" size={24} /> Order History
        </h1>
        <p className="text-xs text-slate-400">Track current shipments and past purchases</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-2xl animate-shimmer" />
          <div className="h-32 rounded-2xl animate-shimmer" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl space-y-4">
          <p className="text-slate-400 text-sm">You haven't placed any orders yet.</p>
          <Link
            to="/products"
            className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-xs text-slate-400">Order Number</span>
                  <p className="text-sm font-bold text-white font-mono">{order.order_number}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge status={order.order_status} />
                  <Badge status={order.payment_status} />
                  <span className="text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{item.product_name}</span>
                      {item.variant_name && <span className="text-slate-400 ml-2">({item.variant_name})</span>}
                      <span className="text-slate-500 ml-2">x {item.quantity}</span>
                    </div>
                    <span className="font-bold text-indigo-300">
                      ₹{item.total_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total & Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="text-xs">
                  <span className="text-slate-400">Grand Total: </span>
                  <span className="text-base font-extrabold text-white">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.order_status) && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle size={14} /> Cancel Order
                    </button>
                  )}
                  <Link
                    to={`/orders/${order.id}`}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Eye size={14} /> View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
