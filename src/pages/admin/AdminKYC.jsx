import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { 
  FileText, 
  User, 
  Calendar, 
  Eye, 
  Check, 
  X, 
  AlertCircle,
  Building,
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:2409/api';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

export default function AdminKYC() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKycQueue = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zivora_admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/kyc-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setSellers(response.data.data.sellers);
      }
    } catch (err) {
      console.error('Error fetching KYC queue:', err);
      setError(err.response?.data?.message || 'Failed to fetch KYC request queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycQueue();
  }, [navigate]);

  const handleKycAction = async (userId, action) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('zivora_admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/admin/kyc/${userId}/action`, 
        { action }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        // Remove seller from queue
        setSellers(prev => prev.filter(s => s._id !== userId));
        setSelectedSeller(null);
      }
    } catch (err) {
      console.error('Error executing KYC action:', err);
      alert(err.response?.data?.message || 'Action execution failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const isImageFile = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.webp');
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 md:p-10 font-sans min-h-screen"
      style={{ backgroundColor: '#F1EDE6' }}
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#A48374]/20 pb-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl text-[#3A2D28] tracking-tight" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
            eKYC Document Review
          </h1>
          <p className="text-xs text-[#A48374] mt-1.5 tracking-wide uppercase font-semibold">
            Compliance & Verification Queue
          </p>
        </div>
        <div className="mt-4 sm:mt-0 bg-[#A48374]/10 text-[#A48374] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Compliance Officer Desk
        </div>
      </div>

      {/* Main Queue View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#A48374] mt-4 italic">Loading queue requests...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50/60 border border-red-200/50 rounded-2xl p-6 flex items-start gap-4 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs text-red-800 uppercase tracking-wide">Queue Retrieval Error</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      ) : sellers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#A48374]/20 p-12 text-center shadow-sm">
          <ShieldCheck className="w-12 h-12 text-[#A48374] mx-auto opacity-40 mb-4" />
          <h3 className="text-lg font-medium text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>All Caught Up!</h3>
          <p className="text-xs text-[#A48374] mt-1.5">There are no pending seller eKYC submissions in the review queue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#A48374]/20 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#A48374]/15 text-[#A48374] uppercase tracking-wider text-[10px] font-bold bg-[#FBF9F6]/50">
                <th className="py-4 px-6">Business / Company</th>
                <th className="py-4 px-6">Owner / Applicant</th>
                <th className="py-4 px-6">Registration Date</th>
                <th className="py-4 px-6 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <motion.tr 
                  key={seller._id}
                  variants={rowVariants}
                  className="border-b border-[#A48374]/10 hover:bg-[#FBF9F6]/30 text-[#3A2D28] transition-colors"
                >
                  <td className="py-4.5 px-6 font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#A48374]" /> 
                    <div>
                      <p className="font-semibold">{seller.company || 'Registered Business'}</p>
                      <p className="text-[10px] text-[#A48374] font-mono mt-0.5">GST: {seller.sellerProfile?.gstNumber || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="py-4.5 px-6 font-medium">
                    <div>
                      <p className="font-semibold">{seller.name}</p>
                      <p className="text-[10px] text-[#A48374] font-normal">{seller.email}</p>
                    </div>
                  </td>
                  <td className="py-4.5 px-6 text-[#A48374] font-medium">
                    {seller.createdAt 
                      ? new Date(seller.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'N/A'
                    }
                  </td>
                  <td className="py-4.5 px-6 text-right">
                    <button 
                      onClick={() => setSelectedSeller(seller)}
                      className="px-4 py-1.5 border border-[#A48374]/55 hover:border-[#3A2D28] text-xs font-semibold rounded-full text-[#A48374] hover:text-[#3A2D28] transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review Documents
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Drawer/Modal */}
      <AnimatePresence>
        {selectedSeller && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSeller(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-y-6 right-6 w-full max-w-2xl bg-white border border-[#A48374]/35 shadow-2xl rounded-3xl z-50 overflow-hidden flex flex-col font-sans"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#A48374]/15 flex items-center justify-between bg-[#FBF9F6]">
                <div>
                  <h3 className="text-lg text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                    eKYC Document Verification
                  </h3>
                  <p className="text-[10px] text-[#A48374] uppercase tracking-widest font-bold mt-0.5">
                    {selectedSeller.company || 'Business Review'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSeller(null)}
                  className="p-1.5 rounded-full hover:bg-[#F1EDE6]/60 text-[#A48374] hover:text-[#3A2D28] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Details Section */}
                <div className="bg-[#FBF9F6]/75 border border-[#A48374]/10 rounded-2xl p-5 text-xs text-[#3A2D28]">
                  <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#A48374] mb-3">Applicant Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-[#A48374] uppercase tracking-wide">Owner Name</p>
                        <p className="font-semibold">{selectedSeller.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-[#A48374] uppercase tracking-wide">Email</p>
                        <p className="font-semibold">{selectedSeller.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-[#A48374] uppercase tracking-wide">Registration Date</p>
                        <p className="font-semibold">
                          {selectedSeller.createdAt 
                            ? new Date(selectedSeller.createdAt).toLocaleString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-[#A48374] uppercase tracking-wide">GST Number</p>
                        <p className="font-semibold font-mono">{selectedSeller.sellerProfile?.gstNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#A48374] flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-[#A48374] uppercase tracking-wide">PAN Number</p>
                        <p className="font-semibold font-mono">{selectedSeller.sellerProfile?.panNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Previews */}
                <div className="space-y-6">
                  {/* GST Documents */}
                  <div>
                    <h3 className="text-xs uppercase tracking-wider font-bold text-[#A48374] mb-3">GST & Business Certificates</h3>
                    {selectedSeller.sellerProfile?.businessProofUrl && selectedSeller.sellerProfile.businessProofUrl.length > 0 ? (
                      selectedSeller.sellerProfile.businessProofUrl.map((docUrl, idx) => (
                        <div key={idx} className="border border-[#A48374]/15 rounded-2xl p-4 bg-white shadow-sm mb-4">
                          <div className="flex items-center justify-between mb-3 border-b border-[#A48374]/10 pb-2.5">
                            <h4 className="text-xs font-bold text-[#3A2D28] flex items-center gap-1.5">
                              <Building className="w-4 h-4 text-[#A48374]" /> Business Proof Document #{idx + 1}
                            </h4>
                            <a 
                              href={docUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[10px] font-bold text-[#A48374] hover:text-[#3A2D28] flex items-center gap-1 hover:underline"
                            >
                              Open Original <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          
                          {isImageFile(docUrl) ? (
                            <div className="h-64 rounded-xl overflow-hidden bg-[#FBF9F6] border border-[#A48374]/10 flex items-center justify-center">
                              <img 
                                src={docUrl} 
                                alt={`Business Proof ${idx + 1}`} 
                                className="max-h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="py-8 bg-[#FBF9F6] border border-dashed border-[#A48374]/20 rounded-xl text-center">
                              <FileText className="w-10 h-10 text-[#A48374] mx-auto opacity-70 mb-2" />
                              <span className="text-xs text-[#3A2D28] block font-semibold">PDF Document Uploaded</span>
                              <a 
                                href={docUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 bg-[#A48374] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity"
                              >
                                View PDF In New Tab
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#A48374] italic">No GST or Business proof documents uploaded.</p>
                    )}
                  </div>

                  {/* PAN Card / ID Document */}
                  <div>
                    <h3 className="text-xs uppercase tracking-wider font-bold text-[#A48374] mb-3">PAN & Identification Certificates</h3>
                    {selectedSeller.sellerProfile?.idProofUrl ? (
                      <div className="border border-[#A48374]/15 rounded-2xl p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-[#A48374]/10 pb-2.5">
                          <h4 className="text-xs font-bold text-[#3A2D28] flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#A48374]" /> Identification Proof
                          </h4>
                          <a 
                            href={selectedSeller.sellerProfile.idProofUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] font-bold text-[#A48374] hover:text-[#3A2D28] flex items-center gap-1 hover:underline"
                          >
                            Open Original <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        
                        {isImageFile(selectedSeller.sellerProfile.idProofUrl) ? (
                          <div className="h-64 rounded-xl overflow-hidden bg-[#FBF9F6] border border-[#A48374]/10 flex items-center justify-center">
                            <img 
                              src={selectedSeller.sellerProfile.idProofUrl} 
                              alt="ID Proof" 
                              className="max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="py-8 bg-[#FBF9F6] border border-dashed border-[#A48374]/20 rounded-xl text-center">
                            <FileText className="w-10 h-10 text-[#A48374] mx-auto opacity-70 mb-2" />
                            <span className="text-xs text-[#3A2D28] block font-semibold">PDF Document Uploaded</span>
                            <a 
                              href={selectedSeller.sellerProfile.idProofUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 bg-[#A48374] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity"
                            >
                              View PDF In New Tab
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#A48374] italic">No identification proof documents uploaded.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar Footer */}
              <div className="p-6 border-t border-[#A48374]/15 bg-[#FBF9F6] grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleKycAction(selectedSeller._id, 'reject')}
                  disabled={actionLoading}
                  className="py-3 border border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider rounded-full hover:bg-red-50/50 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-center"
                >
                  {actionLoading ? 'Executing...' : 'Reject Documents'}
                </button>
                <button
                  onClick={() => handleKycAction(selectedSeller._id, 'approve')}
                  disabled={actionLoading}
                  className="py-3 text-white font-bold text-xs uppercase tracking-wider rounded-full hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  style={{ backgroundColor: '#A48374' }}
                >
                  {actionLoading ? (
                    'Executing...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Approve Seller
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
