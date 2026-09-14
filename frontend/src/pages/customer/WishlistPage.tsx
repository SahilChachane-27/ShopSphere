import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Wishlist } from '../../types';
import { apiClient } from '../../api/client';
import { useCart } from '../../context/CartContext';

export const WishlistPage: React.FC = () => {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/wishlist');
      if (res.data.success) {
        setWishlist(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      const res = await apiClient.delete(`/wishlist/${productId}`);
      if (res.data.success) {
        setWishlist(res.data.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove from wishlist');
    }
  };

  const handleMoveToCart = async (productId: number) => {
    try {
      await addToCart(productId, undefined, 1);
      await handleRemoveItem(productId);
      alert('Moved item to cart!');
    } catch (err: any) {
      alert(err.message || 'Failed to move to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="h-64 rounded-3xl animate-shimmer" />
      </div>
    );
  }

  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="inline-flex p-6 rounded-full glass-panel text-rose-400">
          <Heart size={48} />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Wishlist is Empty</h2>
        <p className="text-xs text-slate-400">Save products to your wishlist to view them later.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
        >
          Browse Products <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Heart className="text-rose-400" size={24} /> Saved Wishlist
        </h1>
        <p className="text-xs text-slate-400">{wishlist.items.length} saved product(s)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.items.map((item) => {
          const prod = item.product;
          const img = prod.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

          return (
            <div key={item.id} className="glass-card rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <Link to={`/products/${prod.slug}`}>
                <img src={img} alt={prod.name} className="w-full h-40 object-cover rounded-xl bg-slate-900" />
                <span className="text-[10px] uppercase font-bold text-indigo-400 mt-2 block">{prod.brand}</span>
                <h3 className="text-xs font-bold text-white line-clamp-2 hover:text-indigo-300">{prod.name}</h3>
                <p className="text-sm font-extrabold text-indigo-400 mt-1">₹{prod.price.toLocaleString('en-IN')}</p>
              </Link>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleMoveToCart(prod.id)}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <ShoppingBag size={14} /> Add to Cart
                </button>
                <button
                  onClick={() => handleRemoveItem(prod.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
