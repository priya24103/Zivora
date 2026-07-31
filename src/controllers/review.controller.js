const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Submit a seller rating & review for a delivered order
// @route   POST /api/reviews/seller
// @access  Private (Buyer only)
exports.submitSellerReview = async (req, res, next) => {
  try {
    const buyerId = req.user._id;
    const { orderId, rating, comment, productId } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and rating value (1-5) are required'
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be a number between 1 and 5'
      });
    }

    // 1. Fetch order details & verify ownership
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.buyerId.toString() !== buyerId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only rate your own orders.'
      });
    }

    // 2. Strict Post-Delivery Enforcement
    const isDelivered = 
      order.fulfillmentStatus === 'delivered' || 
      order.orderStatus === 'delivered';

    if (!isDelivered) {
      return res.status(400).json({
        status: 'error',
        message: 'Ratings are strictly restricted to delivered orders.'
      });
    }

    // 3. Resolve seller ID from order
    let targetSellerId = req.body.sellerId;
    if (!targetSellerId && order.sellerIds && order.sellerIds.length > 0) {
      targetSellerId = order.sellerIds[0];
    }

    if (!targetSellerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Could not determine seller associated with this order'
      });
    }

    const targetSellerIdObj = new mongoose.Types.ObjectId(targetSellerId);

    // 4. Duplicate Check
    const existingReview = await Review.findOne({
      buyerId,
      orderId,
      sellerId: targetSellerIdObj
    });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already submitted a rating for this seller on this order.'
      });
    }

    // 5. Create Review
    const review = await Review.create({
      buyerId,
      sellerId: targetSellerIdObj,
      orderId,
      productId: productId || (order.items?.[0]?.productId) || null,
      rating: numericRating,
      comment: comment || ''
    });

    // 6. Recalculate Seller Average Rating
    const stats = await Review.aggregate([
      { $match: { sellerId: targetSellerIdObj } },
      {
        $group: {
          _id: '$sellerId',
          avgRating: { $avg: '$rating' },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const roundedAvg = Math.round(stats[0].avgRating * 10) / 10;
      await User.findByIdAndUpdate(targetSellerIdObj, {
        'sellerProfile.rating': roundedAvg,
        'sellerProfile.ratingsCount': stats[0].totalCount
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Seller rating submitted successfully',
      data: { review }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already submitted a rating for this order.'
      });
    }
    next(error);
  }
};

// @desc    Get logged-in buyer's submitted reviews
// @route   GET /api/reviews/my-reviews
// @access  Private (Buyer only)
exports.getMyReviews = async (req, res, next) => {
  try {
    const buyerId = req.user._id;
    const reviews = await Review.find({ buyerId }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in seller's received customer reviews and stats
// @route   GET /api/reviews/seller-reviews
// @access  Private (Seller only)
exports.getSellerReviews = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const sellerIdObj = new mongoose.Types.ObjectId(sellerId);

    const reviews = await Review.find({ sellerId: sellerIdObj })
      .populate('buyerId', 'name email')
      .populate('productId', 'title images category')
      .populate({
        path: 'orderId',
        select: 'totalAmount items createdAt'
      })
      .sort({ createdAt: -1 });

    const stats = await Review.aggregate([
      { $match: { sellerId: sellerIdObj } },
      {
        $group: {
          _id: '$sellerId',
          avgRating: { $avg: '$rating' },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0.0;
    const totalCount = stats.length > 0 ? stats[0].totalCount : 0;

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        avgRating,
        totalCount,
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
};

