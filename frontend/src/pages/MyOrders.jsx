import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import { 
  Download, 
  ShoppingBag, 
  Calendar, 
  MapPin, 
  Tag, 
  AlertCircle,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:2409/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 70,
      damping: 15
    }
  }
};

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('zivora_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.status === 'success') {
          setOrders(response.data.data.orders);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Failed to load your order history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingId(orderId);
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob URL and trigger browser download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Could not download your invoice. Please try again later.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStepStatus = (orderStatus, step) => {
    const statusOrder = ['processing', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(orderStatus);
    const stepIdx = statusOrder.indexOf(step);

    if (orderStatus === 'cancelled') {
      return 'cancelled';
    }
    if (currentIdx >= stepIdx) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ backgroundColor: '#F1EDE6' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#A48374]/20 pb-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl text-[#3A2D28] tracking-tight" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
              My Orders
            </h1>
            <p className="text-xs md:text-sm text-[#A48374] mt-2 tracking-wide font-medium">
              View order histories, delivery statuses, and premium receipts.
            </p>
          </div>
          <button 
            onClick={() => navigate('/products')}
            className="mt-4 md:mt-0 inline-flex items-center text-xs uppercase tracking-[0.15em] font-semibold text-[#A48374] hover:text-[#3A2D28] transition-colors gap-1"
          >
            Continue Shopping <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-[#A48374] mt-4 italic">Fetching your acquisitions...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50/50 border border-red-200/60 rounded-2xl p-6 flex items-start gap-4 max-w-xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-red-800 uppercase tracking-wide">Error Loading Orders</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border border-[#A48374]/15 rounded-3xl p-12 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-[#A48374] mx-auto opacity-60 mb-4" />
            <h3 className="text-lg font-medium text-[#3A2D28] mb-1" style={{ fontFamily: 'Georgia, serif' }}>No orders found</h3>
            <p className="text-xs text-[#A48374] max-w-xs mx-auto mb-6">
              You haven't purchased any diamonds or jewelry products yet.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-2.5 rounded-full text-white text-xs uppercase tracking-wider font-semibold shadow-sm hover:opacity-95 transition-opacity"
              style={{ backgroundColor: '#A48374' }}
            >
              Explore Products
            </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {orders.map((order) => {
              const primaryItem = order.items[0] || {};
              const productThumbnail = primaryItem.productId?.images?.[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=200';

              return (
                <motion.div
                  key={order._id}
                  variants={cardVariants}
                  className="bg-white rounded-2xl border border-[#A48374]/20 shadow-[0_4px_20px_rgba(58,45,40,0.02)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(58,45,40,0.05)]"
                >
                  {/* Top Bar Summary Info */}
                  <div className="px-6 py-4 bg-[#FBF9F6]/80 border-b border-[#A48374]/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
                      <div>
                        <p className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">Order ID</p>
                        <p className="font-mono text-[#3A2D28] font-bold">{order._id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">Placed Date</p>
                        <p className="text-[#3A2D28] font-semibold">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">Total Paid</p>
                        <p className="text-[#3A2D28] font-bold">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Invoice Download Action Button */}
                    <button
                      onClick={() => handleDownloadInvoice(order._id)}
                      disabled={downloadingId === order._id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#A48374]/40 hover:border-[#A48374] hover:bg-[#F1EDE6]/30 text-xs font-semibold rounded-full text-[#A48374] hover:text-[#3A2D28] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloadingId === order._id ? 'Generating...' : 'Download Invoice'}
                    </button>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Products List & Thumbnail */}
                      <div className="md:col-span-6 flex gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FBF9F6] border border-[#A48374]/15 flex-shrink-0 relative">
                          <img 
                            src={productThumbnail} 
                            alt={primaryItem.title || 'Product Thumbnail'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=200';
                            }}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <h4 className="text-xs font-bold text-[#A48374] uppercase tracking-wider mb-1">
                            {order.items.length === 1 ? 'Exquisite Purchase' : `${order.items.length} Acquisitions`}
                          </h4>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <p key={idx} className="text-sm font-semibold text-[#3A2D28] truncate">
                                {item.title} <span className="text-xs font-light text-[#A48374]">x{item.quantity}</span>
                              </p>
                            ))}
                          </div>
                          <p className="text-[10px] text-[#A48374] mt-1.5 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Payment Status: 
                            <span className="font-bold uppercase" style={{ color: order.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' }}>
                              {order.paymentStatus}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Delivery address info */}
                      <div className="md:col-span-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#A48374]/10 pt-4 md:pt-0 md:pl-6 text-xs">
                        <h4 className="text-[10px] text-[#A48374] uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Delivery Details
                        </h4>
                        <p className="font-bold text-[#3A2D28]">{order.shippingAddress?.fullName}</p>
                        <p className="text-[#3A2D28] mt-0.5 leading-relaxed">
                          {order.shippingAddress?.streetAddress}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                        </p>
                        <p className="text-[#A48374] mt-1 font-mono">{order.shippingAddress?.phoneNumber}</p>
                      </div>
                    </div>

                    {/* Stepper Status Visual Line */}
                    <div className="mt-8 pt-6 border-t border-[#A48374]/10">
                      <h4 className="text-[10px] text-[#A48374] uppercase tracking-wider font-bold mb-6">Fulfillment Tracking</h4>

                      {order.orderStatus === 'cancelled' ? (
                        <div className="flex items-center gap-3 bg-red-50/50 border border-red-200/50 rounded-xl p-4 text-red-800 text-xs">
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <div>
                            <span className="font-bold">Order Cancelled</span>
                            <p className="text-red-700 text-[10px] mt-0.5">This transaction was cancelled and refunded / returned.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Progress connector line */}
                          <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#A48374]/15 -z-10"></div>
                          <div 
                            className="absolute top-4 left-4 h-0.5 bg-[#A48374] -z-10 transition-all duration-500"
                            style={{
                              width: 
                                (order.fulfillmentStatus || order.orderStatus) === 'delivered' ? '100%' :
                                (order.fulfillmentStatus || order.orderStatus) === 'shipped' ? '50%' : '0%'
                            }}
                          ></div>

                          <div className="flex justify-between items-start text-center">
                            {/* Step 1: Processing */}
                            <div className="flex flex-col items-center flex-1">
                              <div 
                                className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                  getStepStatus(order.fulfillmentStatus || order.orderStatus, 'processing') === 'completed'
                                    ? 'bg-[#A48374] border-[#A48374] text-white'
                                    : 'bg-white border-[#A48374]/30 text-[#A48374]'
                                }`}
                              >
                                <Package className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold text-[#3A2D28] mt-2 block">Processing</span>
                              <span className="text-[9px] text-[#A48374] mt-0.5 font-light block">Inventory Ready</span>
                            </div>

                            {/* Step 2: Shipped */}
                            <div className="flex flex-col items-center flex-1 relative">
                              <div 
                                className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                  getStepStatus(order.fulfillmentStatus || order.orderStatus, 'shipped') === 'completed'
                                    ? 'bg-[#A48374] border-[#A48374] text-white'
                                    : 'bg-white border-[#A48374]/30 text-[#A48374]'
                                }`}
                              >
                                <Truck className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold text-[#3A2D28] mt-2 block">Shipped</span>
                              {order.trackingNumber && (
                                <span className="bg-[#3A2D28] text-white text-[9px] py-0.5 px-2 rounded-full font-mono mt-1 opacity-90 tracking-tight">
                                  Track: {order.trackingNumber}
                                </span>
                              )}
                              <span className="text-[9px] text-[#A48374] mt-0.5 font-light block">In Transit</span>
                            </div>

                            {/* Step 3: Delivered */}
                            <div className="flex flex-col items-center flex-1">
                              <div 
                                className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                  getStepStatus(order.fulfillmentStatus || order.orderStatus, 'delivered') === 'completed'
                                    ? 'bg-[#A48374] border-[#A48374] text-white'
                                    : 'bg-white border-[#A48374]/30 text-[#A48374]'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold text-[#3A2D28] mt-2 block">Delivered</span>
                              <span className="text-[9px] text-[#A48374] mt-0.5 font-light block">Arrival & Handover</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
