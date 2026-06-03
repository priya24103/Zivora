const Auction = require('../models/Auction');
const { Product } = require('../models/Product');

// @desc    Create an auction for an available product
// @route   POST /api/auctions/create
// @access  Private (Seller only)
exports.createAuction = async (req, res, next) => {
  try {
    const { productId, startPrice, duration } = req.body;
    const sellerId = req.user._id;

    if (!productId || !startPrice) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID and starting price are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Verify ownership
    if (product.sellerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only auction your own products'
      });
    }

    // Verify status is available
    if (product.status !== 'available') {
      return res.status(400).json({
        status: 'error',
        message: 'Product must be available to be auctioned'
      });
    }

    // Calculate end time
    let hours = 24;
    if (duration === '48h') hours = 48;
    if (duration === '168h') hours = 168; // 1 week
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + hours);

    const auction = await Auction.create({
      productId,
      sellerId,
      title: product.title,
      category: product.category,
      carat: product.carat,
      color: product.color,
      clarity: product.clarity,
      cut: product.cut,
      startPrice,
      currentBid: startPrice,
      endTime,
      status: 'active',
      bidsCount: 0,
      bids: []
    });

    // Mark product as on_memo
    product.status = 'on_memo';
    await product.save();

    res.status(201).json({
      status: 'success',
      message: 'Auction created successfully',
      data: { auction }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active auctions
// @route   GET /api/auctions
// @access  Private
exports.getActiveAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({
      status: 'active',
      endTime: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: auctions.length,
      data: { auctions }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller's own auctions
// @route   GET /api/auctions/seller
// @access  Private (Seller only)
exports.getSellerAuctions = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const auctions = await Auction.find({ sellerId }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: auctions.length,
      data: { auctions }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Place a bid on an auction
// @route   POST /api/auctions/:id/bid
// @access  Private (Buyer only)
exports.placeBid = async (req, res, next) => {
  try {
    const auctionId = req.params.id;
    const { bidAmount } = req.body;
    const bidderId = req.user._id;
    const bidderName = req.user.name;

    if (!bidAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Bid amount is required'
      });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found'
      });
    }

    if (auction.status !== 'active' || auction.endTime < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Auction has ended'
      });
    }

    // Bid must be higher than starting price and current highest bid
    const minBid = auction.bidsCount === 0 ? auction.startPrice : auction.currentBid;
    if (bidAmount <= minBid) {
      return res.status(400).json({
        status: 'error',
        message: `Bid must be greater than current bid/start price of ₹${minBid}`
      });
    }

    // Add bid
    const newBid = {
      bidderId,
      bidderName,
      bidAmount,
      time: new Date()
    };

    auction.bids.push(newBid);
    auction.currentBid = bidAmount;
    auction.bidsCount += 1;
    await auction.save();

    // Broadcast update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('newBid', {
        auctionId: auction._id,
        currentBid: bidAmount,
        bidsCount: auction.bidsCount,
        newBid: {
          bidder: bidderName,
          bidAmount,
          time: 'Just now'
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bid placed successfully',
      data: { auction }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get buyer's bidding history
// @route   GET /api/auctions/my-bids
// @access  Private (Buyer only)
exports.getMyBids = async (req, res, next) => {
  try {
    const buyerId = req.user._id;

    // Find all auctions where the current buyer has placed at least one bid
    const auctions = await Auction.find({
      'bids.bidderId': buyerId
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: auctions.length,
      data: { auctions }
    });
  } catch (error) {
    next(error);
  }
};
