'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  ArrowUpDown, 
  Sparkles,
  Eye,
  Diamond as DiamondIcon,
  Crown
} from 'lucide-react';

const SHAPES = ['Round', 'Princess', 'Cushion', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Marquise', 'Asscher', 'Heart'];
const METALS = [
  '14k White Gold', '18k White Gold', 
  '14k Yellow Gold', '18k Yellow Gold', 
  '14k Rose Gold', '18k Rose Gold', 
  'Platinum', 'Silver'
];
const JEWELRY_TYPES = ['Ring', 'Necklace', 'Earring', 'Bracelet', 'Pendant', 'Bangle'];
const GENDERS = ['Men', 'Women', 'Unisex'];
const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];

export default function MarketplaceFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination metadata
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Collapse sections for filter sidebar
  const [openSection, setOpenSection] = useState({
    category: true,
    price: true,
    shape: true,
    carat: true,
    metal: true,
    jewelryType: true,
    gender: true,
    quality: false
  });

  // Filter Query values
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const priceMin = searchParams.get('priceMin') || '';
  const priceMax = searchParams.get('priceMax') || '';
  const shape = searchParams.get('shape') || '';
  const caratMin = searchParams.get('caratMin') || '';
  const caratMax = searchParams.get('caratMax') || '';
  const metalType = searchParams.get('metalType') || '';
  const jewelryType = searchParams.get('jewelryType') || '';
  const gender = searchParams.get('gender') || '';
  const color = searchParams.get('color') || '';
  const clarity = searchParams.get('clarity') || '';

  const toggleSection = (section) => {
    setOpenSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to push new query parameter
  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/products');
  };

  // Fetching Logic (assuming REST API runs on backend url)
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (category) queryParams.set('category', category);
        if (search) queryParams.set('search', search);
        if (sort) queryParams.set('sort', sort);
        if (priceMin) queryParams.set('price[min]', priceMin);
        if (priceMax) queryParams.set('price[max]', priceMax);
        
        if (category === 'Diamond' || !category) {
          if (shape) queryParams.set('shape', shape);
          if (color) queryParams.set('color', color);
          if (clarity) queryParams.set('clarity', clarity);
          if (caratMin) queryParams.set('carat[min]', caratMin);
          if (caratMax) queryParams.set('carat[max]', caratMax);
        }

        if (category === 'Jewelry' || !category) {
          if (metalType) queryParams.set('metalType', metalType);
          if (jewelryType) queryParams.set('jewelryType', jewelryType);
          if (gender) queryParams.set('gender', gender);
        }

        const currentPage = parseInt(searchParams.get('page') || '1', 10);
        setPage(currentPage);
        queryParams.set('page', currentPage.toString());
        queryParams.set('limit', '12');

        // Target your API server endpoint
        const res = await fetch(`http://localhost:2409/api/products?${queryParams.toString()}`);
        const resultData = await res.json();
        
        if (resultData.status === 'success') {
          setProducts(resultData.data.products);
          setTotalPages(resultData.pagination.pages || 1);
          setTotalResults(resultData.pagination.total || 0);
        } else {
          setError(resultData.message || 'Retrieval failed');
        }
      } catch (err) {
        console.error(err);
        setError('Error fetching products. Make sure your backend API is online.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [searchParams, router]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="min-h-screen py-10 px-4 md:px-8 lg:px-12 bg-[#F1EDE6] text-[#3A2D28]">
      
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8 bg-white rounded-[32px] p-8 border border-[#E6DFD6] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#A48374] block mb-1">Luxury Marketplace</span>
          <h1 className="text-3xl md:text-4xl font-serif text-[#3A2D28] leading-tight">
            {category === 'Diamond' && 'Loose Certified Diamonds'}
            {category === 'Jewelry' && 'Bespoke Fine Jewelry'}
            {!category && 'The Marketplace Catalog'}
          </h1>
          <p className="text-xs text-[#A48374] mt-2 font-medium">
            Explore conflict-free loose diamonds and curated heirloom jewelry collections.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full text-xs bg-[#F7F3EF] border border-[#E6DFD6] focus:outline-none focus:ring-1 focus:ring-[#A48374] text-[#3A2D28]"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A48374]" />
          {search && (
            <button onClick={() => updateFilter('search', '')} className="absolute right-3.5 top-3.5 p-0.5 hover:bg-gray-200 rounded-full">
              <X className="w-3.5 h-3.5 text-[#3A2D28]" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ========================================================
            FILTER SIDEBAR (Sticky on desktop, 25% width)
           ======================================================== */}
        <aside className="w-full lg:w-1/4 bg-white rounded-3xl p-6 border border-[#E6DFD6] lg:sticky lg:top-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F7F3EF]">
            <span className="flex items-center gap-2 font-serif text-sm font-semibold text-[#3A2D28]">
              <SlidersHorizontal className="w-4 h-4 text-[#A48374]" />
              Filters
            </span>
            <button onClick={clearAllFilters} className="text-[10px] uppercase font-bold tracking-widest text-[#A48374] hover:text-[#3A2D28]">
              Clear All
            </button>
          </div>

          <div className="divide-y divide-[#F7F3EF]">
            
            {/* Category selection */}
            <div className="py-4">
              <button onClick={() => toggleSection('category')} className="w-full flex items-center justify-between font-serif text-sm font-medium py-1">
                <span>Category</span>
                {openSection.category ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
              </button>
              {openSection.category && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateFilter('category', '')} className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold border ${!category ? 'bg-[#3A2D28] text-white border-[#3A2D28]' : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-gray-100'}`}>
                    All
                  </button>
                  <button onClick={() => updateFilter('category', 'Diamond')} className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold border ${category === 'Diamond' ? 'bg-[#3A2D28] text-white border-[#3A2D28]' : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-gray-100'}`}>
                    Diamonds
                  </button>
                  <button onClick={() => updateFilter('category', 'Jewelry')} className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold border ${category === 'Jewelry' ? 'bg-[#3A2D28] text-white border-[#3A2D28]' : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-gray-100'}`}>
                    Jewelry
                  </button>
                </div>
              )}
            </div>

            {/* Price limits */}
            <div className="py-4">
              <button onClick={() => toggleSection('price')} className="w-full flex items-center justify-between font-serif text-sm font-medium py-1">
                <span>Price (INR)</span>
                {openSection.price ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
              </button>
              {openSection.price && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Min" value={priceMin} onChange={(e) => updateFilter('priceMin', e.target.value)} className="p-2 bg-[#F7F3EF] rounded-xl border border-[#E6DFD6] text-xs focus:outline-none" />
                  <input type="number" placeholder="Max" value={priceMax} onChange={(e) => updateFilter('priceMax', e.target.value)} className="p-2 bg-[#F7F3EF] rounded-xl border border-[#E6DFD6] text-xs focus:outline-none" />
                </div>
              )}
            </div>

            {/* Diamond shape (Diamond only) */}
            {(category === 'Diamond' || !category) && (
              <div className="py-4">
                <button onClick={() => toggleSection('shape')} className="w-full flex items-center justify-between font-serif text-sm font-medium py-1">
                  <span>Shape</span>
                  {openSection.shape ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
                </button>
                {openSection.shape && (
                  <div className="grid grid-cols-3 gap-1.5 mt-3">
                    {SHAPES.map(s => (
                      <button key={s} onClick={() => updateFilter('shape', shape === s ? '' : s)} className={`py-1 rounded-xl text-[10px] border ${shape === s ? 'bg-[#A48374] text-white border-[#A48374]' : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-gray-100'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metal composition (Jewelry only) */}
            {(category === 'Jewelry' || !category) && (
              <div className="py-4">
                <button onClick={() => toggleSection('metal')} className="w-full flex items-center justify-between font-serif text-sm font-medium py-1">
                  <span>Metal</span>
                  {openSection.metal ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
                </button>
                {openSection.metal && (
                  <div className="space-y-1.5 mt-3">
                    {METALS.map(m => (
                      <button key={m} onClick={() => updateFilter('metalType', metalType === m ? '' : m)} className={`w-full text-left py-1.5 px-3 rounded-xl text-xs border ${metalType === m ? 'bg-[#A48374] text-white border-[#A48374]' : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-gray-100'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </aside>

        {/* ========================================================
            PRODUCT GRID & SORTING (75% width)
           ======================================================== */}
        <main className="w-full lg:w-3/4">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 mb-6 border border-[#E6DFD6] shadow-sm">
            <span className="text-xs font-semibold text-[#3A2D28]">
              {loading ? 'Sifting inventory...' : `${totalResults} luxury items`}
            </span>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#A48374]" />
              <select value={sort} onChange={(e) => updateFilter('sort', e.target.value)} className="text-xs bg-transparent border-0 focus:outline-none font-medium cursor-pointer">
                <option value="newest">New Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-4 rounded-xl text-center mb-6">
              {error}
            </div>
          )}

          {/* Grid Layout */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-[#E6DFD6] animate-pulse h-80"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E6DFD6]">
              <p className="font-serif text-sm">No items match your specifications.</p>
              <button onClick={clearAllFilters} className="mt-4 px-6 py-2 bg-[#3A2D28] text-white text-xs font-semibold rounded-full">
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map(product => (
                  <div 
                    key={product._id} 
                    onClick={() => router.push(`/products/${product._id}`)}
                    className="group bg-white rounded-3xl p-4 border border-[#E6DFD6] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F7F3EF] mb-4 flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                        ) : (
                          <Sparkles className="w-8 h-8 text-[#CBAD8D] opacity-50" />
                        )}
                        <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90">
                          {product.category}
                        </span>
                      </div>

                      <span className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">
                        Seller: {product.sellerId?.name || 'Partner Merchant'}
                      </span>
                      <h3 className="font-serif text-sm mt-1 mb-2 line-clamp-1 group-hover:text-[#A48374] transition-colors">
                        {product.title}
                      </h3>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#F7F3EF] flex items-center justify-between">
                      <span className="text-sm font-serif font-bold">{formatINR(product.price)}</span>
                      <span className="text-[9px] text-[#6B8E23] font-bold uppercase tracking-wider">Available</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-10">
                  <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-4 py-2 rounded-full text-xs bg-white border border-[#E6DFD6] disabled:opacity-40">
                    Previous
                  </button>
                  <span className="text-xs font-semibold">{page} of {totalPages}</span>
                  <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="px-4 py-2 rounded-full text-xs bg-white border border-[#E6DFD6] disabled:opacity-40">
                    Next
                  </button>
                </div>
              )}
            </>
          )}

        </main>
      </div>

    </div>
  );
}
