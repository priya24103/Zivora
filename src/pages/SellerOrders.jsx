import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { 
  ShoppingBag, 
  Gavel, 
  FileCheck, 
  Truck, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  User, 
  Mail, 
  Tag, 
  Hash, 
  Clock, 
  CheckCircle,
  XCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:2409/api';

export default function SellerOrders() {
  const navigate = useNavigate();
  const [ordersData, setOrdersData] = useState({
    directSaleOrders: [],
    auctionOrders: [],
    rfqOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('directSale'); // 'directSale' | 'auction' | 'rfq'
  
  // Tracking forms state - key: orderId
  const [expandedLog, setExpandedLog] = useState({});
  const [shippingForm, setShippingForm] = useState({});
  const [submittingLog, setSubmittingLog] = useState({});

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/seller/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        const { directSaleOrders = [], auctionOrders = [], rfqOrders = [] } = response.data.data;
        setOrdersData({ directSaleOrders, auctionOrders, rfqOrders });
      }
    } catch (err) {
      console.error('Error fetching seller orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch seller orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerOrders();
  }, [navigate]);

  const toggleExpandLog = (orderId, currentStatus, currentTracking) => {
    setExpandedLog(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
    
    // Initialize form inputs with current values
    if (!shippingForm[orderId]) {
      setShippingForm(prev => ({
        ...prev,
        [orderId]: {
          fulfillmentStatus: currentStatus || 'processing',
          trackingNumber: currentTracking || ''
        }
      }));
    }
  };

  const handleInputChange = (orderId, field, value) => {
    setShippingForm(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  const handleSaveTracking = async (orderId) => {
    const form = shippingForm[orderId];
    if (!form || !form.fulfillmentStatus) return;

    try {
      setSubmittingLog(prev => ({ ...prev, [orderId]: true }));
      const token = localStorage.getItem('zivora_token');
      
      const response = await axios.put(
        `${API_BASE_URL}/seller/orders/${orderId}/tracking`,
        {
          fulfillmentStatus: form.fulfillmentStatus,
          trackingNumber: form.trackingNumber
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        const updatedOrder = response.data.data.order;
        
        // Update local state instantly without full reload
        setOrdersData(prev => {
          const updateArray = (arr) => arr.map(order => 
            order._id === orderId ? { ...order, ...updatedOrder } : order
          );

          return {
            directSaleOrders: updateArray(prev.directSaleOrders),
            auctionOrders: updateArray(prev.auctionOrders),
            rfqOrders: updateArray(prev.rfqOrders)
          };
        });

        // Close the panel
        setExpandedLog(prev => ({ ...prev, [orderId]: false }));
      }
    } catch (err) {
      console.error('Error updating order tracking:', err);
      alert(err.response?.data?.message || 'Failed to update order tracking details.');
    } finally {
      setSubmittingLog(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'text-amber-700 bg-amber-50 border border-amber-200';
      case 'shipped': return 'text-blue-700 bg-blue-50 border border-blue-200';
      case 'delivered': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'cancelled': return 'text-red-700 bg-red-50 border border-red-200';
      default: return 'text-[#A48374] bg-[#F7F3EF] border border-[#CBAD8D]/20';
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActiveOrders = () => {
    if (activeTab === 'directSale') return ordersData.directSaleOrders;
    if (activeTab === 'auction') return ordersData.auctionOrders;
    return ordersData.rfqOrders;
  };

  const currentOrders = getActiveOrders();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-12 font-sans" style={{ backgroundColor: '#F1EDE6' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-b border-[#A48374]/20 pb-6 mb-10">
          <h1 className="text-3xl md:text-4xl text-[#3A2D28] tracking-tight" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
            Order Management
          </h1>
          <p className="text-xs md:text-sm text-[#A48374] mt-2 tracking-wide font-medium">
            Fulfill and track customer purchases across direct sales, live auctions, and RFQ quotes.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#A48374]/15 mb-8 overflow-x-auto gap-2">
          {/* Tab 1: Direct Sale */}
          <button
            onClick={() => setActiveTab('directSale')}
            className={`flex items-center gap-2 py-4 px-6 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'directSale'
                ? 'border-[#3A2D28] text-[#3A2D28]'
                : 'border-transparent text-[#A48374] hover:text-[#3A2D28]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Direct Sales Inventory
            <span className="ml-1.5 px-2 py-0.5 text-[10px] rounded-full bg-[#3A2D28]/10 text-[#3A2D28]">
              {ordersData.directSaleOrders.length}
            </span>
          </button>

          {/* Tab 2: Auction Wins */}
          <button
            onClick={() => setActiveTab('auction')}
            className={`flex items-center gap-2 py-4 px-6 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'auction'
                ? 'border-[#3A2D28] text-[#3A2D28]'
                : 'border-transparent text-[#A48374] hover:text-[#3A2D28]'
            }`}
          >
            <Gavel className="w-4 h-4" />
            Auction Wins
            <span className="ml-1.5 px-2 py-0.5 text-[10px] rounded-full bg-[#3A2D28]/10 text-[#3A2D28]">
              {ordersData.auctionOrders.length}
            </span>
          </button>

          {/* Tab 3: RFQ Contracts */}
          <button
            onClick={() => setActiveTab('rfq')}
            className={`flex items-center gap-2 py-4 px-6 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rfq'
                ? 'border-[#3A2D28] text-[#3A2D28]'
                : 'border-transparent text-[#A48374] hover:text-[#3A2D28]'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            RFQ Contracts
            <span className="ml-1.5 px-2 py-0.5 text-[10px] rounded-full bg-[#3A2D28]/10 text-[#3A2D28]">
              {ordersData.rfqOrders.length}
            </span>
          </button>
        </div>

        {/* Orders Render */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-[#A48374] mt-4 italic">Fetching orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 max-w-xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-red-800 uppercase tracking-wide">Error Loading Orders</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        ) : currentOrders.length === 0 ? (
          <div className="bg-white border border-[#A48374]/20 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto">
            <ShoppingBag className="w-12 h-12 text-[#A48374] mx-auto opacity-40 mb-4" />
            <h3 className="text-lg font-medium text-[#3A2D28] mb-1" style={{ fontFamily: 'Georgia, serif' }}>No orders found</h3>
            <p className="text-xs text-[#A48374] max-w-xs mx-auto">
              There are no orders matching this category in your account at the moment.
            </p>
          </div>
        ) : (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {currentOrders.map((order) => {
                const primaryItem = order.items[0] || {};
                const productThumbnail = primaryItem.productId?.images?.[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=200';
                const isItemAuction = activeTab === 'auction';
                const isItemRfq = activeTab === 'rfq';
                
                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl border border-[#A48374]/20 shadow-sm overflow-hidden"
                  >
                    {/* Top Bar Summary */}
                    <div className="px-6 py-4 bg-[#FBF9F6]/80 border-b border-[#A48374]/10 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">Order ID</p>
                          <p className="font-mono text-[#3A2D28] font-bold">{order._id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">Order Date</p>
                          <p className="text-[#3A2D28] font-semibold">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">Amount Paid</p>
                          <p className="text-[#3A2D28] font-bold">
                            {formatPrice(order.totalAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(order.fulfillmentStatus || order.orderStatus)}`}>
                        {order.fulfillmentStatus || order.orderStatus}
                      </span>
                    </div>

                    {/* Order Details */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Column 1: Product Snapshot */}
                        <div className="md:col-span-5 flex gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FBF9F6] border border-[#A48374]/15 flex-shrink-0">
                            <img 
                              src={productThumbnail} 
                              alt="Thumbnail" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-[10px] text-[#A48374] uppercase font-bold tracking-wider mb-1">
                              {order.items.length === 1 ? 'Marketplace Purchase' : `${order.items.length} Items`}
                            </h4>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <p key={idx} className="text-sm font-semibold text-[#3A2D28] truncate">
                                  {item.title} <span className="text-xs font-light text-[#A48374]">x{item.quantity}</span>
                                </p>
                              ))}
                            </div>
                            
                            {/* Hybrid Extra Detail Banners */}
                            {isItemAuction && (
                              <div className="inline-flex items-center gap-1.5 mt-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/50 py-1 px-2.5 rounded-md font-semibold w-fit">
                                <Gavel className="w-3.5 h-3.5" />
                                Win Bid: {formatPrice(order.totalAmount)}
                              </div>
                            )}

                            {isItemRfq && (
                              <div className="inline-flex items-center gap-1.5 mt-2 text-[10px] text-blue-700 bg-blue-50 border border-blue-200/50 py-1 px-2.5 rounded-md font-mono w-fit">
                                <FileCheck className="w-3.5 h-3.5" />
                                RFQ Ref: {order._id.substring(order._id.length - 8).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Buyer details */}
                        <div className="md:col-span-4 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#A48374]/10 pt-4 md:pt-0 md:pl-6 text-xs">
                          <h4 className="text-[10px] text-[#A48374] uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Buyer Information
                          </h4>
                          <p className="font-bold text-[#3A2D28]">{order.shippingAddress?.fullName || order.buyerId?.name || 'Valued Client'}</p>
                          <p className="text-[#3A2D28] mt-0.5">{order.shippingAddress?.streetAddress}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
                          <p className="text-[#A48374] mt-1 font-mono">{order.shippingAddress?.phoneNumber || 'N/A'}</p>
                          {order.buyerId?.email && (
                            <p className="text-[#A48374] mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {order.buyerId.email}
                            </p>
                          )}
                        </div>

                        {/* Column 3: Logistics details */}
                        <div className="md:col-span-3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#A48374]/10 pt-4 md:pt-0 md:pl-6 text-xs">
                          <h4 className="text-[10px] text-[#A48374] uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" /> Logistics Log
                          </h4>
                          {order.trackingNumber ? (
                            <div className="space-y-1">
                              <div className="flex gap-1.5 items-center">
                                <span className="font-semibold text-[#3A2D28]">Tracking:</span>
                                <span className="bg-[#3A2D28] text-white text-[10px] py-0.5 px-2 rounded-full font-mono font-medium">
                                  {order.trackingNumber}
                                </span>
                              </div>
                              <p className="text-[#A48374] text-[10px] italic">Courier: Priority insured vault</p>
                            </div>
                          ) : (
                            <p className="text-[#A48374] italic">No tracking number logged yet.</p>
                          )}
                          
                          <button
                            onClick={() => toggleExpandLog(order._id, order.fulfillmentStatus || order.orderStatus, order.trackingNumber)}
                            className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer w-fit"
                          >
                            Update Shipping Log
                            {expandedLog[order._id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Logistics Update Form */}
                      <AnimatePresence>
                        {expandedLog[order._id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden border-t border-[#A48374]/10 mt-5 pt-5"
                          >
                            <div className="bg-[#FBF9F6] p-4 rounded-xl border border-[#A48374]/10 max-w-2xl">
                              <h5 className="text-[11px] font-bold uppercase text-[#3A2D28] mb-3 tracking-wider">
                                Log Shipping Credentials
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                  <label className="block text-[10px] font-semibold text-[#A48374] uppercase tracking-wider mb-1">
                                    Fulfillment Status
                                  </label>
                                  <select
                                    value={shippingForm[order._id]?.fulfillmentStatus || 'processing'}
                                    onChange={(e) => handleInputChange(order._id, 'fulfillmentStatus', e.target.value)}
                                    className="w-full text-xs p-2.5 rounded-lg border border-[#CBAD8D]/30 focus:outline-none focus:ring-1 focus:ring-[#A48374] bg-white text-[#3A2D28]"
                                  >
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-[#A48374] uppercase tracking-wider mb-1">
                                    Tracking Code
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Enter tracking code (e.g., TRK-98218-IND)"
                                    value={shippingForm[order._id]?.trackingNumber || ''}
                                    onChange={(e) => handleInputChange(order._id, 'trackingNumber', e.target.value)}
                                    className="w-full text-xs p-2.5 rounded-lg border border-[#CBAD8D]/30 focus:outline-none focus:ring-1 focus:ring-[#A48374] bg-white text-[#3A2D28]"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 justify-end mt-4 border-t border-[#A48374]/10 pt-3">
                                <button
                                  onClick={() => setExpandedLog(prev => ({ ...prev, [order._id]: false }))}
                                  className="px-4 py-2 border border-[#CBAD8D]/30 hover:bg-[#F1EDE6] text-[#A48374] hover:text-[#3A2D28] text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
                                >
                                  Close
                                </button>
                                <button
                                  onClick={() => handleSaveTracking(order._id)}
                                  disabled={submittingLog[order._id]}
                                  className="px-5 py-2 bg-[#3A2D28] text-white hover:opacity-90 disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider rounded-full transition-opacity cursor-pointer flex items-center gap-1.5"
                                >
                                  {submittingLog[order._id] ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>Saving...</span>
                                    </>
                                  ) : (
                                    'Save Details'
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
