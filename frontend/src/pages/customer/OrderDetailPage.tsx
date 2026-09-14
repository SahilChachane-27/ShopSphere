import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, ChevronRight, CheckCircle2, Clock, Truck, Home } from 'lucide-react';
import { Order } from '../../types';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch order detail', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="h-64 rounded-3xl animate-shimmer" />
      </div>
    );
  }

  // Stepper steps
  const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = steps.indexOf(order.order_status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/orders" className="hover:text-white">Orders</Link>
            <ChevronRight size={12} />
            <span className="text-slate-200">#{order.order_number}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Order Details</h1>
        </div>

        <div className="flex items-center gap-3">
          <Badge status={order.order_status} />
          <Badge status={order.payment_status} />
        </div>
      </div>

      {/* Order Status Stepper */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tracking Stepper</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          {steps.map((st, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;
            return (
              <div key={st} className="space-y-2">
                <div
                  className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                    isCompleted ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                  } ${isCurrent ? 'ring-4 ring-indigo-500/30' : ''}`}
                >
                  {idx + 1}
                </div>
                <p className={`text-[10px] font-bold ${isCompleted ? 'text-indigo-300' : 'text-slate-500'}`}>
                  {st.replace(/_/g, ' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="text-indigo-400" size={18} /> Shipping Address
          </h3>
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">{order.shipping_address_json?.full_name}</p>
            <p>{order.shipping_address_json?.street_address}</p>
            <p>
              {order.shipping_address_json?.city}, {order.shipping_address_json?.state} -{' '}
              {order.shipping_address_json?.postal_code}
            </p>
            <p className="font-mono text-slate-400">Ph: {order.shipping_address_json?.phone}</p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="text-amber-400" size={18} /> Payment Summary
          </h3>
          <div className="text-xs space-y-2 border-b border-slate-800/80 pb-3">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Tax / GST</span>
              <span>₹{order.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Shipping Fee</span>
              <span>₹{order.shipping_fee}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Discount</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-baseline text-white">
            <span className="text-sm font-bold">Total Paid</span>
            <span className="text-xl font-black text-indigo-400">
              ₹{order.total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Ordered Items ({order.items?.length})</h3>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-white">{item.product_name}</p>
                {item.variant_name && <p className="text-slate-400">Variant: {item.variant_name}</p>}
                <p className="text-slate-400">Qty: {item.quantity} x ₹{item.price.toLocaleString('en-IN')}</p>
              </div>
              <span className="text-sm font-extrabold text-indigo-300">
                ₹{item.total_price.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
