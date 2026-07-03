import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { X, Trash2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    checkoutCart,
    loading
  } = useCart();

  const [checkoutError, setCheckoutError] = useState(null);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    setCheckoutError(null);
    try {
      const orderId = await checkoutCart();
      if (orderId) {
        setIsCartOpen(false);
        navigate(`/checkout/${orderId}`);
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err.message || 'An item in your cart is out of stock.');
      // Auto-hide the error toast after 5 seconds
      setTimeout(() => setCheckoutError(null), 5000);
    }
  };

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        {/* Drawer Panel */}
        <div 
          className="w-screen max-w-md bg-[#F1EDE6] flex flex-col shadow-2xl transition-transform duration-300 translate-x-0 relative border-l border-[#E6DFD6]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E6DFD6] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A48374]" />
              <h2 className="font-serif text-lg font-bold text-[#3A2D28] tracking-tight">Shopping Bag</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-[#F1EDE6] text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification for Stock Error */}
          {checkoutError && (
            <div className="absolute top-18 left-4 right-4 z-50 bg-[#3A2D28] text-[#F1EDE6] p-4 rounded-2xl shadow-lg border border-[#A48374]/30 flex items-start gap-3 animate-bounce">
              <AlertCircle className="w-5 h-5 text-[#CBAD8D] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#CBAD8D] mb-0.5">Checkout Alert</p>
                <p className="text-[11px] leading-relaxed opacity-90">{checkoutError}</p>
              </div>
              <button 
                onClick={() => setCheckoutError(null)} 
                className="text-[#CBAD8D] hover:text-[#F1EDE6] text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Items List Area */}
          <div className="flex-1 overflow-y-auto py-6 px-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                <div className="w-12 h-12 bg-white/60 rounded-full flex items-center justify-center text-[#A48374] border border-[#E6DFD6]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-[#3A2D28] text-base">Your jewelry bag is empty</h3>
                <p className="text-xs text-[#A48374] max-w-xs leading-relaxed">
                  Discover our exclusive direct sale collections and add items to your cart to checkout.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/products');
                  }}
                  className="px-6 py-2.5 bg-[#3A2D28] text-white text-[10px] uppercase font-bold tracking-widest rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Explore Showcase
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const prod = item.productId || {};
                const imageSrc = prod.images && prod.images.length > 0 ? prod.images[0] : '';
                return (
                  <div
                    key={item.productId?._id || item._id}
                    className="bg-white rounded-2xl p-4 border border-[#E6DFD6] flex gap-4 items-center shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-[#F7F3EF] border border-[#EBE3DB] flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Sparkles className="w-5 h-5 text-[#CBAD8D] opacity-55" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#A48374] block mb-0.5">
                        {prod.category}
                      </span>
                      <h4 className="font-serif text-[#3A2D28] text-xs font-semibold truncate pr-4">
                        {prod.title || 'Premium Diamond Item'}
                      </h4>
                      <p className="text-[11px] font-serif font-bold text-[#3A2D28] mt-1">
                        {formatINR(prod.price || item.priceAtAdd || 0)}
                        {item.quantity > 1 && (
                          <span className="text-[10px] font-sans font-medium text-[#A48374] ml-1.5">
                            x{item.quantity}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeFromCart(prod._id)}
                      className="p-2 rounded-full hover:bg-red-50 text-[#A48374] hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Area */}
          {cartItems.length > 0 && (
            <div className="bg-white border-t border-[#E6DFD6] px-6 py-6 space-y-6">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#A48374]">
                  Total Value
                </span>
                <span className="font-serif text-2xl font-bold text-[#3A2D28]">
                  {formatINR(cartTotal)}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-4 bg-[#3A2D28] text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#3A2D28]/95 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying Stock...</span>
                    </>
                  ) : (
                    <span>Proceed to Secure Checkout</span>
                  )}
                </button>

                <div className="flex items-center gap-2 justify-center text-[10px] text-[#A48374] uppercase tracking-wider font-semibold py-1">
                  <ShieldCheck className="w-4 h-4 text-[#A48374]" />
                  100% Insured Escrow Vault Delivery
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
