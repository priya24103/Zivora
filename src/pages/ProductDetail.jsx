import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Sparkles, 
  ShoppingBag, 
  MessageSquare, 
  Check, 
  ShieldCheck, 
  Truck, 
  Award,
  Diamond as DiamondIcon,
  Crown,
  Calendar,
  Send,
  X,
  Handshake,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MakeOfferModal from '../components/MakeOfferModal';
import HeartButton from '../components/HeartButton';

const API_BASE = 'http://localhost:2409/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Component states
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  
  // Cart & Inquiry states
  const [addedToCart, setAddedToCart] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch product detail
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE}/products/${id}`);
        if (response.data.status === 'success') {
          const prodData = response.data.data.product;
          setProduct(prodData);
          if (prodData.images && prodData.images.length > 0) {
            setActiveImage(prodData.images[0]);
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Error loading product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const [isFavorited, setIsFavorited] = useState(false);

  // Check if item is in wishlist on load
  useEffect(() => {
    const checkWishlist = async () => {
      const token = localStorage.getItem('zivora_token');
      if (!token) return;
      try {
        const response = await axios.get(`${API_BASE}/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.status === 'success') {
          const items = response.data.data.wishlist.items || [];
          const favorited = items.some(item => item.productId?._id === id || item.productId === id);
          setIsFavorited(favorited);
        }
      } catch (e) {
        console.error('Error checking wishlist status:', e);
      }
    };

    if (id) checkWishlist();
  }, [id]);

  const handleToggleWishlist = async () => {
    const token = localStorage.getItem('zivora_token');
    if (!token) {
      alert('Please log in to save items to your wishlist.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/wishlist/toggle`, {
        productId: id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        const items = response.data.data.wishlist.items || [];
        const favorited = items.some(item => item.productId?._id === id || item.productId === id);
        setIsFavorited(favorited);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(`${API_BASE}/cart/add`, {
        productId: product._id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setAddedToCart(true);
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => setAddedToCart(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Could not add item to cart');
    }
  };

  const loggedInUser = JSON.parse(localStorage.getItem('zivora_user')) || {};
  const isRequestedByMe = product?.memoRequestedBy?.includes(loggedInUser._id || loggedInUser.id);

  const handleMemoRequest = async () => {
    const token = localStorage.getItem('zivora_token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE}/products/${product._id}/request-memo`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setProduct(prev => ({
          ...prev,
          memoRequestedBy: [...(prev.memoRequestedBy || []), loggedInUser._id]
        }));
        triggerToast('Memo request submitted successfully.');
      }
    } catch (err) {
      console.error('Memo request error:', err);
      alert(err.response?.data?.message || 'Could not request memo');
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;

    setInquirySending(true);
    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        // Save state or redirect to login
        navigate('/login');
        return;
      }

      // Check if conversation endpoints exist and send message
      // We will hit the conversations/send endpoint or fallback gracefully
      const payload = {
        recipientId: product.sellerId?._id || product.sellerId,
        text: `Inquiry regarding Product: ${product.title} (ID: ${product._id}). Message: ${inquiryMessage}`
      };

      await axios.post(`${API_BASE}/conversations/send`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInquirySuccess(true);
      setInquiryMessage('');
      setTimeout(() => {
        setInquirySuccess(false);
        setInquiryModalOpen(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Could not submit inquiry. Ensure you are signed in as a buyer.');
    } finally {
      setInquirySending(false);
    }
  };

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center" style={{ backgroundColor: '#F1EDE6' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-[#A48374] font-semibold">Gathering item credentials...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen py-16 px-6" style={{ backgroundColor: '#F1EDE6' }}>
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-[#E6DFD6] text-center shadow-sm">
          <X className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="font-serif text-lg text-[#3A2D28]">Item Not Available</h2>
          <p className="text-xs text-[#A48374] mt-2 leading-relaxed">
            The product you are trying to view does not exist or has been removed from our marketplace index.
          </p>
          <button 
            onClick={() => navigate('/products')}
            className="mt-6 px-6 py-2.5 bg-[#3A2D28] text-white text-xs font-semibold tracking-wider rounded-full hover:opacity-90 transition-opacity"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 md:px-8 lg:px-16" style={{ backgroundColor: '#F1EDE6' }}>
      
      {/* Back button */}
      <div className="max-w-6xl mx-auto mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-[32px] border border-[#E6DFD6] shadow-sm overflow-hidden p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* ========================================================
              LEFT COLUMN: IMAGE GALLERY
             ======================================================== */}
          <div className="space-y-6">
            {/* Main Stage Image */}
            <div className="relative aspect-square rounded-[24px] overflow-hidden bg-[#F7F3EF] border border-[#EBE3DB] flex items-center justify-center">
              {activeImage ? (
                <img 
                  src={activeImage} 
                  alt={product.title} 
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-center p-8">
                  <Sparkles className="w-12 h-12 text-[#CBAD8D] mx-auto mb-2 opacity-50" />
                  <span className="text-xs text-[#A48374] block uppercase font-bold tracking-widest">No Image Available</span>
                </div>
              )}

              {/* Status Tag */}
              <span 
                className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full text-[#3A2D28] shadow-sm"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)' }}
              >
                {product.category}
              </span>

              {/* Heart Wishlist Toggle */}
              <HeartButton
                isFavorited={isFavorited}
                onClick={handleToggleWishlist}
                className="absolute top-4 right-4 z-10"
              />

              {/* Yellow M symbol for Memo holds */}
              {product.status === 'on_memo' && (
                <span 
                  className="absolute top-4 right-16 w-6 h-6 rounded-full bg-yellow-400 text-yellow-950 flex items-center justify-center text-xs font-black shadow-md border border-yellow-300 animate-pulse animate-duration-1000"
                  title="On Memo Hold"
                >
                  M
                </span>
              )}
            </div>

            {/* Thumbnail Selection */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-xl overflow-hidden bg-[#F7F3EF] border transition-all flex-shrink-0 ${
                      activeImage === img ? 'border-[#A48374] ring-2 ring-[#A48374]/20' : 'border-[#E6DFD6] hover:border-[#A48374]'
                    }`}
                  >
                    <img src={img} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Premium Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#F7F3EF] text-center">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-[#A48374] mb-1.5" />
                <span className="text-[10px] font-bold text-[#3A2D28] uppercase tracking-wider">Secured Vault</span>
                <span className="text-[8px] text-[#A48374] mt-0.5">Fully Insured Escrow</span>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="w-5 h-5 text-[#A48374] mb-1.5" />
                <span className="text-[10px] font-bold text-[#3A2D28] uppercase tracking-wider">FedEx Priority</span>
                <span className="text-[8px] text-[#A48374] mt-0.5">Free Insured Shipping</span>
              </div>
              <div className="flex flex-col items-center">
                <Award className="w-5 h-5 text-[#A48374] mb-1.5" />
                <span className="text-[10px] font-bold text-[#3A2D28] uppercase tracking-wider">Certified</span>
                <span className="text-[8px] text-[#A48374] mt-0.5">GIA/IGI Authenticated</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: PRODUCT DETAILS & SPECS
             ======================================================== */}
          <div className="flex flex-col justify-between">
            
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-2">
                {product.category === 'Diamond' ? (
                  <span className="flex items-center gap-1"><DiamondIcon className="w-3.5 h-3.5 text-[#CBAD8D]" /> Loose Diamond</span>
                ) : (
                  <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-[#CBAD8D]" /> Fine Jewelry</span>
                )}
                <span>•</span>
                <span>Ref: {product._id.substring(18).toUpperCase()}</span>
              </div>
              
              <h1 className="text-3xl font-serif text-[#3A2D28] leading-tight mb-3">
                {product.title}
              </h1>

              {/* Seller Reference Card */}
              <div className="inline-flex items-center gap-2.5 bg-[#F7F3EF]/70 px-4 py-2 rounded-2xl border border-[#EBE3DB] mb-6">
                <div className="w-8 h-8 rounded-full bg-[#A48374] text-white flex items-center justify-center text-xs font-bold">
                  {product.sellerId?.name ? product.sellerId.name[0] : 'S'}
                </div>
                <div>
                  <p className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">Authorized Merchant</p>
                  <p className="text-xs text-[#3A2D28] font-bold">{product.sellerId?.name || 'Zivora Premium Seller'}</p>
                </div>
                {product.sellerId?.createdAt && (
                  <span className="text-[8px] text-[#CBAD8D] font-medium border-l border-[#CBAD8D]/20 pl-2.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Member since {new Date(product.sellerId.createdAt).getFullYear()}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-4 text-xs text-[#3A2D28]/80 leading-relaxed mb-6">
                <p>{product.description}</p>
              </div>

              {/* Price & Stock status */}
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-3xl font-serif font-bold text-[#3A2D28]">
                  {formatINR(product.price)}
                </span>
                <span className="text-xs font-semibold tracking-widest text-[#A48374] uppercase">
                  (VAT Inclusive)
                </span>
              </div>

              {/* ========================================================
                  DYNAMIC SPECIFICATIONS TABLE
                 ======================================================== */}
              <div className="bg-[#FBF9F6] rounded-2xl border border-[#E6DFD6] p-5 mb-8">
                <h3 className="font-serif text-sm text-[#3A2D28] mb-4 pb-2 border-b border-[#E6DFD6]">
                  Technical Specifications
                </h3>

                {product.category === 'Diamond' ? (
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Carat Weight</span>
                      <span className="text-[#3A2D28] font-semibold">{product.carat} ct</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Shape Cut</span>
                      <span className="text-[#3A2D28] font-semibold">{product.shape}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Color Grade</span>
                      <span className="text-[#3A2D28] font-semibold">{product.color}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Clarity Grade</span>
                      <span className="text-[#3A2D28] font-semibold">{product.clarity}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Cut Quality</span>
                      <span className="text-[#3A2D28] font-semibold">{product.cut || 'Excellent'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Certification Lab</span>
                      <span className="text-[#3A2D28] font-semibold">{product.certificateLab || 'None'}</span>
                    </div>
                    {product.certificateNumber && (
                      <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5 col-span-2">
                        <span className="text-[#A48374] font-medium">Certificate ID</span>
                        <span className="text-[#3A2D28] font-semibold">{product.certificateNumber}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Jewelry Type</span>
                      <span className="text-[#3A2D28] font-semibold">{product.jewelryType}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Metal Composition</span>
                      <span className="text-[#3A2D28] font-semibold">{product.metalType}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Metal Weight</span>
                      <span className="text-[#3A2D28] font-semibold">{product.weightGrams} grams</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1.5">
                      <span className="text-[#A48374] font-medium">Gender Alignment</span>
                      <span className="text-[#3A2D28] font-semibold">{product.gender}</span>
                    </div>
                    {product.diamondDetails && (
                      <div className="col-span-2 border-b border-[#F7F3EF] pb-1.5 flex flex-col gap-1">
                        <span className="text-[#A48374] font-medium">Diamond Accents</span>
                        <span className="text-[#3A2D28] font-semibold bg-[#F7F3EF] p-2.5 rounded-xl block mt-0.5 leading-relaxed">
                          {product.diamondDetails}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 py-4 rounded-full text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg shadow-sm"
                  style={{ 
                    background: product.stock > 0 
                      ? 'linear-gradient(135deg, #A48374, #3A2D28)' 
                      : 'rgb(203,173,141)',
                    opacity: product.stock > 0 ? 1 : 0.6
                  }}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      Added to Collection
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      {product.stock > 0 ? 'Secure Acquisition' : 'Sold Out'}
                    </>
                  )}
                </button>

                {product.status !== 'memo' && product.status !== 'on_memo' && product.status !== 'sold' && (
                  <button
                    onClick={handleMemoRequest}
                    disabled={isRequestedByMe}
                    className={`flex-1 py-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                      isRequestedByMe
                        ? 'bg-[#FAF8F6] border-[#E6DFD6] text-gray-400 cursor-not-allowed'
                        : 'border-[#A48374] text-[#A48374] hover:bg-[#F7F3EF] bg-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {isRequestedByMe ? 'Memo Requested (Pending)' : 'Request 48h Memo'}
                  </button>
                )}

                <button 
                  onClick={() => setOfferModalOpen(true)}
                  disabled={product.stock <= 0}
                  className="flex-1 py-4 rounded-full text-[#A48374] text-xs font-semibold uppercase tracking-wider border border-[#A48374] bg-white transition-colors flex items-center justify-center gap-2 hover:bg-[#F7F3EF] cursor-pointer"
                >
                  <Handshake className="w-4 h-4" />
                  Make an Offer
                </button>
              </div>

              <button 
                onClick={() => setInquiryModalOpen(true)}
                className="w-full py-4 rounded-full text-[#3A2D28] text-xs font-semibold uppercase tracking-wider border border-[#E6DFD6] bg-white transition-colors flex items-center justify-center gap-2 hover:bg-[#F7F3EF] cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#A48374]" />
                Make an Inquiry / RFQ
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================
          INQUIRY MODAL DIALOG
         ======================================================== */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div 
            onClick={() => setInquiryModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-[32px] w-full max-w-lg p-6 md:p-10 border border-[#CBAD8D]/25 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setInquiryModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer text-[#3A2D28]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#CBAD8D] font-bold block mb-1">Direct Sourcing</span>
              <h3 className="font-serif text-2xl text-[#3A2D28]">Submit Sourcing Inquiry</h3>
              <p className="text-[11px] text-[#A48374] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Send a purchase offer, ask for customized certifications, or query shipping terms directly to the merchant.
              </p>
            </div>

            {inquirySuccess ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-serif text-[#3A2D28] text-lg">Inquiry Transmitted</h4>
                <p className="text-[11px] text-[#A48374] mt-2">
                  Your inquiry message has been submitted. Check your conversations panel for merchant replies.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                {/* Prefilled Item details */}
                <div className="bg-[#F7F3EF]/70 p-4 rounded-2xl border border-[#EBE3DB] flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#E6DFD6] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt="thumb" className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#CBAD8D]" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs text-[#3A2D28] font-bold line-clamp-1">{product.title}</h5>
                    <p className="text-[10px] text-[#A48374] font-medium mt-0.5">{product.category} • {formatINR(product.price)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-1.5">
                    Your Message details
                  </label>
                  <textarea
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Provide pricing inquiries, custom resizing requests, or request for shipping arrangements..."
                    className="w-full px-4 py-3 text-xs bg-[#F7F3EF]/30 border border-[#CBAD8D]/25 focus:outline-none focus:border-[#A48374] rounded-2xl text-[#3A2D28] leading-normal"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={inquirySending || !inquiryMessage.trim()}
                    className="flex-1 py-3.5 rounded-full text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    style={{ 
                      background: 'linear-gradient(135deg, #A48374, #3A2D28)',
                      opacity: inquirySending || !inquiryMessage.trim() ? 0.7 : 1
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {inquirySending ? 'Transmitting...' : 'Send Inquiry'}
                  </button>

                  {product.category === 'Diamond' && (
                    <button
                      type="button"
                      onClick={() => navigate('/rfq/create')}
                      className="px-5 py-3.5 rounded-full text-[#3A2D28] text-xs font-semibold uppercase tracking-wider border border-[#E6DFD6] hover:bg-[#F7F3EF] transition-colors cursor-pointer"
                    >
                      Bespoke RFQ
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        product={product}
      />

      {/* Luxury Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3.5 rounded-full shadow-2xl z-[9999] border border-[#CBAD8D]/30 flex items-center gap-2"
          >
            <Clock className="w-3.5 h-3.5 text-[#CBAD8D]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
