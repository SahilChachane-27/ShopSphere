import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Star,
  Store,
  MessageSquarePlus,
  ChevronRight
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../../types';
import { apiClient } from '../../api/client';
import { RatingStars } from '../../components/RatingStars';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { id_or_slug } = useParams<{ id_or_slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    if (id_or_slug) {
      fetchProductDetail();
    }
  }, [id_or_slug]);

  const fetchProductDetail = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/products/${id_or_slug}`);
      if (res.data.success) {
        const prodData: Product = res.data.data;
        setProduct(prodData);
        const mainImg = prodData.images?.find((i) => i.is_primary)?.image_url || prodData.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
        setSelectedImage(mainImg);
        if (prodData.variants && prodData.variants.length > 0) {
          setSelectedVariant(prodData.variants[0]);
        }
        // Fetch reviews
        fetchReviews(prodData.id);
      }
    } catch (err) {
      console.error('Failed to fetch product details', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async (productId: number) => {
    try {
      const res = await apiClient.get(`/reviews/product/${productId}`);
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    }
  };

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="h-96 rounded-3xl animate-shimmer max-w-4xl mx-auto" />
      </div>
    );
  }

  const currentPrice = selectedVariant?.price_override
    ? selectedVariant.price_override
    : product.discount_price || product.price;

  const isOutOfStock = product.stock_count !== undefined && product.stock_count <= 0;

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, selectedVariant?.id, quantity);
      alert('Product added to cart!');
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product.id, selectedVariant?.id, quantity);
      navigate('/checkout');
    } catch (err: any) {
      alert(err.message || 'Failed to initiate purchase');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a review.');
      navigate('/login');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await apiClient.post(`/reviews/product/${product.id}`, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      if (res.data.success) {
        alert('Review submitted successfully!');
        setReviewModalOpen(false);
        setReviewTitle('');
        setReviewComment('');
        fetchProductDetail();
      }
    } catch (err: any) {
      alert(err.message || 'Only verified buyers of delivered items can submit reviews.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-white">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-white">Products</Link>
        <ChevronRight size={12} />
        <span className="text-slate-200 font-medium truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* IMAGE GALLERY */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl glass-panel border border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center p-4">
            <img
              src={selectedImage}
              alt={product.name}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
              }}
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-20 rounded-xl glass-card overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img.image_url ? 'border-indigo-500 scale-105' : 'border-slate-800'
                  }`}
                >
                  <img src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {product.brand}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-3">
              <RatingStars rating={product.rating_avg} size={18} />
              <span className="text-sm text-slate-300 font-semibold">
                {product.rating_avg.toFixed(1)} ({product.review_count} customer reviews)
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl glass-card border border-slate-800 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">₹{currentPrice.toLocaleString('en-IN')}</span>
              {product.discount_price && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">Includes {product.tax_percent}% Tax</span>
          </div>

          {/* Variants selector if available */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Variant</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedVariant?.id === v.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold text-slate-300">Quantity:</label>
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                -
              </button>
              <span className="px-4 py-1.5 text-sm font-bold text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} /> Add to Shopping Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-xl"
            >
              Buy Now with Fast Checkout
            </button>
          </div>

          {/* Seller Card */}
          {product.seller && (
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Store size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{product.seller.store_name}</h4>
                  <p className="text-[11px] text-slate-400">Verified Marketplace Seller</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white">Product Description</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* REVIEWS & RATINGS SECTION */}
      <section className="border-t border-slate-800 pt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="text-amber-400" size={20} /> Verified Customer Reviews
            </h2>
            <p className="text-xs text-slate-400">
              Only verified buyers of delivered orders can post reviews
            </p>
          </div>
          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2"
          >
            <MessageSquarePlus size={16} /> Write a Review
          </button>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No reviews yet for this product.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {rev.user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{rev.user?.full_name || 'Customer'}</h4>
                      <RatingStars rating={rev.rating} size={12} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>

                <h5 className="text-xs font-bold text-slate-200">{rev.title}</h5>
                <p className="text-xs text-slate-400">{rev.comment}</p>

                {rev.seller_response && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                    <p className="font-bold text-amber-400">Seller Response:</p>
                    <p className="text-slate-300">{rev.seller_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review Submission Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Write a Verified Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Rating</label>
                <RatingStars rating={reviewRating} interactive size={24} onRatingChange={setReviewRating} />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Great build quality!"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Comment</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
