import React, { useState } from 'react';
import { Star, X, MessageSquare, Award, User, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SellerReviewsModal({ isOpen, onClose, reviews = [], avgRating = 0, totalCount = 0 }) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  if (!isOpen) return null;

  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.rating === Number(selectedFilter);
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-[#CBAD8D]/30 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Close Header Button */}
          <div className="flex items-center justify-between pb-4 border-b border-[#CBAD8D]/20 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF8F6] border border-[#CBAD8D]/30 flex items-center justify-center text-[#A48374]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>
                  Verified Customer Reviews
                </h3>
                <p className="text-xs text-[#A48374]">
                  Buyer ratings & feedback from completed acquisitions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#A48374] hover:text-[#3A2D28] p-1.5 rounded-full hover:bg-[#FAF8F6] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rating Summary Header Banner */}
          <div className="py-4 my-4 px-6 bg-[#FAF8F6] rounded-2xl border border-[#CBAD8D]/20 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="text-3xl font-bold font-mono text-[#3A2D28]">
                  {totalCount > 0 ? (Number(avgRating).toFixed(1)) : '0.0'}
                </span>
                <span className="text-sm font-semibold text-[#A48374] ml-1">/ 5.0</span>
                <div className="flex items-center gap-1 mt-1 justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(avgRating)
                          ? 'fill-[#CBAD8D] text-[#CBAD8D]'
                          : 'text-gray-300 fill-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="h-10 w-px bg-[#CBAD8D]/20 hidden sm:block"></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#3A2D28]">
                  {totalCount} {totalCount === 1 ? 'Verified Review' : 'Verified Reviews'}
                </p>
                <p className="text-[10px] text-[#A48374] mt-0.5">
                  Calculated from post-delivery buyer evaluations
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#CBAD8D]/20 text-xs">
              {['all', 5, 4, 3, 2, 1].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(String(f))}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[10px] uppercase transition-all ${
                    selectedFilter === String(f)
                      ? 'bg-[#3A2D28] text-white shadow-sm'
                      : 'text-[#A48374] hover:text-[#3A2D28]'
                  }`}
                >
                  {f === 'all' ? 'All' : `${f}★`}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Reviews List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
            {filteredReviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A48374] italic bg-[#FAF8F6]/50 rounded-2xl border border-dashed border-[#CBAD8D]/20">
                <MessageSquare className="w-8 h-8 text-[#CBAD8D]/40 mx-auto mb-2" />
                No buyer reviews found for this selection.
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-4 rounded-2xl bg-white border border-[#CBAD8D]/20 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#3A2D28] text-white flex items-center justify-center text-[10px] font-bold">
                        {rev.buyerId?.name ? rev.buyerId.name[0].toUpperCase() : 'B'}
                      </div>
                      <div>
                        <p className="font-semibold text-[#3A2D28]">{rev.buyerId?.name || 'Verified Buyer'}</p>
                        <p className="text-[10px] text-[#A48374]">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {/* Star Badge */}
                    <div className="flex items-center gap-1 bg-[#FAF8F6] px-2.5 py-1 rounded-full border border-[#CBAD8D]/30 text-[#86684e] font-mono font-bold text-[11px]">
                      <Star className="w-3.5 h-3.5 fill-[#CBAD8D] text-[#CBAD8D]" />
                      {rev.rating}.0
                    </div>
                  </div>

                  {/* Comment */}
                  {rev.comment ? (
                    <p className="text-[#3A2D28] leading-relaxed pl-9 bg-[#FAF8F6]/50 p-2.5 rounded-xl border border-[#CBAD8D]/10">
                      "{rev.comment}"
                    </p>
                  ) : (
                    <p className="text-[10px] text-[#A48374] italic pl-9">No text comment left.</p>
                  )}

                  {/* Order snapshot tag if available */}
                  {rev.productId?.title && (
                    <div className="pl-9 text-[10px] text-[#A48374] flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-[#CBAD8D]" />
                      Item: <span className="font-medium text-[#3A2D28]">{rev.productId.title}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
