const mongoose = require('mongoose');

// ==========================================
// 1. QUOTE SUB-SCHEMA (The Bids)
// ==========================================
const quoteSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },
  sellerName: {
    type: String, // Denormalized for faster frontend rendering
    required: true
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Sellers must attach a product from their inventory']
  },
  quotePrice: {
    type: Number,
    required: [true, 'Quote price is required'],
    min: [0, 'Quote cannot be negative']
  },
  message: {
    type: String,
    required: true,
    trim: true
  }
}, { 
  timestamps: true // Automatically tracks when the bid was placed (useful for tie-breakers)
}); 
// Removed { _id: false } so each bid gets a unique identifier

// ==========================================
// 2. MAIN RFQ SCHEMA
// ==========================================
const rfqSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  shape: {
    type: String,
    enum: ['Round', 'Princess', 'Cushion', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Marquise', 'Asscher', 'Heart'],
    required: true
  },
  carat: {
    type: Number, // Fixed: Must be a number
    required: true
  },
  color: {
    type: String,
    enum: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    required: true
  },
  clarity: {
    type: String,
    enum: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'],
    required: true
  },
  budget: {
    type: Number, // Fixed: Must be a number
    required: true
  },
  deadline: { 
    type: Date, // Added: Required for the cron job to know when to execute Min Heap logic
    required: [true, 'RFQ must have a deadline']
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'awarded'], // 'open' accepts bids, 'awarded' means winner chosen
    default: 'open'
  },
  winnerSeller: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  winningQuoteId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  quotes: [quoteSchema] // The embedded array of bids
}, {
  timestamps: true
});

module.exports = mongoose.model('RFQ', rfqSchema);
