import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Diamond, 
  Gavel, 
  MessageSquare, 
  LogOut, 
  TrendingUp, 
  Heart,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Handshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import OfferInbox from '../components/OfferInbox';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  
  // Retrieve user details from localStorage
  const user = JSON.parse(localStorage.getItem('zivora_user')) || {
    name: 'Valued Client',
    email: 'client@zivora.com',
    phone: '9876543210',
    role: 'buyer',
    isVerified: true
  };

  const [rfqs, setRfqs] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bids'); // 'bids' or 'explore'
  const [expandedRfqId, setExpandedRfqId] = useState(null);
  
  // Bid input state per auction: { [auctionId]: value }
  const [bidInputs, setBidInputs] = useState({});

  const handleLogout = () => {
    localStorage.removeItem('zivora_token');
    localStorage.removeItem('zivora_user');
    navigate('/login');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // 1. Fetch RFQs
      const rfqRes = await axios.get('http://localhost:2409/api/rfq', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rfqRes.data.status === 'success') {
        setRfqs(rfqRes.data.data.rfqs);
      }

      // 2. Fetch my bidding history
      const bidsRes = await axios.get('http://localhost:2409/api/auctions/my-bids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (bidsRes.data.status === 'success') {
        setMyBids(bidsRes.data.data.auctions);
      }

      // 3. Fetch active auctions available to bid on
      const activeRes = await axios.get('http://localhost:2409/api/auctions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activeRes.data.status === 'success') {
        setActiveAuctions(activeRes.data.data.auctions);
      }

      // 4. Fetch placed orders
      const ordersRes = await axios.get('http://localhost:2409/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (ordersRes.data.status === 'success') {
        setOrders(ordersRes.data.data.orders);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handlePlaceBid = async (auctionId, startPrice, currentBid, bidsCount) => {
    const inputVal = bidInputs[auctionId];
    if (!inputVal) {
      alert('Please enter a bid amount.');
      return;
    }

    const bidAmount = Number(inputVal);
    const minRequired = bidsCount === 0 ? startPrice : currentBid;

    if (bidAmount <= minRequired) {
      alert(`Your bid must be strictly greater than ₹${minRequired.toLocaleString('en-IN')}`);
      return;
    }

    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.post(`http://localhost:2409/api/auctions/${auctionId}/bid`, {
        bidAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        alert('Bid placed successfully!');
        setBidInputs(prev => ({ ...prev, [auctionId]: '' }));
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error placing bid:', err);
      alert(err.response?.data?.message || 'Could not place your bid. Please try again.');
    }
  };

  const handleRegisterForAuction = async (auctionId) => {
    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.post(`http://localhost:2409/api/auctions/${auctionId}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        alert('Successfully registered for this live auction!');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error registering for auction:', err);
      alert(err.response?.data?.message || 'Could not register for auction.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order and restore the items to your cart?')) return;
    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.post(`http://localhost:2409/api/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        alert('Order cancelled and items restored to cart successfully.');
        fetchDashboardData();
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Could not cancel order');
    }
  };

  return (
    <div className="min-h-screen py-12 px-6 lg:px-16" style={{ backgroundColor: '#F7F3EF' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* ─── DASHBOARD HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.35em]" style={{ color: '#A48374' }}>Buyer Portfolio</span>
            <h1 className="text-4xl md:text-5xl mt-2" style={{ fontWeight: 200, color: '#3A2D28', fontFamily: 'Georgia, serif' }}>
              Welcome back, <em style={{ color: '#A48374', fontStyle: 'italic' }}>{user.name.split(' ')[0]}</em>
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="self-start md:self-auto flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-[#A48374] border border-[#A48374]/30 hover:bg-[#A48374] hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ─── LEFT COLUMN: PROFILE CARD ─────────────────────────────── */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #A48374, #3A2D28)' }}>
                  <span className="text-2xl font-light">{user.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#3A2D28]">{user.name}</h3>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-50 text-green-700">
                    <Shield className="w-2.5 h-2.5" />
                    Verified Client
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm border-t border-[#CBAD8D]/10 pt-6">
                <div className="flex items-center gap-3 text-[#3A2D28]">
                  <Mail className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-[#3A2D28]">
                  <Phone className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                  <span>+91 {user.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-[#3A2D28]">
                  <User className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                  <span className="capitalize">{user.role} Account</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10 text-center">
                <Gavel className="w-5 h-5 text-[#A48374] mb-2 mx-auto" />
                <p className="text-xl font-light text-[#3A2D28]">{myBids.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#A48374] mt-0.5">My Bids</p>
              </div>
              <div 
                onClick={() => navigate('/my-rfqs')}
                className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10 text-center cursor-pointer hover:border-[#A48374] transition-colors group"
              >
                <MessageSquare className="w-5 h-5 text-[#A48374] mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-xl font-light text-[#3A2D28]">{rfqs.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#A48374] mt-0.5">Custom RFQs</p>
              </div>
              <div 
                onClick={() => navigate('/my-orders')}
                className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10 text-center cursor-pointer hover:border-[#A48374] transition-colors group"
              >
                <ShoppingBag className="w-5 h-5 text-[#A48374] mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-xl font-light text-[#3A2D28]">{orders.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#A48374] mt-0.5">My Orders</p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: INTERACTIVE PORTAL SECTIONS ─────────────── */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Live Auctions Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#CBAD8D]/10 pb-4">
                <div className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-[#A48374]" />
                  <h3 className="text-xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Auctions Platform</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab('bids')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'bids' ? 'bg-[#3A2D28] text-white' : 'bg-[#F7F3EF] text-[#A48374]'}`}
                  >
                    My Bids ({myBids.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'explore' ? 'bg-[#3A2D28] text-white' : 'bg-[#F7F3EF] text-[#A48374]'}`}
                  >
                    Explore Active ({activeAuctions.length})
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#A48374] italic">Loading auctions data...</div>
              ) : activeTab === 'bids' ? (
                // BUYER'S ACTIVE BIDS TAB
                myBids.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#A48374] italic">You have not bid on any live auctions yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#CBAD8D]/15 text-[#A48374] text-xs uppercase tracking-wider font-semibold">
                          <th className="pb-3">Diamond Details</th>
                          <th className="pb-3">Starting Price</th>
                          <th className="pb-3">Current Bid</th>
                          <th className="pb-3">My Last Bid</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#CBAD8D]/10">
                        {myBids.map((bid) => {
                          const userBids = bid.bids.filter(b => b.bidderId === user._id).sort((a, b) => (b.amount || b.bidAmount || 0) - (a.amount || a.bidAmount || 0));
                          const myLastBid = userBids[0]?.amount || userBids[0]?.bidAmount || bid.startPrice;
                          const isHighest = bid.bids[bid.bids.length - 1]?.bidderId === user._id;
                          const currentBidVal = bid.currentHighestBid !== undefined ? bid.currentHighestBid : bid.currentBid;

                          return (
                            <tr key={bid._id} className="text-[#3A2D28] hover:bg-[#FBF9F6]/50 transition-colors">
                              <td className="py-4 font-medium flex items-center gap-2">
                                <Diamond className="w-3.5 h-3.5 text-[#CBAD8D]" />
                                <div>
                                  <p>{bid.title || bid.productId?.title}</p>
                                  <p className="text-[10px] text-[#A48374] mt-0.5">{bid.category || bid.productId?.category} • {bid.productId?.carat || bid.carat}ct • {bid.productId?.color || bid.color} {bid.productId?.clarity || bid.clarity}</p>
                                </div>
                              </td>
                              <td className="py-4">₹{bid.startPrice.toLocaleString('en-IN')}</td>
                              <td className="py-4">₹{currentBidVal.toLocaleString('en-IN')}</td>
                              <td className="py-4 font-semibold">₹{myLastBid.toLocaleString('en-IN')}</td>
                              <td className="py-4">
                                <span 
                                  className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" 
                                  style={{ 
                                    backgroundColor: isHighest ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                                    color: isHighest ? '#10B981' : '#EF4444' 
                                  }}
                                >
                                  {isHighest ? 'Highest Bidder' : 'Outbid'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                // EXPLORE ACTIVE AUCTIONS TAB
                activeAuctions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#A48374] italic">No active auctions running currently. Check back later.</div>
                ) : (
                  <div className="space-y-6">
                    {activeAuctions.map((auc) => {
                      const currentBidVal = auc.currentHighestBid !== undefined ? auc.currentHighestBid : auc.currentBid;
                      const hasBid = auc.bids.some(b => b.bidderId === user._id);
                      const isRegistered = auc.registeredBuyers?.some(id => id.toString() === user._id?.toString());
                      const regDeadline = new Date(auc.registrationDeadline || auc.createdAt || new Date());
                      const regClosed = new Date() >= regDeadline;

                      return (
                        <div 
                          key={auc._id} 
                          className="p-5 rounded-2xl border border-[#CBAD8D]/10 hover:border-[#A48374]/30 transition-all bg-[#FBF9F6]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Live</span>
                            </div>
                            <h4 className="font-semibold text-base text-[#3A2D28] mt-1">{auc.title || auc.productId?.title}</h4>
                            <p className="text-xs text-[#A48374] mt-0.5">
                              {auc.category || auc.productId?.category} {auc.productId?.carat && `• ${auc.productId.carat}ct • ${auc.productId.color} ${auc.productId.clarity} • ${auc.productId.cut || 'Excellent'} Cut`}
                            </p>
                            <div className="flex items-center gap-4 text-[11px] font-bold text-[#A48374] mt-3 uppercase tracking-wider">
                              <span>Starting: ₹{auc.startPrice.toLocaleString('en-IN')}</span>
                              <span>•</span>
                              <span>Bids: {auc.bidsCount}</span>
                              {isRegistered && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600">Registered</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end w-full md:w-auto">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A48374]">Current Bid</p>
                            <p className="text-2xl font-light text-[#3A2D28] mt-0.5">₹{currentBidVal.toLocaleString('en-IN')}</p>
                            
                            <div className="mt-3 w-full md:w-auto">
                              {isRegistered ? (
                                <button 
                                  onClick={() => navigate(`/auctions/${auc._id}`)}
                                  className="px-6 py-2 bg-[#3A2D28] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#A48374] transition-colors whitespace-nowrap cursor-pointer block text-center"
                                >
                                  Enter Live Room
                                </button>
                              ) : regClosed ? (
                                <button 
                                  disabled
                                  className="px-6 py-2 bg-gray-200 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-lg whitespace-nowrap cursor-not-allowed block text-center"
                                >
                                  Registration Closed
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleRegisterForAuction(auc._id)}
                                  className="px-6 py-2 bg-[#CBAD8D] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#A48374] transition-colors whitespace-nowrap cursor-pointer block text-center"
                                >
                                  Register for Auction
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </motion.div>
 
            {/* Direct Negotiations Section */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10"
            >
              <div className="flex items-center gap-2 mb-6 border-b border-[#CBAD8D]/10 pb-4">
                <Handshake className="w-5 h-5 text-[#A48374]" />
                <h3 className="text-xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Direct Negotiations</h3>
              </div>
              <OfferInbox />
            </motion.div>

            {/* Custom Diamond Quote Requests (RFQs) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#A48374]" />
                  <h3 className="text-xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Custom Requests (RFQs)</h3>
                </div>
                <button 
                  onClick={() => navigate('/rfq/create')}
                  className="px-4 py-2 bg-[#3A2D28] text-white text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors cursor-pointer shadow-sm"
                >
                  Create New Request
                </button>
              </div>

              {loading ? (
                <div className="py-6 text-center text-xs text-[#A48374] italic">Loading requests...</div>
              ) : rfqs.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#A48374] italic">You have not submitted any quote requests yet.</div>
              ) : (
                <div className="space-y-4">
                  {rfqs.map((rfq) => {
                    const isExpanded = expandedRfqId === rfq._id;
                    const hasQuotes = rfq.quotes && rfq.quotes.length > 0;
                    
                    return (
                      <div 
                        key={rfq._id} 
                        className="p-5 rounded-2xl border border-[#CBAD8D]/10 hover:border-[#CBAD8D]/30 transition-all bg-[#FBF9F6]/40"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#3A2D28]">{rfq.shape} Request</span>
                              <span className="text-xs text-[#A48374]">• {rfq.carat}ct {rfq.color} {rfq.clarity}</span>
                            </div>
                            <p className="text-xs text-[#A48374] mt-1">
                              Requested on {new Date(rfq.createdAt).toLocaleDateString()} • Budget: <strong className="text-[#3A2D28]">₹{Number(rfq.budget).toLocaleString('en-IN')}</strong>
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between md:justify-end gap-4">
                            <span 
                              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                              style={{ 
                                backgroundColor: 
                                  rfq.status === 'awarded' ? 'rgba(16,185,129,0.15)' :
                                  rfq.status === 'closed' ? 'rgba(239,68,68,0.15)' :
                                  rfq.status === 'submitted' ? 'rgba(164,131,116,0.15)' : 'rgba(203,173,141,0.15)',
                                color: 
                                  rfq.status === 'awarded' ? '#10B981' :
                                  rfq.status === 'closed' ? '#EF4444' : '#A48374'
                              }}
                            >
                              {
                                rfq.status === 'awarded' ? 'Awarded' :
                                rfq.status === 'closed' ? 'Closed' :
                                rfq.status === 'submitted' ? `Offers Received (${rfq.quotes.length})` : 'Pending Review'
                              }
                            </span>
                            {hasQuotes && (
                              <button 
                                onClick={() => setExpandedRfqId(isExpanded ? null : rfq._id)}
                                className="p-2 rounded-full border border-[#CBAD8D]/20 text-[#A48374] hover:text-[#3A2D28] hover:bg-white transition-all cursor-pointer"
                                title={isExpanded ? 'Collapse quotes' : 'Expand quotes'}
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Quotes List */}
                        <AnimatePresence>
                          {isExpanded && hasQuotes && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden mt-4 pt-4 border-t border-[#CBAD8D]/10 space-y-3"
                            >
                              <p className="text-[10px] font-bold text-[#A48374] uppercase tracking-wider">Seller Offers:</p>
                              {rfq.quotes.map((q, idx) => {
                                const isWinner = rfq.winningQuoteId && q._id.toString() === rfq.winningQuoteId.toString();
                                return (
                                  <div 
                                    key={idx} 
                                    className={`p-4 bg-white border rounded-2xl text-xs flex justify-between items-start gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] ${isWinner ? 'border-green-500 bg-green-50/10' : 'border-[#CBAD8D]/10'}`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-bold text-[#3A2D28]">{q.sellerName}</p>
                                        {isWinner && (
                                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[8px] font-bold uppercase tracking-wider">
                                            🏆 Winner
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[#6B5549] mt-1 leading-relaxed">{q.message}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="font-bold text-sm text-[#3A2D28]">₹{q.quotePrice.toLocaleString('en-IN')}</p>
                                      <span className="text-[9px] text-[#A48374] block mt-1">{new Date(q.createdAt || q.date).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
