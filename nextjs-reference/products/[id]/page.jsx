'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  X,
  Send
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  
  const [addedToCart, setAddedToCart] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Fetch product detail (assuming REST API runs on backend url)
  useEffect(() => {
    const loadProductDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:2409/api/products/${id}`);
        const resultData = await res.json();
        
        if (resultData.status === 'success') {
          setProduct(resultData.data.product);
          if (resultData.data.product?.images?.length > 0) {
            setActiveImage(resultData.data.product.images[0]);
          }
        } else {
          setError(resultData.message || 'Product not found');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading product credentials.');
      } finally {
        setLoading(false);
      }
    };

    loadProductDetail();
  }, [id]);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;

    setInquirySending(true);
    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('http://localhost:2409/api/conversations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: product.sellerId?._id || product.sellerId,
          text: `Inquiry regarding Product: ${product.title} (ID: ${product._id}). Message: ${inquiryMessage}`
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setInquirySuccess(true);
        setInquiryMessage('');
        setTimeout(() => {
          setInquirySuccess(false);
          setInquiryModalOpen(false);
        }, 3000);
      } else {
        alert(data.message || 'Failed to submit inquiry.');
      }
    } catch (err) {
      console.error(err);
      alert('Could not submit inquiry. Ensure you are signed in.');
    } finally {
      setInquirySending(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center bg-[#F1EDE6]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-[#A48374] font-semibold">Retrieving specs...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen py-16 px-6 bg-[#F1EDE6]">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-[#E6DFD6] text-center shadow-sm">
          <X className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="font-serif text-lg text-[#3A2D28]">Product Not Found</h2>
          <p className="text-xs text-[#A48374] mt-2 leading-relaxed">
            This listing is no longer active in our database records.
          </p>
          <button onClick={() => router.push('/products')} className="mt-6 px-6 py-2.5 bg-[#3A2D28] text-white text-xs font-semibold rounded-full">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 md:px-8 lg:px-16 bg-[#F1EDE6] text-[#3A2D28]">
      
      {/* Back button */}
      <div className="max-w-6xl mx-auto mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-[32px] border border-[#E6DFD6] p-6 md:p-12 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* IMAGE GALLERY */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-[24px] overflow-hidden bg-[#F7F3EF] border border-[#EBE3DB] flex items-center justify-center">
              {activeImage ? (
                <img src={activeImage} alt={product.title} className="object-cover w-full h-full" />
              ) : (
                <Sparkles className="w-12 h-12 text-[#CBAD8D] opacity-50" />
              )}
              <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-white/95 rounded-full">
                {product.category}
              </span>
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-xl overflow-hidden bg-[#F7F3EF] border transition-all ${activeImage === img ? 'border-[#A48374] ring-2 ring-[#A48374]/20' : 'border-[#E6DFD6]'}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#F7F3EF] text-center">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-[#A48374]" />
                <span className="text-[10px] font-bold mt-1">Escrow Secured</span>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="w-5 h-5 text-[#A48374]" />
                <span className="text-[10px] font-bold mt-1">Insured Shipping</span>
              </div>
              <div className="flex flex-col items-center">
                <Award className="w-5 h-5 text-[#A48374]" />
                <span className="text-[10px] font-bold mt-1">Certified Genuine</span>
              </div>
            </div>
          </div>

          {/* DETAILS */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-2">
                {product.category === 'Diamond' ? 'Loose Diamond' : 'Fine Jewelry'}
                <span>•</span>
                <span>ID: {product._id.substring(18).toUpperCase()}</span>
              </div>
              
              <h1 className="text-3xl font-serif leading-tight mb-3">{product.title}</h1>

              {/* Seller reference */}
              <div className="inline-flex items-center gap-2.5 bg-[#F7F3EF]/70 px-4 py-2 rounded-2xl border border-[#EBE3DB] mb-6">
                <div className="w-8 h-8 rounded-full bg-[#A48374] text-white flex items-center justify-center text-xs font-bold">
                  {product.sellerId?.name ? product.sellerId.name[0] : 'S'}
                </div>
                <div>
                  <p className="text-[10px] text-[#A48374] uppercase font-semibold">Seller Profile</p>
                  <p className="text-xs font-bold">{product.sellerId?.name || 'Zivora Premium Seller'}</p>
                </div>
              </div>

              <p className="text-xs text-[#3A2D28]/80 leading-relaxed mb-6">{product.description}</p>

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-3xl font-serif font-bold">{formatINR(product.price)}</span>
                <span className="text-xs font-semibold tracking-widest text-[#A48374] uppercase">INR</span>
              </div>

              {/* SPEC TABLE */}
              <div className="bg-[#FBF9F6] rounded-2xl border border-[#E6DFD6] p-5 mb-8">
                <h3 className="font-serif text-sm mb-4 pb-2 border-b border-[#E6DFD6]">Specifications</h3>

                {product.category === 'Diamond' ? (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1">
                      <span className="text-[#A48374]">Carat</span>
                      <span className="font-semibold">{product.carat} ct</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1">
                      <span className="text-[#A48374]">Shape</span>
                      <span className="font-semibold">{product.shape}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1">
                      <span className="text-[#A48374]">Color</span>
                      <span className="font-semibold">{product.color}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1">
                      <span className="text-[#A48374]">Clarity</span>
                      <span className="font-semibold">{product.clarity}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1">
                      <span className="text-[#A48374]">Jewelry Type</span>
                      <span className="font-semibold">{product.jewelryType}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1">
                      <span className="text-[#A48374]">Metal</span>
                      <span className="font-semibold">{product.metalType}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1">
                      <span className="text-[#A48374]">Weight</span>
                      <span className="font-semibold">{product.weightGrams}g</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F7F3EF] pb-1">
                      <span className="text-[#A48374]">Gender</span>
                      <span className="font-semibold">{product.gender}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button 
                onClick={handleAddToCart}
                className="w-full py-4 rounded-full text-white text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#A48374] to-[#3A2D28]"
              >
                {addedToCart ? 'Added to Cart' : 'Add to Cart'}
              </button>

              <button 
                onClick={() => setInquiryModalOpen(true)}
                className="w-full py-4 rounded-full text-[#3A2D28] text-xs font-semibold uppercase tracking-wider border border-[#E6DFD6] bg-white hover:bg-[#F7F3EF]"
              >
                Make an Inquiry / RFQ
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* INQUIRY MODAL */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div onClick={() => setInquiryModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[32px] w-full max-w-lg p-6 md:p-10 border border-[#CBAD8D]/25 shadow-2xl z-10">
            <button onClick={() => setInquiryModalOpen(false)} className="absolute right-6 top-6 p-1 hover:bg-gray-100 rounded-full cursor-pointer text-[#3A2D28]">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h3 className="font-serif text-2xl text-[#3A2D28]">Sourcing Inquiry</h3>
              <p className="text-[11px] text-[#A48374] mt-1">Submit terms, resize inquiries, or shipping questions.</p>
            </div>

            {inquirySuccess ? (
              <div className="text-center py-6">
                <Check className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="text-xs font-semibold">Message submitted successfully</p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <textarea
                  rows={4}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full p-4 text-xs bg-[#F7F3EF]/30 border border-[#CBAD8D]/25 rounded-2xl text-[#3A2D28] focus:outline-none"
                  required
                />
                <button type="submit" disabled={inquirySending} className="w-full py-3 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-full flex items-center justify-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  {inquirySending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
