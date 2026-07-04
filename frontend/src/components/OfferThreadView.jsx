import React, { useState } from 'react';
import { Send, Check, X, CreditCard, Handshake, MessageSquare, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:2409/api';

export default function OfferThreadView({ offer, user, onActionSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Counter offer state
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAction = async (actionType, additionalData = {}) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        setError('Your authentication session has expired.');
        setLoading(false);
        return;
      }

      const payload = {
        action: actionType,
        ...additionalData
      };

      const response = await axios.put(
        `${API_BASE}/offers/${offer._id}/action`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === 'success') {
        setShowCounterForm(false);
        setCounterAmount('');
        setCounterMessage('');
        if (onActionSuccess) {
          onActionSuccess(response.data.data.offer);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to complete this action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterSubmit = (e) => {
    e.preventDefault();
    const amountNum = Number(counterAmount);
    if (!counterAmount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid counter-offer amount.');
      return;
    }

    handleAction('counter', {
      newAmount: amountNum,
      message: counterMessage.trim() || 'Counter-proposal submitted.'
    });
  };

  const handleProceedToCheckout = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('zivora_token');
      // For seamless checkout integration in B2B context, we automatically add this item to cart
      // at the agreed offer amount (in a real B2B app, checkout would support negotiated contracts,
      // here we add to cart as the bridge mechanism)
      await axios.post(
        `${API_BASE}/cart/add`,
        { productId: offer.productId._id || offer.productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Redirect buyer directly to checkout page
      navigate(`/checkout?offerId=${offer._id}`);
    } catch (err) {
      console.error('Checkout redirect issue:', err);
      // Fallback: navigate directly to checkout anyway
      navigate('/checkout');
    } finally {
      setLoading(false);
    }
  };

  // Determine if this user needs to respond
  const needsResponse = 
    (offer.status === 'pending_seller' && user.role === 'seller') ||
    (offer.status === 'pending_buyer' && user.role === 'buyer');

  return (
    <div className="flex flex-col h-full bg-[#F1EDE6]">
      {/* Product Banner */}
      <div className="bg-white p-4 border-b border-[#CBAD8D]/20 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#F7F3EF] border border-[#EBE3DB] rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
            {offer.productId?.images && offer.productId.images.length > 0 ? (
              <img src={offer.productId.images[0]} alt={offer.productId.title} className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#CBAD8D]" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#3A2D28] line-clamp-1">{offer.productId?.title}</h4>
            <p className="text-[10px] text-[#A48374] font-medium mt-0.5">
              Ask Price: {formatCurrency(offer.productId?.price || 0)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-[#A48374] uppercase tracking-wider">Current Agreement Status</p>
          <p className="text-xs font-bold text-[#3A2D28] capitalize mt-0.5">{offer.status.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Main Error Bar */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs text-center flex-shrink-0">
          {error}
        </div>
      )}

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {offer.history && offer.history.map((msg, index) => {
          // Buyer aligns LEFT, Seller aligns RIGHT
          const isBuyerMsg = msg.senderType === 'buyer';
          
          return (
            <div 
              key={msg._id || index}
              className={`flex flex-col ${isBuyerMsg ? 'items-start' : 'items-end'} w-full`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.01)] border transition-all duration-300 ${
                  isBuyerMsg 
                    ? 'bg-white border-[#CBAD8D]/15 text-[#3A2D28] rounded-bl-none' 
                    : 'bg-[#A48374] border-[#A48374]/10 text-white rounded-br-none'
                }`}
              >
                {/* Header with Role details */}
                <div className="flex items-center justify-between gap-6 mb-2 border-b pb-1.5" style={{ borderColor: isBuyerMsg ? 'rgba(203,173,141,0.2)' : 'rgba(255,255,255,0.2)' }}>
                  <span className={`text-[8px] uppercase tracking-wider font-extrabold ${isBuyerMsg ? 'text-[#A48374]' : 'text-white/80'}`}>
                    {isBuyerMsg ? 'Buyer Proposal' : 'Seller Counter'}
                  </span>
                  <span className={`text-[8px] ${isBuyerMsg ? 'text-[#3A2D28]/50' : 'text-white/60'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Amount detail */}
                <div className="mb-2">
                  <p className={`text-[9px] uppercase tracking-wide ${isBuyerMsg ? 'text-[#A48374]' : 'text-white/80'}`}>
                    Proposed Amount
                  </p>
                  <p className="text-base font-semibold font-serif mt-0.5">
                    {formatCurrency(msg.offerAmount)}
                  </p>
                </div>

                {/* Message */}
                {msg.message && (
                  <p className={`text-xs leading-relaxed ${isBuyerMsg ? 'text-[#3A2D28]/85' : 'text-white/90'}`}>
                    {msg.message}
                  </p>
                )}
              </div>
              
              {/* Message date footer */}
              <span className="text-[8px] text-[#A48374] mt-1 px-1">
                {new Date(msg.timestamp).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Bar (Footer) */}
      <div className="p-4 border-t border-[#CBAD8D]/25 bg-white flex-shrink-0">
        {loading ? (
          <div className="py-3 text-center flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-[#A48374] font-medium">Processing Proposal...</span>
          </div>
        ) : showCounterForm ? (
          /* COUNTER OFFER FORM */
          <form onSubmit={handleCounterSubmit} className="space-y-3.5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#CBAD8D]/15 pb-2">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#3A2D28] flex items-center gap-1">
                <Handshake className="w-3.5 h-3.5 text-[#A48374]" /> Proposed Counter-Offer
              </h5>
              <button 
                type="button"
                onClick={() => setShowCounterForm(false)}
                className="text-[9px] font-bold text-[#A48374] hover:text-[#3A2D28]"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-[#A48374] mb-1">
                Counter Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#A48374] font-medium">₹</span>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Enter counter price"
                  className="w-full pl-7 pr-3 py-2 bg-[#F7F3EF]/40 border border-[#EBE3DB] focus:outline-none focus:border-[#A48374] rounded-xl text-xs font-semibold text-[#3A2D28]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-[#A48374] mb-1">
                Terms Message
              </label>
              <textarea
                rows={2}
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Include custom terms or details..."
                className="w-full px-3 py-2 bg-[#F7F3EF]/40 border border-[#EBE3DB] focus:outline-none focus:border-[#A48374] rounded-xl text-xs leading-normal"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#A48374] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3A2D28] transition-colors cursor-pointer"
            >
              Submit Counter Proposal
            </button>
          </form>
        ) : needsResponse ? (
          /* ACTION OPTIONS (PENDING DECISION) */
          <div className="space-y-3.5">
            <div className="flex gap-2.5">
              <button
                onClick={() => handleAction('accept')}
                className="flex-1 py-3 bg-[#A48374] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#3A2D28] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Accept Offer
              </button>
              
              <button
                onClick={() => setShowCounterForm(true)}
                className="flex-1 py-3 bg-white border border-[#A48374] text-[#A48374] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#F7F3EF] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Handshake className="w-3.5 h-3.5" /> Counter Offer
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => handleAction('reject')}
                className="text-[10px] font-bold uppercase tracking-widest text-[#3A2D28] hover:text-red-600 hover:underline transition-colors"
              >
                Reject Proposal
              </button>
            </div>
          </div>
        ) : offer.status === 'accepted' && user.role === 'buyer' ? (
          /* PROCEED TO CHECKOUT BUTTON (ACCEPTED STATE) */
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#ECFDF5] border border-green-200 p-3 rounded-xl text-[9px] text-[#047857] mb-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
              Contract established! Proceed to checkout to settle escrow deposit.
            </div>
            
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-4 bg-[#3A2D28] hover:bg-[#A48374] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> Proceed to Checkout
            </button>
          </div>
        ) : (
          /* STATE LABELS */
          <div className="text-center py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A48374] italic">
              {offer.status === 'accepted' 
                ? 'Negotiation Accepted. Escrow payment pending.' 
                : offer.status === 'rejected' 
                ? 'Negotiation Rejected.' 
                : 'Awaiting other party response.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
