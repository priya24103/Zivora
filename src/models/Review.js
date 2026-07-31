const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer ID is required']
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  rating: {
    type: Number,
    required: [true, 'Rating value is required'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars']
  },
  comment: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Enforce 1 review per buyer per delivered order & seller
reviewSchema.index({ buyerId: 1, orderId: 1, sellerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
