import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  Gavel, 
  Clock, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  User, 
  DollarSign,
  Gem,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SOCKET_URL = 'http://localhost:2409';

export default function LiveAuctionRoom() {
  const { id: auctionId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // States
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bids, setBids] = useState([]);
  const [currentHighestBid, setCurrentHighestBid] = useState(0);
  const [bidsCount, setBidsCount] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  
  // Cooldown & Countdown States
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [auctionEnded, setAuctionEnded] = useState(false);

  // Current logged-in user
  const user = JSON.parse(localStorage.getItem('zivora_user')) || {};
  const token = localStorage.getItem('zivora_token');

  // Socket reference
  const socketRef = useRef(null);

  // Fetch initial auction details
  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SOCKET_URL}/api/auctions/${auctionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        const auc = res.data.data.auction;
        setAuction(auc);
        setBids(auc.bids || []);
        setCurrentHighestBid(auc.currentHighestBid);
        setBidsCount(auc.bidsCount || 0);
        
        // Default bid amount to currentHighestBid + minIncrement
        const minIncrement = auc.minIncrement || 100;
        setBidAmount((auc.currentHighestBid + minIncrement).toString());
      }
    } catch (err) {
      console.error('Error fetching auction details:', err);
      setError(err.response?.data?.message || 'Failed to load auction room. Ensure you are registered.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAuctionDetails();
  }, [auctionId, token]);

  // Socket.io Connection & Listeners
  useEffect(() => {
    if (!token || loading || error || !auction) return;

    // Connect to Socket.io
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token }
    });

    const socket = socketRef.current;

    // Join the auction room
    socket.emit('join_auction', { auctionId, userId: user._id });

    // Handle access denial or other socket errors
    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'An error occurred. Connection closed.');
      // If permission denied, kick them out
      if (err.message && err.message.toLowerCase().includes('access denied')) {
        setTimeout(() => {
          navigate('/buyer/dashboard');
        }, 3000);
      }
    });

    // Handle successful join
    socket.on('joined_room', (data) => {
      console.log('Successfully joined auction socket room:', data);
    });

    // Listen for new bids
    socket.on('new_bid', (data) => {
      console.log('Received new bid event:', data);
      if (data.auctionId.toString() === auctionId.toString()) {
        setCurrentHighestBid(data.amount);
        setBidsCount(data.bidsCount);
        setBids(data.bids || []);
        
        // Auto-update input to next valid bid amount if user hasn't edited it or if it is below next min
        const nextMin = data.amount + (auction.minIncrement || 100);
        setBidAmount(nextMin.toString());
      }
    });

    // Listen for global cooldown
    socket.on('bid_cooldown', (data) => {
      console.log('Received cooldown event:', data);
      setIsCooldown(true);
      setCooldownTime(data.duration || 5);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [auction, loading, error]);

  // Scrolling bid feed to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bids]);

  // Handle Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (isCooldown && cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setIsCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCooldown, cooldownTime]);

  // Handle Auction End Time Countdown
  useEffect(() => {
    if (!auction) return;

    const interval = setInterval(() => {
      const difference = new Date(auction.endTime) - new Date();
      if (difference <= 0) {
        setTimeLeft('Auction Ended');
        setAuctionEnded(true);
        clearInterval(interval);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  // Place Bid handler
  const handlePlaceBidSubmit = (e) => {
    e.preventDefault();
    if (isCooldown || auctionEnded) return;

    const amount = Number(bidAmount);
    const minIncrement = auction.minIncrement || 100;
    const minRequired = currentHighestBid + minIncrement;

    if (!amount || isNaN(amount)) {
      alert('Please enter a valid bid amount.');
      return;
    }

    if (amount < minRequired) {
      alert(`Your bid must be at least ₹${minRequired.toLocaleString('en-IN')}`);
      return;
    }

    // Emit bid event to backend
    if (socketRef.current) {
      socketRef.current.emit('place_bid', {
        auctionId,
        userId: user._id,
        amount
      });
    }
  };

  // Helper to format currency
  const formatINR = (value) => {
    return Number(value).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F6]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#CBAD8D] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs uppercase tracking-widest text-[#A48374]">Entering Auction Room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F6] px-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#CBAD8D]/20 shadow-[0_12px_40px_rgba(0,0,0,0.03)] text-center space-y-6">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>Access Denied</h2>
          <p className="text-sm text-[#A48374] leading-relaxed">{error}</p>
          <div className="pt-4">
            <Link 
              to="/buyer/dashboard" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const product = auction?.productId || {};
  const isHighestBidder = auction?.highestBidder?.toString() === user._id?.toString() || bids[bids.length - 1]?.bidderId === user._id;

  return (
    <div className="min-h-screen bg-[#FAF8F6] py-12 px-6 lg:px-16 text-[#3A2D28]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top bar navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-[#CBAD8D]/15">
          <Link 
            to="/buyer/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#A48374] hover:text-[#3A2D28] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 bg-[#F5F1EC] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-[#A48374]">
            <Gavel className="w-3.5 h-3.5" />
            <span>Auction Room ID: <span className="font-mono text-[#3A2D28]">{auctionId}</span></span>
          </div>
        </div>

        {/* Main Grid split Left (Product specs & countdown) & Right (Bids & action) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: PRODUCT IMAGE AND SPECS (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col md:flex-row gap-6">
              
              {/* Product Image */}
              <div className="w-full md:w-1/2 aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-[#CBAD8D]/10 relative group flex-shrink-0">
                <img 
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800'} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>

              {/* Title & Stats */}
              <div className="flex flex-col justify-between py-2 space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#A48374] font-semibold">{product.category}</span>
                  <h1 className="text-3xl font-light mt-1 text-[#3A2D28] leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {product.title}
                  </h1>
                  <p className="text-xs text-[#A48374] mt-2 line-clamp-3 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Live timer / status */}
                <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#CBAD8D]/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${auctionEnded ? 'text-red-500' : 'text-[#CBAD8D] animate-pulse'}`} />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#A48374]">Time Remaining</p>
                      <p className="text-base font-semibold font-mono text-[#3A2D28] mt-0.5">{timeLeft || 'Loading...'}</p>
                    </div>
                  </div>
                  <span 
                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${auctionEnded ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                  >
                    {auctionEnded ? 'Ended' : 'Live'}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Specifications details */}
            <div className="bg-white rounded-3xl p-8 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6">
              <h3 className="text-lg font-light text-[#3A2D28] tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>Gemstone Specifications</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.carat && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#CBAD8D]/10 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#A48374]">Carat Weight</p>
                    <p className="text-lg font-medium text-[#3A2D28] mt-1">{product.carat} ct</p>
                  </div>
                )}
                {product.color && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#CBAD8D]/10 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#A48374]">Color Grade</p>
                    <p className="text-lg font-medium text-[#3A2D28] mt-1">{product.color}</p>
                  </div>
                )}
                {product.clarity && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#CBAD8D]/10 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#A48374]">Clarity Grade</p>
                    <p className="text-lg font-medium text-[#3A2D28] mt-1">{product.clarity}</p>
                  </div>
                )}
                {product.cut && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#CBAD8D]/10 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#A48374]">Cut Precision</p>
                    <p className="text-lg font-medium text-[#3A2D28] mt-1">{product.cut}</p>
                  </div>
                )}
                {product.shape && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#CBAD8D]/10 text-center col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#A48374]">Diamond Shape</p>
                    <p className="text-lg font-medium text-[#3A2D28] mt-1">{product.shape}</p>
                  </div>
                )}
                {product.certificateLab && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#CBAD8D]/10 text-center col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#A48374]">Certification Lab</p>
                    <p className="text-lg font-medium text-[#3A2D28] mt-1">{product.certificateLab}</p>
                  </div>
                )}
              </div>

              {/* Security info */}
              <div className="pt-4 border-t border-[#CBAD8D]/10 flex items-center gap-3 text-xs text-[#A48374] leading-relaxed">
                <Gem className="w-5 h-5 text-[#CBAD8D] flex-shrink-0" />
                <p>This diamond is secured under 100% genuine appraisal certifications. Submitting a bid represents an irrevocable legal obligation to purchase upon winning the auction drop.</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BID HISTORY AND LIVE PLACE BID ACTION (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Bid History log */}
            <div className="bg-white rounded-3xl p-6 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex-1 flex flex-col h-[380px]">
              <div className="flex items-center justify-between pb-4 border-b border-[#CBAD8D]/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#CBAD8D]" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#3A2D28]">Live Bid History</h3>
                </div>
                <span className="text-[10px] font-bold text-[#A48374] uppercase tracking-widest">{bidsCount} Bids Placed</span>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 scrollbar-thin">
                {bids.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-xs text-[#A48374] italic">
                    No bids placed yet. Be the first to start the auction!
                  </div>
                ) : (
                  bids.map((b, index) => {
                    const isSelf = b.bidderId === user._id;
                    const isTop = index === bids.length - 1;

                    return (
                      <div 
                        key={b._id || index}
                        className={`p-3 rounded-2xl border text-xs flex justify-between items-center transition-all ${
                          isTop 
                            ? 'bg-[#FAF8F6] border-[#CBAD8D] shadow-[0_4px_15px_rgba(203,173,141,0.08)]' 
                            : 'bg-white border-[#CBAD8D]/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ${
                            isSelf ? 'bg-[#A48374]' : 'bg-[#3A2D28]'
                          }`}>
                            {b.bidderName ? b.bidderName[0] : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#3A2D28]">{isSelf ? 'You' : b.bidderName}</span>
                              {isTop && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase bg-[#CBAD8D]/15 text-[#86684e]">
                                  Current High
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-[#A48374]">{new Date(b.timestamp || b.time).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <span className={`font-semibold font-mono text-sm ${isSelf ? 'text-[#A48374]' : 'text-[#3A2D28]'}`}>
                          {formatINR(b.amount || b.bidAmount)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* ACTION AREA (Bid placement) */}
            <div className="bg-white rounded-3xl p-6 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgb(0,0,0,0.01)] relative overflow-hidden">
              
              {/* Cooldown Overlay */}
              <AnimatePresence>
                {isCooldown && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center text-center p-6 space-y-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#CBAD8D]/10 flex items-center justify-center text-[#CBAD8D] animate-spin">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#3A2D28]">Evaluating Bids</h4>
                      <p className="text-xs text-[#A48374] mt-1">Accepting next bids in <strong className="font-mono text-[#3A2D28]">{cooldownTime}s</strong></p>
                    </div>
                    {/* Visual 5-second progress bar */}
                    <div className="w-40 h-1 bg-[#F5F1EC] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                        className="h-full bg-[#CBAD8D]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#A48374] font-semibold">Current Highest Bid</p>
                  <h2 className="text-3xl font-light font-mono text-[#3A2D28] mt-1">
                    {formatINR(currentHighestBid)}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-[#A48374] font-semibold">Min Bid Required</p>
                  <p className="text-sm font-semibold font-mono text-[#CBAD8D] mt-1">
                    {formatINR(currentHighestBid + (auction?.minIncrement || 100))}
                  </p>
                </div>
              </div>

              {/* Bid Form */}
              <form onSubmit={handlePlaceBidSubmit} className="space-y-4">
                <div>
                  <label htmlFor="bid-input" className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">
                    Enter Bid Amount (INR)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A48374] font-mono text-sm">
                      ₹
                    </div>
                    <input 
                      id="bid-input"
                      type="number" 
                      required
                      disabled={isCooldown || auctionEnded}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={(currentHighestBid + (auction?.minIncrement || 100)).toString()}
                      className="w-full pl-8 pr-4 py-3 border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl text-sm bg-[#FAF8F6] text-[#3A2D28] font-mono"
                    />
                  </div>
                </div>

                {/* Pre-set Bid Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 5000, 10000].map((inc) => {
                    const targetVal = currentHighestBid + (auction?.minIncrement || 100) + inc;
                    return (
                      <button
                        key={inc}
                        type="button"
                        disabled={isCooldown || auctionEnded}
                        onClick={() => setBidAmount(targetVal.toString())}
                        className="py-2 px-3 border border-[#CBAD8D]/15 hover:border-[#A48374] rounded-lg text-[10px] text-[#A48374] hover:text-[#3A2D28] bg-[#FAF8F6]/30 transition-all font-semibold font-mono"
                      >
                        +{inc / 1000}k ({inc / 1000 === 1 ? '₹1,000' : `₹${inc / 1000},000`})
                      </button>
                    );
                  })}
                </div>

                {/* Place Bid Submit Button */}
                <button
                  type="submit"
                  disabled={isCooldown || auctionEnded}
                  className={`w-full py-4 text-xs font-semibold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm ${
                    auctionEnded 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isHighestBidder 
                        ? 'bg-green-700 text-white hover:bg-green-800'
                        : 'bg-[#3A2D28] text-white hover:bg-[#A48374]'
                  }`}
                >
                  {auctionEnded 
                    ? 'Auction Terminated' 
                    : isHighestBidder 
                      ? 'You Are Highest Bidder' 
                      : 'Place Bid'}
                </button>
              </form>

              {/* Status footer for buyer feedback */}
              <div className="mt-4 pt-4 border-t border-[#CBAD8D]/10 flex items-center justify-between text-[10px] text-[#A48374] font-semibold uppercase tracking-wider">
                <span>Increment: {formatINR(auction?.minIncrement || 100)}</span>
                {isHighestBidder ? (
                  <span className="text-green-600 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Winning
                  </span>
                ) : (
                  <span className="text-[#CBAD8D] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Outbid
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
