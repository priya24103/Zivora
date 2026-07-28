import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Trash2, Heart, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Toast helper for premium luxury notification overlays
  const triggerToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const fetchWishlist = async () => {
    const token = localStorage.getItem('zivora_token');
    if (!token) {
      setError('Please log in to view your wishlist.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('http://localhost:2409/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setWishlistItems(response.data.data.wishlist.items || []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err.response?.data?.message || 'Failed to load your wishlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveItem = async (productId, silent = false) => {
    // Optimistic UI update: instantly filter item out from local state
    const originalItems = [...wishlistItems];
    setWishlistItems(prev => prev.filter(item => item.productId?._id !== productId));
    if (!silent) {
      triggerToast('Item removed from wishlist.');
    }

    const token = localStorage.getItem('zivora_token');
    try {
      await axios.delete(`http://localhost:2409/api/wishlist/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to delete item from backend wishlist:', err);
      // Revert state if backend delete fails
      setWishlistItems(originalItems);
      if (!silent) {
        triggerToast('Could not remove item. Please try again.');
      }
    }
  };

  const handleAddToBag = async (productId, title) => {
    try {
      const success = await addToCart(productId);
      if (success) {
        triggerToast(`"${title}" added to your shopping bag.`);
        // Silently remove from wishlist since it is now in the cart
        handleRemoveItem(productId, true);
      }
    } catch (err) {
      console.error('Add to bag error:', err);
      triggerToast(err.message || 'Could not add item to bag.');
    }
  };

  // Framer Motion layout configuration for cards grid staggering
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100
      }
    },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <div className="min-h-screen bg-[#F1EDE6] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* BESPOKE LUXURY TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3.5 rounded-full shadow-2xl z-[9999] border border-[#CBAD8D]/30 flex items-center gap-2"
          >
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Back navigation header */}
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] transition-colors mb-8 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <div className="border-b border-[#CBAD8D]/20 pb-6 mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#A48374] font-medium">Curated Vault</span>
            <h1 className="text-4xl mt-1.5 font-light text-[#3A2D28] tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              My Wishlist
            </h1>
          </div>
          <p className="text-xs text-[#A48374] font-medium tracking-wide">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'Saved Masterpiece' : 'Saved Masterpieces'}
          </p>
        </div>

        {/* Dynamic Page States */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#A48374] animate-spin" />
            <p className="text-xs text-[#A48374] uppercase tracking-widest font-bold">Accessing Vault...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-[#CBAD8D]/15 p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
            <p className="text-sm font-semibold text-[#3A2D28]">{error}</p>
            {error.includes('log in') && (
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-[#3A2D28] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors cursor-pointer"
              >
                Log In
              </button>
            )}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-[#CBAD8D]/15 p-16 text-center max-w-xl mx-auto space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F6] border border-[#CBAD8D]/15 flex items-center justify-center mx-auto text-[#A48374]">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>Your Vault is Empty</h3>
              <p className="text-xs text-[#A48374] mt-2 leading-relaxed">
                Save rare loose diamonds, bespoke jewelry pieces, and active marketplace items to watch them here.
              </p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-3.5 bg-[#A48374] hover:bg-[#3A2D28] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-colors cursor-pointer shadow-md"
            >
              Explore Collection
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            <AnimatePresence>
              {wishlistItems.map((item) => {
                const prod = item.productId;
                if (!prod) return null;
                const image = prod.images?.[0] || 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800';

                return (
                  <motion.div
                    key={prod._id}
                    variants={cardVariants}
                    exit="exit"
                    layout
                    className="bg-white rounded-2xl border border-[#CBAD8D]/15 hover:border-[#A48374]/50 hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden"
                  >
                    {/* Image Block */}
                    <div className="relative aspect-[4/3] w-full bg-[#FBF9F6] overflow-hidden border-b border-[#CBAD8D]/10">
                      <img 
                        src={image} 
                        alt={prod.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {prod.status !== 'available' && (
                        <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                          {prod.status === 'sold' ? 'Sold' : 'Reserved'}
                        </span>
                      )}
                    </div>

                    {/* Metadata Block */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#A48374]">
                          {prod.category}
                        </span>
                        <h3 
                          onClick={() => navigate(`/products/${prod._id}`)}
                          className="font-semibold text-sm text-[#3A2D28] leading-tight line-clamp-1 hover:text-[#A48374] transition-colors cursor-pointer"
                        >
                          {prod.title}
                        </h3>
                        <p className="font-bold text-sm text-[#3A2D28] mt-1.5">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Card Actions */}
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => handleAddToBag(prod._id, prod.title)}
                          disabled={prod.status === 'sold'}
                          className="w-full py-2.5 bg-[#A48374] hover:bg-[#3A2D28] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Add to Bag
                        </button>
                        
                        <button
                          onClick={() => handleRemoveItem(prod._id)}
                          className="w-full py-2 border border-transparent text-center text-xs font-bold uppercase tracking-widest text-[#A48374] hover:text-red-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
