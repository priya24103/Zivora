import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  X,
  Users,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Handshake,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import OfferInbox from '../components/OfferInbox';
import { io } from 'socket.io-client';
import EditListingDrawer from '../components/EditListingDrawer';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  
  // Retrieve user details from localStorage with safe parsing
  let user = {
    _id: 'mock_seller_id_12345',
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

  try {
    const stored = localStorage.getItem('zivora_user');
    if (stored && stored !== 'undefined') {
      const parsed = JSON.parse(stored);
      if (parsed) {
        user = { ...user, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
  }

  const token = localStorage.getItem('zivora_token');

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
  
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [selectedMemoProduct, setSelectedMemoProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [rfqPriceQuote, setRfqPriceQuote] = useState('');
  const [rfqMessage, setRfqMessage] = useState('');
  const [rfqProductId, setRfqProductId] = useState('');  const [activeAuctionTab, setActiveAuctionTab] = useState('Live Now');
  const [selectedManageAuction, setSelectedManageAuction] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const socketRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket.io connection for seller to watch bids in real-time
  useEffect(() => {
    if (!selectedManageAuction) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('zivora_token');
    
    // Connect to Socket.io
    socketRef.current = io('http://localhost:2409', {
      transports: ['websocket'],
      auth: { token }
    });

    const socket = socketRef.current;

    // Join the auction room
    socket.emit('join_auction', { 
      auctionId: selectedManageAuction._id, 
      userId: user._id 
    });

    socket.on('error', (err) => {
      console.error('Socket error in Seller Dashboard:', err);
    });

    socket.on('joined_room', (data) => {
      console.log('Seller successfully joined socket room:', data);
    });

    // Listen for new bids in real-time
    socket.on('new_bid', (data) => {
      console.log('Seller received new bid socket event:', data);
      if (data.auctionId.toString() === selectedManageAuction._id.toString()) {
        setSelectedManageAuction(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentHighestBid: data.amount,
            bidsCount: data.bidsCount,
            bids: data.bids || []
          };
        });
        
        // Also update the auction in the main list so dashboard totals reflect it
        setAuctions(prev => prev.map(auc => {
          if (auc._id.toString() === selectedManageAuction._id.toString()) {
            return {
              ...auc,
              currentHighestBid: data.amount,
              bidsCount: data.bidsCount,
              bids: data.bids || []
            };
          }
          return auc;
        }));
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [selectedManageAuction, token]);

  const getAuctionCategory = (auction) => {
    const now = currentTime;
    const start = new Date(auction.startTime);
    const end = new Date(auction.endTime);
    const status = auction.status;

    if (status === 'cancelled' || status === 'completed') {
      return 'Closed';
    }
    
    // If start time has not passed yet, it is Upcoming
    if (status === 'pending' && start > now) {
      return 'Upcoming';
    }

    if (status === 'pending' && start <= now && end >= now) {
      return 'Live Now';
    }

    if (status === 'active' && start <= now && end >= now) {
      return 'Live Now';
    }

    if (status === 'active' && end < now) {
      return 'Closed';
    }

    if (status === 'pending' && end < now) {
      return 'Closed';
    }

    return 'Closed';
  };

  const getTimerBadge = (auction) => {
    const now = currentTime;
    const start = new Date(auction.startTime);
    const end = new Date(auction.endTime);
    const status = auction.status;

    if (status === 'cancelled') {
      return { text: 'Cancelled', style: 'bg-red-50 text-red-700 border border-red-200' };
    }
    if (status === 'completed') {
      return { text: 'Closed', style: 'bg-gray-100 text-gray-700 border border-gray-200' };
    }

    if (start > now) {
      const diffMs = start - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return { text: `Starts in ${diffDays} Day${diffDays > 1 ? 's' : ''}`, style: 'bg-[#F5F1EC] text-[#A48374] border border-[#CBAD8D]/30' };
      }
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
      return { 
        text: `Starts in ${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`, 
        style: 'bg-[#FAF8F6] text-[#A48374] border border-[#CBAD8D]/20' 
      };
    }

    if (start <= now && end >= now) {
      const diffMs = end - now;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
      return { 
        text: `Ends in ${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`, 
        style: 'bg-green-50 text-green-700 border border-green-200 font-mono animate-pulse' 
      };
    }

    return { text: 'Closed', style: 'bg-gray-100 text-gray-700 border border-gray-200' };
  };

  const getMockBuyersForAuction = (auction) => {
    if (auction.registeredBuyers && auction.registeredBuyers.length > 0) {
      return auction.registeredBuyers.map((buyer, idx) => ({
        name: buyer.name || `Buyer #${idx + 1}`,
        email: buyer.email || `buyer${idx + 1}@zivora.com`,
        id: buyer._id ? `B-${buyer._id.toString().slice(-4).toUpperCase()}` : `B-MOCK${idx}`
      }));
    }
    return [
      { name: 'Kunal Singhania', email: 'kunal@singhaniadiamonds.com', id: 'B-8821' },
      { name: 'Gaurang Javerian', email: 'g.javerian@venusjewels.in', id: 'B-4091' },
      { name: 'Aishwarya Roy', email: 'aishwarya@royalluxury.co', id: 'B-9831' },
      { name: 'Amitabh Mehta', email: 'amehta@mehtabrothers.com', id: 'B-7712' },
      { name: 'Priyanka Chopra', email: 'priyanka@pcjewellers.com', id: 'B-5290' }
    ];
  };

  const getMockBidsForAuction = (auction) => {
    if (auction.bids && auction.bids.length > 0) {
      return [...auction.bids].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return [];
  };

  const handleCancelAuction = async (auctionId) => {
    if (!window.confirm('Are you sure you want to cancel this auction? This will restore the product back to your active catalog.')) {
      return;
    }
    try {
      setIsCancelling(true);
      const token = localStorage.getItem('zivora_token');
      const response = await axios.patch(`http://localhost:2409/api/auctions/${auctionId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        alert('Auction cancelled successfully.');
        setSelectedManageAuction(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error cancelling auction:', err);
      alert(err.response?.data?.message || 'Could not cancel the auction. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };
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
        setAuctions(aucRes.data.data.auctions || []);
      }

      // 3. Fetch RFQs
      const rfqRes = await axios.get('http://localhost:2409/api/rfq/seller', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rfqRes.data.status === 'success') {
        const mappedRfqs = rfqRes.data.data.rfqs.map(r => {
          const myQuoteEntry = r.quotes.find(q => q.sellerId && user?._id && q.sellerId.toString() === user._id.toString());
          let statusVal = r.status;
          if (statusVal === 'pending' || statusVal === 'submitted' || statusVal === 'open') {
            statusVal = myQuoteEntry ? 'submitted' : 'pending';
          }
          const isWinner = r.status === 'awarded' && user?._id && r.winnerSeller?.toString() === user._id.toString();
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

  const handleApproveMemo = async (buyerId) => {
    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.put(`http://localhost:2409/api/seller/products/${selectedMemoProduct._id}/approve-memo`, {
        buyerId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        triggerToast('Memo hold approved successfully.');
        setShowMemoModal(false);
        setSelectedMemoProduct(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error approving memo request:', err);
      alert(err.response?.data?.message || 'Could not approve memo request.');
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
  const isKycVerified = kycStatus === 'approved';
  const kycRemarks = user.sellerProfile?.kycRemarks || 'Your business documents are currently being processed.';

  if (user.isVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F1EDE6' }}>
        <div className="w-full max-w-md bg-white border border-[#A48374]/20 rounded-3xl p-8 shadow-xl text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-[#F5F1EC] flex items-center justify-center mx-auto text-[#A48374] mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl text-[#3A2D28] mb-2" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Verify Your Email</h2>
          <p className="text-xs text-[#A48374] leading-relaxed mb-6">
            We have sent a verification code to <strong>{user.email}</strong>. Please complete the verification process to activate your account.
          </p>
          <button
            onClick={() => navigate('/verify-email')}
            className="w-full py-3 rounded-full text-white text-xs uppercase tracking-widest font-bold hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
            style={{ backgroundColor: '#A48374' }}
          >
            Enter Verification Code
          </button>
          <button
            onClick={handleLogout}
            className="mt-4 text-xs font-semibold text-[#A48374] hover:text-[#3A2D28] transition-colors uppercase tracking-wider block mx-auto cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

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
        {kycStatus === 'rejected' && (
          <div className="mb-8 p-5 rounded-2xl border border-red-200 bg-red-50/40 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-red-100/50 flex-shrink-0 text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-red-800 uppercase tracking-wider">eKYC Verification Rejected</h4>
              <p className="text-[#3A2D28] mt-1 leading-relaxed">
                Your submitted business registration proofs were rejected by our compliance administrators.
              </p>
              {kycRemarks && (
                <p className="mt-2 text-red-700 font-medium italic">
                  Reason: {kycRemarks}
                </p>
              )}
              <p className="mt-2 text-xs text-[#A48374]">
                Please contact Zivora support to update your registration credentials.
              </p>
            </div>
          </div>
        )}

        {kycStatus === 'pending' && (
          <div className="mb-8 p-5 rounded-2xl border border-[#A48374]/30 bg-[#FBF9F6] flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#F5F1EC] flex-shrink-0 text-[#A48374] animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-[#3A2D28] uppercase tracking-wider">eKYC Under Review</h4>
              <p className="text-[#A48374] mt-1 leading-relaxed">
                Your business credentials (GST: {user.sellerProfile?.gstNumber}, PAN: {user.sellerProfile?.panNumber}) and uploaded proofs are currently being processed. Product listing and auction actions will be unlocked as soon as compliance approval is granted.
              </p>
            </div>
          </div>
        )}

        {/* ─── TAB NAVIGATION SWITCH ──────────────────────────────────────── */}
        {/* We keep this hidden visually as header is doing the tab work, but add responsive controls for dashboard page */}
        <div className="flex md:hidden overflow-x-auto gap-2 pb-4 mb-6 border-b border-[#CBAD8D]/20">
          {['overview', 'inventory', 'auctions', 'rfqs', 'negotiations', 'messages', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${currentTab === tab ? 'bg-[#3A2D28] text-white' : 'bg-white text-[#A48374] border border-[#CBAD8D]/25'}`}
            >
              {tab === 'negotiations' ? 'Direct Offers' : tab === 'rfqs' ? 'Buyer RFQs' : tab}
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
                          onClick={() => {
                            if (!isKycVerified) {
                              alert(`Access Denied. Your eKYC review status is "${kycStatus.toUpperCase()}". Listing permissions are disabled.`);
                            } else {
                              navigate('/seller/add-product');
                            }
                          }}
                          disabled={!isKycVerified}
                          className={`flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#CBAD8D]/20 transition-all group cursor-pointer ${!isKycVerified ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#A48374] hover:bg-[#FBF9F6]'}`}
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
                    onClick={() => {
                      if (!isKycVerified) {
                        alert(`Access Denied. Your eKYC review status is "${kycStatus.toUpperCase()}". Listing permissions are disabled.`);
                      } else {
                        navigate('/seller/add-product');
                      }
                    }}
                    disabled={!isKycVerified}
                    className={`inline-flex items-center gap-2 px-6 py-3 text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors shadow-md ${!isKycVerified ? 'bg-gray-400 opacity-60 cursor-not-allowed' : 'bg-[#3A2D28] hover:bg-[#A48374] cursor-pointer'}`}
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
                            memo: { label: 'On Memo', bg: 'rgba(203,173,141,0.25)', color: '#A48374' },
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
                                  {item.memoRequestedBy && item.memoRequestedBy.length > 0 && (
                                    <div className="mt-1.5 flex items-center">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#A48374]/15 text-[#3A2D28] text-[9px] font-bold uppercase tracking-widest rounded-full border border-[#A48374]/20 shadow-xs animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#A48374] inline-block" />
                                        {item.memoRequestedBy.length} {item.memoRequestedBy.length === 1 ? 'Memo Request' : 'Memo Requests'}
                                      </span>
                                    </div>
                                  )}
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
                                  {item.memoRequestedBy && item.memoRequestedBy.length > 0 && (
                                    <button
                                      onClick={() => {
                                        setSelectedMemoProduct(item);
                                        setShowMemoModal(true);
                                      }}
                                      className="px-3 py-1 bg-[#A48374] hover:bg-[#3A2D28] text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
                                      title="Review Memo Requests"
                                    >
                                      Review Memos
                                    </button>
                                  )}

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

                                  {/* Edit Listing */}
                                  <button
                                    onClick={() => {
                                      if (item.listingType === 'auction_only') {
                                        const auc = auctions.find(a => a.productId?._id === item._id || a.productId === item._id);
                                        if (auc) {
                                          setSelectedListing({ ...auc, isAuction: true });
                                        } else {
                                          setSelectedListing({ ...item, isProduct: true });
                                        }
                                      } else {
                                        setSelectedListing({ ...item, isProduct: true });
                                      }
                                      setShowEditDrawer(true);
                                    }}
                                    className="p-1.5 text-xs font-semibold text-[#A48374] hover:text-[#3A2D28] border border-[#CBAD8D]/30 hover:bg-[#F7F3EF] rounded-md transition-colors"
                                    title="Edit Listing"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

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
            {currentTab === 'auctions' && (() => {
              const liveAuctions = auctions.filter(a => getAuctionCategory(a) === 'Live Now');
              const upcomingAuctions = auctions.filter(a => getAuctionCategory(a) === 'Upcoming');
              const closedAuctions = auctions.filter(a => getAuctionCategory(a) === 'Closed');

              const filteredAuctions = activeAuctionTab === 'Live Now'
                ? liveAuctions
                : activeAuctionTab === 'Upcoming'
                  ? upcomingAuctions
                  : closedAuctions;

              return (
                <div className="space-y-8">
                {/* Dashboard Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#CBAD8D]/20">
                  <div>
                    <span className="text-xs uppercase tracking-[0.3em]" style={{ color: '#A48374' }}>Live Bidding Hub</span>
                    <h2 className="text-3xl mt-1 font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>Auction Management</h2>
                  </div>
                  <button 
                    onClick={() => navigate('/seller/create-auction')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#3A2D28] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-all cursor-pointer shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Host New Auction
                  </button>
                </div>

                {/* Sleek Tabs Navigation */}
                <div className="flex border-b border-[#CBAD8D]/20">
                  {['Live Now', 'Upcoming', 'Closed'].map((tab) => {
                    const count = tab === 'Live Now' 
                      ? liveAuctions.length 
                      : tab === 'Upcoming' 
                        ? upcomingAuctions.length 
                        : closedAuctions.length;
                    const isActive = activeAuctionTab === tab;
                    
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveAuctionTab(tab)}
                        className={`py-4 px-6 text-xs font-bold uppercase tracking-widest relative transition-all cursor-pointer ${
                          isActive ? 'text-[#3A2D28]' : 'text-[#A48374] hover:text-[#3A2D28]'
                        }`}
                      >
                        {tab} <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] bg-[#FAF8F6] border border-[#CBAD8D]/15">{count}</span>
                        {isActive && (
                          <motion.div 
                            layoutId="activeAuctionIndicator" 
                            className="absolute bottom-0 left-0 right-0 h-1 bg-[#A48374]" 
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Auction Cards Grid */}
                {filteredAuctions.length === 0 ? (
                  <div className="bg-[#FAF8F6] rounded-3xl border border-[#CBAD8D]/15 p-16 text-center max-w-2xl mx-auto space-y-6 shadow-xs">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto text-[#A48374] shadow-xs">
                      <Gavel className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#3A2D28]">No auctions listed under {activeAuctionTab}</h4>
                      <p className="text-xs text-[#A48374] mt-2 leading-relaxed">
                        Host an auction drop to list a diamond or jewelry piece for verified buyer bidding.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/seller/create-auction')}
                      className="px-6 py-3 border border-[#A48374] text-[#A48374] hover:bg-[#3A2D28] hover:text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
                    >
                      + Host Auction Drop
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAuctions.map((auc) => {
                      const timer = getTimerBadge(auc);
                      const buyerCount = getMockBuyersForAuction(auc).length;
                      const hasBids = auc.bids && auc.bids.length > 0;
                      const image = auc.productId?.images?.[0] || 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800';
                      
                      return (
                        <div 
                          key={auc._id} 
                          className="bg-white rounded-2xl border border-[#CBAD8D]/15 hover:border-[#A48374]/55 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group"
                        >
                          {/* Image Box */}
                          <div className="relative aspect-[4/3] w-full bg-[#F5F1EC] overflow-hidden">
                            <img 
                              src={image} 
                              alt={auc.productId?.title || 'Jewelry stone'} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Live Badge */}
                            <span 
                              className={`absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${timer.style}`}
                            >
                              {timer.text}
                            </span>
                            {/* Registered badge */}
                            <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[9px] font-semibold tracking-wider flex items-center gap-1">
                              <Users className="w-3 h-3 text-[#CBAD8D]" /> {buyerCount} Registered
                            </span>
                          </div>

                          {/* Info Box */}
                          <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                            <div className="space-y-2.5">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#A48374]">
                                  {auc.productId?.category || 'Luxury Stone'}
                                </span>
                                {auc.productId?.certificateLab && auc.productId.certificateLab !== 'None' && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-[#FAF8F6] border border-[#CBAD8D]/20 text-[#3A2D28] rounded">
                                    {auc.productId.certificateLab}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-sm text-[#3A2D28] line-clamp-1 group-hover:text-[#A48374] transition-colors">
                                {auc.productId?.title || 'Untitled Listing'}
                              </h3>
                              <p className="text-[11px] text-[#A48374] leading-relaxed line-clamp-2">
                                {auc.productId?.category === 'Diamond' 
                                  ? `${auc.productId?.carat} Carat • ${auc.productId?.shape} Shape • ${auc.productId?.color} Color • ${auc.productId?.clarity} Clarity • ${auc.productId?.cut} Cut`
                                  : `${auc.productId?.jewelryType} • ${auc.productId?.metalType} • ${auc.productId?.weightGrams}g`
                                }
                              </p>
                            </div>

                            {/* Metrices */}
                            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-[#CBAD8D]/10 text-xs bg-[#FAF8F6]/30 px-2 rounded-xl">
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-[#A48374] font-semibold">Reserve</p>
                                <p className="font-semibold text-xs text-[#3A2D28] mt-0.5">₹{auc.startPrice.toLocaleString('en-IN')}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-[#A48374] font-semibold">High Bid</p>
                                <p className="font-bold text-xs text-[#3A2D28] mt-0.5">₹{auc.currentHighestBid.toLocaleString('en-IN')}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-[#A48374] font-semibold">Min Increment</p>
                                <p className="font-semibold text-xs text-[#A48374] mt-0.5">₹{auc.minIncrement.toLocaleString('en-IN')}</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedManageAuction(auc)}
                                className="flex-1 py-3 bg-[#FAF8F6] hover:bg-[#A48374] hover:text-white border border-[#CBAD8D]/30 hover:border-transparent text-[10px] font-bold uppercase tracking-widest text-[#A48374] rounded-full transition-all cursor-pointer shadow-xs"
                              >
                                Manage Auction
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedListing({ ...auc, isAuction: true });
                                  setShowEditDrawer(true);
                                }}
                                className="px-3.5 py-3 bg-[#FAF8F6] hover:bg-[#A48374] hover:text-white border border-[#CBAD8D]/30 hover:border-transparent text-[#A48374] rounded-full transition-all cursor-pointer shadow-xs flex items-center justify-center"
                                title="Edit Auction Settings"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manage Auction Immersive Full-Screen Overlay View */}
                <AnimatePresence>
                  {selectedManageAuction && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 w-screen h-screen bg-[#F1EDE6] overflow-y-auto flex flex-col font-sans"
                    >
                      {/* Header Bar */}
                      <div className="sticky top-0 bg-white border-b border-[#CBAD8D]/25 px-8 py-5 flex items-center justify-between z-10 shadow-xs">
                        <button 
                          onClick={() => setSelectedManageAuction(null)}
                          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer group"
                        >
                          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                          ← Back to Dashboard
                        </button>
                        
                        <h3 className="text-lg font-light text-[#3A2D28] tracking-widest text-center uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                          {selectedManageAuction.productId?.title || 'Luxury Auction Console'}
                        </h3>
                        
                        <div className="w-36 text-right">
                          <span 
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              getTimerBadge(selectedManageAuction).style
                            }`}
                          >
                            {getAuctionCategory(selectedManageAuction)}
                          </span>
                        </div>
                      </div>

                      {/* Main Immersive 3-Column Grid */}
                      <div className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* COLUMN 1: Product & Financials */}
                        <div className="space-y-6 flex flex-col">
                          {/* Image Showcase */}
                          <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-[#CBAD8D]/25 shadow-sm relative group">
                            <img 
                              src={selectedManageAuction.productId?.images?.[0] || 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800'} 
                              alt="Luxury product stone" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {selectedManageAuction.productId?.certificateLab && selectedManageAuction.productId.certificateLab !== 'None' && (
                              <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-[#3A2D28] font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-[#CBAD8D]/20 shadow-xs">
                                {selectedManageAuction.productId.certificateLab} Certified
                              </span>
                            )}
                          </div>

                          {/* Technical Specifications */}
                          <div className="bg-white rounded-2xl p-6 border border-[#CBAD8D]/20 shadow-sm space-y-4 flex-1">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-[#A48374] border-b border-[#CBAD8D]/15 pb-2">Product Specifications</h4>
                            
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs leading-relaxed">
                              <div>
                                <p className="text-[10px] text-[#A48374] uppercase font-semibold">Category</p>
                                <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.category}</p>
                              </div>
                              {selectedManageAuction.productId?.category === 'Diamond' ? (
                                <>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Carat weight</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.carat} ct</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Shape</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.shape}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Color Grade</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.color}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Clarity</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.clarity}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Cut Grade</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.cut}</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Jewelry Type</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.jewelryType}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Metal Type</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.metalType}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Weight</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.weightGrams} g</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#A48374] uppercase font-semibold">Gender</p>
                                    <p className="font-bold text-[#3A2D28] mt-0.5">{selectedManageAuction.productId?.gender}</p>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="pt-4 border-t border-[#CBAD8D]/10 text-xs">
                              <p className="text-[10px] text-[#A48374] uppercase font-semibold">Description</p>
                              <p className="text-[#3A2D28] mt-1 leading-relaxed line-clamp-3">{selectedManageAuction.productId?.description}</p>
                            </div>
                          </div>

                          {/* Countdown Timer & Reservation Pricing */}
                          <div className="bg-white rounded-2xl p-6 border border-[#CBAD8D]/25 shadow-sm space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-[#A48374] border-b border-[#CBAD8D]/15 pb-2">Timeline & Valuation</h4>
                            
                            <div className="flex justify-between items-center py-2 border-b border-[#CBAD8D]/5">
                              <span className="text-xs font-semibold text-[#A48374]">Remaining Time</span>
                              <span className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                getTimerBadge(selectedManageAuction).style
                              }`}>
                                {getTimerBadge(selectedManageAuction).text}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                              <div>
                                <p className="text-[10px] text-[#A48374] uppercase font-semibold">Starting Reserve</p>
                                <p className="font-bold text-base text-[#3A2D28] mt-0.5">₹{selectedManageAuction.startPrice.toLocaleString('en-IN')}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[#A48374] uppercase font-semibold">Current Highest Bid</p>
                                <p className="font-extrabold text-base text-[#3A2D28] mt-0.5">₹{selectedManageAuction.currentHighestBid.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* COLUMN 2: The VIP List (Registered Buyers) */}
                        <div className="bg-white rounded-2xl border border-[#CBAD8D]/20 shadow-sm overflow-hidden flex flex-col h-[650px] lg:h-auto">
                          <div className="p-6 border-b border-[#CBAD8D]/20 flex justify-between items-center bg-[#FAF8F6]">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#A48374]" />
                              <h4 className="font-bold text-xs uppercase tracking-widest text-[#3A2D28]">The VIP List — Buyers</h4>
                            </div>
                            <span className="text-[9px] bg-[#A48374]/15 text-[#A48374] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider">
                              {getMockBuyersForAuction(selectedManageAuction).length} Verified
                            </span>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-[#CBAD8D]/20 bg-[#FAF8F6]/50 text-[#A48374] text-[9px] font-bold uppercase tracking-wider">
                                  <th className="py-3.5 px-6">Buyer ID</th>
                                  <th className="py-3.5 px-6">Name</th>
                                  <th className="py-3.5 px-6">Email Contact</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#CBAD8D]/10 text-xs text-[#3A2D28]">
                                {getMockBuyersForAuction(selectedManageAuction).map((buyer, idx) => (
                                  <tr key={idx} className="hover:bg-[#FAF8F6]/55 transition-colors">
                                    <td className="py-4 px-6 font-mono font-bold text-[#A48374]">{buyer.id}</td>
                                    <td className="py-4 px-6 font-semibold">{buyer.name}</td>
                                    <td className="py-4 px-6 text-[#A48374] select-all">{buyer.email}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* COLUMN 3: Live Bid Feed Terminal */}
                        <div className="flex flex-col space-y-6">
                          <div className="bg-[#3A2D28] text-[#F1EDE6] rounded-2xl p-6 shadow-md flex flex-col flex-1 h-[450px] lg:h-auto border border-[#CBAD8D]/20">
                            <div className="border-b border-white/10 pb-4 mb-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Gavel className="w-4 h-4 text-[#CBAD8D] animate-bounce" />
                                <h4 className="font-bold text-xs uppercase tracking-widest text-[#CBAD8D]">Live Bidding Feed</h4>
                              </div>
                              {getAuctionCategory(selectedManageAuction) === 'Live Now' && (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                  <span className="text-[9px] font-bold uppercase text-green-400 tracking-wider">Live</span>
                                </span>
                              )}
                            </div>
                            
                            {getAuctionCategory(selectedManageAuction) === 'Upcoming' ? (
                              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-[#A48374] italic font-mono text-xs">
                                <Clock className="w-6 h-6 mb-2 opacity-50 text-[#CBAD8D]" />
                                <p>Auction drops live when registration deadline passes. Real-time bid logs will print here.</p>
                              </div>
                            ) : (
                              <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-[11px] leading-relaxed">
                                {getMockBidsForAuction(selectedManageAuction).length === 0 ? (
                                  <p className="text-center text-[10px] text-[#CBAD8D] italic py-8">No bids received yet.</p>
                                ) : (
                                  getMockBidsForAuction(selectedManageAuction).map((bid, i) => (
                                    <div key={i} className="p-3 bg-black/20 rounded-xl border border-white/5 flex flex-col space-y-1.5">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[#CBAD8D] font-bold">{bid.bidderName}</span>
                                        <span className="text-[9px] opacity-60">
                                          {new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-[#F1EDE6]">
                                        Placed a bid of <strong className="text-green-400 font-bold">₹{bid.amount.toLocaleString('en-IN')}</strong>
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          {/* Control Action Card */}
                          {(getAuctionCategory(selectedManageAuction) === 'Live Now' || getAuctionCategory(selectedManageAuction) === 'Upcoming') && (
                            <div className="bg-white p-6 rounded-2xl border border-[#CBAD8D]/20 shadow-sm space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-red-600 border-b border-red-50 pb-2">Danger Zone</h4>
                              <p className="text-[11px] text-[#A48374] leading-relaxed">
                                Cancelling will instantly terminate this drop, refund registration options, and list the item back into active inventory.
                              </p>
                              <button
                                onClick={() => handleCancelAuction(selectedManageAuction._id)}
                                disabled={isCancelling}
                                className="w-full py-3.5 border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-xs text-center"
                              >
                                {isCancelling ? 'Processing Reversion...' : 'Cancel Auction Listing'}
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}

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

            {/* 4.5 NEGOTIATIONS TAB */}
            {currentTab === 'negotiations' && (
              <div className="bg-white rounded-[28px] p-8 border border-[#CBAD8D]/15 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-[#CBAD8D]/10 pb-4">
                  <Handshake className="w-5 h-5 text-[#A48374]" />
                  <h2 className="text-2xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Direct Negotiations</h2>
                </div>
                <OfferInbox />
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

        {/* Edit Listing Side Drawer */}
        <EditListingDrawer
          isOpen={showEditDrawer}
          onClose={() => {
            setShowEditDrawer(false);
            setSelectedListing(null);
          }}
          selectedListing={selectedListing}
          onSaveSuccess={fetchDashboardData}
        />

        {/* Review Memo Requests Modal */}
        {showMemoModal && selectedMemoProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <div 
              onClick={() => {
                setShowMemoModal(false);
                setSelectedMemoProduct(null);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />

            {/* Modal Content */}
            <div className="relative bg-[#F1EDE6] rounded-[32px] w-full max-w-lg p-6 md:p-10 border border-[#CBAD8D]/25 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => {
                  setShowMemoModal(false);
                  setSelectedMemoProduct(null);
                }}
                className="absolute right-6 top-6 p-1.5 hover:bg-gray-200/50 rounded-full cursor-pointer text-[#3A2D28]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#A48374] font-bold block mb-1">Approval Center</span>
                <h3 className="font-serif text-2xl text-[#3A2D28]">Review Memo Requests</h3>
                <p className="text-[11px] text-[#A48374] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Approve a 48-hour memo hold for one of the buyers below. This will temporarily lock the item status to "On Memo" for 48 hours.
                </p>
              </div>

              {/* Product Info Summary */}
              <div className="bg-white p-4 rounded-2xl border border-[#CBAD8D]/20 flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#F7F3EF] border border-[#E6DFD6] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#A48374]">
                  <Diamond className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs text-[#3A2D28] font-bold line-clamp-1">{selectedMemoProduct.title}</h5>
                  <p className="text-[10px] text-[#A48374] font-medium mt-0.5">
                    {selectedMemoProduct.category} • ₹{selectedMemoProduct.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Buyers List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {selectedMemoProduct.memoRequestedBy && selectedMemoProduct.memoRequestedBy.length > 0 ? (
                  selectedMemoProduct.memoRequestedBy.map((buyer) => (
                    <div 
                      key={buyer._id || buyer.id} 
                      className="bg-white p-4 rounded-xl border border-[#CBAD8D]/15 flex items-center justify-between gap-4 hover:shadow-xs transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[#3A2D28] font-bold truncate">{buyer.name || 'Anonymous Buyer'}</p>
                        <p className="text-[10px] text-[#A48374] truncate mt-0.5 select-all">{buyer.email || 'no-email@zivora.com'}</p>
                      </div>
                      <button
                        onClick={() => handleApproveMemo(buyer._id || buyer.id)}
                        className="px-4 py-2 bg-[#3A2D28] hover:bg-[#A48374] text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        Approve Memo
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-[#A48374] italic py-4">No pending memo requests found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Luxury Toast Notification */}
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

      </div>
    </div>
  );
}
