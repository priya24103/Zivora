import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Diamond, 
  FileText, 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Clock, 
  Check, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE = 'http://localhost:2409/api';

export default function CreateRfq() {
  const navigate = useNavigate();
  
  // Sourcing Form States
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [shape, setShape] = useState('Round');
  const [carat, setCarat] = useState('');
  const [color, setColor] = useState('D');
  const [clarity, setClarity] = useState('VVS1');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');

  // Dashboard List States
  const [rfqs, setRfqs] = useState([]);
  const [rfqsLoading, setRfqsLoading] = useState(true);
  const [expandedRfqId, setExpandedRfqId] = useState(null);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchRFQs = async () => {
    const token = localStorage.getItem('zivora_token');
    if (!token) return;

    try {
      setRfqsLoading(true);
      const response = await axios.get(`${API_BASE}/rfqs/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setRfqs(response.data.data.rfqs || []);
      }
    } catch (err) {
      console.error('Error fetching RFQs:', err);
    } finally {
      setRfqsLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!carat || !budget || !deadline) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const payload = {
        shape,
        carat: Number(carat),
        color,
        clarity,
        budget: Number(budget),
        deadline: new Date(deadline).toISOString()
      };

      const response = await axios.post(`${API_BASE}/rfq/create`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        triggerToast('RFQ Sourcing Request submitted successfully!');
        // Reset form fields
        setCarat('');
        setBudget('');
        setDeadline('');
        // Refresh requests list below
        fetchRFQs();
      }
    } catch (err) {
      console.error('Error creating RFQ:', err);
      setFormError(err.response?.data?.message || 'Could not submit your request. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

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
        fetchRFQs();
        setTimeout(() => {
          navigate('/cart');
        }, 1500);
      }
    } catch (err) {
      console.error('Error accepting quote:', err);
      alert(err.response?.data?.message || 'Failed to accept quote.');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const toggleExpandRfq = (rfqId) => {
    setExpandedRfqId(prev => (prev === rfqId ? null : rfqId));
  };

  const getLowestQuoteId = (quotes) => {
    if (!quotes || quotes.length === 0) return null;
    const sorted = [...quotes].sort((a, b) => a.quotePrice - b.quotePrice);
    return sorted[0]._id;
  };

  const getStatusBadge = (rfq) => {
    const now = new Date();
    const deadlineDate = new Date(rfq.deadline);
    const isPastDeadline = deadlineDate < now;

    if (rfq.status === 'completed' || rfq.status === 'awarded') {
      return { text: 'Completed', bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
    }
    if (rfq.status === 'closed' || isPastDeadline) {
      return { text: 'Expired', bg: '#F1EDE6', color: '#6B5549' };
    }
    return { text: 'Open', bg: 'rgba(203,173,141,0.25)', color: '#A48374' };
  };

  return (
    <div className="min-h-screen py-16 px-6 lg:px-16" style={{ backgroundColor: '#F7F3EF' }}>
      {/* LUXURY TOAST */}
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

      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/buyer/dashboard')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A48374] mb-8 hover:text-[#3A2D28] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* ─── LEFT COLUMN: REQUEST FORM ────────────────────────────── */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/15"
            >
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-[#F7F3EF] text-[#A48374]">
                  <FileText className="w-5.5 h-5.5" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: '#CBAD8D' }}>Bespoke Sourcing</span>
                <h1 className="text-2xl mt-1 text-[#3A2D28]" style={{ fontWeight: 200, fontFamily: 'Georgia, serif' }}>
                  Request a Custom Quote
                </h1>
                <p className="text-xs text-[#A48374] mt-2 leading-relaxed">
                  Submit raw specifications to our merchant network to receive custom diamond offers.
                </p>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-1.5">
                    Diamond Shape
                  </label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                  >
                    {['Round', 'Princess', 'Cushion', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Marquise', 'Asscher', 'Heart'].map((sh) => (
                      <option key={sh} value={sh}>{sh}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-1.5">
                      Carat Weight *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1.5"
                      value={carat}
                      onChange={(e) => setCarat(e.target.value)}
                      className="w-full px-5 py-3 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-1.5">
                      Color Grade
                    </label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-5 py-3 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                    >
                      {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map((col) => (
                        <option key={col} value={col}>{col} Grade</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-1.5">
                      Clarity Grade
                    </label>
                    <select
                      value={clarity}
                      onChange={(e) => setClarity(e.target.value)}
                      className="w-full px-5 py-3 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                    >
                      {['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'].map((cl) => (
                        <option key={cl} value={cl}>{cl}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-1.5">
                      Budget (INR) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-5 py-3 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-1.5">
                    Deadline Date *
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-4 rounded-full text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #A48374, #3A2D28)',
                    opacity: formLoading ? 0.7 : 1
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                  {formLoading ? 'Submitting Request...' : 'Submit RFQ Request'}
                </button>
              </form>
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN: RFQS & BIDS DASHBOARD ─────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/15 min-h-[500px]">
              <div className="border-b border-[#CBAD8D]/10 pb-4 mb-6">
                <span className="text-[10px] uppercase tracking-[0.35em] text-[#CBAD8D]">Requests & Submissions</span>
                <h2 className="text-2xl mt-1 text-[#3A2D28]" style={{ fontWeight: 300, fontFamily: 'Georgia, serif' }}>
                  Your Diamond Proposals
                </h2>
              </div>

              {rfqsLoading ? (
                <div className="text-center py-20 text-xs text-[#A48374] italic">
                  Connecting to secure ledger...
                </div>
              ) : rfqs.length === 0 ? (
                <div className="text-center py-24 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF8F6] flex items-center justify-center mx-auto text-[#A48374]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-[#3A2D28] uppercase tracking-wider">No proposals found</h4>
                  <p className="text-xs text-[#A48374] max-w-xs mx-auto leading-relaxed">
                    Submit the form on the left to broadcast specifications to verified sellers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rfqs.map((rfq) => {
                    const badge = getStatusBadge(rfq);
                    const quotesCount = rfq.quotes ? rfq.quotes.length : 0;
                    const isExpanded = expandedRfqId === rfq._id;
                    const lowestQuoteId = getLowestQuoteId(rfq.quotes);

                    return (
                      <div 
                        key={rfq._id}
                        className="bg-[#FAF8F6]/50 rounded-2xl border border-[#CBAD8D]/10 hover:border-[#CBAD8D]/30 transition-all overflow-hidden"
                      >
                        {/* RFQ Row */}
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span 
                                className="inline-block px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" 
                                style={{ backgroundColor: badge.bg, color: badge.color }}
                              >
                                {badge.text}
                              </span>
                              <span className="text-[9px] text-[#A48374] font-mono">
                                Ref: {rfq._id.substring(18).toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-[#3A2D28]">
                              {rfq.carat}ct {rfq.shape} Diamond
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] text-[#A48374]">
                              <span>Color: {rfq.color}</span>
                              <span>•</span>
                              <span>Clarity: {rfq.clarity}</span>
                              <span>•</span>
                              <span>Budget: ₹{rfq.budget.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#CBAD8D]/5">
                            <div className="text-left sm:text-right">
                              <p className="text-[8px] text-[#A48374] font-bold uppercase tracking-widest">Offers</p>
                              <p className="text-xs font-bold text-[#3A2D28] font-serif">
                                {quotesCount} {quotesCount === 1 ? 'Quote' : 'Quotes'}
                              </p>
                            </div>

                            {quotesCount > 0 && (
                              <button
                                onClick={() => toggleExpandRfq(rfq._id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#CBAD8D]/25 hover:border-[#A48374] rounded-full text-[9px] font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] bg-white transition-all cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>Hide <ChevronUp className="w-3.5 h-3.5" /></>
                                ) : (
                                  <>View <ChevronDown className="w-3.5 h-3.5" /></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Offers list */}
                        <AnimatePresence>
                          {isExpanded && quotesCount > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-white border-t border-[#CBAD8D]/10 overflow-hidden"
                            >
                              <div className="p-4 space-y-3">
                                {rfq.quotes.map((quote) => {
                                  const isLowest = quote._id === lowestQuoteId;
                                  const isAccepted = quote.accepted === true;
                                  const canAccept = badge.text === 'Open';

                                  return (
                                    <div
                                      key={quote._id}
                                      className={`p-4 rounded-xl border relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                                        isLowest 
                                          ? 'border-[#A48374] bg-[#FAF8F6]/30 shadow-xs' 
                                          : 'border-[#CBAD8D]/10'
                                      }`}
                                    >
                                      {isLowest && (
                                        <span className="absolute -top-2 left-3 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#A48374] text-white text-[7px] font-bold uppercase tracking-wider">
                                          <Trophy className="w-2 h-2" /> Best Price
                                        </span>
                                      )}

                                      <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs text-[#3A2D28] font-bold">
                                            {quote.sellerId?.company || quote.sellerName}
                                          </span>
                                          {quote.sellerId?.name && (
                                            <span className="text-[9px] text-[#A48374]">
                                              ({quote.sellerId.name})
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-[#3A2D28]/80 leading-relaxed italic">
                                          "{quote.message}"
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#CBAD8D]/5">
                                        <div className="text-left sm:text-right">
                                          <p className="text-[7px] text-[#A48374] font-bold uppercase tracking-widest font-mono">Offered Price</p>
                                          <p className="text-xs font-bold text-[#3A2D28]">
                                            ₹{quote.quotePrice.toLocaleString('en-IN')}
                                          </p>
                                        </div>

                                        <div className="flex gap-1.5">
                                          {quote.productId && (
                                            <a
                                              href={`/products/${quote.productId._id || quote.productId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#CBAD8D]/25 hover:bg-[#FAF8F6] rounded-full text-[9px] font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] transition-colors"
                                            >
                                              Specs <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          )}

                                          {isAccepted ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-full text-[9px] font-bold uppercase tracking-wider border border-green-200">
                                              <Check className="w-2.5 h-2.5" /> Accepted
                                            </span>
                                          ) : canAccept ? (
                                            <button
                                              onClick={() => handleAcceptQuote(rfq._id, quote._id)}
                                              disabled={acceptingQuoteId !== null}
                                              className="px-3 py-1.5 bg-[#A48374] hover:bg-[#3A2D28] text-white text-[9px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
                                            >
                                              {acceptingQuoteId === quote._id ? 'Accepting...' : 'Accept'}
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
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
        </div>
      </div>
    </div>
  );
}
