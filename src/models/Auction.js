const mongoose = require('mongoose');

// ==========================================
// 1. BID SUB-SCHEMA
// ==========================================
const bidSchema = new mongoose.Schema({
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bidder ID is required']
  },
  bidderName: {
    type: String, // Kept for fast frontend rendering in the chat/bid log
    required: true
  },
  amount: { // Renamed from bidAmount to match PRD terminology
    type: Number,
    required: [true, 'Bid amount is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}); 
// Mongoose will automatically generate _id for each bid

// ==========================================
// 2. MAIN AUCTION SCHEMA
// ==========================================
const auctionSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Auction must be linked to a product']
  },
  startPrice: {
    type: Number,
    required: [true, 'Starting price is required']
  },
  minIncrement: {
    type: Number,
    required: [true, 'Minimum bid increment is required'],
    default: 100 // Default increment if the seller doesn't specify
  },
  currentHighestBid: { // Root level tracker for atomic updates
    type: Number,
    required: true
  },
  highestBidder: { // Root level tracker for the winner
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bidsCount: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: [true, 'Auction end time is required']
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'], // Added pending for scheduled auctions
    default: 'active'
  },
  bids: [bidSchema] // Embedded history of all bids
}, {
  timestamps: true
});

module.exports = mongoose.model('Auction', auctionSchema);
