import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  ArrowRight, 
  Gem, 
  Settings, 
  CheckCircle2, 
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_URL = 'http://localhost:2409';

// Static choices matching Product.js schemas
const DIAMOND_SHAPES = ['Round', 'Princess', 'Cushion', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Marquise', 'Asscher', 'Heart'];
const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];
const DIAMOND_CUTS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

const JEWELRY_TYPES = ['Ring', 'Necklace', 'Earring', 'Bracelet', 'Pendant', 'Bangle'];
const METAL_TYPES = [
  '14k White Gold', '18k White Gold', 
  '14k Yellow Gold', '18k Yellow Gold', 
  '14k Rose Gold', '18k Rose Gold', 
  'Platinum', 'Silver'
];
const GENDERS = ['Men', 'Women', 'Unisex'];

export default function CreateAuction() {
  const navigate = useNavigate();

  // Steps state: 1 (Specs), 2 (Auction), 3 (Success)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [category, setCategory] = useState('Diamond'); // 'Diamond' or 'Jewelry'
  
  // Shared Product specs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Diamond specific specs
  const [carat, setCarat] = useState('');
  const [color, setColor] = useState('D');
  const [clarity, setClarity] = useState('VVS1');
  const [cut, setCut] = useState('Excellent');
  const [shape, setShape] = useState('Round');
  const [certificateLab, setCertificateLab] = useState('GIA');
  const [certificateNumber, setCertificateNumber] = useState('');

  // Jewelry specific specs
  const [jewelryType, setJewelryType] = useState('Ring');
  const [metalType, setMetalType] = useState('18k White Gold');
  const [weightGrams, setWeightGrams] = useState('');
  const [gender, setGender] = useState('Women');
  const [diamondDetails, setDiamondDetails] = useState('');

  // Auction specifications
  const [startPrice, setStartPrice] = useState('');
  const [minIncrement, setMinIncrement] = useState('100');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleNextStep = () => {
    // Validate Step 1 fields
    if (!title || !description) {
      setError('Please provide a title and description for the product.');
      return;
    }
    if (category === 'Diamond') {
      if (!carat || !shape || !color || !clarity || !cut) {
        setError('Please complete all diamond specifications.');
        return;
      }
    } else {
      if (!jewelryType || !metalType || !weightGrams || !gender) {
        setError('Please complete all jewelry specifications.');
        return;
      }
    }
    setError(null);
    setStep(2);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate Step 2 fields
    if (!startPrice || !registrationDeadline || !endTime) {
      setError('Starting price, registration deadline, and end time are required.');
      return;
    }

    const regDate = new Date(registrationDeadline);
    const endDate = new Date(endTime);
    const now = new Date();

    if (regDate <= now) {
      setError('Registration deadline must be a future datetime.');
      return;
    }

    if (endDate <= regDate) {
      setError('Auction end time must occur after the registration deadline.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Format images array
      const images = imageUrlInput 
        ? imageUrlInput.split(',').map(url => url.trim()).filter(Boolean)
        : ['https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=800'];

      // Construct unified payload
      const payload = {
        category,
        title,
        description,
        images,
        startPrice: Number(startPrice),
        minIncrement: Number(minIncrement) || 100,
        registrationDeadline: regDate.toISOString(),
        endTime: endDate.toISOString(),
        // Diamond fields
        ...(category === 'Diamond' && {
          carat: Number(carat),
          color,
          clarity,
          cut,
          shape,
          certificateLab,
          certificateNumber
        }),
        // Jewelry fields
        ...(category === 'Jewelry' && {
          jewelryType,
          metalType,
          weightGrams: Number(weightGrams),
          gender,
          diamondDetails
        })
      };

      const response = await axios.post(`${API_URL}/api/auctions/create`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setStep(3); // Success step
      }
    } catch (err) {
      console.error('Error creating 1-step auction:', err);
      setError(err.response?.data?.message || 'Failed to create auction. Verify details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F6] py-16 px-6 lg:px-16 text-[#3A2D28]">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link 
            to="/seller/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#A48374] hover:text-[#3A2D28] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Step indicator header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#A48374] font-semibold">1-Step Unified Creation</span>
            <h1 className="text-3xl font-light text-[#3A2D28] mt-2" style={{ fontFamily: 'Georgia, serif' }}>
              Launch Live Auction Drops
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step === i 
                    ? 'bg-[#3A2D28] text-white shadow-sm scale-110' 
                    : step > i 
                      ? 'bg-green-600 text-white' 
                      : 'bg-[#F5F1EC] text-[#A48374] border border-[#CBAD8D]/20'
                }`}
              >
                {step > i ? '✓' : i}
              </div>
            ))}
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/50 text-xs text-red-600 font-medium tracking-wide">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 border border-[#CBAD8D]/15 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: PRODUCT SPECIFICATIONS */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                key="step1"
                className="space-y-6"
              >
                <div className="flex items-center gap-2 pb-4 border-b border-[#CBAD8D]/15">
                  <Gem className="w-5 h-5 text-[#CBAD8D]" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Step 1: Product Specifications</h3>
                </div>

                {/* Category Switcher */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-3">Item Category</label>
                  <div className="flex gap-2">
                    {['Diamond', 'Jewelry'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setError(null);
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                          category === cat 
                            ? 'bg-[#3A2D28] text-white border-transparent shadow-sm' 
                            : 'bg-[#FAF8F6] text-[#A48374] border-[#CBAD8D]/20 hover:border-[#A48374]/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Product Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="e.g. 1.5 Carat Round Brilliant Solitaire Cut"
                      className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Product Description</label>
                    <textarea 
                      rows="3"
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Include cut nuances, gemstone brilliance details, and condition..."
                      className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#CBAD8D]" />
                      Images URLs (Comma separated)
                    </label>
                    <input 
                      type="text"
                      value={imageUrlInput} 
                      onChange={(e) => setImageUrlInput(e.target.value)} 
                      placeholder="https://images.unsplash.com/..., https://..."
                      className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28] font-mono"
                    />
                  </div>
                </div>

                {/* DIAMOND SPECIFIC FIELDS */}
                {category === 'Diamond' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#CBAD8D]/10">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Carat Weight</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={carat} 
                        onChange={(e) => setCarat(e.target.value)} 
                        placeholder="e.g. 1.25"
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Shape</label>
                      <select 
                        value={shape} 
                        onChange={(e) => setShape(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      >
                        {DIAMOND_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Color</label>
                      <select 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      >
                        {DIAMOND_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Clarity</label>
                      <select 
                        value={clarity} 
                        onChange={(e) => setClarity(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      >
                        {DIAMOND_CLARITIES.map(cl => <option key={cl} value={cl}>{cl}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Cut</label>
                      <select 
                        value={cut} 
                        onChange={(e) => setCut(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      >
                        {DIAMOND_CUTS.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Lab Certificate</label>
                      <input 
                        type="text" 
                        value={certificateLab} 
                        onChange={(e) => setCertificateLab(e.target.value)} 
                        placeholder="e.g. GIA"
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      />
                    </div>
                  </div>
                )}

                {/* JEWELRY SPECIFIC FIELDS */}
                {category === 'Jewelry' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#CBAD8D]/10">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Jewelry Type</label>
                      <select 
                        value={jewelryType} 
                        onChange={(e) => setJewelryType(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      >
                        {JEWELRY_TYPES.map(j => <option key={j} value={j}>{j}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Metal Type</label>
                      <select 
                        value={metalType} 
                        onChange={(e) => setMetalType(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      >
                        {METAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Metal Weight (Grams)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={weightGrams} 
                        onChange={(e) => setWeightGrams(e.target.value)} 
                        placeholder="e.g. 8.5"
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Target Gender</label>
                      <select 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      >
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Diamond Details (optional)</label>
                      <input 
                        type="text" 
                        value={diamondDetails} 
                        onChange={(e) => setDiamondDetails(e.target.value)} 
                        placeholder="e.g. Total 0.42ct accent diamonds, SI1 clarity, G-H color"
                        className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#A48374] transition-colors cursor-pointer"
                  >
                    Continue to Auction Parameters
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: AUCTION PARAMETERS */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                key="step2"
                className="space-y-6"
              >
                <div className="flex items-center gap-2 pb-4 border-b border-[#CBAD8D]/15">
                  <Settings className="w-5 h-5 text-[#CBAD8D]" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Step 2: Auction Parameters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Starting Price (INR)</label>
                    <input 
                      type="number" 
                      required
                      value={startPrice} 
                      onChange={(e) => setStartPrice(e.target.value)} 
                      placeholder="e.g. 150000"
                      className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Minimum Increment (INR)</label>
                    <input 
                      type="number" 
                      required
                      value={minIncrement} 
                      onChange={(e) => setMinIncrement(e.target.value)} 
                      placeholder="100"
                      className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Registration Deadline</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={registrationDeadline} 
                      onChange={(e) => setRegistrationDeadline(e.target.value)} 
                      className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#A48374] font-semibold mb-2">Auction End Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={endTime} 
                      onChange={(e) => setEndTime(e.target.value)} 
                      className="w-full px-4 py-3 text-xs border border-[#CBAD8D]/20 focus:border-[#A48374] focus:outline-none rounded-xl bg-[#FAF8F6] text-[#3A2D28]"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-[#CBAD8D]/10 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#CBAD8D]/20 text-[#A48374] hover:text-[#3A2D28] hover:bg-[#FAF8F6] text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#A48374] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CBAD8D]" />
                        Publishing Drop...
                      </>
                    ) : (
                      'Launch Live Auction'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SUCCESS FEEDBACK */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="step3"
                className="text-center py-10 space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto text-green-600">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-light text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>Auction Drop Created</h3>
                  <p className="text-xs text-[#A48374] mt-2 max-w-sm mx-auto leading-relaxed">
                    The gemstone specifications and live auction parameters have been successfully registered. The drop will appear live on the platform for buyer pre-registration.
                  </p>
                </div>
                <div className="pt-4 flex justify-center gap-4">
                  <button
                    onClick={() => navigate('/seller/dashboard')}
                    className="px-6 py-3 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#A48374] transition-colors"
                  >
                    View Auctions Tab
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
