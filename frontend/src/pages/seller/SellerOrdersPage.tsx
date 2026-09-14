import React, { useEffect, useState } from 'react';
import { ShoppingBag, ChevronRight, CheckCircle2, Truck, Clock } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { Order, OrderStatus } from '../../types';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';

export const SellerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/orders/seller/list');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch seller orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const res = await apiClient.put(`/orders/seller/${orderId}/status`, {
        order_status: newStatus,
      });

      if (res.data.success) {
        alert(`Order status updated to ${newStatus}`);
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  return (
    <SidebarLayout type="seller" title="Store Orders & Fulfillment">
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="text-indigo-400" size={20} /> Orders Containing Your Products
          </h3>

          {isLoading ? (
            <p className="text-xs text-slate-400">Loading store orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No orders received for your store yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
                    <div>
                      <span className="text-slate-400">Order Number: </span>
                      <span className="font-mono font-bold text-white">{order.order_number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={order.order_status} size="sm" />
                      <span className="text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 text-xs">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-slate-300">
                        <span>{item.product_name} x {item.quantity}</span>
                        <span className="font-bold text-amber-300">₹{item.total_price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status Transition dropdown */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">Update Order Status:</span>
                    <select
                      value={order.order_status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1 text-xs text-amber-300 font-bold focus:outline-none"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
