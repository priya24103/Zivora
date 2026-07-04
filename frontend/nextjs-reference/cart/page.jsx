'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:2409/api';

export default function NextCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCart = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('zivora_token') : null;
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setCart(response.data.data.cart);
      } else {
        setError('Failed to fetch cart details');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading your shopping bag.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemoveItem = async (productId) => {
    setActionLoading(productId);
    try {
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.delete(`${API_BASE}/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setCart(response.data.data.cart);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Could not remove item');
    } finally {
      setActionLoading(null);
    }
  };

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('zivora_token') : null;

  if (!token) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center bg-[#F1EDE6]">
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 border border-[#E6DFD6] text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F7F3EF] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-[#A48374]" />
          </div>
          <h2 className="font-serif text-2xl text-[#3A2D28] mb-3">Sign In Required</h2>
          <p className="text-xs text-[#A48374] leading-relaxed mb-8">
            To view your cart and proceed to checkout, please sign in to your Zivora account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3.5 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity"
          >
            Sign In to Zivora
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center bg-[#F1EDE6]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-[#A48374] font-semibold">Opening jewelry box...</p>
        </div>
      </div>
    );
  }

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <div className="min-h-screen py-16 px-4 md:px-8 lg:px-16 bg-[#F1EDE6]">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl text-[#3A2D28] mb-10 tracking-tight">Shopping Bag</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-100">
            {error}
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
              onClick={() => router.push('/products')}
              className="px-8 py-4 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left Side: Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.items.map((item) => {
                const prod = item.productId || {};
                const imageSrc = prod.images && prod.images.length > 0 ? prod.images[0] : '';

                return (
                  <div
                    key={item._id || prod._id}
                    className="bg-white rounded-3xl p-5 md:p-6 border border-[#E6DFD6] flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="flex gap-4 md:gap-6 items-center flex-1">
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

                    <div className="flex md:flex-col justify-between items-center md:items-end w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#F7F3EF] mt-2 md:mt-0">
                      <div className="font-serif text-base md:text-lg font-bold text-[#3A2D28] mb-1">
                        {formatINR(prod.price * item.quantity)}
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(prod._id)}
                        disabled={actionLoading === prod._id}
                        className="text-[10px] uppercase tracking-widest font-bold text-[#A48374] hover:text-red-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 py-1"
                      >
                        {actionLoading === prod._id ? 'Removing...' : (
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
                    <span className="font-semibold text-[#3A2D28]">{formatINR(cart.cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#A48374]">
                    <span>Estimated Shipping</span>
                    <span className="text-green-600 font-semibold uppercase tracking-wider">Free</span>
                  </div>

                  <div className="pt-4 border-t border-[#F7F3EF] flex justify-between items-baseline">
                    <span className="text-sm font-serif text-[#3A2D28]">Total (VAT Incl.)</span>
                    <span className="text-lg md:text-xl font-serif font-bold text-[#3A2D28]">
                      {formatINR(cart.cartTotal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full mt-8 py-4 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
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
