import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Order, PaymentMethod } from '../types';
import { apiClient } from '../api/client';
import { useCart } from '../context/CartContext';

interface SimulatedPaymentModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatedPaymentModal: React.FC<SimulatedPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [step, setStep] = useState<'SELECT_METHOD' | 'PROCESSING' | 'RESULT'>('SELECT_METHOD');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [txnId, setTxnId] = useState<string>('');
  const [paymentResultStatus, setPaymentResultStatus] = useState<'SUCCESS' | 'FAILED' | 'PENDING' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Step 1: Initiate Payment
  const handleInitiatePayment = async () => {
    setIsSubmitting(true);
    try {
      if (paymentMethod === 'COD') {
        // COD order created as COD
        setStep('RESULT');
        setPaymentResultStatus('SUCCESS');
        await clearCart();
        return;
      }

      const res = await apiClient.post('/payments/create', {
        order_id: order.id,
        payment_method: paymentMethod,
      });

      if (res.data.success) {
        setPaymentId(res.data.data.payment_id);
        setTxnId(res.data.data.transaction_id);
        setStep('PROCESSING');
      }
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Dev Controls for Payment Result
  const handleSimulateResult = async (result: 'SUCCESS' | 'FAILED' | 'PENDING') => {
    if (!paymentId) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/payments/process', {
        payment_id: paymentId,
        result: result,
      });

      if (res.data.success) {
        setPaymentResultStatus(result);
        setStep('RESULT');
        if (result === 'SUCCESS') {
          await clearCart();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record simulated payment result');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg glass-panel border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulated Payment Gateway</h3>
              <p className="text-xs text-indigo-300 font-medium">
                Order #{order.order_number}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Demo System
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: Select Payment Method */}
          {step === 'SELECT_METHOD' && (
            <>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Total Amount Payable</span>
                  <p className="text-2xl font-black text-white">₹{order.total.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{order.items?.length || 1} Item(s)</p>
                  <p className="text-emerald-400 font-medium">Free Shipping</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-3">
                  Select Payment Method
                </label>
                <div className="space-y-2.5">
                  <label
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-indigo-600/15 border-indigo-500 text-white'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className={paymentMethod === 'CARD' ? 'text-indigo-400' : 'text-slate-500'} size={22} />
                      <div>
                        <p className="text-sm font-semibold">Credit / Debit Card (Simulated)</p>
                        <p className="text-xs text-slate-400">Visa, Mastercard, RuPay</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="pay_method"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod('CARD')}
                      className="accent-indigo-500"
                    />
                  </label>

                  <label
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'UPI'
                        ? 'bg-indigo-600/15 border-indigo-500 text-white'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className={paymentMethod === 'UPI' ? 'text-indigo-400' : 'text-slate-500'} size={22} />
                      <div>
                        <p className="text-sm font-semibold">UPI Payment (Simulated)</p>
                        <p className="text-xs text-slate-400">GPay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="pay_method"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                      className="accent-indigo-500"
                    />
                  </label>

                  <label
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'bg-indigo-600/15 border-indigo-500 text-white'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className={paymentMethod === 'COD' ? 'text-indigo-400' : 'text-slate-500'} size={22} />
                      <div>
                        <p className="text-sm font-semibold">Cash on Delivery (COD)</p>
                        <p className="text-xs text-slate-400">Pay cash upon delivery at your doorstep</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="pay_method"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="accent-indigo-500"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleInitiatePayment}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Initiating...' : 'Place Order & Pay'} <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Processing Screen & Dev Controls */}
          {step === 'PROCESSING' && (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex p-4 rounded-full bg-indigo-500/10 text-indigo-400 animate-pulse">
                <RefreshCw size={36} className="animate-spin" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">Processing Payment</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Transaction ID: <span className="font-mono text-indigo-300">{txnId}</span>
                </p>
                <p className="text-xs text-slate-400">Amount: ₹{order.total.toLocaleString('en-IN')}</p>
              </div>

              {/* Developer controls */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Development Simulation Controls
                </p>
                <p className="text-[11px] text-slate-400">
                  Select a payment result state below to test full workflow:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSimulateResult('SUCCESS')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} /> Simulate Success
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSimulateResult('FAILED')}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={16} /> Simulate Failure
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSimulateResult('PENDING')}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5"
                  >
                    <Clock size={16} /> Simulate Pending
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Final Payment Result Display */}
          {step === 'RESULT' && (
            <div className="text-center py-4 space-y-6">
              {paymentResultStatus === 'SUCCESS' && (
                <>
                  <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={48} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-emerald-400">Payment Successful!</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Your order has been confirmed and is being processed by the seller.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order Number</span>
                      <span className="font-semibold text-white">{order.order_number}</span>
                    </div>
                    {txnId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Transaction ID</span>
                        <span className="font-mono text-indigo-300">{txnId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Paid</span>
                      <span className="font-bold text-emerald-400">₹{order.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment Method</span>
                      <span className="text-white">{paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/orders/${order.id}`);
                      }}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg"
                    >
                      View Order Details
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/products');
                      }}
                      className="flex-1 py-3 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </>
              )}

              {paymentResultStatus === 'FAILED' && (
                <>
                  <div className="inline-flex p-4 rounded-full bg-rose-500/20 text-rose-400">
                    <XCircle size={48} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-rose-400">Payment Failed</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Your payment attempt could not be completed. Your cart items are preserved.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-left text-xs space-y-1 text-rose-300">
                    <p className="font-semibold">Reason:</p>
                    <p>User selected simulated payment failure state.</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('SELECT_METHOD')}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg"
                    >
                      Retry Payment
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/cart');
                      }}
                      className="flex-1 py-3 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Return to Cart
                    </button>
                  </div>
                </>
              )}

              {paymentResultStatus === 'PENDING' && (
                <>
                  <div className="inline-flex p-4 rounded-full bg-amber-500/20 text-amber-400">
                    <Clock size={48} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-amber-400">Payment Pending</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Your payment is currently pending confirmation from the simulated bank server.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSimulateResult('SUCCESS')}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg"
                    >
                      Confirm Success
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/orders/${order.id}`);
                      }}
                      className="flex-1 py-3 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Check Order Status
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
