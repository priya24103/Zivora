import React, { useState, useEffect } from 'react';
import { Search, Diamond } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';

export default function GlobalInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('zivora_admin_token');
      const response = await axios.get('http://localhost:2409/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setProducts(response.data.data.products);
      }
    } catch (err) {
      console.warn('Backend API failed, loading mock global inventory database instead.');
      setProducts([
        {
          _id: 'p1',
          title: '2.02ct D FL Round Brilliant Diamond',
          category: 'Diamond',
          price: 18500,
          status: 'available',
          listingType: 'direct_sale',
          images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=150&q=80'],
          sellerId: { name: 'Vikram Seth', company: 'Seth Luxury Atelier' }
        },
        {
          _id: 'p2',
          title: 'VVS1 Cushion Cut Pink Diamond',
          category: 'Diamond',
          price: 45000,
          status: 'on_memo',
          listingType: 'auction_only',
          images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=150&q=80'],
          sellerId: { name: 'Rajesh Mehta', company: 'Mehta Fine Diamonds' }
        },
        {
          _id: 'p3',
          title: '18k White Gold Platinum Diamond Ring',
          category: 'Jewelry',
          price: 8900,
          status: 'sold',
          listingType: 'direct_sale',
          images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=150&q=80'],
          sellerId: { name: 'Vikram Seth', company: 'Seth Luxury Atelier' }
        },
        {
          _id: 'p4',
          title: '3.50ct Round Cut Emerald Accent Necklace',
          category: 'Jewelry',
          price: 29000,
          status: 'available',
          listingType: 'auction_only',
          images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=150&q=80'],
          sellerId: { name: 'Sanjay Dutt', company: 'Dutt & Sons Imports' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-green-700 bg-green-50/50 border border-green-200/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Available
          </span>
        );
      case 'on_memo':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50/50 border border-blue-200/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            On Memo
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-gray-500 bg-gray-50/60 border border-gray-200/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Sold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-gray-700 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const getListingBadge = (listingType) => {
    if (listingType === 'auction_only') {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-purple-50/50 border border-purple-250/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Auction
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50/50 border border-amber-250/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
        Direct Sale
      </span>
    );
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.sellerId?.name && product.sellerId.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (product.sellerId?.company && product.sellerId.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>
            Global Inventory
          </h2>
          <p className="text-[10px] mt-1 text-[#A48374] tracking-widest uppercase font-semibold">Oversee catalog listings, valuations & ownership</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border" style={{ borderColor: 'rgba(164, 131, 116, 0.2)' }}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-4 h-4" style={{ color: '#A48374' }} />
          <input
            type="text"
            placeholder="Search by product title or seller details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-xs bg-[#F1EDE6]/20 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#A48374] transition-all"
            style={{ borderColor: 'rgba(164, 131, 116, 0.25)', color: '#3A2D28' }}
          />
        </div>
      </div>

      {/* Product Catalog List */}
      <div 
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
        style={{ borderColor: 'rgba(164, 131, 116, 0.2)' }}
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#A48374' }}></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#A48374] font-medium uppercase tracking-wider">
            No products logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b" style={{ backgroundColor: 'rgba(164, 131, 116, 0.04)', borderColor: 'rgba(164, 131, 116, 0.15)' }}>
                  <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80 w-24">Preview</th>
                  <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Product</th>
                  <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Seller</th>
                  <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Listing Type</th>
                  <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Value (USD)</th>
                  <th className="p-5 font-semibold uppercase tracking-wider text-[#3A2D28]/80">Status</th>
                </tr>
              </thead>
              
              <motion.tbody 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-gray-100"
              >
                {filteredProducts.map((product) => (
                  <motion.tr 
                    key={product._id} 
                    variants={itemVariants}
                    className="hover:bg-gray-50/40 transition-colors"
                  >
                    <td className="p-5 py-4">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.title} 
                          className="w-14 h-14 object-cover rounded-xl border"
                          style={{ borderColor: 'rgba(164, 131, 116, 0.25)' }}
                        />
                      ) : (
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-[#A48374] border border-dashed"
                          style={{ borderColor: 'rgba(164, 131, 116, 0.25)', backgroundColor: 'rgba(164, 131, 116, 0.04)' }}
                        >
                          <Diamond className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="font-semibold text-sm text-[#3A2D28]">{product.title}</div>
                      <div className="text-gray-400 mt-1 uppercase tracking-wider text-[9px] font-bold">{product.category}</div>
                    </td>
                    <td className="p-5">
                      <div className="font-semibold text-[#3A2D28]">{product.sellerId?.name || '—'}</div>
                      <div className="text-gray-400 mt-1">{product.sellerId?.company || 'Individual Seller'}</div>
                    </td>
                    <td className="p-5">
                      {getListingBadge(product.listingType)}
                    </td>
                    <td className="p-5">
                      <div className="font-semibold text-sm text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>
                        ₹{product.price ? product.price.toLocaleString() : '0'}
                      </div>
                    </td>
                    <td className="p-5">
                      {getStatusBadge(product.status)}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
