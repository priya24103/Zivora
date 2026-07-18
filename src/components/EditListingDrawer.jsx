import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

// Helper to format ISO date strings for <input type="datetime-local" />
const formatDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function EditListingDrawer({ isOpen, onClose, selectedListing, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Determine if it's an auction and if it is locked
  const isAuction = selectedListing?.isAuction === true;
  const isLiveAuction = isAuction && selectedListing?.status === 'active';

  // Initialize form when selectedListing changes
  useEffect(() => {
    if (selectedListing) {
      setError(null);
      if (isAuction) {
        setStartingBid(selectedListing.startPrice || '');
        setStartTime(formatDateTimeLocal(selectedListing.startTime));
        setEndTime(formatDateTimeLocal(selectedListing.endTime));
      } else {
        setTitle(selectedListing.title || '');
        setDescription(selectedListing.description || '');
        setPrice(selectedListing.price || '');
        setStock(selectedListing.stock !== undefined ? selectedListing.stock : 1);
      }
    }
  }, [selectedListing, isAuction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLiveAuction) return;

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('zivora_token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      if (isAuction) {
        const payload = {
          startingBid: Number(startingBid),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString()
        };

        await axios.put(
          `http://localhost:2409/api/seller/auctions/${selectedListing._id}`,
          payload,
          config
        );
      } else {
        const payload = {
          title,
          description,
          price: Number(price),
          stock: Number(stock)
        };

        await axios.put(
          `http://localhost:2409/api/seller/products/${selectedListing._id}`,
          payload,
          config
        );
      }

      setLoading(false);
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to update listing. Please try again.';
      setError(errMsg);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop/Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3A2D28] z-[999] cursor-pointer"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[1000] flex flex-col border-l border-[#CBAD8D]/20 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#CBAD8D]/15 flex items-center justify-between bg-[#F1EDE6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A48374]">
                  {isAuction ? 'Auction Listing' : 'Direct Sale Product'}
                </span>
                <h3 className="text-lg text-[#3A2D28] font-semibold mt-0.5">
                  Edit {isAuction ? 'Auction Details' : 'Product Info'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/60 text-[#3A2D28] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Warning Banner for Live Auctions */}
              {isLiveAuction && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">
                      Validation Lock
                    </h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                      Live auctions cannot be modified. Editing is disabled.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Info Snippet (Uneditable details) */}
              <div className="bg-[#FAF8F6] border border-[#CBAD8D]/10 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[#A48374] font-bold">
                  Listing Title (Reference)
                </span>
                <p className="text-xs font-bold text-[#3A2D28]">
                  {isAuction ? selectedListing?.productId?.title : selectedListing?.title}
                </p>
                {selectedListing?.category && (
                  <p className="text-[10px] text-[#A48374] mt-1 font-medium">
                    Category: {selectedListing.category}
                  </p>
                )}
              </div>

              {/* Conditional Inputs */}
              {!isAuction ? (
                // DIRECT SALE INPUTS
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A48374] mb-1.5">
                      Product Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="e.g. 1.5 Carat Princess Cut Diamond"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#FAF8F6] text-xs text-[#3A2D28] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A48374] mb-1.5">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      min="0"
                      placeholder="e.g. 250000"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#FAF8F6] text-xs text-[#3A2D28] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A48374] mb-1.5">
                      Stock Count
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                      min="0"
                      placeholder="e.g. 1"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#FAF8F6] text-xs text-[#3A2D28] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A48374] mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows="4"
                      placeholder="Enter detailed description..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#FAF8F6] text-xs text-[#3A2D28] font-medium resize-none"
                    />
                  </div>
                </div>
              ) : (
                // AUCTION INPUTS
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A48374] mb-1.5">
                      Starting Bid (₹)
                    </label>
                    <input
                      type="number"
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      required
                      disabled={isLiveAuction}
                      min="0"
                      placeholder="Starting price"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#FAF8F6] text-xs text-[#3A2D28] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A48374] mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      disabled={isLiveAuction}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#FAF8F6] text-xs text-[#3A2D28] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A48374] mb-1.5">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      disabled={isLiveAuction}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#FAF8F6] text-xs text-[#3A2D28] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Footer containing Save Action Button */}
            <div className="p-6 border-t border-[#CBAD8D]/15 bg-[#FAF8F6]">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || isLiveAuction}
                className="w-full py-3.5 bg-[#A48374] hover:bg-[#3A2D28] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
