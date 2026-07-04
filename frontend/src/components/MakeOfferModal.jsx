import React, { useState } from 'react';
import { X, Handshake, ShieldCheck, Sparkles, MessageCircle, DollarSign, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:2409/api';

export default function MakeOfferModal({ isOpen, onClose, product, onOfferSubmitted }) {
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen || !product) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amountNum = Number(offerAmount);
    if (!offerAmount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid offer amount.');
      return;
    }

    if (amountNum >= product.price) {
      setError(`Your offer should ideally be below the asking price (${formatCurrency(product.price)}).`);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        setError('You must be signed in to submit an offer.');
        setLoading(false);
        return;
      }

      // API Call to create an offer
      const response = await axios.post(
        `${API_BASE}/offers/create`,
        {
          productId: product._id,
          initialAmount: amountNum,
          message: message.trim() || 'Interested in direct acquisition.'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === 'success') {
        setSuccessToast(true);
        setOfferAmount('');
        setMessage('');
        
        if (onOfferSubmitted) {
          onOfferSubmitted(response.data.data.offer);
        }

        setTimeout(() => {
          setSuccessToast(false);
          onClose();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not submit your offer. Ensure you are logged in as a buyer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#3A2D28]/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-[32px] w-full max-w-lg p-6 md:p-10 border border-[#A48374]/20 shadow-2xl z-10 overflow-hidden" style={{ backgroundColor: '#F1EDE6' }}>
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: 'linear-gradient(90deg, #A48374, #EBE3DB, #3A2D28)' }} />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-[#EBE3DB] text-[#3A2D28] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 mt-2">
          <div className="inline-flex p-3 bg-white rounded-full border border-[#CBAD8D]/20 mb-3">
            <Handshake className="w-6 h-6 text-[#A48374]" />
          </div>
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#A48374] font-bold block mb-1">Direct Acquisition</span>
          <h3 className="font-serif text-2xl text-[#3A2D28]">Make a Direct Offer</h3>
          <p className="text-[11px] text-[#3A2D28]/60 mt-1 max-w-sm mx-auto leading-relaxed">
            Propose your purchase price directly to the merchant. Negotiation is protected by secure vault escrow terms.
          </p>
        </div>

        {successToast ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-[#CBAD8D]/20 p-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-serif text-[#3A2D28] text-lg">Proposal Transmitted</h4>
            <p className="text-[11px] text-[#A48374] mt-2">
              Your negotiation thread has been initiated. The merchant will be notified immediately. Check your inbox for updates.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Product Summary Card */}
            <div className="bg-white p-4 rounded-2xl border border-[#EBE3DB] flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#F7F3EF] border border-[#EBE3DB] overflow-hidden flex-shrink-0 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#CBAD8D]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-xs text-[#3A2D28] font-bold truncate">{product.title}</h5>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#F7F3EF] text-[#A48374] px-2 py-0.5 rounded">
                    {product.category}
                  </span>
                  {product.carat && (
                    <span className="text-[9px] text-[#A48374] font-medium">• {product.carat} ct</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 border-l border-[#EBE3DB] pl-4">
                <p className="text-[9px] text-[#A48374] uppercase tracking-wider">Asking Price</p>
                <p className="text-sm font-semibold text-[#3A2D28] mt-0.5 font-serif">
                  {formatCurrency(product.price)}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#3A2D28] mb-1.5">
                  Proposed Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A48374] font-medium text-xs">₹</span>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Enter offer price e.g. 150000"
                    className="w-full pl-8 pr-4 py-3 bg-white border border-[#EBE3DB] focus:outline-none focus:border-[#A48374] rounded-xl text-[#3A2D28] text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#3A2D28] mb-1.5 flex items-center justify-between">
                  <span>Addressed Message to Merchant</span>
                  <span className="text-[9px] text-[#A48374] font-medium normal-case">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce your inquiry terms, custom certification requirements, or preferred memo terms..."
                  className="w-full px-4 py-3 bg-white border border-[#EBE3DB] focus:outline-none focus:border-[#A48374] rounded-xl text-[#3A2D28] text-xs leading-normal"
                />
              </div>
            </div>

            {/* Vault Protection Info */}
            <div className="flex items-start gap-2 bg-white/50 p-3 rounded-xl border border-[#EBE3DB]/60 text-[9px] text-[#3A2D28]/70">
              <ShieldCheck className="w-4 h-4 text-[#A48374] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                By submitting this proposal, you agree that your negotiated value remains binding for 7 days. Escrow holds apply on accepted contracts.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-white border border-[#EBE3DB] hover:bg-gray-50 text-[#3A2D28] text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !offerAmount}
                className="flex-1 py-3.5 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm rounded-full"
                style={{ 
                  background: 'linear-gradient(135deg, #A48374, #3A2D28)',
                  opacity: loading || !offerAmount ? 0.7 : 1
                }}
              >
                {loading ? 'Transmitting...' : 'Submit Proposal'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
