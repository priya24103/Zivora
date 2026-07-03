const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  priceAtAdd: {
    type: Number,
    required: false
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cart must belong to a buyer'],
    unique: true, // A buyer has exactly one active cart
    alias: 'userId'
  },
  items: [cartItemSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// We can define a virtual property for cartTotal if populated, 
// though we will also calculate it on the fly in the controller.
cartSchema.virtual('cartTotal').get(function() {
  if (!this.items) return 0;
  return this.items.reduce((total, item) => {
    const price = item.productId && item.productId.price ? item.productId.price : 0;
    return total + (price * item.quantity);
  }, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
