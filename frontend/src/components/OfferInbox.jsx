import React, { useState, useEffect } from 'react';
import { Handshake, MessageCircle, AlertCircle, Sparkles, X, ChevronRight } from 'lucide-react';
import axios from 'axios';
import OfferThreadView from './OfferThreadView';

const API_BASE = 'http://localhost:2409/api';

export default function OfferInbox() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Retrieve user details from localStorage
  const user = JSON.parse(localStorage.getItem('zivora_user')) || { role: 'buyer', _id: '' };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        setError('Please sign in to view your offers.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/offers/inbox`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setOffers(response.data.data.offers || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not fetch your offers inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper to determine status text and style
  const getStatusBadge = (offer) => {
    const isPendingSeller = offer.status === 'pending_seller';
    const isPendingBuyer = offer.status === 'pending_buyer';
    const isAccepted = offer.status === 'accepted';
    const isRejected = offer.status === 'rejected';

    if (isPendingSeller) {
      if (user.role === 'seller') {
        return {
          text: 'Awaiting Your Response',
          style: 'bg-[#A48374]/20 text-[#3A2D28] border border-[#A48374]'
        };
      }
      return {
        text: 'Awaiting Seller Response',
        style: 'bg-white text-[#A48374] border border-[#EBE3DB]'
      };
    }

    if (isPendingBuyer) {
      if (user.role === 'buyer') {
        return {
          text: 'Awaiting Your Response',
          style: 'bg-[#A48374]/20 text-[#3A2D28] border border-[#A48374]'
        };
      }
      return {
        text: 'Awaiting Buyer Response',
        style: 'bg-white text-[#A48374] border border-[#EBE3DB]'
      };
    }

    if (isAccepted) {
      return {
        text: 'Proposal Accepted',
        style: 'bg-green-50 text-green-700 border border-green-200'
      };
    }

    if (isRejected) {
      return {
        text: 'Offer Rejected',
        style: 'bg-red-50 text-red-700 border border-red-200'
      };
    }

    return {
      text: 'Negotiation Completed',
      style: 'bg-gray-50 text-gray-500 border border-gray-200'
    };
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs uppercase tracking-widest text-[#A48374] font-semibold">Opening Sourcing Vault...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border border-red-200 text-center shadow-sm my-8">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h4 className="font-serif text-[#3A2D28] text-base">Inbox Error</h4>
        <p className="text-xs text-[#A48374] mt-2">{error}</p>
        <button 
          onClick={fetchOffers}
          className="mt-4 px-5 py-2.5 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {offers.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-3xl border border-[#EBE3DB] p-8">
          <div className="inline-flex p-4 bg-white rounded-full border border-[#CBAD8D]/20 mb-4">
            <Handshake className="w-8 h-8 text-[#A48374]/60" />
          </div>
          <h4 className="font-serif text-lg text-[#3A2D28] mb-1">No Active Negotiations</h4>
          <p className="text-xs text-[#A48374] max-w-sm mx-auto leading-relaxed">
            You don't have any direct offers or price negotiations currently in progress. Go to listings to initialize a proposal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {offers.map((offer) => {
            const badge = getStatusBadge(offer);
            const product = offer.productId || { title: 'Unknown Diamond', price: 0, images: [] };
            const partnerName = user.role === 'buyer' 
              ? (offer.sellerId?.name || 'Authorized Merchant') 
              : (offer.buyerId?.name || 'Valued Buyer');

            return (
              <div 
                key={offer._id}
                onClick={() => setSelectedOffer(offer)}
                className="bg-white rounded-3xl p-5 border border-[#CBAD8D]/15 hover:border-[#A48374]/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(164,131,116,0.06)] flex gap-4 cursor-pointer relative group duration-300"
              >
                {/* Product Thumbnail */}
                <div className="w-20 h-20 bg-[#F7F3EF] border border-[#EBE3DB] rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-[#CBAD8D]" />
                  )}
                </div>

                {/* Offer Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-xs font-bold text-[#3A2D28] truncate group-hover:text-[#A48374] transition-colors pr-2">
                        {product.title}
                      </h4>
                      <ChevronRight className="w-4 h-4 text-[#A48374]/40 group-hover:text-[#A48374] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                    
                    <p className="text-[10px] text-[#A48374] font-medium mb-2 uppercase tracking-wide">
                      Partner: {partnerName}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center justify-between mt-auto">
                    <div>
                      <p className="text-[8px] text-[#A48374] uppercase tracking-widest">Latest Proposal</p>
                      <p className="text-sm font-semibold text-[#3A2D28] font-serif mt-0.5">
                        {formatCurrency(offer.currentOfferAmount)}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${badge.style}`}>
                      {badge.text}
                    </span>
                  </div>
                </div>

                {/* Active negotiation pulse indicator if response is needed */}
                {((offer.status === 'pending_seller' && user.role === 'seller') ||
                  (offer.status === 'pending_buyer' && user.role === 'buyer')) && (
                  <span className="absolute top-4 right-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A48374] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A48374]"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-out Panel (Drawer) for Thread View */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedOffer(null)}
            className="absolute inset-0 bg-[#3A2D28]/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Thread Panel */}
          <div className="relative w-full max-w-lg h-full bg-[#F1EDE6] shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-[#CBAD8D]/20 bg-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#A48374]/15 flex items-center justify-center text-[#A48374]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base text-[#3A2D28]">Negotiation Thread</h3>
                  <p className="text-[10px] text-[#A48374] font-medium tracking-wide uppercase">
                    Ref: {selectedOffer._id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#3A2D28] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Thread Content */}
            <div className="flex-1 overflow-y-auto">
              <OfferThreadView 
                offer={selectedOffer} 
                user={user}
                onActionSuccess={(updatedOffer) => {
                  // Update offer in selection
                  setSelectedOffer(updatedOffer);
                  // Refresh the inbox data
                  fetchOffers();
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
