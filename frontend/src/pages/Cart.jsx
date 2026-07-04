import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Trash2, ShoppingBag, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_BASE = 'http://localhost:2409/api';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartTotal,
    removeFromCart,
    checkoutCart,
    loading,
    error,
    setError
  } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // stores productId being removed
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) return;

      setLoadingOrders(true);
      const response = await axios.get(`${API_BASE}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        const myOrders = response.data.data.orders || [];
        const pending = myOrders.filter(o => o.paymentStatus === 'pending' && o.orderStatus !== 'cancelled');
        setPendingOrders(pending);
      }
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCancelPendingOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this pending checkout and restore the items to your bag?')) return;
    try {
      const token = localStorage.getItem('zivora_token');
      const response = await axios.post(`${API_BASE}/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        alert('Order cancelled and items restored to bag successfully.');
        fetchPendingOrders();
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Could not cancel order');
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    window.addEventListener('storage', fetchPendingOrders);
    return () => window.removeEventListener('storage', fetchPendingOrders);
  }, []);

  const handleRemoveItem = async (productId) => {
    setActionLoading(productId);
    await removeFromCart(productId);
    setActionLoading(null);
  };

  const handleCheckout = async () => {
    setError(null);
    setCheckoutLoading(true);
    try {
      const orderId = await checkoutCart();
      if (orderId) {
        navigate(`/checkout/${orderId}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An item in your cart is out of stock.');
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

  const isLoggedIn = !!localStorage.getItem('zivora_token');

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center animate-fade-in" style={{ backgroundColor: '#F1EDE6' }}>
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 border border-[#E6DFD6] text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F7F3EF] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-[#A48374]" />
          </div>
          <h2 className="font-serif text-2xl text-[#3A2D28] mb-3">Sign In Required</h2>
          <p className="text-xs text-[#A48374] leading-relaxed mb-8">
            To view your curated collection and proceed to purchase, please sign in to your Zivora account.
          </p>
          <Link
            to="/login"
            className="block w-full py-3.5 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity"
          >
            Sign In to Zivora
          </Link>
        </div>
      </div>
    );
  }

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center" style={{ backgroundColor: '#F1EDE6' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-[#A48374] font-semibold">Opening jewelry box...</p>
        </div>
      </div>
    );
  }

  const hasItems = cartItems && cartItems.length > 0;

  return (
    <div className="min-h-screen py-16 px-4 md:px-8 lg:px-16" style={{ backgroundColor: '#F1EDE6' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl text-[#3A2D28] mb-10 tracking-tight">Shopping Bag</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        {pendingOrders.length > 0 && (
          <div className="mb-10 p-6 md:p-8 bg-white border border-[#CBAD8D]/20 rounded-[28px] shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[#A48374] text-xs font-bold uppercase tracking-widest mb-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#A48374]"></span>
                Pending Checkout Found
              </div>
              <h2 className="font-serif text-xl text-[#3A2D28]">Incomplete Purchase Staging</h2>
              <p className="text-[11px] text-[#A48374] mt-1 leading-relaxed">
                You have active pending payments for diamonds or jewelry. You can resume checkout pay flow or release the items back to your shopping bag.
              </p>
            </div>

            <div className="divide-y divide-[#F7F3EF]">
              {pendingOrders.map((order) => (
                <div key={order._id} className="py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-xs first:pt-0 last:pb-0">
                  <div className="flex-1 space-y-2">
                    <div className="font-bold text-[#3A2D28]">
                      Order Staging ID: <span className="font-mono font-medium text-[#A48374]">{order._id}</span>
                    </div>
                    
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-[#3A2D28] flex gap-2">
                          <span className="font-semibold">• {item.title}</span>
                          <span className="text-[#A48374]">(Qty: {item.quantity})</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[13px] font-serif font-bold text-[#3A2D28]">
                      Total Due: {formatINR(order.totalAmount)}
                    </div>
                  </div>

                  <div className="flex gap-3.5 flex-wrap">
                    <button
                      onClick={() => handleCancelPendingOrder(order._id)}
                      className="px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-full font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px]"
                    >
                      Cancel Staging & Restore Cart
                    </button>
                    <button
                      onClick={() => navigate(`/checkout/${order._id}`)}
                      className="px-6 py-2.5 bg-[#3A2D28] hover:bg-[#A48374] text-white rounded-full font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px]"
                    >
                      Resume Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasItems ? (
          <div className="bg-white rounded-[32px] border border-[#E6DFD6] py-20 px-6 text-center shadow-sm max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-[#F7F3EF] rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-8 h-8 text-[#CBAD8D] opacity-60" />
            </div>
            <h2 className="font-serif text-2xl text-[#3A2D28] mb-3">Your jewelry box is currently empty</h2>
            <p className="text-xs text-[#A48374] max-w-sm mx-auto leading-relaxed mb-8">
              Explore Zivora's luxury selection of fine diamonds and handcrafted settings to start building your order.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left Side: Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => {
                const prod = item.productId || {};
                const imageSrc = prod.images && prod.images.length > 0 ? prod.images[0] : '';

                return (
                  <div
                    key={item._id || prod._id}
                    className="bg-white rounded-3xl p-5 md:p-6 border border-[#E6DFD6] flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="flex gap-4 md:gap-6 items-center flex-1">
                      {/* Image Thumbnail */}
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#F7F3EF] border border-[#EBE3DB] flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={prod.title || 'Product'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <Sparkles className="w-6 h-6 text-[#CBAD8D] opacity-50" />
                        )}
                      </div>

                      {/* Details */}
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-[#A48374] mb-1">
                          {prod.category}
                        </div>
                        <h3 className="font-serif text-[#3A2D28] text-sm md:text-base font-semibold leading-snug line-clamp-2 pr-4">
                          {prod.title || 'Premium Marketplace Item'}
                        </h3>
                        <p className="text-[11px] font-medium text-[#A48374] mt-1">
                          Quantity: <span className="text-[#3A2D28] font-bold">{item.quantity}</span>
                        </p>
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="flex md:flex-col justify-between items-center md:items-end w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#F7F3EF] mt-2 md:mt-0">
                      <div className="font-serif text-base md:text-lg font-bold text-[#3A2D28] mb-1">
                        {formatINR((prod.price || item.priceAtAdd || 0) * item.quantity)}
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(prod._id)}
                        disabled={actionLoading === prod._id}
                        className="text-[10px] uppercase tracking-widest font-bold text-[#A48374] hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 py-1"
                      >
                        {actionLoading === prod._id ? (
                          'Removing...'
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Side: Order Summary */}
            <div className="lg:col-span-1 lg:sticky lg:top-8">
              <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 md:p-8 shadow-sm">
                <h2 className="font-serif text-lg text-[#3A2D28] mb-6 pb-3 border-b border-[#F7F3EF]">
                  Order Summary
                </h2>

                <div className="space-y-4 text-xs">
                  <div className="flex justify-between text-[#A48374]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#3A2D28]">{formatINR(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#A48374]">
                    <span>Estimated Shipping</span>
                    <span className="text-green-600 font-semibold uppercase tracking-wider">Free</span>
                  </div>

                  <div className="pt-4 border-t border-[#F7F3EF] flex justify-between items-baseline">
                    <span className="text-sm font-serif text-[#3A2D28]">Total (VAT Incl.)</span>
                    <span className="text-lg md:text-xl font-serif font-bold text-[#3A2D28]">
                      {formatINR(cartTotal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full mt-8 py-4 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying Stock...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center gap-2 justify-center text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#A48374]" />
                  100% Insured Escrow Vault Delivery
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
