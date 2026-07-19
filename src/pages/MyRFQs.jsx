import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Check, 
  Tag, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  ExternalLink 
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:2409/api';

export default function MyRFQs() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRfqId, setExpandedRfqId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [acceptingQuoteId, setAcceptingQuoteId] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchRFQs = async () => {
    const token = localStorage.getItem('zivora_token');
    if (!token) {
      setError('Please log in to view your custom quotes.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/rfqs/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setRfqs(response.data.data.rfqs || []);
      }
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      setError(err.response?.data?.message || 'Failed to load your custom requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const handleAcceptQuote = async (rfqId, quoteId) => {
    const token = localStorage.getItem('zivora_token');
    if (!token) return;

    try {
      setAcceptingQuoteId(quoteId);
      const response = await axios.post(`${API_BASE}/rfqs/${rfqId}/accept-quote`, {
        quoteId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        triggerToast('Quote Accepted! Placing item in Cart...');
        // Refresh catalog list
        fetchRFQs();
        setTimeout(() => {
          navigate('/cart');
        }, 1500);
      }
    } catch (err) {
      console.error('Error accepting quote:', err);
      alert(err.response?.data?.message || 'Failed to accept quote. Please try again.');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const toggleExpandRfq = (rfqId) => {
    setExpandedRfqId(prev => (prev === rfqId ? null : rfqId));
  };

  // Find the lowest price quote inside an RFQ array (Min-Heap logic highlight)
  const getLowestQuoteId = (quotes) => {
    if (!quotes || quotes.length === 0) return null;
    const sorted = [...quotes].sort((a, b) => a.quotePrice - b.quotePrice);
    return sorted[0]._id;
  };

  const getStatusBadge = (rfq) => {
    const now = new Date();
    const deadline = new Date(rfq.deadline);
    const isPastDeadline = deadline < now;

    if (rfq.status === 'completed' || rfq.status === 'awarded') {
      return { text: 'Completed', bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
    }
    if (rfq.status === 'closed' || isPastDeadline) {
      return { text: 'Expired', bg: '#F1EDE6', color: '#6B5549' };
    }
    return { text: 'Open', bg: 'rgba(203,173,141,0.25)', color: '#A48374' };
  };

  return (
    <div className="min-h-screen bg-[#F1EDE6] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* LUXURY TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3.5 rounded-full shadow-2xl z-[9999] border border-[#CBAD8D]/30 flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <button 
          onClick={() => navigate('/buyer/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] transition-colors mb-8 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>

        <div className="border-b border-[#CBAD8D]/20 pb-6 mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#A48374] font-medium">Bespoke Sourcing</span>
            <h1 className="text-4xl mt-1.5 font-light text-[#3A2D28] tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              My Custom RFQs
            </h1>
          </div>
          <button
            onClick={() => navigate('/rfq/create')}
            className="px-6 py-3 bg-[#3A2D28] hover:bg-[#A48374] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            + Create New RFQ
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-[#A48374] italic">
            Connecting to secure ledger...
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-[#CBAD8D]/20 p-10 text-center max-w-lg mx-auto space-y-4">
            <p className="text-xs text-[#3A2D28]/75">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-[#A48374] text-white text-[10px] uppercase font-bold tracking-wider rounded-full"
            >
              Sign In
            </button>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#CBAD8D]/15 p-16 text-center max-w-lg mx-auto space-y-6 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F6] flex items-center justify-center mx-auto text-[#A48374]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#3A2D28] uppercase tracking-wider">No custom RFQs submitted</h4>
              <p className="text-xs text-[#A48374] mt-2 leading-relaxed">
                Submit raw specifications to our verified merchant network to receive custom direct diamond offerings.
              </p>
            </div>
            <button
              onClick={() => navigate('/rfq/create')}
              className="px-6 py-3 border border-[#A48374] text-[#A48374] hover:bg-[#3A2D28] hover:text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
            >
              Request Custom Sourcing
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {rfqs.map((rfq) => {
              const badge = getStatusBadge(rfq);
              const quotesCount = rfq.quotes ? rfq.quotes.length : 0;
              const isExpanded = expandedRfqId === rfq._id;
              const lowestQuoteId = getLowestQuoteId(rfq.quotes);

              return (
                <div 
                  key={rfq._id}
                  className="bg-white rounded-3xl border border-[#CBAD8D]/15 hover:border-[#CBAD8D]/35 transition-all shadow-sm overflow-hidden flex flex-col"
                >
                  {/* RFQ Card Header */}
                  <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider" 
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {badge.text}
                        </span>
                        <span className="text-[10px] text-[#A48374] font-medium font-mono">
                          Ref: {rfq._id.substring(18).toUpperCase()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg md:text-xl font-bold text-[#3A2D28]">
                        {rfq.carat} Carat {rfq.shape} Diamond
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#A48374]">
                        <span><strong>Color:</strong> {rfq.color}</span>
                        <span>•</span>
                        <span><strong>Clarity:</strong> {rfq.clarity}</span>
                        <span>•</span>
                        <span><strong>Budget:</strong> ₹{rfq.budget.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-[#CBAD8D]/10">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-[#A48374] font-bold uppercase tracking-widest">Offers Received</p>
                        <p className="text-lg font-serif font-bold text-[#3A2D28] mt-0.5">
                          {quotesCount} {quotesCount === 1 ? 'Quote' : 'Quotes'}
                        </p>
                      </div>

                      {quotesCount > 0 && (
                        <button
                          onClick={() => toggleExpandRfq(rfq._id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#CBAD8D]/30 hover:border-[#A48374] rounded-full text-[10px] font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] bg-white transition-colors cursor-pointer"
                        >
                          {isExpanded ? (
                            <>Hide Quotes <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>View Quotes <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quotes Expansion (Reverse Bidding UI) */}
                  <AnimatePresence>
                    {isExpanded && quotesCount > 0 && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#FAF8F6] border-t border-[#CBAD8D]/15 overflow-hidden"
                      >
                        <div className="p-6 md:p-8 space-y-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-2 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Direct Bids from Verified Sellers
                          </h4>

                          <div className="space-y-4">
                            {rfq.quotes.map((quote) => {
                              const isLowest = quote._id === lowestQuoteId;
                              const isAccepted = quote.accepted === true;
                              const canAccept = badge.text === 'Open';

                              return (
                                <div
                                  key={quote._id}
                                  className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                                    isLowest 
                                      ? 'border-[#A48374] ring-1 ring-[#A48374]/20 shadow-xs' 
                                      : 'border-[#CBAD8D]/15 hover:border-[#CBAD8D]/30'
                                  }`}
                                >
                                  {isLowest && (
                                    <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#A48374] text-white text-[8px] font-bold uppercase tracking-wider shadow-sm">
                                      <Trophy className="w-2.5 h-2.5" /> Best Price
                                    </span>
                                  )}

                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className="text-xs text-[#3A2D28] font-bold">
                                        {quote.sellerId?.company || quote.sellerName}
                                      </span>
                                      {quote.sellerId?.name && (
                                        <span className="text-[10px] text-[#A48374]">
                                          ({quote.sellerId.name})
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[#3A2D28]/80 leading-relaxed italic">
                                      "{quote.message}"
                                    </p>
                                  </div>

                                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-[#CBAD8D]/10">
                                    <div className="text-left md:text-right">
                                      <p className="text-[9px] text-[#A48374] font-bold uppercase tracking-widest">Offered Price</p>
                                      <p className="text-base font-bold text-[#3A2D28] mt-0.5">
                                        ₹{quote.quotePrice.toLocaleString('en-IN')}
                                      </p>
                                    </div>

                                    <div className="flex gap-2">
                                      {quote.productId && (
                                        <a
                                          href={`/products/${quote.productId._id || quote.productId}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-3 py-2 border border-[#CBAD8D]/30 hover:bg-[#FAF8F6] rounded-full text-[10px] font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] transition-colors"
                                        >
                                          Stone Specs <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}

                                      {isAccepted ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200">
                                          <Check className="w-3 h-3" /> Accepted
                                        </span>
                                      ) : canAccept ? (
                                        <button
                                          onClick={() => handleAcceptQuote(rfq._id, quote._id)}
                                          disabled={acceptingQuoteId !== null}
                                          className="px-4 py-2 bg-[#A48374] hover:bg-[#3A2D28] text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer shadow-xs"
                                        >
                                          {acceptingQuoteId === quote._id ? 'Accepting...' : 'Accept Quote'}
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
