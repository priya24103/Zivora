import React from 'react';
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
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

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

  const handleLogout = () => {
    localStorage.removeItem('zivora_token');
    localStorage.removeItem('zivora_user');
    navigate('/login');
  };

  // Mock data to give the portal an extremely rich, functional feel
  const mockBids = [
    { id: 'b1', name: 'Princess Cut Diamond 1.8ct E VS1', price: '$28,000', myBid: '$29,500', status: 'Highest Bidder', color: '#10B981' },
    { id: 'b2', name: 'Round Brilliant Diamond 2.5ct D VVS1', price: '$45,000', myBid: '$44,000', status: 'Outbid', color: '#EF4444' }
  ];

  const mockRfqs = [
    { id: 'r1', shape: 'Emerald Cut', carat: '2.2ct', color: 'D', clarity: 'IF', budget: '$60,000', status: 'Offers Received (3)', date: 'May 28, 2026' },
    { id: 'r2', shape: 'Cushion Cut', carat: '3.0ct', color: 'F', clarity: 'VVS2', budget: '$50,000', status: 'Pending Review', date: 'May 30, 2026' }
  ];

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
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #A48374, #3A2D28)' }}>
                  <span className="text-2xl font-light">{user.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#3A2D28]">{user.name}</h3>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(203,173,141,0.2)', color: '#A48374' }}>
                    <Shield className="w-2.5 h-2.5" />
                    Verified Client
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm border-t border-[#CBAD8D]/10 pt-6">
                <div className="flex items-center gap-3 text-[#3A2D28]">
                  <Mail className="w-4 h-4 text-[#A48374]" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-[#3A2D28]">
                  <Phone className="w-4 h-4 text-[#A48374]" />
                  <span>+91 {user.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-[#3A2D28]">
                  <User className="w-4 h-4 text-[#A48374]" />
                  <span className="capitalize">{user.role} Account</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10">
                <Gavel className="w-6 h-6 text-[#A48374] mb-3" />
                <p className="text-2xl font-light text-[#3A2D28]">{mockBids.length}</p>
                <p className="text-xs uppercase tracking-wider text-[#A48374] mt-1">Active Bids</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10">
                <MessageSquare className="w-6 h-6 text-[#A48374] mb-3" />
                <p className="text-2xl font-light text-[#3A2D28]">{mockRfqs.length}</p>
                <p className="text-xs uppercase tracking-wider text-[#A48374] mt-1">Custom RFQs</p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: INTERACTIVE PORTAL SECTIONS ─────────────── */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Live Bids Portfolio */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-[#A48374]" />
                  <h3 className="text-xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Active Live Auctions</h3>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#A48374]">Real-time status</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#CBAD8D]/15 text-[#A48374] text-xs uppercase tracking-wider font-semibold">
                      <th className="pb-3">Diamond Details</th>
                      <th className="pb-3">Starting Price</th>
                      <th className="pb-3">My Last Bid</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBAD8D]/10">
                    {mockBids.map((bid) => (
                      <tr key={bid.id} className="text-[#3A2D28] hover:bg-[#FBF9F6]/50 transition-colors">
                        <td className="py-4 font-medium flex items-center gap-2">
                          <Diamond className="w-3.5 h-3.5 text-[#CBAD8D]" />
                          {bid.name}
                        </td>
                        <td className="py-4">{bid.price}</td>
                        <td className="py-4 font-semibold">{bid.myBid}</td>
                        <td className="py-4">
                          <span 
                            className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" 
                            style={{ backgroundColor: `${bid.color}15`, color: bid.color }}
                          >
                            {bid.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  className="px-4 py-2 bg-[#3A2D28] text-white text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors cursor-pointer"
                >
                  Create New Request
                </button>
              </div>

              <div className="space-y-4">
                {mockRfqs.map((rfq) => (
                  <div 
                    key={rfq.id} 
                    className="p-5 rounded-2xl border border-[#CBAD8D]/10 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#CBAD8D]/30 transition-all bg-[#FBF9F6]/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#3A2D28]">{rfq.shape}</span>
                        <span className="text-xs text-[#A48374]">• {rfq.carat} {rfq.color} {rfq.clarity}</span>
                      </div>
                      <p className="text-xs text-[#A48374] mt-1">Requested on {rfq.date} • Budget: <strong className="text-[#3A2D28]">{rfq.budget}</strong></p>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#CBAD8D]/15 text-[#A48374]">
                        {rfq.status}
                      </span>
                      <button className="p-2 rounded-full border border-[#CBAD8D]/20 text-[#A48374] hover:text-[#3A2D28] hover:bg-white transition-all cursor-pointer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
