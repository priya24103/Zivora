import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  UploadCloud, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Diamond as DiamondIcon, 
  Gem, 
  Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

export default function AddProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Auth & Token verification
  const [token, setToken] = useState(null);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('zivora_token');
    const savedUser = localStorage.getItem('zivora_user');
    
    if (!savedToken || !savedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== 'seller') {
      navigate('/');
      return;
    }

    setToken(savedToken);
    setSeller(parsedUser);
  }, [navigate]);

  // Wizard state
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('Diamond'); // 'Diamond' (Loose Diamond) or 'Jewelry'

  // Form Field states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState(1);
  const [images, setImages] = useState([]); // List of Cloudinary URLs

  // Diamond specific specifications
  const [carat, setCarat] = useState('');
  const [shape, setShape] = useState('Round');
  const [color, setColor] = useState('D');
  const [clarity, setClarity] = useState('VS1');
  const [cut, setCut] = useState('Excellent');
  const [certificateLab, setCertificateLab] = useState('GIA');
  const [certificateNumber, setCertificateNumber] = useState('');

  // Jewelry specific specifications
  const [jewelryType, setJewelryType] = useState('Ring');
  const [metalType, setMetalType] = useState('18k White Gold');
  const [weightGrams, setWeightGrams] = useState('');
  const [gender, setGender] = useState('Women');
  const [diamondDetails, setDiamondDetails] = useState('');

  // Status & loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Dropdown options matching backend enums
  const diamondShapes = ['Round', 'Princess', 'Cushion', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Marquise', 'Asscher', 'Heart'];
  const diamondColors = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const diamondClarities = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];
  const diamondCuts = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
  const certificateLabs = ['GIA', 'IGI', 'HRD', 'None'];

  const jewelryTypes = ['Ring', 'Necklace', 'Earring', 'Bracelet', 'Pendant', 'Bangle'];
  const metalTypes = [
    '14k White Gold', '18k White Gold', 
    '14k Yellow Gold', '18k Yellow Gold', 
    '14k Rose Gold', '18k Rose Gold', 
    'Platinum', 'Silver'
  ];
  const genders = ['Men', 'Women', 'Unisex'];

  // Handle Drag Events for file upload
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop of files
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  // Handle file select via browse dialog
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFiles(e.target.files);
    }
  };

  // Upload files to Express upload backend
  const uploadFiles = async (fileList) => {
    setIsUploading(true);
    setErrorMessage('');
    const formData = new FormData();
    
    // Convert FileList to array and restrict to max remaining images (up to 5 total)
    const filesToUpload = Array.from(fileList).slice(0, 5 - images.length);
    if (filesToUpload.length === 0) {
      setErrorMessage('You can upload up to 5 images in total.');
      setIsUploading(false);
      return;
    }

    filesToUpload.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await axios.post('http://localhost:2409/api/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        setImages((prev) => [...prev, ...res.data.urls]);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to upload images. Ensure files are under 10MB (.jpg, .png, .pdf).');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove an uploaded image from status state
  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Validate Phase 1
  const validatePhase1 = () => {
    if (!title.trim()) return 'Product title is required';
    if (!price || Number(price) <= 0) return 'Please enter a valid price greater than 0';
    if (!stock || Number(stock) < 0) return 'Stock cannot be negative';
    if (!description.trim()) return 'Product description is required';
    return null;
  };

  // Handle Next Phase Navigation
  const handleNext = () => {
    const error = validatePhase1();
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  // Handle Back Navigation
  const handleBack = () => {
    setErrorMessage('');
    setStep(1);
  };

  // Submit Listing Form to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    // Build the request body payload based on the discriminator
    const basePayload = {
      category,
      title,
      description,
      price: Number(price),
      stock: Number(stock),
      images
    };

    let specPayload = {};
    if (category === 'Diamond') {
      if (!carat || Number(carat) <= 0) {
        setErrorMessage('Carat weight must be greater than 0');
        setIsSubmitting(false);
        return;
      }
      specPayload = {
        carat: Number(carat),
        shape,
        color,
        clarity,
        cut,
        certificateLab,
        certificateNumber: certificateNumber.trim() || null
      };
    } else {
      if (!weightGrams || Number(weightGrams) <= 0) {
        setErrorMessage('Metal weight must be greater than 0');
        setIsSubmitting(false);
        return;
      }
      specPayload = {
        jewelryType,
        metalType,
        weightGrams: Number(weightGrams),
        gender,
        diamondDetails: diamondDetails.trim() || null
      };
    }

    const payload = { ...basePayload, ...specPayload };

    try {
      const res = await axios.post('http://localhost:2409/api/products/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.status === 'success') {
        setSuccessMessage('Your product has been published successfully!');
        setTimeout(() => {
          navigate('/seller/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Submit listing error:', err);
      setErrorMessage(err.response?.data?.message || 'Listing creation failed. Please check spec requirements.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6 lg:px-16" style={{ backgroundColor: '#F7F3EF' }}>
      <div className="max-w-3xl mx-auto">
        
        {/* Back Link to Dashboard */}
        <button
          onClick={() => navigate('/seller/dashboard')}
          className="flex items-center gap-2 mb-6 text-xs uppercase tracking-widest text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        {/* Headline */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.35em] text-[#A48374]">Marketplace listing</span>
          <h1 className="text-4xl mt-2 text-[#3A2D28]" style={{ fontWeight: 200, fontFamily: 'Georgia, serif' }}>
            Add New Product
          </h1>
        </div>

        {/* Elegant Form Wrapper */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/10 overflow-hidden relative">
          
          {/* Progress / Step Banner */}
          <div className="flex border-b border-[#CBAD8D]/10 text-center text-xs font-semibold uppercase tracking-wider">
            <div className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all ${
              step === 1 ? 'bg-[#FBF9F6] text-[#A48374] border-b-2 border-[#A48374]' : 'text-[#A48374]/50'
            }`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
              Basic Information
            </div>
            <div className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all ${
              step === 2 ? 'bg-[#FBF9F6] text-[#A48374] border-b-2 border-[#A48374]' : 'text-[#A48374]/50'
            }`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
              Detailed Specifications
            </div>
          </div>

          <div className="p-8 md:p-12">
            
            {/* Smooth Sliding Switch - Category Selector (Available in Step 1) */}
            {step === 1 && (
              <div className="flex flex-col items-center mb-8">
                <span className="text-xs font-semibold text-[#A48374] uppercase tracking-wider mb-3">Select Product Type</span>
                <div className="relative flex p-1 bg-[#F1EDE6] rounded-full w-full max-w-[360px]">
                  {/* Active Slide Indicator */}
                  <motion.div
                    className="absolute top-1 bottom-1 rounded-full bg-[#A48374]"
                    initial={false}
                    animate={{
                      x: category === 'Diamond' ? 0 : '100%',
                      width: '50%'
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    style={{ left: 0 }}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setCategory('Diamond')}
                    className={`relative z-10 w-1/2 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
                      category === 'Diamond' ? 'text-white' : 'text-[#3A2D28]'
                    }`}
                  >
                    Loose Diamond
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('Jewelry')}
                    className={`relative z-10 w-1/2 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
                      category === 'Jewelry' ? 'text-white' : 'text-[#3A2D28]'
                    }`}
                  >
                    Jewelry
                  </button>
                </div>
              </div>
            )}

            {/* Status alerts */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 mb-6 rounded-2xl flex items-start gap-3 text-xs bg-[#FFF5F5] border border-[#FFE3E3] text-[#E53E3E]"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            <AnimatePresence>
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[#A48374] flex items-center justify-center mb-4 text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl text-[#3A2D28] mb-1" style={{ fontWeight: 300, fontFamily: 'Georgia, serif' }}>
                    Listing Added Successfully
                  </h3>
                  <p className="text-xs text-[#A48374]">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* WIZARD FORMS */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1: COMMON BASIC DETAILS */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Title Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#3A2D28]">
                      Product Title <span className="text-[#E53E3E]">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={category === 'Diamond' ? 'E.g., Round Brilliant Diamond 2.5ct D VVS1' : 'E.g., 18k White Gold Accent Diamond Halo Ring'} 
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                      style={{ backgroundColor: '#F1EDE6' }}
                      required
                    />
                  </div>

                  {/* Price & Stock Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#3A2D28]">
                        Price ($) <span className="text-[#E53E3E]">*</span>
                      </label>
                      <input 
                        type="number" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="E.g., 45000" 
                        min="0"
                        className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                        style={{ backgroundColor: '#F1EDE6' }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#3A2D28]">
                        Stock Quantity <span className="text-[#E53E3E]">*</span>
                      </label>
                      <input 
                        type="number" 
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="E.g., 1" 
                        min="0"
                        className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                        style={{ backgroundColor: '#F1EDE6' }}
                        required
                      />
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#3A2D28]">
                      Description <span className="text-[#E53E3E]">*</span>
                    </label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write details regarding origin, certificate status, and fine details..." 
                      rows="4"
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                      style={{ backgroundColor: '#F1EDE6' }}
                      required
                    />
                  </div>

                  {/* Images Upload Area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#3A2D28]">
                      Product Images <span className="text-xs text-[#A48374] font-normal">(Max 5)</span>
                    </label>

                    {/* Drag & drop container */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                        dragActive 
                          ? 'border-[#3A2D28] bg-[#F1EDE6]/60' 
                          : 'border-[#A48374]/30 bg-[#F1EDE6]/30 hover:bg-[#F1EDE6]/50'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                        accept="image/*"
                      />
                      
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-[#A48374] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-medium text-[#3A2D28]">Uploading files to Cloudinary...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-10 h-10 text-[#A48374]" />
                          <p className="text-sm font-medium text-[#3A2D28]">Click to upload or drag and drop</p>
                          <p className="text-xs text-[#A48374]">PNG, JPG up to 10MB (max 5 images)</p>
                        </>
                      )}
                    </div>

                    {/* Image Thumbnails Previews */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-5 gap-3 mt-4">
                        {images.map((url, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-[#CBAD8D]/20 bg-gray-50">
                            <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Step 1 */}
                  <div className="flex justify-end pt-4 border-t border-[#CBAD8D]/10">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-8 py-3.5 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#A48374] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: CATEGORY-SPECIFIC DETAILS */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  
                  {/* DIAMOND SPECIFIC FIELDS */}
                  {category === 'Diamond' ? (
                    <div className="space-y-6">
                      
                      {/* Carat & Shape Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Carat Weight <span className="text-[#E53E3E]">*</span>
                          </label>
                          <input 
                            type="number" 
                            value={carat}
                            onChange={(e) => setCarat(e.target.value)}
                            placeholder="E.g., 2.50" 
                            step="0.01"
                            min="0.01"
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Diamond Shape <span className="text-[#E53E3E]">*</span>
                          </label>
                          <select 
                            value={shape}
                            onChange={(e) => setShape(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28] appearance-none"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          >
                            {diamondShapes.map((sh) => (
                              <option key={sh} value={sh}>{sh}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Color & Clarity Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Color Grade <span className="text-[#E53E3E]">*</span>
                          </label>
                          <select 
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          >
                            {diamondColors.map((col) => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Clarity Grade <span className="text-[#E53E3E]">*</span>
                          </label>
                          <select 
                            value={clarity}
                            onChange={(e) => setClarity(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          >
                            {diamondClarities.map((cl) => (
                              <option key={cl} value={cl}>{cl}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Cut & Certificate Lab Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Cut Grade <span className="text-[#E53E3E]">*</span>
                          </label>
                          <select 
                            value={cut}
                            onChange={(e) => setCut(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          >
                            {diamondCuts.map((ct) => (
                              <option key={ct} value={ct}>{ct}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Certificate Lab
                          </label>
                          <select 
                            value={certificateLab}
                            onChange={(e) => setCertificateLab(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                          >
                            {certificateLabs.map((lab) => (
                              <option key={lab} value={lab}>{lab}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Certificate Number Field */}
                      {certificateLab !== 'None' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Certificate Number
                          </label>
                          <input 
                            type="text" 
                            value={certificateNumber}
                            onChange={(e) => setCertificateNumber(e.target.value)}
                            placeholder="E.g., GIA-12345678" 
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    
                    /* JEWELRY SPECIFIC FIELDS */
                    <div className="space-y-6">
                      
                      {/* Jewelry Type & Metal Type Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Jewelry Type <span className="text-[#E53E3E]">*</span>
                          </label>
                          <select 
                            value={jewelryType}
                            onChange={(e) => setJewelryType(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          >
                            {jewelryTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Metal Type <span className="text-[#E53E3E]">*</span>
                          </label>
                          <select 
                            value={metalType}
                            onChange={(e) => setMetalType(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          >
                            {metalTypes.map((metal) => (
                              <option key={metal} value={metal}>{metal}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Metal Weight & Target Gender Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Weight (Grams) <span className="text-[#E53E3E]">*</span>
                          </label>
                          <input 
                            type="number" 
                            value={weightGrams}
                            onChange={(e) => setWeightGrams(e.target.value)}
                            placeholder="E.g., 4.5" 
                            step="0.01"
                            min="0.01"
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#3A2D28]">
                            Target Gender <span className="text-[#E53E3E]">*</span>
                          </label>
                          <select 
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                            style={{ backgroundColor: '#F1EDE6' }}
                            required
                          >
                            {genders.map((gen) => (
                              <option key={gen} value={gen}>{gen}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Accent Diamond Details Field */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[#3A2D28]">
                          Accent Diamond Details
                        </label>
                        <textarea 
                          value={diamondDetails}
                          onChange={(e) => setDiamondDetails(e.target.value)}
                          placeholder="E.g., Contains 0.5ct total accent diamonds, VS clarity..." 
                          rows="3"
                          className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#CBAD8D] transition-shadow text-[#3A2D28]"
                          style={{ backgroundColor: '#F1EDE6' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Wizard Step 2 Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-[#CBAD8D]/10">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-8 py-3.5 border border-[#A48374]/30 text-[#A48374] text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#F1EDE6] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3.5 bg-[#A48374] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#3A2D28] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Submit Listing'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
