import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { RatingStars } from './RatingStars';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const primaryImg = product.images?.find((img) => img.is_primary)?.image_url || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

  const discountPercent = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  const currentPrice = product.discount_price ? product.discount_price : product.price;
  const isOutOfStock = product.stock_count !== undefined && product.stock_count <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    try {
      await addToCart(product.id, product.variants?.[0]?.id, 1);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    }
  };

  return (
    <div className="group relative rounded-2xl glass-card overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1">
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-900">
        <img
          src={primaryImg}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
          }}
        />
        {/* Discount Pill */}
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            -{discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          className="absolute top-3 right-3 p-2 rounded-full glass-panel text-slate-300 hover:text-rose-400 hover:scale-110 transition-all shadow-md"
          title="Add to Wishlist"
        >
          <Heart size={16} />
        </button>
      </Link>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              {product.brand}
            </span>
            {isOutOfStock ? (
              <span className="inline-flex items-center text-[10px] text-rose-400 font-medium gap-1">
                <AlertTriangle size={12} /> Out of Stock
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium gap-1">
                <CheckCircle2 size={12} /> In Stock
              </span>
            )}
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-indigo-300 transition-colors mb-2">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <RatingStars rating={product.rating_avg} size={14} />
            <span className="text-xs text-slate-400 font-medium">
              {product.rating_avg.toFixed(1)} ({product.review_count})
            </span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">₹{currentPrice.toLocaleString('en-IN')}</span>
              {product.discount_price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95'
            }`}
            title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
