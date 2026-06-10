import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldAlert, 
  ShieldCheck, 
  Diamond, 
  Gavel, 
  DollarSign, 
  LogOut, 
  PlusCircle, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  Eye,
  MessageSquare,
  Trash2,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Send,
  Plus,
  ArrowUpRight,
  Check,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  
  // Retrieve user details from localStorage
  const user = JSON.parse(localStorage.getItem('zivora_user')) || {
    name: 'Exquisite Diamonds Ltd',
    email: 'contact@exquisitediamonds.com',
    phone: '9876543210',
    role: 'seller',
    isVerified: false,
    sellerProfile: {
      panNumber: 'ABCDE1234F',
      gstNumber: '22ABCDE1234F1Z5',
      kycStatus: 'approved',
      kycRemarks: 'Verification complete. Premium trading enabled.'
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zivora_token');
    localStorage.removeItem('zivora_user');
    navigate('/login');
  };

  // State management
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Interactive Modals & Workflow States
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [selectedAuctionItem, setSelectedAuctionItem] = useState(null);
  const [auctionStartPrice, setAuctionStartPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('24h');
  
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [rfqPriceQuote, setRfqPriceQuote] = useState('');
  const [rfqMessage, setRfqMessage] = useState('');
  const [rfqProductId, setRfqProductId] = useState('');

  // ─── DATABASE BACKED DATABASES ─────────────────────────────────────────────
  
  const [auctions, setAuctions] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const calculateTimeLeft = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Ended';
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  };

  const formatTimeAgo = (time) => {
    const diff = new Date() - new Date(time);
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(time).toLocaleDateString();
  };

  // Fetch all console data from the database
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // 1. Fetch inventory
      const prodRes = await axios.get('http://localhost:2409/api/products/seller', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (prodRes.data.status === 'success') {
        setInventory(prodRes.data.data.products);
      }

      // 2. Fetch auctions
      const aucRes = await axios.get('http://localhost:2409/api/auctions/seller', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (aucRes.data.status === 'success') {
        const mappedAuctions = aucRes.data.data.auctions.map(a => ({
          id: a._id,
          title: a.title,
          category: a.category,
          carat: a.carat,
          color: a.color,
          clarity: a.clarity,
          cut: a.cut,
          startPrice: a.startPrice,
          currentBid: a.currentBid,
          bidsCount: a.bidsCount,
          timeLeft: calculateTimeLeft(a.endTime),
          status: a.status,
          bids: a.bids.map(b => ({
            bidder: b.bidderName,
            bidAmount: b.bidAmount,
            time: formatTimeAgo(b.time)
          })).reverse()
        }));
        setAuctions(mappedAuctions);
      }

      // 3. Fetch RFQs
      const rfqRes = await axios.get('http://localhost:2409/api/rfq/seller', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rfqRes.data.status === 'success') {
        const mappedRfqs = rfqRes.data.data.rfqs.map(r => {
          const myQuoteEntry = r.quotes.find(q => q.sellerId.toString() === user._id.toString());
          let statusVal = r.status;
          if (statusVal === 'pending' || statusVal === 'submitted' || statusVal === 'open') {
            statusVal = myQuoteEntry ? 'submitted' : 'pending';
          }
          const isWinner = r.status === 'awarded' && r.winnerSeller?.toString() === user._id.toString();
          return {
            id: r._id,
            buyer: r.buyerName,
            specs: `${r.carat}ct ${r.shape} Cut, ${r.color} Color, ${r.clarity} Clarity`,
            budget: `₹${Number(r.budget).toLocaleString('en-IN')}`,
            date: new Date(r.createdAt).toLocaleDateString(),
            status: statusVal,
            dbStatus: r.status,
            isWinner,
            myQuote: myQuoteEntry ? `₹${myQuoteEntry.quotePrice.toLocaleString('en-IN')}` : undefined,
            myMsg: myQuoteEntry ? myQuoteEntry.message : undefined
          };
        });
        setRfqs(mappedRfqs);
      }

      // 4. Fetch conversations
      const convRes = await axios.get('http://localhost:2409/api/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (convRes.data.status === 'success') {
        const mapped = convRes.data.data.conversations.map(c => {
          const recipient = c.participants.find(p => p._id !== user._id) || { name: 'Buyer', _id: '' };
          return {
            id: c._id,
            name: recipient.name,
            recipientId: recipient._id,
            lastMsg: c.lastMsg,
            time: formatTimeAgo(c.updatedAt),
            unread: c.unread,
            messages: c.messages.map(m => ({
              sender: m.senderId === user._id ? 'seller' : 'buyer',
              text: m.text
            }))
          };
        });
        setConversations(mapped);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Could not retrieve console data from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  // Helper to switch tabs via Search Parameters
  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Change product status handler
  const handleUpdateStatus = async (productId, newStatus) => {
    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.patch(`http://localhost:2409/api/products/${productId}/status`, { 
        status: newStatus 
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (response.data.status === 'success') {
        alert(`Product status updated to "${newStatus}" successfully.`);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Could not update product status.');
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.delete(`http://localhost:2409/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        alert('Product listing removed successfully.');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(err.response?.data?.message || 'Could not delete product.');
    }
  };

  // Create auction submit handler
  const handleCreateAuctionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAuctionItem || !auctionStartPrice) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.post('http://localhost:2409/api/auctions/create', {
        productId: selectedAuctionItem._id,
        startPrice: Number(auctionStartPrice),
        duration: auctionDuration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setShowAuctionModal(false);
        setSelectedAuctionItem(null);
        setAuctionStartPrice('');
        alert(`Auction launched successfully for: "${selectedAuctionItem.title}"!`);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error launching auction:', err);
      alert(err.response?.data?.message || 'Could not launch the auction. Please try again.');
    }
  };

  // Submit Quote RFQ handler
  const handleRfqQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!rfqPriceQuote || !rfqProductId) {
      alert('Please enter a quote price and select a product.');
      return;
    }

    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.post(`http://localhost:2409/api/rfq/${selectedRfq.id}/quote`, {
        productId: rfqProductId,
        quotePrice: Number(rfqPriceQuote),
        message: rfqMessage || 'Direct seller offer matching specifications.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setShowRfqModal(false);
        setSelectedRfq(null);
        setRfqPriceQuote('');
        setRfqMessage('');
        setRfqProductId('');
        alert('Quote submitted successfully to the buyer.');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error submitting quote:', err);
      alert(err.response?.data?.message || 'Could not submit your quote. Please try again.');
    }
  };

  // Retract Quote RFQ handler
  const handleRfqQuoteRetract = async (rfqId) => {
    if (!window.confirm("Do you want to retract this offer?")) return;
    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.delete(`http://localhost:2409/api/rfq/${rfqId}/quote`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        alert('Quote retracted successfully.');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error retracting quote:', err);
      alert(err.response?.data?.message || 'Could not retract quote. Please try again.');
    }
  };

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.post('http://localhost:2409/api/conversations/send', {
        recipientId: activeConv.recipientId,
        text: replyText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setReplyText('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConversationId);

  // Filtered inventory calculations
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const kycStatus = user.sellerProfile?.kycStatus || 'pending';
  const kycRemarks = user.sellerProfile?.kycRemarks || 'Your business documents are currently being processed.';

  return (
    <div className="min-h-screen py-10 px-4 lg:px-12" style={{ backgroundColor: '#F7F3EF' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* ─── DASHBOARD TOP ROW (Title & Logout) ─────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.35em]" style={{ color: '#A48374' }}>Seller Console</span>
            <h1 className="text-4xl md:text-5xl mt-1.5" style={{ fontWeight: 200, color: '#3A2D28', fontFamily: 'Georgia, serif' }}>
              Welcome back, <em style={{ color: '#A48374', fontStyle: 'italic' }}>{user.name.split(' ')[0]}</em>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboardData}
              className="p-3 rounded-full border border-[#CBAD8D]/30 text-[#A48374] hover:bg-white hover:text-[#3A2D28] transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-[#A48374] border border-[#A48374]/30 hover:bg-[#A48374] hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>

        {/* ─── KYC VERIFICATION BANNER ───────────────────────────────────── */}
        {kycStatus !== 'approved' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-2xl border flex flex-col md:flex-row items-start gap-4 bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
          >
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-[#FEF3C7]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <h3 className="font-bold uppercase tracking-wider">KYC Verification Required</h3>
              <p className="mt-1 leading-relaxed opacity-90">
                Your business documents (GST: {user.sellerProfile?.gstNumber}, PAN: {user.sellerProfile?.panNumber}) are being reviewed. Listing permissions are disabled until verification completes.
              </p>
              {kycRemarks && <p className="mt-2 font-medium italic">Status: {kycRemarks}</p>}
            </div>
          </motion.div>
        )}

        {/* ─── TAB NAVIGATION SWITCH ──────────────────────────────────────── */}
        {/* We keep this hidden visually as header is doing the tab work, but add responsive controls for dashboard page */}
        <div className="flex md:hidden overflow-x-auto gap-2 pb-4 mb-6 border-b border-[#CBAD8D]/20">
          {['overview', 'inventory', 'auctions', 'rfqs', 'messages', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${currentTab === tab ? 'bg-[#3A2D28] text-white' : 'bg-white text-[#A48374] border border-[#CBAD8D]/25'}`}
            >
              {tab === 'rfqs' ? 'Buyer RFQs' : tab}
            </button>
          ))}
        </div>

        {/* ─── TAB CONTENTS ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* 1. OVERVIEW TAB */}
            {currentTab === 'overview' && (
              <div className="space-y-8">
                
                {/* Visual Stats Row matching image 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Total Listings */}
                  <div className="bg-white rounded-[24px] p-6 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#F7F3EF] flex items-center justify-center text-[#A48374] flex-shrink-0">
                      <Diamond className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-light text-[#3A2D28] tracking-tight">{loading ? '...' : inventory.length}</h4>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A48374] mt-1">Total Listings</p>
                    </div>
                  </div>

                  {/* Card 2: Total Sales */}
                  <div className="bg-white rounded-[24px] p-6 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] flex items-center justify-center text-[#047857] flex-shrink-0">
                      <DollarSign className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-light text-[#3A2D28] tracking-tight">₹2.84 Cr</h4>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A48374] mt-1">Total Sales</p>
                    </div>
                  </div>

                  {/* Card 3: Active Auctions */}
                  <div className="bg-white rounded-[24px] p-6 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-[#B45309] flex-shrink-0">
                      <Gavel className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-light text-[#3A2D28] tracking-tight">{auctions.filter(a => a.status === 'active').length}</h4>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A48374] mt-1">Active Auctions</p>
                    </div>
                  </div>

                  {/* Card 4: Seller Rating */}
                  <div className="bg-white rounded-[24px] p-6 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#FFF5F5] flex items-center justify-center text-[#C084FC] flex-shrink-0">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-light text-[#3A2D28] tracking-tight">4.9</h4>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A48374] mt-1">Seller Rating</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Split Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Recent Activity, Performance Overview */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>Sales & Trading Growth</h3>
                        <span className="text-xs text-[#A48374] font-semibold tracking-wider uppercase bg-[#F7F3EF] px-3 py-1 rounded-full">Quarterly View</span>
                      </div>
                      
                      {/* Styled Simulated Graph Bar Chart */}
                      <div className="h-56 flex items-end justify-between gap-4 mt-6 border-b border-[#CBAD8D]/20 pb-4">
                        {[
                          { month: 'Jan', val: '40%', amount: '₹12.4L' },
                          { month: 'Feb', val: '55%', amount: '₹18.9L' },
                          { month: 'Mar', val: '72%', amount: '₹26.5L' },
                          { month: 'Apr', val: '60%', amount: '₹21.0L' },
                          { month: 'May', val: '88%', amount: '₹42.2L' },
                          { month: 'Jun', val: '95%', amount: '₹58.7L' }
                        ].map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-12 bg-[#3A2D28] text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                              {d.amount}
                            </div>
                            {/* Bar Graphic */}
                            <div 
                              className="w-full bg-[#EAE2D8] hover:bg-[#A48374] rounded-t-xl transition-all duration-500 ease-out"
                              style={{ height: d.val }}
                            />
                            {/* Month Label */}
                            <span className="text-[10px] uppercase font-bold text-[#A48374] mt-2 tracking-wider">{d.month}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-[#A48374] font-medium pt-4">
                        <p>Total Revenue Transacted: <strong className="text-[#3A2D28]">₹1.79 Cr</strong></p>
                        <p>Total Orders Closed: <strong className="text-[#3A2D28]">28</strong></p>
                      </div>
                    </div>

                    {/* Pending RFQ Alerts */}
                    <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>Latest Buyer RFQs</h3>
                        <button onClick={() => setActiveTab('rfqs')} className="text-xs font-bold text-[#A48374] hover:text-[#3A2D28] flex items-center gap-1">
                          View Console <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {rfqs.slice(0, 2).map(r => (
                          <div key={r.id} className="p-4 rounded-2xl bg-[#FBF9F6] border border-[#CBAD8D]/10 hover:border-[#A48374]/30 transition-all flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-xs text-[#A48374] uppercase tracking-wider">Requested by {r.buyer}</p>
                              <p className="text-xs text-[#3A2D28] font-medium mt-1">{r.specs}</p>
                              <div className="flex gap-4 items-center mt-2.5 text-[10px] text-[#CBAD8D] font-bold uppercase tracking-wider">
                                <span>Budget: {r.budget}</span>
                                <span>•</span>
                                <span>Posted: {r.date}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedRfq(r);
                                setShowRfqModal(true);
                              }}
                              className="px-4 py-2 bg-white border border-[#CBAD8D]/40 text-[10px] font-bold uppercase tracking-wider text-[#A48374] rounded-full hover:bg-[#3A2D28] hover:text-white transition-colors cursor-pointer shadow-sm"
                            >
                              Quote Price
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quick Actions & Profile Summary */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Quick Actions Panel matching image 2 */}
                    <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                      <h3 className="text-xl font-light text-[#3A2D28] mb-6" style={{ fontFamily: 'Georgia, serif' }}>Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => navigate('/seller/add-product')}
                          className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#CBAD8D]/20 hover:border-[#A48374] hover:bg-[#FBF9F6] transition-all group cursor-pointer"
                        >
                          <PlusCircle className="w-8 h-8 text-[#A48374] mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-[#3A2D28] uppercase tracking-wider text-center">Add Product</span>
                        </button>
                        <button 
                          onClick={() => setActiveTab('inventory')}
                          className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#CBAD8D]/20 hover:border-[#A48374] hover:bg-[#FBF9F6] transition-all group cursor-pointer"
                        >
                          <Eye className="w-8 h-8 text-[#A48374] mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-[#3A2D28] uppercase tracking-wider text-center">View Inventory</span>
                        </button>
                        <button 
                          onClick={() => setActiveTab('auctions')}
                          className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#CBAD8D]/20 hover:border-[#A48374] hover:bg-[#FBF9F6] transition-all group cursor-pointer"
                        >
                          <Gavel className="w-8 h-8 text-[#A48374] mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-[#3A2D28] uppercase tracking-wider text-center">Manage Auctions</span>
                        </button>
                        <button 
                          onClick={() => setActiveTab('messages')}
                          className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#CBAD8D]/20 hover:border-[#A48374] hover:bg-[#FBF9F6] transition-all group cursor-pointer"
                        >
                          <MessageSquare className="w-8 h-8 text-[#A48374] mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-[#3A2D28] uppercase tracking-wider text-center">Messages</span>
                        </button>
                      </div>
                    </div>

                    {/* Store / Seller Identity Info Card */}
                    <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #CBAD8D, #A48374)' }}>
                          <span className="text-xl font-light">{user.name[0]}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[#3A2D28]">{user.name}</h3>
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#3A2D28] text-[#F1EDE6]">
                            Verified Partner
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs pt-4 border-t border-[#CBAD8D]/10">
                        <div className="flex items-center gap-3 text-[#3A2D28]">
                          <Mail className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[#3A2D28]">
                          <Phone className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                          <span>+91 {user.phone}</span>
                        </div>
                        
                        <div className="h-px bg-[#CBAD8D]/10 my-3" />
                        
                        <div className="flex items-start gap-3">
                          <FileText className="w-4 h-4 mt-0.5 text-[#A48374]" />
                          <div>
                            <p className="font-bold text-[#A48374] uppercase tracking-widest text-[9px]">PAN Number</p>
                            <p className="mt-0.5 font-mono text-[#3A2D28]">{user.sellerProfile?.panNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileText className="w-4 h-4 mt-0.5 text-[#A48374]" />
                          <div>
                            <p className="font-bold text-[#A48374] uppercase tracking-widest text-[9px]">GST Number</p>
                            <p className="mt-0.5 font-mono text-[#3A2D28]">{user.sellerProfile?.gstNumber}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 2. INVENTORY TAB */}
            {currentTab === 'inventory' && (
              <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                
                {/* Subheader and List Diamond Trigger */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-2.5">
                    <Diamond className="w-5 h-5 text-[#A48374]" />
                    <h3 className="text-2xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Inventory Catalog</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/seller/add-product')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#3A2D28] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors cursor-pointer shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    List New Diamond
                  </button>
                </div>

                {/* Filter and Search Bar Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {/* Search Bar */}
                  <div className="md:col-span-2 relative flex items-center">
                    <Search className="absolute left-4 w-4 h-4 text-[#A48374]" />
                    <input 
                      type="text"
                      placeholder="Search title, details, SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full text-xs border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-white text-[#3A2D28] appearance-none cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      <option value="Diamond">Diamonds Only</option>
                      <option value="Jewelry">Jewelry Only</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full text-xs border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-white text-[#3A2D28] appearance-none cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="available">Available</option>
                      <option value="on_memo">On Memo (Auction/Approval)</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                </div>

                {/* Database Inventory Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#CBAD8D]/20 text-[#A48374] text-xs uppercase tracking-wider font-semibold">
                        <th className="pb-3 pl-2">Stone / Jewelry Info</th>
                        <th className="pb-3">Base Price</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Stock</th>
                        <th className="pb-3">Listing Status</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBAD8D]/10">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-xs text-[#A48374] italic">
                            Connecting to database...
                          </td>
                        </tr>
                      ) : filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-xs text-[#A48374] italic">
                            No listings match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((item) => {
                          const statusColors = {
                            available: { label: 'Available', bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
                            on_memo: { label: 'On Memo', bg: 'rgba(203,173,141,0.25)', color: '#A48374' },
                            sold: { label: 'Sold', bg: '#F1EDE6', color: '#6B5549' }
                          };
                          const badge = statusColors[item.status] || { label: item.status, bg: '#F1EDE6', color: '#6B5549' };
                          
                          return (
                            <tr key={item._id} className="text-[#3A2D28] hover:bg-[#FBF9F6] transition-colors">
                              {/* Details */}
                              <td className="py-4 pl-2 font-medium flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#F7F3EF] flex items-center justify-center text-[#A48374] flex-shrink-0">
                                  <Diamond className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs md:text-sm">{item.title}</p>
                                  <p className="text-[10px] text-[#A48374] mt-0.5 font-medium leading-relaxed">
                                    {item.category === 'Diamond' 
                                      ? `${item.carat}ct • ${item.shape} • ${item.color} ${item.clarity} • ${item.cut} Cut`
                                      : `${item.jewelryType} • ${item.metalType} • ${item.weightGrams}g`
                                    }
                                  </p>
                                </div>
                              </td>
                              {/* Price */}
                              <td className="py-4 font-semibold text-xs md:text-sm">
                                ₹{item.price.toLocaleString('en-IN')}
                              </td>
                              {/* Category */}
                              <td className="py-4 text-xs font-semibold uppercase tracking-wider text-[#A48374]">
                                {item.category}
                              </td>
                              {/* Stock */}
                              <td className="py-4 text-xs font-semibold text-[#3A2D28]">
                                {item.stock !== undefined ? item.stock : 1}
                              </td>
                              {/* Status Badge */}
                              <td className="py-4">
                                <span 
                                  className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider" 
                                  style={{ backgroundColor: badge.bg, color: badge.color }}
                                >
                                  {badge.label}
                                </span>
                              </td>
                              {/* Interactive Actions */}
                              <td className="py-4 text-right pr-2">
                                <div className="inline-flex items-center gap-2">
                                  {/* Quick status cycle toggle */}
                                  <select 
                                    value={item.status}
                                    onChange={(e) => handleUpdateStatus(item._id, e.target.value)}
                                    className="bg-white border border-[#CBAD8D]/30 text-[10px] font-bold uppercase px-2 py-1 rounded-md focus:outline-none cursor-pointer"
                                  >
                                    <option value="available">Make Available</option>
                                    <option value="on_memo">Send On Memo</option>
                                    <option value="sold">Mark Sold</option>
                                  </select>

                                  {/* Launch auction button */}
                                  {item.status === 'available' && (
                                    <button
                                      onClick={() => {
                                        setSelectedAuctionItem(item);
                                        setAuctionStartPrice(item.price);
                                        setShowAuctionModal(true);
                                      }}
                                      className="p-1.5 text-xs font-semibold text-[#A48374] hover:text-[#3A2D28] border border-[#CBAD8D]/30 hover:bg-[#F7F3EF] rounded-md transition-colors"
                                      title="Launch Auction"
                                    >
                                      <Gavel className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteProduct(item._id)}
                                    className="p-1.5 text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete Listing"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. AUCTIONS TAB */}
            {currentTab === 'auctions' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Active Auctions list */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-[#A48374]" />
                        <h3 className="text-xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>Live Auctions</h3>
                      </div>
                      <button 
                        onClick={() => navigate('/seller/create-auction')}
                        className="px-4 py-2 bg-[#3A2D28] text-white text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors cursor-pointer shadow-sm"
                      >
                        Start Auction
                      </button>
                    </div>

                    <div className="space-y-6">
                      {auctions.map(a => (
                        <div key={a.id} className="p-6 rounded-2xl border border-[#CBAD8D]/10 hover:border-[#A48374]/30 bg-[#FBF9F6]/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Active Listing</span>
                            </div>
                            <h4 className="text-lg font-bold text-[#3A2D28]">{a.title}</h4>
                            <p className="text-xs text-[#A48374] font-medium">
                              Category: {a.category} {a.carat && `• ${a.carat}ct • ${a.color} ${a.clarity}`}
                            </p>
                            <div className="flex items-center gap-4 text-xs font-semibold text-[#6B5549] pt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#A48374]" /> {a.timeLeft} remaining
                              </span>
                              <span>•</span>
                              <span>{a.bidsCount} bids submitted</span>
                            </div>
                          </div>

                          <div className="flex items-end gap-6 md:text-right flex-row md:flex-col justify-between md:justify-start border-t md:border-t-0 border-[#CBAD8D]/10 pt-4 md:pt-0">
                            <div>
                              <p className="text-[10px] font-bold text-[#A48374] uppercase tracking-wider">Current Bid</p>
                              <p className="text-2xl font-light text-[#3A2D28] mt-0.5">₹{a.currentBid.toLocaleString('en-IN')}</p>
                              <p className="text-[10px] text-[#CBAD8D] font-bold uppercase mt-0.5">Reserve: ₹{a.startPrice.toLocaleString('en-IN')}</p>
                            </div>
                            <button 
                              onClick={() => {
                                alert(`Opening bids log for ${a.title}. You have full control over bid validation.`);
                              }}
                              className="px-4 py-2 border border-[#A48374] hover:bg-[#A48374] hover:text-white text-[10px] font-bold uppercase tracking-wider text-[#A48374] rounded-full transition-colors cursor-pointer"
                            >
                              Verify Bids
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Live bid feeds */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                    <h3 className="text-lg font-light text-[#3A2D28] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Live Auction Feed</h3>
                    <p className="text-xs text-[#A48374] mb-6">Real-time bids being submitted by verified buyers on Zivora Live.</p>
                    
                    <div className="space-y-4">
                      {auctions.flatMap(a => a.bids.map(b => ({ ...b, itemTitle: a.title }))).slice(0, 5).map((bid, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-[#F7F3EF]/50 border border-[#CBAD8D]/5 text-xs flex justify-between items-start gap-4">
                          <div>
                            <p className="font-bold text-[#3A2D28]">{bid.bidder}</p>
                            <p className="text-[10px] text-[#A48374] truncate mt-0.5 max-w-[150px]">{bid.itemTitle}</p>
                            <span className="text-[9px] text-[#CBAD8D] block mt-1">{bid.time}</span>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-bold text-[9px] uppercase tracking-wider">
                              + Bid
                            </span>
                            <p className="font-semibold text-[#3A2D28] mt-1.5">₹{bid.bidAmount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 4. RFQ TAB */}
            {currentTab === 'rfqs' && (
              <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <FileText className="w-5 h-5 text-[#A48374]" />
                  <h3 className="text-2xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Buyer Request Console (RFQs)</h3>
                </div>
                <p className="text-xs text-[#A48374] mb-8">Buyers submit high-precision diamond requirements. Submit custom offers from your active inventory to secure sales.</p>

                <div className="space-y-6">
                  {rfqs.map(rfq => (
                    <div key={rfq.id} className="p-6 rounded-2xl border border-[#CBAD8D]/10 hover:border-[#A48374]/30 bg-[#FBF9F6]/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            rfq.status === 'awarded' ? (rfq.isWinner ? 'bg-green-500 animate-pulse' : 'bg-red-400') :
                            rfq.status === 'closed' ? 'bg-gray-400' :
                            rfq.status === 'submitted' ? 'bg-[#A48374]' : 'bg-[#3A2D28]'
                          }`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A48374]">
                            {
                              rfq.status === 'awarded' ? (rfq.isWinner ? '🏆 Won & Awarded' : 'Awarded to Other') :
                              rfq.status === 'closed' ? 'Expired / Closed' :
                              rfq.status === 'submitted' ? 'Offer Submitted' : 'Pending Bid Request'
                            }
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[#3A2D28]">Required Specs: {rfq.specs}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#6B5549] pt-1">
                          <span>Buyer: <strong className="text-[#3A2D28] font-medium">{rfq.buyer}</strong></span>
                          <span>•</span>
                          <span>Target Budget: <strong className="text-[#3A2D28] font-medium">{rfq.budget}</strong></span>
                          <span>•</span>
                          <span>Received: {rfq.date}</span>
                        </div>
                        {rfq.status === 'submitted' && (
                          <div className="mt-3 p-3 bg-white border border-[#CBAD8D]/20 rounded-xl text-xs">
                            <span className="font-bold text-[#A48374] uppercase tracking-wider text-[9px]">My Submitted Offer</span>
                            <p className="font-semibold text-[#3A2D28] mt-0.5">Quote Price: {rfq.myQuote}</p>
                            <p className="text-[10px] text-[#A48374] mt-1 font-medium">Remarks: "{rfq.myMsg}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {rfq.dbStatus === 'awarded' || rfq.dbStatus === 'closed' ? (
                          <span className="text-xs font-semibold text-[#A48374] italic">RFQ Closed</span>
                        ) : rfq.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedRfq(rfq);
                              setShowRfqModal(true);
                            }}
                            className="px-6 py-3 bg-[#3A2D28] hover:bg-[#A48374] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-sm"
                          >
                            Submit Offer
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRfqQuoteRetract(rfq.id)}
                            className="px-5 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
                          >
                            Retract Quote
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. MESSAGES TAB */}
            {currentTab === 'messages' && (
              <div className="bg-white rounded-[28px] border border-[#CBAD8D]/15 shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px]">
                
                {/* Conversations List */}
                <div className="w-full md:w-80 border-r border-[#CBAD8D]/10 flex flex-col">
                  <div className="p-4 border-b border-[#CBAD8D]/10">
                    <div className="relative">
                      <Search className="absolute left-3.5 w-3.5 h-3.5 text-[#A48374]" />
                      <input 
                        type="text" 
                        placeholder="Search chats..." 
                        className="w-full pl-9 pr-4 py-2 border border-[#CBAD8D]/15 rounded-full text-xs focus:outline-none bg-[#F7F3EF]/30"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#CBAD8D]/5">
                    {conversations.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setActiveConversationId(c.id)}
                        className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${activeConversationId === c.id ? 'bg-[#F7F3EF]/50' : 'hover:bg-[#FBF9F6]'}`}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold uppercase flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3A2D28, #A48374)' }}>
                          {c.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="font-bold text-xs text-[#3A2D28] truncate">{c.name}</h4>
                            <span className="text-[9px] text-[#CBAD8D] font-semibold">{c.time}</span>
                          </div>
                          <p className={`text-[10px] truncate ${c.unread && c.id !== activeConversationId ? 'font-bold text-[#3A2D28]' : 'text-[#A48374]'}`}>
                            {c.lastMsg}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Chat Window */}
                <div className="flex-1 flex flex-col bg-[#FBF9F6]/50">
                  {activeConv ? (
                    <>
                      {/* Active Contact Header */}
                      <div className="p-4 border-b border-[#CBAD8D]/10 bg-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold uppercase" style={{ background: 'linear-gradient(135deg, #3A2D28, #A48374)' }}>
                            {activeConv.name[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-[#3A2D28]">{activeConv.name}</h4>
                            <span className="text-[9px] text-green-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#A48374] font-medium">B2B Chat Link</span>
                      </div>

                      {/* Chat Messages Log */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activeConv.messages.map((m, idx) => (
                          <div 
                            key={idx} 
                            className={`flex ${m.sender === 'seller' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${m.sender === 'seller' ? 'bg-[#3A2D28] text-white rounded-tr-none' : 'bg-white text-[#3A2D28] border border-[#CBAD8D]/10 rounded-tl-none'}`}
                            >
                              <p>{m.text}</p>
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-[#CBAD8D]/10 p-3 rounded-2xl rounded-tl-none text-xs text-[#A48374] italic">
                              {activeConv.name} is typing...
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message Input Form */}
                      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#CBAD8D]/10 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your message details here..."
                          className="flex-1 px-4 py-3 border border-[#CBAD8D]/15 rounded-full text-xs focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30"
                        />
                        <button
                          type="submit"
                          className="p-3 bg-[#3A2D28] hover:bg-[#A48374] text-white rounded-full transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#A48374] italic">
                      <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-xs">Select a buyer thread to start negotiating deals.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 6. ANALYTICS TAB */}
            {currentTab === 'analytics' && (
              <div className="space-y-6">
                
                {/* Tier and Revenue metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-[24px] p-6 border border-[#CBAD8D]/15 shadow-sm md:col-span-2">
                    <h3 className="text-lg font-light text-[#3A2D28] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Quarterly Performance Summary</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-[#A48374] mb-1">
                          <span>Total Sales Margin</span>
                          <span>92% to Target</span>
                        </div>
                        <div className="w-full bg-[#F7F3EF] h-2.5 rounded-full overflow-hidden">
                          <div className="bg-[#A48374] h-full rounded-full" style={{ width: '92%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-[#A48374] mb-1">
                          <span>Inquiries Conversion Rate</span>
                          <span>34.2%</span>
                        </div>
                        <div className="w-full bg-[#F7F3EF] h-2.5 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: '34%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] p-6 border border-[#CBAD8D]/15 shadow-sm">
                    <h3 className="text-lg font-light text-[#3A2D28] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Seller Standing</h3>
                    <div className="flex items-center gap-2.5 mt-4">
                      <span className="w-8 h-8 rounded-full bg-[#FEF3C7] text-amber-600 flex items-center justify-center font-bold text-xs">A</span>
                      <div>
                        <h4 className="font-bold text-xs text-[#3A2D28]">Platinum Tier Status</h4>
                        <p className="text-[10px] text-[#A48374] mt-0.5">Top-rated merchant with excellent dispatch rating</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales distribution list */}
                <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                  <h3 className="text-xl font-light text-[#3A2D28] mb-6" style={{ fontFamily: 'Georgia, serif' }}>B2B Top Performing Categories</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#CBAD8D]/10 text-center">
                      <p className="text-[10px] font-bold text-[#A48374] uppercase tracking-wider">Round Brilliant Diamonds</p>
                      <h4 className="text-3xl font-light text-[#3A2D28] mt-2">68%</h4>
                      <p className="text-xs text-green-600 mt-1 font-semibold">▲ +12% this month</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#CBAD8D]/10 text-center">
                      <p className="text-[10px] font-bold text-[#A48374] uppercase tracking-wider">Fancy Shapes (Cushion, Oval)</p>
                      <h4 className="text-3xl font-light text-[#3A2D28] mt-2">24%</h4>
                      <p className="text-xs text-green-600 mt-1 font-semibold">▲ +4% this month</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#CBAD8D]/10 text-center">
                      <p className="text-[10px] font-bold text-[#A48374] uppercase tracking-wider">Custom Jewelry Solitaires</p>
                      <h4 className="text-3xl font-light text-[#3A2D28] mt-2">8%</h4>
                      <p className="text-xs text-[#A48374] mt-1 font-semibold">Stable</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ─── MODAL 1: START AUCTION MODAL ──────────────────────────────── */}
        {showAuctionModal && selectedAuctionItem && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#CBAD8D]/25 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-light text-[#3A2D28] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Host Diamond Auction</h3>
              <p className="text-xs text-[#A48374] mb-6">Launch an active live auction on Zivora Bids. This moves the product to "On Memo" status.</p>
              
              <div className="mb-5 p-4 bg-[#FBF9F6] border border-[#CBAD8D]/10 rounded-2xl">
                <span className="font-bold text-[#A48374] uppercase text-[9px] tracking-wider">Selected Product</span>
                <h4 className="font-bold text-xs text-[#3A2D28] mt-1">{selectedAuctionItem.title}</h4>
                <p className="text-[10px] text-[#A48374] mt-0.5">Original Listing Price: ₹{selectedAuctionItem.price.toLocaleString('en-IN')}</p>
              </div>

              <form onSubmit={handleCreateAuctionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#A48374] uppercase tracking-wider mb-1.5">Starting Price Bid (₹)</label>
                  <input
                    type="number"
                    value={auctionStartPrice}
                    onChange={(e) => setAuctionStartPrice(e.target.value)}
                    placeholder="Enter reserve bid amount"
                    className="w-full px-4 py-2.5 text-xs border border-[#CBAD8D]/30 rounded-xl focus:outline-none focus:border-[#A48374]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A48374] uppercase tracking-wider mb-1.5">Auction Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['24h', '48h', '7d'].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setAuctionDuration(dur)}
                        className={`py-2 text-xs font-semibold rounded-lg border uppercase tracking-wider ${auctionDuration === dur ? 'bg-[#3A2D28] text-white border-[#3A2D28]' : 'bg-white text-[#A48374] border-[#CBAD8D]/30'}`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuctionModal(false);
                      setSelectedAuctionItem(null);
                    }}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-[#A48374] border border-[#CBAD8D]/30 rounded-full hover:bg-[#F7F3EF] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#3A2D28] hover:bg-[#A48374] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all shadow-sm"
                  >
                    Launch Live
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL 2: SUBMIT RFQ QUOTE MODAL ────────────────────────────── */}
        {showRfqModal && selectedRfq && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#CBAD8D]/25 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-light text-[#3A2D28] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Submit Custom Diamond Offer</h3>
              <p className="text-xs text-[#A48374] mb-6">Quote your price for the diamond requirements requested by the buyer.</p>
              
              <div className="mb-5 p-4 bg-[#FBF9F6] border border-[#CBAD8D]/10 rounded-2xl">
                <span className="font-bold text-[#A48374] uppercase text-[9px] tracking-wider">Buyer Specification</span>
                <h4 className="font-bold text-xs text-[#3A2D28] mt-1">{selectedRfq.specs}</h4>
                <div className="flex justify-between items-center mt-2.5 text-[10px] text-[#A48374] font-semibold">
                  <span>Buyer: {selectedRfq.buyer}</span>
                  <span>Target Budget: {selectedRfq.budget}</span>
                </div>
              </div>

              <form onSubmit={handleRfqQuoteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#A48374] uppercase tracking-wider mb-1.5">Select Product from Inventory *</label>
                  <select
                    value={rfqProductId}
                    onChange={(e) => setRfqProductId(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-[#CBAD8D]/30 rounded-xl focus:outline-none focus:border-[#A48374] bg-white text-[#3A2D28]"
                    required
                  >
                    <option value="">-- Choose a Product --</option>
                    {inventory.filter(item => item.status === 'available').map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.title} ({item.carat ? `${item.carat}ct • ` : ''}₹{item.price.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A48374] uppercase tracking-wider mb-1.5">My Quote Price (₹)</label>
                  <input
                    type="number"
                    value={rfqPriceQuote}
                    onChange={(e) => setRfqPriceQuote(e.target.value)}
                    placeholder="Enter bid quote amount"
                    className="w-full px-4 py-2.5 text-xs border border-[#CBAD8D]/30 rounded-xl focus:outline-none focus:border-[#A48374]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A48374] uppercase tracking-wider mb-1.5">Remarks / Guarantee Message</label>
                  <textarea
                    value={rfqMessage}
                    onChange={(e) => setRfqMessage(e.target.value)}
                    placeholder="E.g. GIA certified, conflict-free, next day insured dispatch."
                    rows="3"
                    className="w-full px-4 py-2.5 text-xs border border-[#CBAD8D]/30 rounded-xl focus:outline-none focus:border-[#A48374] resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRfqModal(false);
                      setSelectedRfq(null);
                      setRfqPriceQuote('');
                      setRfqMessage('');
                      setRfqProductId('');
                    }}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-[#A48374] border border-[#CBAD8D]/30 rounded-full hover:bg-[#F7F3EF] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#3A2D28] hover:bg-[#A48374] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all shadow-sm"
                  >
                    Send Quote
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
