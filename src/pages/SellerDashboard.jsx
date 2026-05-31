import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SellerDashboard() {
  const navigate = useNavigate();
  
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
      kycStatus: 'pending',
      kycRemarks: 'Verification usually completes within 24-48 business hours.'
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zivora_token');
    localStorage.removeItem('zivora_user');
    navigate('/login');
  };

  // Mock listing inventory
  const mockInventory = [
    { id: 'i1', name: 'Round Brilliant 2.1ct D IF GIA', price: '$32,500', bids: '5 bids', status: 'In Auction' },
    { id: 'i2', name: 'Emerald Cut 3.0ct E VVS1 GIA', price: '$48,000', bids: '0 bids', status: 'Fixed Price' },
    { id: 'i3', name: 'Cushion Cut 1.5ct F VS2 GIA', price: '$12,200', bids: '--', status: 'Draft' }
  ];

  // Map KYC status style
  const kycStatus = user.sellerProfile?.kycStatus || 'pending';
  const kycRemarks = user.sellerProfile?.kycRemarks || 'Your business documents are currently being processed.';

  return (
    <div className="min-h-screen py-12 px-6 lg:px-16" style={{ backgroundColor: '#F7F3EF' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* ─── DASHBOARD HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.35em]" style={{ color: '#A48374' }}>Seller Console</span>
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

        {/* ─── KYC VERIFICATION BANNER ───────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-6 rounded-3xl border flex flex-col md:flex-row items-start gap-4"
          style={{ 
            backgroundColor: kycStatus === 'approved' ? '#ECFDF5' : kycStatus === 'rejected' ? '#FEF2F2' : '#FFFBEB',
            borderColor: kycStatus === 'approved' ? '#A7F3D0' : kycStatus === 'rejected' ? '#FCA5A5' : '#FDE68A',
            color: kycStatus === 'approved' ? '#065F46' : kycStatus === 'rejected' ? '#991B1B' : '#92400E'
          }}
        >
          <div className="p-3 rounded-2xl flex-shrink-0" style={{ backgroundColor: kycStatus === 'approved' ? '#D1FAE5' : kycStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7' }}>
            {kycStatus === 'approved' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold uppercase tracking-wider">
              KYC Status: {kycStatus}
            </h3>
            <p className="text-xs mt-1.5 leading-relaxed opacity-90">
              {kycStatus === 'pending' && `Your seller credentials are undergoing official verification. Our compliance managers are verifying GST (${user.sellerProfile?.gstNumber}) and PAN (${user.sellerProfile?.panNumber}) details.`}
              {kycStatus === 'approved' && "Congratulations! Your Zivora Seller Profile is fully approved. You have full listing privileges on live auctions and search catalogues."}
              {kycStatus === 'rejected' && "Verification was unsuccessful. Please check your remarks below or re-submit valid credentials."}
            </p>
            {kycRemarks && (
              <div className="mt-3 text-xs italic opacity-80 pl-3 border-l-2" style={{ borderColor: 'currentColor' }}>
                Remarks: "{kycRemarks}"
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ─── LEFT COLUMN: PROFILE & DATA INFO ──────────────────────── */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #CBAD8D, #A48374)' }}>
                  <span className="text-2xl font-light">{user.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#3A2D28]">{user.name}</h3>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(203,173,141,0.2)', color: '#A48374' }}>
                    Seller Profile
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
                
                {user.sellerProfile && (
                  <>
                    <div className="h-px bg-[#CBAD8D]/10 my-3" />
                    <div className="flex items-start gap-3 text-[#3A2D28]">
                      <FileText className="w-4 h-4 mt-0.5 text-[#A48374]" />
                      <div className="text-xs">
                        <p className="font-bold text-[#A48374] uppercase tracking-wider">PAN Number</p>
                        <p className="mt-0.5 font-mono">{user.sellerProfile.panNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-[#3A2D28]">
                      <FileText className="w-4 h-4 mt-0.5 text-[#A48374]" />
                      <div className="text-xs">
                        <p className="font-bold text-[#A48374] uppercase tracking-wider">GST Number</p>
                        <p className="mt-0.5 font-mono">{user.sellerProfile.gstNumber}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10">
                <Diamond className="w-6 h-6 text-[#A48374] mb-3" />
                <p className="text-2xl font-light text-[#3A2D28]">12</p>
                <p className="text-xs uppercase tracking-wider text-[#A48374] mt-1">Listed Gems</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10">
                <Gavel className="w-6 h-6 text-[#A48374] mb-3" />
                <p className="text-2xl font-light text-[#3A2D28]">2</p>
                <p className="text-xs uppercase tracking-wider text-[#A48374] mt-1">Live Auctions</p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: INVENTORY CONTROL PANEL ─────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Inventory Table */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Diamond className="w-5 h-5 text-[#A48374]" />
                  <h3 className="text-xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>Inventory Catalog</h3>
                </div>
                <button 
                  disabled={kycStatus !== 'approved'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3A2D28] text-white text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  List Diamond
                </button>
              </div>

              {kycStatus !== 'approved' && (
                <div className="p-4 mb-6 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-2 text-xs text-[#92400E]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Listing is disabled until your KYC compliance undergoes official approval.</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#CBAD8D]/15 text-[#A48374] text-xs uppercase tracking-wider font-semibold">
                      <th className="pb-3">Stone Properties</th>
                      <th className="pb-3">List Price</th>
                      <th className="pb-3">Auction Bids</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBAD8D]/10">
                    {mockInventory.map((item) => (
                      <tr key={item.id} className="text-[#3A2D28] hover:bg-[#FBF9F6]/50 transition-colors">
                        <td className="py-4 font-medium flex items-center gap-2">
                          <Diamond className="w-3.5 h-3.5 text-[#CBAD8D]" />
                          {item.name}
                        </td>
                        <td className="py-4 font-semibold">{item.price}</td>
                        <td className="py-4">{item.bids}</td>
                        <td className="py-4">
                          <span 
                            className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider" 
                            style={{ 
                              backgroundColor: item.status === 'In Auction' ? 'rgba(203,173,141,0.25)' : item.status === 'Draft' ? '#F1EDE6' : 'rgba(16,185,129,0.1)', 
                              color: item.status === 'In Auction' ? '#A48374' : item.status === 'Draft' ? '#6B5549' : '#10B981'
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
