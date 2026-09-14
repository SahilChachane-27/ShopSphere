import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Tag, Plus, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Address, Order, PaymentMethod } from '../../types';
import { apiClient } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { SimulatedPaymentModal } from '../../components/SimulatedPaymentModal';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Address form modal
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    title: 'Home',
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('WELCOME10');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string>('');

  // Payment modal state
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await apiClient.get('/users/me/addresses');
      if (res.data.success) {
        setAddresses(res.data.data);
        const def = res.data.data.find((a: Address) => a.is_default) || res.data.data[0];
        if (def) setSelectedAddressId(def.id);
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/users/me/addresses', newAddr);
      if (res.data.success) {
        setShowAddressForm(false);
        fetchAddresses();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    try {
      const res = await apiClient.post('/coupons/validate', {
        code: couponCode.trim(),
        cart_total: cart.subtotal,
      });

      if (res.data.data.valid) {
        setAppliedCoupon(res.data.data.code);
        setCouponDiscount(res.data.data.calculated_discount);
        setCouponMessage(res.data.data.message);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponMessage(res.data.data.message);
      }
    } catch (err: any) {
      setCouponMessage(err.message || 'Invalid coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/orders/checkout', {
        address_id: selectedAddressId,
        coupon_code: appliedCoupon,
        payment_method: 'CARD',
      });

      if (res.data.success) {
        const newOrder: Order = res.data.data;
        setCreatedOrder(newOrder);
        setIsPaymentModalOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-sm">Your cart is empty. Add items to checkout.</p>
      </div>
    );
  }

  const finalTotal = Math.max(0, cart.total - couponDiscount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white border-b border-slate-800 pb-4">
        Checkout & Shipping
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* STEP 1: Delivery Address Selection */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="text-indigo-400" size={20} /> Select Delivery Address
              </h3>
              <button
                onClick={() => setShowAddressForm(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <p className="text-xs text-slate-400">No delivery address saved. Add an address to proceed.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'bg-indigo-600/15 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-white">{addr.title}</span>
                      {selectedAddressId === addr.id && <CheckCircle2 size={16} className="text-indigo-400" />}
                    </div>
                    <p className="text-xs font-semibold text-slate-200">{addr.full_name}</p>
                    <p className="text-xs text-slate-400">{addr.street_address}</p>
                    <p className="text-xs text-slate-400">
                      {addr.city}, {addr.state} - {addr.postal_code}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-1">Ph: {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: Coupon Code Application */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="text-amber-400" size={20} /> Apply Promo Coupon
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code (e.g. WELCOME10)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white uppercase font-mono"
              />
              <button
                type="button"
                onClick={handleValidateCoupon}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Apply Coupon
              </button>
            </div>
            {couponMessage && (
              <p className={`text-xs ${appliedCoupon ? 'text-emerald-400 font-semibold' : 'text-rose-400'}`}>
                {couponMessage}
              </p>
            )}
          </div>
        </div>

        {/* ORDER REVIEW & PAYMENT TRIGGER */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 sticky top-24">
          <h3 className="text-base font-bold text-white">Payment Summary</h3>

          <div className="space-y-3 text-xs border-b border-slate-800 pb-4">
            <div className="flex justify-between text-slate-300">
              <span>Items Total</span>
              <span>₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>GST / Tax</span>
              <span>₹{cart.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Shipping Fee</span>
              <span className="text-emerald-400">FREE</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Coupon ({appliedCoupon})</span>
                <span>-₹{couponDiscount}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-baseline text-white">
            <span className="text-sm font-bold">Payable Amount</span>
            <span className="text-2xl font-black text-indigo-400">
              ₹{finalTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || !selectedAddressId}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Initiating Checkout...' : 'Proceed to Payment Gateway'} <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Add New Address Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Add Delivery Address</h3>
            <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newAddr.full_name}
                onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <textarea
                required
                placeholder="Street Address"
                value={newAddr.street_address}
                onChange={(e) => setNewAddr({ ...newAddr, street_address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={newAddr.state}
                  onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Postal Code / PIN"
                value={newAddr.postal_code}
                onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Payment Modal Component */}
      {createdOrder && (
        <SimulatedPaymentModal
          order={createdOrder}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}
    </div>
  );
};
