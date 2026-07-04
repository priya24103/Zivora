import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  ArrowUpDown, 
  Sparkles,
  Heart,
  Eye,
  Diamond as DiamondIcon,
  Crown
} from 'lucide-react';

const API_BASE = 'http://localhost:2409/api';

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

export default function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Products states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination metadata
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  // Collapse states for filter sidebar sections
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

  // Extract filter parameters from URL
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

  // Toggle collapse sections
  const toggleSection = (section) => {
    setOpenSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to update search params
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1'); // Reset pagination on filter change
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Fetch products when query params change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = {};
        
        // Populate standard parameters
        if (category) queryParams.category = category;
        if (search) queryParams.search = search;
        if (sort) queryParams.sort = sort;
        
        if (priceMin) queryParams['price[min]'] = priceMin;
        if (priceMax) queryParams['price[max]'] = priceMax;
        
        // Populate Diamond specifications
        if (category === 'Diamond' || !category) {
          if (shape) queryParams.shape = shape;
          if (color) queryParams.color = color;
          if (clarity) queryParams.clarity = clarity;
          if (caratMin) queryParams['carat[min]'] = caratMin;
          if (caratMax) queryParams['carat[max]'] = caratMax;
        }
        
        // Populate Jewelry specifications
        if (category === 'Jewelry' || !category) {
          if (metalType) queryParams.metalType = metalType;
          if (jewelryType) queryParams.jewelryType = jewelryType;
          if (gender) queryParams.gender = gender;
        }

        // Add page/limit
        const currentPage = parseInt(searchParams.get('page') || '1', 10);
        setPage(currentPage);
        queryParams.page = currentPage;
        queryParams.limit = 12;

        const response = await axios.get(`${API_BASE}/products`, { params: queryParams });
        
        if (response.data.status === 'success') {
          setProducts(response.data.data.products);
          setTotalPages(response.data.pagination.pages);
          setTotalResults(response.data.pagination.total);
        } else {
          setError('Failed to load products');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick helper to format pricing in INR
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen font-sans py-8 px-4 md:px-8 lg:px-12" style={{ backgroundColor: '#F1EDE6' }}>
      
      {/* Search Header Banner */}
      <div className="max-w-7xl mx-auto mb-8 bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-[#E6DFD6] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="text-[10px] uppercase tracking-widest text-[#A48374] mb-2 font-bold flex items-center gap-2">
            <span>Marketplace</span>
            <span>/</span>
            <span className="text-[#3A2D28]">{category || 'All Products'}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-serif text-[#3A2D28] leading-tight">
            {category === 'Diamond' && 'Loose Certified Diamonds'}
            {category === 'Jewelry' && 'Exquisite Fine Jewelry'}
            {!category && 'The Luxury Collection'}
          </h1>
          <p className="text-xs text-[#A48374] mt-2 font-medium">
            Discover conflict-free, certified stones and bespoke designer pieces crafted for perpetuity.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search keywords, SKU..."
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full text-xs bg-[#F7F3EF] border border-[#E6DFD6] focus:outline-none focus:ring-1 focus:ring-[#A48374] text-[#3A2D28]"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A48374]" />
          {search && (
            <button 
              onClick={() => updateFilter('search', '')}
              className="absolute right-3.5 top-3.5 p-0.5 hover:bg-gray-200 rounded-full"
            >
              <X className="w-3.5 h-3.5 text-[#3A2D28]" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ========================================================
            FILTER SIDEBAR (25% Width, Sticky on larger screens)
           ======================================================== */}
        <aside className="w-full lg:w-1/4 bg-white rounded-3xl p-6 border border-[#E6DFD6] lg:sticky lg:top-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F7F3EF]">
            <div className="flex items-center gap-2 font-serif text-[#3A2D28] text-lg">
              <SlidersHorizontal className="w-4 h-4 text-[#A48374]" />
              <span>Refine Selection</span>
            </div>
            <button 
              onClick={clearAllFilters}
              className="text-[10px] uppercase font-bold tracking-widest text-[#A48374] hover:text-[#3A2D28] transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="divide-y divide-[#F7F3EF] mt-2">
            
            {/* Filter Section: Category */}
            <div className="py-4">
              <button 
                onClick={() => toggleSection('category')}
                className="w-full flex items-center justify-between font-serif text-[#3A2D28] text-sm font-medium py-1"
              >
                <span>Category</span>
                {openSection.category ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
              </button>
              
              {openSection.category && (
                <div className="flex gap-2.5 mt-3">
                  <button
                    onClick={() => updateFilter('category', '')}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold border transition-all ${
                      !category 
                        ? 'bg-[#3A2D28] text-[#F1EDE6] border-[#3A2D28]' 
                        : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => updateFilter('category', 'Diamond')}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      category === 'Diamond'
                        ? 'bg-[#3A2D28] text-[#F1EDE6] border-[#3A2D28]' 
                        : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                    }`}
                  >
                    <DiamondIcon className="w-3.5 h-3.5" />
                    Diamonds
                  </button>
                  <button
                    onClick={() => updateFilter('category', 'Jewelry')}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      category === 'Jewelry'
                        ? 'bg-[#3A2D28] text-[#F1EDE6] border-[#3A2D28]' 
                        : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Jewelry
                  </button>
                </div>
              )}
            </div>

            {/* Filter Section: Price Range */}
            <div className="py-4">
              <button 
                onClick={() => toggleSection('price')}
                className="w-full flex items-center justify-between font-serif text-[#3A2D28] text-sm font-medium py-1"
              >
                <span>Price Range</span>
                {openSection.price ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
              </button>
              
              {openSection.price && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#A48374] font-semibold block mb-1">Min (₹)</label>
                    <input 
                      type="number" 
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => updateFilter('priceMin', e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-[#F7F3EF] border border-[#E6DFD6] focus:outline-none text-[#3A2D28]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A48374] font-semibold block mb-1">Max (₹)</label>
                    <input 
                      type="number" 
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => updateFilter('priceMax', e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs bg-[#F7F3EF] border border-[#E6DFD6] focus:outline-none text-[#3A2D28]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Diamond-Specific Filters (Visible only if category is 'Diamond' or empty) */}
            {(category === 'Diamond' || !category) && (
              <>
                {/* Filter Section: Diamond Shape */}
                <div className="py-4">
                  <button 
                    onClick={() => toggleSection('shape')}
                    className="w-full flex items-center justify-between font-serif text-[#3A2D28] text-sm font-medium py-1"
                  >
                    <span>Diamond Shape</span>
                    {openSection.shape ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
                  </button>
                  
                  {openSection.shape && (
                    <div className="grid grid-cols-3 gap-1.5 mt-3">
                      {SHAPES.map(s => (
                        <button
                          key={s}
                          onClick={() => updateFilter('shape', shape === s ? '' : s)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] text-center border transition-all ${
                            shape === s
                              ? 'bg-[#A48374] text-white border-[#A48374] font-bold'
                              : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter Section: Carat Weight */}
                <div className="py-4">
                  <button 
                    onClick={() => toggleSection('carat')}
                    className="w-full flex items-center justify-between font-serif text-[#3A2D28] text-sm font-medium py-1"
                  >
                    <span>Carat Weight</span>
                    {openSection.carat ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
                  </button>
                  
                  {openSection.carat && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#A48374] font-semibold block mb-1">Min Carat</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          value={caratMin}
                          onChange={(e) => updateFilter('caratMin', e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs bg-[#F7F3EF] border border-[#E6DFD6] focus:outline-none text-[#3A2D28]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#A48374] font-semibold block mb-1">Max Carat</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="5.00"
                          value={caratMax}
                          onChange={(e) => updateFilter('caratMax', e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs bg-[#F7F3EF] border border-[#E6DFD6] focus:outline-none text-[#3A2D28]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Diamond Quality: Color and Clarity */}
                <div className="py-4">
                  <button 
                    onClick={() => toggleSection('quality')}
                    className="w-full flex items-center justify-between font-serif text-[#3A2D28] text-sm font-medium py-1"
                  >
                    <span>Color & Clarity</span>
                    {openSection.quality ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
                  </button>
                  
                  {openSection.quality && (
                    <div className="mt-3 space-y-4">
                      {/* Color */}
                      <div>
                        <span className="text-[10px] text-[#A48374] font-bold block mb-1.5 uppercase">Color Grade</span>
                        <div className="flex flex-wrap gap-1">
                          {COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => updateFilter('color', color === c ? '' : c)}
                              className={`w-7 h-7 rounded-lg text-[10px] border transition-all font-semibold ${
                                color === c
                                  ? 'bg-[#3A2D28] text-[#F1EDE6] border-[#3A2D28]'
                                  : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clarity */}
                      <div>
                        <span className="text-[10px] text-[#A48374] font-bold block mb-1.5 uppercase">Clarity Grade</span>
                        <div className="flex flex-wrap gap-1">
                          {CLARITIES.map(cl => (
                            <button
                              key={cl}
                              onClick={() => updateFilter('clarity', clarity === cl ? '' : cl)}
                              className={`py-1 px-2 rounded-lg text-[9px] border transition-all font-semibold ${
                                clarity === cl
                                  ? 'bg-[#3A2D28] text-[#F1EDE6] border-[#3A2D28]'
                                  : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                              }`}
                            >
                              {cl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Jewelry-Specific Filters (Visible only if category is 'Jewelry' or empty) */}
            {(category === 'Jewelry' || !category) && (
              <>
                {/* Filter Section: Jewelry Type */}
                <div className="py-4">
                  <button 
                    onClick={() => toggleSection('jewelryType')}
                    className="w-full flex items-center justify-between font-serif text-[#3A2D28] text-sm font-medium py-1"
                  >
                    <span>Jewelry Type</span>
                    {openSection.jewelryType ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
                  </button>
                  
                  {openSection.jewelryType && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {JEWELRY_TYPES.map(jt => (
                        <button
                          key={jt}
                          onClick={() => updateFilter('jewelryType', jewelryType === jt ? '' : jt)}
                          className={`py-1.5 px-3 rounded-xl text-[10px] border transition-all ${
                            jewelryType === jt
                              ? 'bg-[#A48374] text-white border-[#A48374] font-bold'
                              : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                          }`}
                        >
                          {jt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter Section: Metal Type */}
                <div className="py-4">
                  <button 
                    onClick={() => toggleSection('metal')}
                    className="w-full flex items-center justify-between font-serif text-[#3A2D28] text-sm font-medium py-1"
                  >
                    <span>Metal / Alloy</span>
                    {openSection.metal ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
                  </button>
                  
                  {openSection.metal && (
                    <div className="space-y-1.5 mt-3">
                      {METALS.map(m => (
                        <button
                          key={m}
                          onClick={() => updateFilter('metalType', metalType === m ? '' : m)}
                          className={`w-full text-left py-2 px-3 rounded-xl text-xs border transition-all ${
                            metalType === m
                              ? 'bg-[#A48374] text-white border-[#A48374] font-bold'
                              : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter Section: Gender */}
                <div className="py-4">
                  <button 
                    onClick={() => toggleSection('gender')}
                    className="w-full flex items-center justify-between font-serif text-[#3A2D28] text-sm font-medium py-1"
                  >
                    <span>Gender Fit</span>
                    {openSection.gender ? <ChevronUp className="w-4 h-4 text-[#A48374]" /> : <ChevronDown className="w-4 h-4 text-[#A48374]" />}
                  </button>
                  
                  {openSection.gender && (
                    <div className="flex gap-2 mt-3">
                      {GENDERS.map(g => (
                        <button
                          key={g}
                          onClick={() => updateFilter('gender', gender === g ? '' : g)}
                          className={`flex-1 py-1.5 px-2 rounded-full text-[10px] text-center border transition-all font-semibold ${
                            gender === g
                              ? 'bg-[#3A2D28] text-[#F1EDE6] border-[#3A2D28]'
                              : 'bg-[#F7F3EF] text-[#3A2D28] border-transparent hover:bg-[#EBE3DB]'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </aside>

        {/* ========================================================
            PRODUCT GRID & CONTROLS (75% Width)
           ======================================================== */}
        <main className="w-full lg:w-3/4">
          
          {/* Controls Bar: Results Count & Sort Dropdown */}
          <div className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 mb-6 border border-[#E6DFD6] shadow-sm">
            <span className="text-xs text-[#3A2D28] font-semibold">
              {loading ? 'Searching catalog...' : `${totalResults} exquisite pieces found`}
            </span>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#A48374]" />
              <select 
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="text-xs text-[#3A2D28] bg-transparent border-0 focus:outline-none focus:ring-0 font-medium py-1 cursor-pointer"
              >
                <option value="newest">Sort by: New Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="oldest">Catalog Age</option>
              </select>
            </div>
          </div>

          {/* Error View */}
          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-200 text-center font-semibold mb-6">
              {error}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-[#E6DFD6] animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-1/2 mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded-full w-1/3"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-[#E6DFD6] text-center shadow-sm">
              <SlidersHorizontal className="w-12 h-12 text-[#CBAD8D] mx-auto mb-4 opacity-50" />
              <h3 className="font-serif text-lg text-[#3A2D28]">No exact matches found</h3>
              <p className="text-xs text-[#A48374] mt-2 max-w-sm mx-auto leading-relaxed">
                Adjust your filters, clear selected shape or metal specifications, or search for broader keywords.
              </p>
              <button 
                onClick={clearAllFilters}
                className="mt-6 px-6 py-2.5 bg-[#3A2D28] text-white text-xs font-semibold tracking-wider rounded-full hover:opacity-90 transition-opacity"
              >
                Reset Catalog
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map(product => (
                  <div 
                    key={product._id} 
                    onClick={() => navigate(`/products/${product._id}`)}
                    className="group bg-white rounded-3xl p-4 border border-[#E6DFD6] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Frame */}
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F7F3EF] mb-4 flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.title} 
                            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Sparkles className="w-8 h-8 text-[#CBAD8D] mx-auto mb-2 opacity-50" />
                            <span className="text-[10px] text-[#A48374] block uppercase font-bold tracking-widest">Image Coming Soon</span>
                          </div>
                        )}
                        
                        {/* Hover Overlay Button */}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/95 text-[#3A2D28] text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-full shadow-lg flex items-center gap-1.5 transition-transform translate-y-2 group-hover:translate-y-0 duration-300">
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </span>
                        </div>

                        {/* Category Tag */}
                        <span 
                          className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-[#3A2D28] shadow-sm"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)' }}
                        >
                          {product.category}
                        </span>

                        {/* Yellow M symbol for Memo holds */}
                        {product.status === 'on_memo' && (
                          <span 
                            className="absolute top-3 right-3 w-5 h-5 rounded-full bg-yellow-400 text-yellow-950 flex items-center justify-center text-[10px] font-black shadow-md border border-yellow-300 animate-pulse"
                            title="On Memo Hold"
                          >
                            M
                          </span>
                        )}
                      </div>

                      {/* Title & Details */}
                      <div className="px-1">
                        <span className="text-[10px] text-[#A48374] uppercase tracking-wider font-semibold">
                          Listed by: {product.sellerId?.name || 'Authorized Partner'}
                        </span>
                        <h3 className="font-serif text-[#3A2D28] text-sm mt-1 mb-2 line-clamp-1 group-hover:text-[#A48374] transition-colors">
                          {product.title}
                        </h3>

                        {/* Specific parameters */}
                        {product.category === 'Diamond' && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            <span className="bg-[#F7F3EF] text-[#3A2D28] text-[9px] px-2 py-0.5 rounded-full font-medium">
                              {product.carat} Carats
                            </span>
                            <span className="bg-[#F7F3EF] text-[#3A2D28] text-[9px] px-2 py-0.5 rounded-full font-medium">
                              {product.color} Color
                            </span>
                            <span className="bg-[#F7F3EF] text-[#3A2D28] text-[9px] px-2 py-0.5 rounded-full font-medium">
                              {product.clarity}
                            </span>
                          </div>
                        )}

                        {product.category === 'Jewelry' && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            <span className="bg-[#F7F3EF] text-[#3A2D28] text-[9px] px-2 py-0.5 rounded-full font-medium">
                              {product.metalType}
                            </span>
                            <span className="bg-[#F7F3EF] text-[#3A2D28] text-[9px] px-2 py-0.5 rounded-full font-medium">
                              {product.jewelryType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Frame */}
                    <div className="mt-3 pt-3 border-t border-[#F7F3EF] flex items-center justify-between px-1">
                      <span className="text-sm font-serif font-bold text-[#3A2D28]">
                        {formatINR(product.price)}
                      </span>
                      {product.stock > 0 ? (
                        product.status === 'on_memo' ? (
                          <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-wider">On Memo</span>
                        ) : (
                          <span className="text-[9px] text-[#6B8E23] font-bold uppercase tracking-wider">In Stock</span>
                        )
                      ) : (
                        <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider">Sold</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-10">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#E6DFD6] disabled:opacity-40 text-[#3A2D28] hover:bg-[#F7F3EF] transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1.5">
                    {[...Array(totalPages)].map((_, index) => {
                      const pNum = index + 1;
                      return (
                        <button
                          key={pNum}
                          onClick={() => handlePageChange(pNum)}
                          className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                            page === pNum
                              ? 'bg-[#3A2D28] text-[#F1EDE6]'
                              : 'bg-white text-[#3A2D28] border border-[#E6DFD6] hover:bg-[#F7F3EF]'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#E6DFD6] disabled:opacity-40 text-[#3A2D28] hover:bg-[#F7F3EF] transition-colors"
                  >
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
