import React, { useState, useEffect } from 'react';
import { Gavel, FileText, Clock, TrendingUp, Award } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';

export default function AuctionsAndRfqs() {
  const [activeTab, setActiveTab] = useState('auctions');
  const [auctions, setAuctions] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time remaining calculator helper
  const calculateTimeRemaining = (endTimeStr) => {
    const total = Date.parse(endTimeStr) - Date.parse(new Date());
    if (total <= 0) return 'Ended';
    
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // State timer triggers
  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('zivora_admin_token');
      const [auctionsRes, rfqsRes] = await Promise.all([
        axios.get('http://localhost:2409/api/admin/auctions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:2409/api/admin/rfqs', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (auctionsRes.data.status === 'success') {
        setAuctions(auctionsRes.data.data.auctions);
      }
      if (rfqsRes.data.status === 'success') {
        setRfqs(rfqsRes.data.data.rfqs);
      }
    } catch (err) {
      console.warn('Backend API failed, loading mock auctions and RFQ logs instead.');
      setAuctions([
        {
          _id: 'auc1',
          productId: { title: '2.50ct Emerald Cut VVS2 Diamond', images: [] },
          startPrice: 1200000,
          currentHighestBid: 1420000,
          bidsCount: 5,
          highestBidder: { name: 'Amit Sharma' },
          endTime: new Date(Date.now() + 86400000 * 1.5).toISOString(),
          status: 'active'
        },
        {
          _id: 'auc2',
          productId: { title: 'Platinum Diamond Eternity Band', images: [] },
          startPrice: 500000,
          currentHighestBid: 580000,
          bidsCount: 3,
          highestBidder: { name: 'Priya Patel' },
          endTime: new Date(Date.now() + 3600000 * 2).toISOString(),
          status: 'active'
        },
        {
          _id: 'auc3',
          productId: { title: '1.80ct Princess Cut D Color FL Diamond', images: [] },
          startPrice: 2000000,
          currentHighestBid: 2450000,
          bidsCount: 9,
          highestBidder: { name: 'Amit Sharma' },
          endTime: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed'
        }
      ]);

      setRfqs([
        {
          _id: 'rfq1',
          buyerId: { name: 'Priya Patel' },
          shape: 'Round',
          carat: 1.5,
          color: 'D',
          clarity: 'VVS1',
          budget: 1500000,
          deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
          quotes: [{}, {}, {}],
          status: 'open'
        },
        {
          _id: 'rfq2',
          buyerId: { name: 'Amit Sharma' },
          shape: 'Cushion',
          carat: 2.0,
          color: 'F',
          clarity: 'VS1',
          budget: 2200000,
          deadline: new Date(Date.now() - 86400000).toISOString(),
          quotes: [{}, {}],
          winnerSeller: { name: 'Rajesh Mehta' },
          status: 'awarded'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
      case 'open':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-green-700 bg-green-50/50 border border-green-250/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Live
          </span>
        );
      case 'completed':
      case 'closed':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-gray-500 bg-gray-50/60 border border-gray-250/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Ended
          </span>
        );
      case 'awarded':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50/50 border border-blue-250/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Awarded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-gray-700 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>
            Live Platform Operations
          </h2>
          <p className="text-[10px] mt-1 text-[#A48374] tracking-widest uppercase font-semibold">Audit Bids, time margins, and buyer demands</p>
        </div>

        {/* Tab Switcher Redesigned */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#A48374]/20 shadow-sm">
          <button
            onClick={() => setActiveTab('auctions')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === 'auctions' ? 'rgba(164, 131, 116, 0.12)' : 'transparent',
              color: '#3A2D28'
            }}
          >
            <Gavel className="w-3.5 h-3.5" style={{ color: activeTab === 'auctions' ? '#A48374' : 'rgba(58, 45, 40, 0.45)' }} />
            <span>Auctions ({auctions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rfqs')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === 'rfqs' ? 'rgba(164, 131, 116, 0.12)' : 'transparent',
              color: '#3A2D28'
            }}
          >
            <FileText className="w-3.5 h-3.5" style={{ color: activeTab === 'rfqs' ? '#A48374' : 'rgba(58, 45, 40, 0.45)' }} />
            <span>Buyer RFQs ({rfqs.length})</span>
          </button>
        </div>
      </div>

      {/* Table Content Redesigned */}
      <div 
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
        style={{ borderColor: 'rgba(164, 131, 116, 0.2)' }}
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#A48374' }}></div>
          </div>
        ) : activeTab === 'auctions' ? (
          /* Auctions Table */
          auctions.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#A48374] font-medium uppercase tracking-wider">
              No auctions currently logged.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: 'rgba(164, 131, 116, 0.04)', borderColor: 'rgba(164, 131, 116, 0.15)' }}>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Product Title</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Starting Price</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Highest Bid</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Highest Bidder</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Time Remaining</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Status</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-gray-100"
                >
                  {auctions.map((auc) => (
                    <motion.tr 
                      key={auc._id} 
                      variants={itemVariants}
                      className="hover:bg-gray-50/40 transition-colors"
                    >
                      <td className="p-5 py-4.5 font-semibold text-sm text-[#3A2D28]">
                        {auc.productId?.title || 'Unknown Product'}
                      </td>
                      <td className="p-5 py-4.5 text-[#3A2D28] font-medium">
                        ₹{auc.startPrice?.toLocaleString()}
                      </td>
                      <td className="p-5 py-4.5">
                        <div className="flex items-center gap-1 font-semibold text-[#3A2D28]">
                          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                          <span>₹{auc.currentHighestBid?.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 font-normal">({auc.bidsCount} bids)</span>
                        </div>
                      </td>
                      <td className="p-5 py-4.5">
                        <span className="font-medium text-[#3A2D28]">{auc.highestBidder?.name || 'No bids yet'}</span>
                      </td>
                      <td className="p-5 py-4.5">
                        <div className="flex items-center gap-1.5 font-medium text-[#3A2D28]">
                          <Clock className="w-3.5 h-3.5 text-[#A48374]" />
                          <span className={calculateTimeRemaining(auc.endTime) === 'Ended' ? 'text-red-500 font-semibold' : ''}>
                            {calculateTimeRemaining(auc.endTime)}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 py-4.5">
                        {getStatusBadge(auc.status)}
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )
        ) : (
          /* RFQs Table */
          rfqs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#A48374] font-medium uppercase tracking-wider">
              No RFQs currently open.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: 'rgba(164, 131, 116, 0.04)', borderColor: 'rgba(164, 131, 116, 0.15)' }}>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Buyer</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Diamond Details</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Budget</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Quotes Placed</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Awarded To</th>
                    <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Status</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-gray-100"
                >
                  {rfqs.map((rfq) => (
                    <motion.tr 
                      key={rfq._id} 
                      variants={itemVariants}
                      className="hover:bg-gray-50/40 transition-colors"
                    >
                      <td className="p-5 py-4.5">
                        <div className="font-semibold text-sm text-[#3A2D28]">{rfq.buyerId?.name || rfq.buyerName}</div>
                      </td>
                      <td className="p-5 py-4.5">
                        <div className="font-semibold text-sm text-[#3A2D28]">
                          {rfq.carat}ct {rfq.shape}
                        </div>
                        <div className="text-gray-400 mt-1">
                          Color: {rfq.color} • Clarity: {rfq.clarity}
                        </div>
                      </td>
                      <td className="p-5 py-4.5">
                        <div className="font-semibold text-[#3A2D28]">
                          ₹{rfq.budget?.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-5 py-4.5">
                        <div className="font-medium text-[#3A2D28] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#A48374]" />
                          <span>{rfq.quotes ? rfq.quotes.length : 0} quotes</span>
                        </div>
                      </td>
                      <td className="p-5 py-4.5">
                        {rfq.winnerSeller ? (
                          <div className="flex items-center gap-1 font-semibold text-green-700 bg-green-50/50 border border-green-200/30 px-2.5 py-1 rounded w-max">
                            <Award className="w-3.5 h-3.5" />
                            <span>{rfq.winnerSeller.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-5 py-4.5">
                        {getStatusBadge(rfq.status)}
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
