const Order = require('../models/Order');
const { Product } = require('../models/Product');
const User = require('../models/User');

/**
 * Ensures a pending Order record exists for an awarded or completed RFQ.
 * @param {Object} rfq - The RFQ Mongoose document or plain object.
 * @param {Object} winningQuote - The winning quote object from rfq.quotes.
 */
const ensureRFQOrder = async (rfq, winningQuote) => {
  try {
    if (!rfq || !winningQuote || !winningQuote.productId) return null;

    // Check if an order already exists for this buyer and product
    const existingOrder = await Order.findOne({
      buyerId: rfq.buyerId,
      'items.productId': winningQuote.productId
    });

    if (existingOrder) {
      return existingOrder;
    }

    // Fetch product details for snapshot
    const product = await Product.findById(winningQuote.productId);
    const buyer = await User.findById(rfq.buyerId);

    const title = product ? product.title : `RFQ Diamond (${rfq.carat}ct ${rfq.shape}, ${rfq.color}/${rfq.clarity})`;
    const price = winningQuote.quotePrice || rfq.budget || 0;

    const order = await Order.create({
      buyerId: rfq.buyerId,
      sellerIds: [winningQuote.sellerId],
      items: [
        {
          productId: winningQuote.productId,
          title: title,
          priceAtPurchase: price,
          quantity: 1
        }
      ],
      shippingAddress: {
        fullName: (buyer && buyer.name) || rfq.buyerName || 'Valued Client',
        streetAddress: 'Pending Address Confirmation',
        city: 'Pending Checkout',
        state: 'Pending Checkout',
        zipCode: '000000',
        phoneNumber: (buyer && buyer.phone) || '0000000000'
      },
      paymentStatus: 'pending',
      orderStatus: 'processing',
      fulfillmentStatus: 'processing',
      totalAmount: price
    });

    console.log(`[RFQ Order Helper] Created pending order ${order._id} for awarded RFQ ${rfq._id}`);
    return order;
  } catch (error) {
    console.error('[RFQ Order Helper] Error ensuring RFQ order:', error);
    return null;
  }
};

module.exports = {
  ensureRFQOrder
};
