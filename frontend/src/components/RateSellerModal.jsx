import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:2409/api';

export default function RateSellerModal({ isOpen, onClose, order, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('zivora_token');
      if (!token) {
        setError('Your session has expired. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/reviews/seller`,
        {
          orderId: order._id,
          rating,
          comment,
          sellerId: order.sellerIds?.[0]
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          if (onReviewSubmitted) onReviewSubmitted(order._id, rating);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit seller rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-md w-full p-8 border border-[#CBAD8D]/30 shadow-2xl relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={submitting}
            className="absolute top-5 right-5 text-[#A48374] hover:text-[#3A2D28] p-1 rounded-full hover:bg-[#FAF8F6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto border border-green-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>
                Thank You for Rating!
              </h3>
              <p className="text-xs text-[#A48374] leading-relaxed">
                Your verified purchase rating has been recorded and will help maintain quality across Zivora's seller marketplace.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#A48374] uppercase tracking-[0.2em] block mb-1">
                  Verified Order Rating
                </span>
                <h3 className="text-2xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>
                  Rate Your Seller
                </h3>
                <p className="text-xs text-[#A48374] mt-1">
                  Order ID: <span className="font-mono font-semibold text-[#3A2D28]">{order._id}</span>
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="text-center py-2 bg-[#FAF8F6] rounded-2xl border border-[#CBAD8D]/20">
                <p className="text-xs text-[#A48374] font-medium mb-3">Select Star Rating</p>
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-115 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            isFilled
                              ? 'fill-[#CBAD8D] text-[#CBAD8D]'
                              : 'text-gray-300 fill-transparent'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="inline-block text-xs font-bold text-[#3A2D28] mt-2 font-mono">
                  {hoverRating || rating} / 5 Stars
                </span>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-[10px] font-bold text-[#A48374] uppercase tracking-wider mb-2">
                  Feedback / Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details regarding packaging, authenticity certificate, or delivery speed..."
                  className="w-full p-3.5 border border-[#CBAD8D]/30 rounded-2xl text-xs text-[#3A2D28] bg-[#FAF8F6] focus:outline-none focus:border-[#A48374] resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#3A2D28] hover:bg-[#A48374] text-white text-xs font-semibold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Rating...
                  </>
                ) : (
                  'Submit Verified Rating'
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
