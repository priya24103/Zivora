import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Clock, 
  Gavel, 
  CheckCircle, 
  ArrowLeft, 
  ShieldAlert, 
  TrendingUp, 
  User, 
  DollarSign, 
  Gem, 
  Award,
  ChevronLeft,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_URL = 'http://localhost:2409';

export default function Auctions() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  
  // Dashboard & Navigation States
  const [activeTab, setActiveTab] = useState('Live Now'); // 'Live Now', 'Upcoming', 'Past Auctions'
  const [selectedAuction, setSelectedAuction] = useState(null); // When set, enters Live Bidding Room
  
  // Data States
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [closedAuctions, setClosedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local Registration State
  const [registeredList, setRegisteredList] = useState({}); // { [auctionId]: true }
  
  // Countdown/Time Watcher State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Socket/Bidding Simulation States in Live Room
  const [liveRoomHighestBid, setLiveRoomHighestBid] = useState(0);
  const [liveRoomBids, setLiveRoomBids] = useState([]);
  const [userBidAmount, setUserBidAmount] = useState('');
  
  // 5s Cooldown UX States
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Active user details
  const user = JSON.parse(localStorage.getItem('zivora_user')) || { name: 'Verified Buyer', email: 'buyer@zivora.com' };
  const token = localStorage.getItem('zivora_token');

  // Time ticker interval
  useEffect(() => {
    const ticker = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // Socket.io connection and listeners for the Live Room
  useEffect(() => {
    if (!selectedAuction) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket.io
    socketRef.current = io(API_URL, {
      transports: ['websocket'],
      auth: { token }
    });

    const socket = socketRef.current;

    // Join the auction room
    socket.emit('join_auction', { 
      auctionId: selectedAuction._id, 
      userId: user._id 
    });

    socket.on('error', (err) => {
      console.error('Socket error in Auctions room:', err);
      alert(err.message || 'An error occurred in the live bidding room.');
    });

    socket.on('joined_room', (data) => {
      console.log('Successfully joined auction socket room:', data);
    });

    // Listen for new bids in real-time
    socket.on('new_bid', (data) => {
      console.log('Received new bid socket event:', data);
      if (data.auctionId.toString() === selectedAuction._id.toString()) {
        setLiveRoomHighestBid(data.amount);
        setLiveRoomBids(data.bids || []);
        
        // Auto-update input to next valid bid amount
        const minInc = selectedAuction.minIncrement || 100;
        setUserBidAmount((data.amount + minInc).toString());
      }
    });

    // Listen for global cooldown
    socket.on('bid_cooldown', (data) => {
      console.log('Received bid cooldown socket event:', data);
      setIsCooldown(true);
      setCooldownRemaining(data.duration || 5);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [selectedAuction, token]);

  // Fetch auctions from database on load
  const fetchAuctionsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`${API_URL}/api/auctions/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.status === 'success') {
        const { live, upcoming, closed } = res.data.data;
        setLiveAuctions(live || []);
        setUpcomingAuctions(upcoming || []);
        setClosedAuctions(closed || []);
      } else {
        setLiveAuctions([]);
        setUpcomingAuctions([]);
        setClosedAuctions([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard auctions:', err);
      setError('Could not fetch auctions from the database.');
      setLiveAuctions([]);
      setUpcomingAuctions([]);
      setClosedAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionsData();
  }, [token]);

  // watch deadlines on upcoming auctions for the Auto-Transition logic
  useEffect(() => {
    if (upcomingAuctions.length === 0) return;

    // Check if any upcoming auction has passed its registrationDeadline (which equals startTime)
    const now = currentTime;
    let transitionOccurred = false;

    const remainingUpcoming = upcomingAuctions.filter((auc) => {
      const deadline = new Date(auc.registrationDeadline);
      if (now >= deadline) {
        // Transition: move this auction to live list
        const updatedAuction = {
          ...auc,
          status: 'active',
          startTime: now.toISOString(),
          // Extend endTime dynamically if needed or keep original
          endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
        };
        
        setLiveAuctions(prev => [updatedAuction, ...prev]);
        transitionOccurred = true;
        return false; // remove from upcoming
      }
      return true; // keep in upcoming
    });

    if (transitionOccurred) {
      setUpcomingAuctions(remainingUpcoming);
    }
  }, [currentTime, upcomingAuctions]);

  // Handle registration flow for upcoming auctions
  const handleRegister = async (auction) => {
    try {
      if (!token) {
        alert('Please log in to register for auctions.');
        navigate('/login');
        return;
      }

      // Optimistically set status
      setRegisteredList(prev => ({ ...prev, [auction._id]: true }));

      // Send to backend
      await axios.post(`${API_URL}/api/auctions/${auction._id}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Registration API error:', err);
      // We keep it registered locally anyway for the mock/standalone experience
    }
  };

  // Immersive room bid submission via Socket.io
  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (isCooldown) return;

    const bidVal = Number(userBidAmount);
    const minInc = selectedAuction.minIncrement || 100;
    const requiredMin = liveRoomHighestBid + minInc;

    if (isNaN(bidVal) || bidVal < requiredMin) {
      alert(`Your bid must be at least ₹${requiredMin.toLocaleString('en-IN')}`);
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('place_bid', {
        auctionId: selectedAuction._id,
        userId: user._id,
        amount: bidVal
      });
    }
  };

  // Cooldown countdown watcher
  useEffect(() => {
    let timer;
    if (isCooldown && cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            setIsCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCooldown, cooldownRemaining]);

  // Load live room states when an auction is selected
  const enterLiveRoom = (auction) => {
    setSelectedAuction(auction);
    setLiveRoomHighestBid(auction.currentHighestBid || auction.startPrice);
    
    // Sort and set bids chronological
    const sortedBids = auction.bids 
      ? [...auction.bids].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      : [];
    setLiveRoomBids(sortedBids);
    
    const minInc = auction.minIncrement || 100;
    setUserBidAmount(((auction.currentHighestBid || auction.startPrice) + minInc).toString());
  };

  // Helper to format remaining durations
  const formatCountdown = (targetDateStr) => {
    const diffMs = new Date(targetDateStr) - currentTime;
    if (diffMs <= 0) return '00:00:00';
    
    const hrs = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, '0');
    const mins = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const secs = String(Math.floor((diffMs % (1000 * 60)) / 1000)).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="min-h-screen py-10 px-4 md:px-12 flex flex-col font-sans" style={{ backgroundColor: '#F1EDE6' }}>
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: BUYER AUCTION DASHBOARD */}
        {!selectedAuction ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto w-full space-y-8"
          >
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#CBAD8D]/25 pb-6">
              <div>
                <span className="text-xs uppercase tracking-[0.35em]" style={{ color: '#A48374' }}>Marketplace drops</span>
                <h1 className="text-4xl mt-1 text-[#3A2D28]" style={{ fontWeight: 200, fontFamily: 'Georgia, serif' }}>Live Auctions</h1>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#A48374]/35 text-xs font-bold uppercase tracking-widest text-[#A48374] rounded-full hover:bg-white transition-all cursor-pointer shadow-xs"
              >
                ← Return Home
              </button>
            </div>

            {/* Horizontal tab lists */}
            <div className="flex border-b border-[#CBAD8D]/20 gap-2 overflow-x-auto pb-px">
              {['Live Now', 'Upcoming', 'Past Auctions'].map((tab) => {
                const count = tab === 'Live Now' 
                  ? liveAuctions.length 
                  : tab === 'Upcoming' 
                    ? upcomingAuctions.length 
                    : closedAuctions.length;
                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-xs font-extrabold uppercase tracking-widest relative whitespace-nowrap transition-colors cursor-pointer ${
                      isActive ? 'text-[#3A2D28]' : 'text-[#A48374] hover:text-[#3A2D28]'
                    }`}
                  >
                    {tab} <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] bg-[#FAF8F6] border border-[#CBAD8D]/15">{count}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator" 
                        className="absolute bottom-0 left-0 right-0 h-0.5" 
                        style={{ backgroundColor: '#A48374' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cards layout */}
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs uppercase tracking-widest text-[#A48374]">Accessing Zivora Vault...</p>
              </div>
            ) : (
              (() => {
                const list = activeTab === 'Live Now' 
                  ? liveAuctions 
                  : activeTab === 'Upcoming' 
                    ? upcomingAuctions 
                    : closedAuctions;

                if (list.length === 0) {
                  return (
                    <div className="bg-[#EBE3DB]/40 rounded-3xl border border-[#CBAD8D]/20 p-16 text-center max-w-xl mx-auto space-y-5">
                      <Gavel className="w-12 h-12 text-[#A48374] mx-auto opacity-55" />
                      <h4 className="font-bold text-sm text-[#3A2D28] uppercase tracking-wider">No active auctions</h4>
                      <p className="text-xs text-[#A48374] leading-relaxed">
                        There are currently no listed items in this category. Check back soon for exclusive drops.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {list.map((auc) => {
                      const image = auc.productId?.images?.[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800';
                      const isUpcoming = activeTab === 'Upcoming';
                      const isPast = activeTab === 'Past Auctions';
                      
                      // Check countdowns
                      const countdownText = isUpcoming 
                        ? formatCountdown(auc.registrationDeadline)
                        : formatCountdown(auc.endTime);

                      const isRegistered = registeredList[auc._id];

                      return (
                        <div 
                          key={auc._id} 
                          className="bg-white rounded-2xl border border-[#CBAD8D]/20 hover:border-[#A48374]/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
                        >
                          {/* Image Box */}
                          <div className="relative aspect-[4/3] bg-[#EBE3DB]/40 overflow-hidden">
                            <img 
                              src={image} 
                              alt={auc.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Live Badge */}
                            {!isPast && (
                              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                <Clock className="w-3 h-3 text-[#CBAD8D] animate-pulse" />
                                <span>{isUpcoming ? `Reg Closes: ${countdownText}` : `Ends in: ${countdownText}`}</span>
                              </div>
                            )}
                            {isPast && (
                              <div className="absolute top-4 left-4 bg-gray-100 border border-gray-200 text-gray-500 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                Closed
                              </div>
                            )}
                          </div>

                          {/* Details Box */}
                          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-[#A48374]">
                                {auc.productId?.category || 'Luxury drop'}
                              </span>
                              <h3 className="font-bold text-sm text-[#3A2D28] line-clamp-1 group-hover:text-[#A48374] transition-colors">
                                {auc.title}
                              </h3>
                              <p className="text-[10px] text-[#A48374] leading-relaxed line-clamp-2">
                                {auc.productId?.category === 'Diamond' 
                                  ? `${auc.productId?.carat}ct • ${auc.productId?.shape} • ${auc.productId?.color} ${auc.productId?.clarity} • ${auc.productId?.cut} Cut`
                                  : `${auc.productId?.jewelryType} • ${auc.productId?.metalType} • ${auc.productId?.weightGrams}g`
                                }
                              </p>
                            </div>

                            <div className="pt-3 border-t border-[#CBAD8D]/15 flex items-center justify-between text-xs">
                              <div>
                                <p className="text-[9px] text-[#A48374] uppercase font-semibold">Reserve Price</p>
                                <p className="font-bold text-sm text-[#3A2D28] mt-0.5">₹{auc.startPrice.toLocaleString('en-IN')}</p>
                              </div>
                              {!isUpcoming && (
                                <div className="text-right">
                                  <p className="text-[9px] text-[#A48374] uppercase font-semibold">Highest Bid</p>
                                  <p className="font-extrabold text-sm text-[#A48374] mt-0.5">
                                    ₹{(auc.currentHighestBid || auc.startPrice).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Dynamic Button States */}
                            {isPast ? (
                              <button 
                                disabled
                                className="w-full py-3 bg-[#F1EDE6] text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-200"
                              >
                                Completed
                              </button>
                            ) : isUpcoming ? (
                              isRegistered ? (
                                <button 
                                  disabled
                                  className="w-full py-3 bg-[#F1EDE6] text-[#A48374] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#CBAD8D]/30"
                                >
                                  ✅ Registered for Drop
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleRegister(auc)}
                                  className="w-full py-3 border border-[#A48374] hover:bg-[#3A2D28] hover:text-white hover:border-transparent text-[10px] font-bold uppercase tracking-widest text-[#A48374] rounded-full transition-colors cursor-pointer"
                                >
                                  Register for Auction
                                </button>
                              )
                            ) : (
                              <button 
                                onClick={() => enterLiveRoom(auc)}
                                className="w-full py-3 bg-[#A48374] hover:bg-[#3A2D28] text-white text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors cursor-pointer shadow-xs"
                              >
                                Enter Live Room ⚡
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </motion.div>
        ) : (
          // VIEW 2: IMMERSIVE LIVE BIDDING ROOM (THE VIP ROOM)
          <motion.div
            key="live-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 w-screen h-screen bg-[#F1EDE6] overflow-y-auto flex flex-col font-sans"
          >
            {/* Immersive Header Bar */}
            <div className="sticky top-0 bg-white border-b border-[#CBAD8D]/25 px-6 py-5 flex items-center justify-between z-10 shadow-xs">
              <button 
                onClick={() => setSelectedAuction(null)}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer group"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                ← Back to Auctions
              </button>
              
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                <span className="text-red-600 text-[10px] font-black uppercase tracking-widest">LIVE BIDDING ACTIVE</span>
              </div>
              
              <span className="text-[10px] bg-[#FAF8F6] border border-[#CBAD8D]/30 text-[#A48374] px-3.5 py-1.5 rounded-full font-mono font-bold uppercase tracking-wider">
                ID: {selectedAuction._id.slice(0, 8)}
              </span>
            </div>

            {/* Immersive Split Screen Columns */}
            <div className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: THE ITEM (7 cols) */}
              <div className="lg:col-span-7 space-y-6 flex flex-col">
                {/* Showcase Image */}
                <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-white border border-[#CBAD8D]/25 shadow-sm relative group">
                  <img 
                    src={selectedAuction.productId?.images?.[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'} 
                    alt={selectedAuction.title} 
                    className="w-full h-full object-cover transition-transform duration-500"
                  />
                  {selectedAuction.productId?.certificateLab && selectedAuction.productId.certificateLab !== 'None' && (
                    <span className="absolute top-4 right-4 bg-white/95 text-[#3A2D28] font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-[#CBAD8D]/25 shadow-xs">
                      {selectedAuction.productId.certificateLab} Certified
                    </span>
                  )}
                </div>

                {/* Spec details Card */}
                <div className="bg-white rounded-2xl p-6 border border-[#CBAD8D]/20 shadow-sm space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-[#A48374] font-bold">
                        {selectedAuction.productId?.category} Spec Sheet
                      </span>
                      <h2 className="text-2xl font-light text-[#3A2D28] mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                        {selectedAuction.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-[#A48374] leading-relaxed">
                    {selectedAuction.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 text-xs border-t border-[#CBAD8D]/10">
                    {selectedAuction.productId?.category === 'Diamond' ? (
                      <>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Carat weight</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.carat} ct</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Shape</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.shape}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Color Grade</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.color}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Clarity</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.clarity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Cut Precision</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.cut}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Jewelry Type</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.jewelryType}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Metal alloy</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.metalType}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Metal weight</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.weightGrams} g</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase font-semibold">Gender</p>
                          <p className="font-bold text-[#3A2D28] mt-0.5">{selectedAuction.productId?.gender}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Remaining bid time Box */}
                <div className="bg-white rounded-2xl p-6 border border-[#CBAD8D]/25 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#CBAD8D] animate-pulse" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#A48374] font-semibold">Time Remaining</p>
                      <p className="text-lg font-bold font-mono text-[#3A2D28] mt-0.5">
                        {formatCountdown(selectedAuction.endTime)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-green-50 border border-green-200 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Bidding Open
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN: THE ACTION (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-6">
                {/* Current bid displays */}
                <div className="bg-white rounded-2xl p-6 border border-[#CBAD8D]/25 shadow-sm space-y-4">
                  <p className="text-xs uppercase tracking-widest text-[#A48374] font-bold">Current Highest Bid</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>
                      ₹{liveRoomHighestBid.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] bg-[#FAF8F6] text-[#A48374] border border-[#CBAD8D]/20 px-2 py-0.5 rounded font-mono font-bold">
                      Reserve Met
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#CBAD8D]/10 flex justify-between text-xs">
                    <div>
                      <p className="text-[10px] text-[#A48374] font-medium">Bids Placed</p>
                      <p className="font-bold text-[#3A2D28] mt-0.5">{liveRoomBids.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#A48374] font-medium">Minimum Increment</p>
                      <p className="font-bold text-[#3A2D28] mt-0.5">₹{(selectedAuction.minIncrement || 100).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Scrolling Bid History feed */}
                <div className="bg-[#3A2D28] text-[#F1EDE6] rounded-2xl p-6 shadow-md flex flex-col flex-1 h-[300px] lg:h-auto border border-[#CBAD8D]/20">
                  <div className="border-b border-white/10 pb-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-[#CBAD8D]" />
                      <h4 className="font-bold text-xs uppercase tracking-widest text-[#CBAD8D]">VIP Bid Stream</h4>
                    </div>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-[11px] leading-relaxed">
                    {liveRoomBids.length === 0 ? (
                      <p className="text-center text-xs text-[#CBAD8D] italic py-8">No bids received yet.</p>
                    ) : (
                      [...liveRoomBids].reverse().map((bid, i) => (
                        <div key={i} className="p-3 bg-black/20 rounded-xl border border-white/5 flex flex-col space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[#CBAD8D] font-bold">
                              {bid.bidderName === user.name ? 'You (Verified Buyer)' : 'Buyer ***'}
                            </span>
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
                </div>

                {/* Bidding place action form */}
                <div className="bg-white rounded-2xl p-6 border border-[#CBAD8D]/25 shadow-sm space-y-4 relative overflow-hidden">
                  
                  {/* Cooldown Overlay */}
                  <AnimatePresence>
                    {isCooldown && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center text-center p-6 space-y-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#CBAD8D]/15 flex items-center justify-center text-[#A48374] animate-spin">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#3A2D28]">Evaluating Bid Submission</h4>
                          <p className="text-xs text-[#A48374] mt-1">Accepting next bids in <strong className="font-mono text-[#3A2D28]">{cooldownRemaining}s</strong></p>
                        </div>
                        <div className="w-40 h-1 bg-[#F1EDE6] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 5, ease: 'linear' }}
                            className="h-full bg-[#A48374]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handlePlaceBid} className="space-y-4">
                    <div>
                      <label htmlFor="bid-amount" className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">
                        Enter Custom Bid Amount (₹)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A48374] font-mono text-sm">
                          ₹
                        </div>
                        <input 
                          id="bid-amount"
                          type="number" 
                          required
                          disabled={isCooldown}
                          value={userBidAmount}
                          onChange={(e) => setUserBidAmount(e.target.value)}
                          placeholder={(liveRoomHighestBid + (selectedAuction.minIncrement || 100)).toString()}
                          className="w-full pl-8 pr-4 py-3.5 border border-[#CBAD8D]/30 focus:border-[#A48374] focus:outline-none rounded-xl text-sm bg-[#FAF8F6] text-[#3A2D28] font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Pre-set Bid Quick Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      {[1000, 5000, 10000].map((inc) => {
                        const targetVal = liveRoomHighestBid + (selectedAuction.minIncrement || 100) + inc;
                        return (
                          <button
                            key={inc}
                            type="button"
                            disabled={isCooldown}
                            onClick={() => setUserBidAmount(targetVal.toString())}
                            className="py-2.5 px-3 border border-[#CBAD8D]/15 hover:border-[#A48374] rounded-lg text-[10px] text-[#A48374] hover:text-[#3A2D28] bg-[#FAF8F6]/30 transition-all font-semibold font-mono"
                          >
                            +{inc / 1000}k (₹{(inc / 1000).toLocaleString()}k)
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      disabled={isCooldown}
                      className="w-full py-4 bg-[#3A2D28] hover:bg-[#A48374] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 text-center"
                    >
                      {isCooldown ? `Evaluating bid... ${cooldownRemaining}s` : 'Submit Irrevocable Bid ⚡'}
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
