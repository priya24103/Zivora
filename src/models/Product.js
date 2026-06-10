const mongoose = require('mongoose');

// ==========================================
// 1. BASE PRODUCT SCHEMA (Shared Fields)
// ==========================================
const baseOptions = {
  discriminatorKey: 'category', // Mongoose will automatically set this to 'Diamond' or 'Jewelry'
  collection: 'products',       // Ensures everything stays in one unified collection
  timestamps: true
};

const ProductSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A product must belong to a seller']
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    default: 1,
    min: [0, 'Stock cannot be negative']
  },
  images: [{
    type: String // Array of Cloudinary URLs
  }],
  status: {
    type: String,
    enum: ['available', 'on_memo', 'sold'], // Fixed values for order/memo workflows
    default: 'available'
  },
  listingType: {
    type: String,
    enum: ['direct_sale', 'auction_only'],
    default: 'direct_sale'
  }
}, baseOptions);

// Text index for unified marketplace search
ProductSchema.index({ title: 'text', description: 'text' });

// Compile the base model
const Product = mongoose.model('Product', ProductSchema);

// ==========================================
// 2. DIAMOND SCHEMA (Strict Fields & Fixed Enums)
// ==========================================
const Diamond = Product.discriminator('Diamond', new mongoose.Schema({
  carat: { 
    type: Number, 
    required: [true, 'Carat weight is required'] 
  },
  color: { 
    type: String,
    enum: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    required: [true, 'Color grade is required']
  },
  clarity: { 
    type: String,
    enum: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'],
    required: [true, 'Clarity grade is required']
  },
  cut: { 
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
    required: [true, 'Cut grade is required']
  },
  shape: { 
    type: String,
    enum: ['Round', 'Princess', 'Cushion', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Marquise', 'Asscher', 'Heart'],
    required: [true, 'Diamond shape is required']
  },
  certificateLab: {
    type: String,
    enum: ['GIA', 'IGI', 'HRD', 'None'], // Supported certifications from the PRD
    default: 'None'
  },
  certificateNumber: { 
    type: String, 
    default: null 
  },
  certificateFileUrl: { 
    type: String, // Cloudinary PDF/Image link
    default: null 
  }
}));

// ==========================================
// 3. JEWELRY SCHEMA (Strict Fields & Fixed Enums)
// ==========================================
const Jewelry = Product.discriminator('Jewelry', new mongoose.Schema({
  jewelryType: { 
    type: String,
    enum: ['Ring', 'Necklace', 'Earring', 'Bracelet', 'Pendant', 'Bangle'],
    required: [true, 'Jewelry type is required']
  },
  metalType: { 
    type: String,
    enum: [
      '14k White Gold', '18k White Gold', 
      '14k Yellow Gold', '18k Yellow Gold', 
      '14k Rose Gold', '18k Rose Gold', 
      'Platinum', 'Silver'
    ],
    required: [true, 'Metal type is required']
  },
  weightGrams: { 
    type: Number,
    required: [true, 'Metal weight in grams is required']
  },
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex'], // Required for marketplace filtering
    required: [true, 'Target gender is required']
  },
  diamondDetails: { 
    type: String, // E.g., "Contains 0.5ct total accent diamonds, VS clarity"
    default: null
  }
}));

// Export all three so you can use them in your controllers
module.exports = {
  Product,
  Diamond,
  Jewelry
};
