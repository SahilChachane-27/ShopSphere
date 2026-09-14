import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Tag, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="h-64 rounded-3xl animate-shimmer" />
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="inline-flex p-6 rounded-full glass-panel text-slate-500">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Browse our verified marketplace catalog and add items to your cart.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
        >
          Explore Catalog <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
          <p className="text-xs text-slate-400">
            {cart.items.length} item(s) in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const prod = item.product;
            const primaryImg = prod.images?.find((img) => img.is_primary)?.image_url || prod.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

            return (
              <div
                key={item.id}
                className="p-4 sm:p-6 rounded-2xl glass-card border border-slate-800 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
              >
                <img
                  src={primaryImg}
                  alt={prod.name}
                  className="w-24 h-24 rounded-xl object-cover bg-slate-900 shrink-0"
                />

                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">{prod.brand}</span>
                  <Link to={`/products/${prod.slug}`} className="block text-sm font-bold text-white hover:text-indigo-300">
                    {prod.name}
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-slate-400">Variant: {item.variant.name}</p>
                  )}
                  <p className="text-sm font-extrabold text-indigo-300">
                    ₹{item.unit_price.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="px-2.5 py-1 text-slate-400 hover:text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-400 hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 sticky top-24">
          <h3 className="text-base font-bold text-white">Order Summary</h3>

          <div className="space-y-3 text-xs border-b border-slate-800 pb-4">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span className="font-semibold text-white">₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>GST / Tax</span>
              <span className="font-semibold text-white">₹{cart.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Shipping Fee</span>
              <span className="font-semibold text-emerald-400">
                {cart.shipping === 0 ? 'FREE' : `₹${cart.shipping}`}
              </span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Coupon Discount</span>
                <span className="font-bold">-₹{cart.discount}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-baseline text-white">
            <span className="text-sm font-bold">Grand Total</span>
            <span className="text-2xl font-black text-indigo-400">
              ₹{cart.total.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
