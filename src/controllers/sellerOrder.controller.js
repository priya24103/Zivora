const Order = require('../models/Order');
const RFQ = require('../models/RFQ');
const { ensureRFQOrder } = require('../utils/rfqOrderHelper');

// @desc    Fetch all segmented orders for the authenticated seller
// @route   GET /api/seller/orders
// @access  Private (Seller only)
exports.getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const sellerIdStr = sellerId.toString();

    // Reconciliation Step: Ensure an Order record exists for all awarded/completed RFQs for this seller
    const awardedRFQs = await RFQ.find({
      status: { $in: ['awarded', 'completed'] }
    });

    for (const rfq of awardedRFQs) {
      let winningQuote = rfq.winningQuoteId ? rfq.quotes.id(rfq.winningQuoteId) : null;
      if (!winningQuote) {
        winningQuote = rfq.quotes.find(q => {
          const qSeller = q.sellerId?._id || q.sellerId;
          return qSeller && qSeller.toString() === sellerIdStr && q.accepted;
        });
      }
      if (!winningQuote) {
        winningQuote = rfq.quotes.find(q => {
          const qSeller = q.sellerId?._id || q.sellerId;
          return qSeller && qSeller.toString() === sellerIdStr;
        });
      }

      if (winningQuote) {
        const winnerId = (rfq.winnerSeller?._id || rfq.winnerSeller || winningQuote.sellerId?._id || winningQuote.sellerId || '').toString();
        if (winnerId === sellerIdStr) {
          await ensureRFQOrder(rfq, winningQuote);
        }
      }
    }

    // Fetch all orders matching the seller's user ID
    const orders = await Order.find({ sellerIds: sellerId })
      .populate({
        path: 'buyerId',
        select: 'name email'
      })
      .populate({
        path: 'items.productId',
        select: 'title images category weightGrams jewelryType metalType carat color clarity cut shape description listingType'
      })
      .sort({ createdAt: -1 });

    const rfqProductIds = new Set(
      awardedRFQs.map(rfq => {
        let winningQuote = rfq.winningQuoteId ? rfq.quotes.id(rfq.winningQuoteId) : null;
        if (!winningQuote) {
          winningQuote = rfq.quotes.find(q => q.sellerId.toString() === sellerId.toString());
        }
        return winningQuote ? winningQuote.productId.toString() : null;
      }).filter(Boolean)
    );

    const directSaleOrders = [];
    const auctionOrders = [];
    const rfqOrders = [];

    for (const order of orders) {
      let isAuction = false;
      let isRfq = false;

      for (const item of order.items) {
        const product = item.productId;
        if (product) {
          if (product.listingType === 'auction_only') {
            isAuction = true;
          } else if (rfqProductIds.has(product._id.toString())) {
            isRfq = true;
          }
        } else {
          // If title includes RFQ or product missing, check rfq
          if (item.title && item.title.includes('RFQ')) {
            isRfq = true;
          }
        }
      }

      if (isAuction) {
        auctionOrders.push(order);
      } else if (isRfq) {
        rfqOrders.push(order);
      } else {
        directSaleOrders.push(order);
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        directSaleOrders,
        auctionOrders,
        rfqOrders
      }
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error during fetching seller orders.'
    });
  }
};

// @desc    Update tracking and fulfillment status for an order
// @route   PUT /api/seller/orders/:id/tracking
// @access  Private (Seller only)
exports.updateTrackingStatus = async (req, res, next) => {
  try {
    const { fulfillmentStatus, trackingNumber } = req.body;
    const orderId = req.params.id;
    const sellerId = req.user._id;

    if (!fulfillmentStatus) {
      return res.status(400).json({
        status: 'error',
        message: 'Fulfillment status is required.'
      });
    }

    const allowedStatus = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatus.includes(fulfillmentStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid fulfillment status.'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found.'
      });
    }

    // Verify that the seller is authorized for this order
    const isSeller = order.sellerIds.some(id => id.toString() === sellerId.toString());
    if (!isSeller) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update tracking for this order.'
      });
    }

    order.fulfillmentStatus = fulfillmentStatus;
    order.orderStatus = fulfillmentStatus; // sync fulfillment with orderStatus

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate({
        path: 'buyerId',
        select: 'name email'
      })
      .populate({
        path: 'items.productId',
        select: 'title images category weightGrams jewelryType metalType carat color clarity cut shape description listingType'
      });

    res.status(200).json({
      status: 'success',
      message: 'Order tracking details updated successfully',
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error('Error updating order tracking details:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error during updating order tracking details.'
    });
  }
};
