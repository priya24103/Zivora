const mongoose = require('mongoose');

const offerHistorySchema = new mongoose.Schema({
  senderType: {
    type: String,
    enum: ['buyer', 'seller'],
    required: [true, 'Sender type is required (buyer or seller)']
  },
  offerAmount: {
    type: Number,
    required: [true, 'Offer amount is required'],
    min: [0, 'Offer amount cannot be negative']
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const offerSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'ProductId is required']
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'BuyerId is required']
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'SellerId is required']
  },
  status: {
    type: String,
    enum: ['pending_seller', 'pending_buyer', 'accepted', 'rejected', 'completed'],
    default: 'pending_seller'
  },
  currentOfferAmount: {
    type: Number
  },
  history: [offerHistorySchema]
}, {
  timestamps: true
});

offerSchema.pre('save', function () {
  if (this.history && this.history.length > 0) {
    this.currentOfferAmount = this.history[this.history.length - 1].offerAmount;
  }
});

module.exports = mongoose.model('Offer', offerSchema);
