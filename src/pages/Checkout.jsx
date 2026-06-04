import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Sparkles, CreditCard, Lock, ArrowLeft } from 'lucide-react';

const API_BASE = 'http://localhost:2409/api';

export default function Checkout() {
  const navigate = useNavigate();
  
  // Cart & Loading states
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: ''
  });

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        const cartData = response.data.data.cart;
        setCart(cartData);
        if (!cartData.items || cartData.items.length === 0) {
          navigate('/cart'); // redirect if cart empty
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching cart details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setCheckoutLoading(true);

    // Validate inputs
    const { fullName, streetAddress, city, state, zipCode, phoneNumber } = shippingAddress;
    if (!fullName || !streetAddress || !city || !state || !zipCode || !phoneNumber) {
      setError('Please fill in all shipping details.');
      setCheckoutLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `${API_BASE}/orders/checkout`,
        { shippingAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        const orderId = response.data.data.order._id;
        // Dispatch custom storage event to update Header badge count to 0 in real-time
        window.dispatchEvent(new Event('storage'));
        navigate('/order/success', { state: { orderId } });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to place order. Please review your details.');
    } finally {
      setCheckoutLoading(false);
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
      <div className="min-h-screen py-20 flex items-center justify-center" style={{ backgroundColor: '#F1EDE6' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-[#A48374] font-semibold">Preparing secure desk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4 md:px-8 lg:px-16" style={{ backgroundColor: '#F1EDE6' }}>
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shopping Bag
        </button>

        <h1 className="font-serif text-3xl text-[#3A2D28] mb-10 tracking-tight">Checkout</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Side: Form Sections */}
          <div className="lg:col-span-7 space-y-8">
            {/* Section 1: Shipping Information */}
            <div className="bg-white rounded-[28px] border border-[#E6DFD6] p-6 md:p-8 shadow-sm">
              <h2 className="font-serif text-lg text-[#3A2D28] mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#F7F3EF] text-xs font-bold text-[#A48374] flex items-center justify-center">1</span>
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    placeholder="Recipient's legal full name"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#F7F3EF]/30 border border-[#CBAD8D]/25 focus:outline-none focus:border-[#A48374] rounded-2xl text-[#3A2D28] leading-normal"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={shippingAddress.streetAddress}
                    onChange={handleInputChange}
                    placeholder="Suite, apartment, vault delivery details"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#F7F3EF]/30 border border-[#CBAD8D]/25 focus:outline-none focus:border-[#A48374] rounded-2xl text-[#3A2D28] leading-normal"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    placeholder="E.g., Mumbai"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#F7F3EF]/30 border border-[#CBAD8D]/25 focus:outline-none focus:border-[#A48374] rounded-2xl text-[#3A2D28] leading-normal"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    placeholder="E.g., Maharashtra"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#F7F3EF]/30 border border-[#CBAD8D]/25 focus:outline-none focus:border-[#A48374] rounded-2xl text-[#3A2D28] leading-normal"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-2">
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleInputChange}
                    placeholder="6-digit ZIP code"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#F7F3EF]/30 border border-[#CBAD8D]/25 focus:outline-none focus:border-[#A48374] rounded-2xl text-[#3A2D28] leading-normal"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={shippingAddress.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="10-digit number for delivery"
                    required
                    className="w-full px-4 py-3 text-xs bg-[#F7F3EF]/30 border border-[#CBAD8D]/25 focus:outline-none focus:border-[#A48374] rounded-2xl text-[#3A2D28] leading-normal"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Payment Placeholder */}
            <div className="bg-white rounded-[28px] border border-[#E6DFD6] p-6 md:p-8 shadow-sm">
              <h2 className="font-serif text-lg text-[#3A2D28] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#F7F3EF] text-xs font-bold text-[#A48374] flex items-center justify-center">2</span>
                Payment Method
              </h2>
              
              <div 
                className="rounded-2xl p-6 border-2 border-dashed border-[#CBAD8D]/30 text-center space-y-3"
                style={{ backgroundColor: '#FBF9F6' }}
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CreditCard className="w-5 h-5 text-[#A48374]" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2D28]">Secure Payment Gateway</h3>
                <p className="text-[11px] text-[#A48374] max-w-sm mx-auto leading-relaxed">
                  Stripe, Razorpay, or Direct Wire options will be integrated in Phase 2. Secure checkout and insurance escrow is activated by default.
                </p>
                <span className="inline-block text-[9px] uppercase tracking-wider font-bold text-[#A48374] px-3.5 py-1.5 rounded-full bg-[#F7F3EF]">
                  Sandbox Escrow Mode Active
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Order Review & Button */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[28px] border border-[#E6DFD6] p-6 md:p-8 shadow-sm">
              <h2 className="font-serif text-lg text-[#3A2D28] mb-6 pb-3 border-b border-[#F7F3EF]">
                Order Review
              </h2>

              {/* Items List */}
              <div className="divide-y divide-[#F7F3EF] max-h-60 overflow-y-auto mb-6 pr-1">
                {cart && cart.items && cart.items.map((item) => {
                  const prod = item.productId || {};
                  return (
                    <div key={item._id} className="py-3 flex justify-between gap-4 text-xs">
                      <div className="flex-1">
                        <p className="font-semibold text-[#3A2D28] line-clamp-1">{prod.title}</p>
                        <p className="text-[10px] text-[#A48374] mt-0.5">{prod.category} • Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-[#3A2D28] flex-shrink-0">
                        {formatINR(prod.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Totals */}
              <div className="space-y-3.5 text-xs border-t border-[#F7F3EF] pt-4">
                <div className="flex justify-between text-[#A48374]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#3A2D28]">{cart ? formatINR(cart.cartTotal) : '₹0'}</span>
                </div>
                <div className="flex justify-between text-[#A48374]">
                  <span>Shipping (Priority Vault)</span>
                  <span className="text-green-600 font-semibold uppercase tracking-wider">Free</span>
                </div>
                
                <div className="pt-4 border-t border-[#F7F3EF] flex justify-between items-baseline">
                  <span className="text-sm font-serif text-[#3A2D28]">Total Due</span>
                  <span className="text-xl font-serif font-bold text-[#3A2D28]">
                    {cart ? formatINR(cart.cartTotal) : '₹0'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full mt-8 py-4 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                {checkoutLoading ? 'Processing Securely...' : 'Place Secure Order'}
              </button>

              <div className="mt-6 flex items-center gap-2 justify-center text-[9px] text-[#A48374] uppercase tracking-wider font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#A48374]" />
                Authorized SSL Encryption Shield
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
