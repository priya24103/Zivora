const Auction = require('../models/Auction');
const { Product, Diamond, Jewelry } = require('../models/Product');

// @desc    Create an auction with its product listing (1-Step Flow)
// @route   POST /api/auctions/create
// @access  Private (Seller only)
exports.createAuction = async (req, res, next) => {
  let createdProduct = null;
  try {
    const { 
      // Product details
      category, 
      title, 
      description, 
      images, 
      carat, 
      color, 
      clarity, 
      cut, 
      shape, 
      certificateLab, 
      certificateNumber, 
      certificateFileUrl,
      jewelryType, 
      metalType, 
      weightGrams, 
      gender, 
      diamondDetails,
      
      // Auction details
      startPrice, 
      minIncrement, 
      endTime, 
      registrationDeadline,
      startTime
    } = req.body;

    const sellerId = req.user._id;

    // Verify user role is seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        status: 'error',
        message: 'Access restricted to sellers only'
      });
    }

    if (!category || !title || !description || !startPrice || !registrationDeadline || !endTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Product category, title, description, starting price, registration deadline, and end time are required'
      });
    }

    // 1. Prepare base product payload
    const productPayload = {
      sellerId,
      title,
      description,
      price: Number(startPrice),
      stock: 1,
      images: images || [],
      listingType: 'auction_only',
      status: 'available'
    };

    // 2. Instantiate correct model based on category
    let productInstance;
    if (category === 'Diamond' || category === 'Loose Diamond') {
      if (!carat || !color || !clarity || !cut || !shape) {
        return res.status(400).json({
          status: 'error',
          message: 'Carat, color, clarity, cut, and shape are required for Diamonds'
        });
      }
      productInstance = new Diamond({
        ...productPayload,
        carat: Number(carat),
        color,
        clarity,
        cut,
        shape,
        certificateLab: certificateLab || 'None',
        certificateNumber,
        certificateFileUrl
      });
    } else if (category === 'Jewelry') {
      if (!jewelryType || !metalType || !weightGrams || !gender) {
        return res.status(400).json({
          status: 'error',
          message: 'Jewelry type, metal type, weight in grams, and target gender are required for Jewelry'
        });
      }
      productInstance = new Jewelry({
        ...productPayload,
        jewelryType,
        metalType,
        weightGrams: Number(weightGrams),
        gender,
        diamondDetails
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: `Invalid product category: "${category}". Category must be either "Diamond" or "Jewelry".`
      });
    }

    // Step A: Save Product
    createdProduct = await productInstance.save();

    // Step B: Prepare and save Auction
    const parsedRegDeadline = new Date(registrationDeadline);
    const parsedEndTime = new Date(endTime);

    if (isNaN(parsedRegDeadline.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid registration deadline date format'
      });
    }

    if (isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid auction end time date format'
      });
    }

    if (parsedEndTime <= parsedRegDeadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Auction end time must occur after the registration deadline'
      });
    }

    const auction = new Auction({
      productId: createdProduct._id,
      sellerId,
      startPrice: Number(startPrice),
      minIncrement: Number(minIncrement) || 100,
      currentHighestBid: Number(startPrice),
      highestBidder: null,
      registrationDeadline: parsedRegDeadline,
      endTime: parsedEndTime,
      startTime: parsedRegDeadline, // Set startTime exactly equal to registrationDeadline
      status: 'pending', // Initialize as pending
      bidsCount: 0,
      registeredBuyers: [],
      bids: []
    });

    const savedAuction = await auction.save();

    // Step C: Return success response
    res.status(201).json({
      status: 'success',
      message: 'Auction and product created successfully in a 1-step flow',
      data: {
        auction: savedAuction,
        product: createdProduct
      }
    });

  } catch (error) {
    // Rollback: if product was saved but auction creation failed, delete the product to prevent orphans
    if (createdProduct && createdProduct._id) {
      try {
        await Product.findByIdAndDelete(createdProduct._id);
        console.log(`Rollback completed: Deleted orphaned product ${createdProduct._id}`);
      } catch (deleteErr) {
        console.error(`Rollback failed to delete product ${createdProduct._id}:`, deleteErr);
      }
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }

    next(error);
  }
};

// @desc    Register a buyer for an auction
// @route   POST /api/auctions/:id/register
// @access  Private (Buyer only)
exports.registerForAuction = async (req, res, next) => {
  try {
    const auctionId = req.params.id;
    const userId = req.user._id;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found'
      });
    }

    if (new Date() >= new Date(auction.registrationDeadline)) {
      return res.status(400).json({
        status: 'error',
        message: 'Registration deadline has passed'
      });
    }

    // Check if already registered
    const isAlreadyRegistered = auction.registeredBuyers.some(
      (buyerId) => buyerId.toString() === userId.toString()
    );

    if (isAlreadyRegistered) {
      return res.status(200).json({
        status: 'success',
        message: 'You are already registered for this auction',
        data: { auction }
      });
    }

    auction.registeredBuyers.push(userId);
    await auction.save();

    res.status(200).json({
      status: 'success',
      message: 'Successfully registered for auction',
      data: { auction }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get auction dashboard (upcoming, live, closed)
// @route   GET /api/auctions/dashboard
// @access  Private
exports.getAuctionDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    // Upcoming: status is pending/active and startTime > now
    const upcoming = await Auction.find({
      $or: [
        { status: 'pending', startTime: { $gt: now } },
        { status: 'active', startTime: { $gt: now } }
      ]
    }).populate('productId').populate('sellerId', 'name email').sort({ startTime: 1 });

    // Live: status is active/pending and startTime <= now and endTime >= now
    const live = await Auction.find({
      $or: [
        { status: 'active', startTime: { $lte: now }, endTime: { $gte: now } },
        { status: 'pending', startTime: { $lte: now }, endTime: { $gte: now } }
      ]
    }).populate('productId').populate('sellerId', 'name email').sort({ endTime: 1 });

    // Closed: status is completed/cancelled or endTime < now
    const closed = await Auction.find({
      $or: [
        { status: 'completed' },
        { status: 'cancelled' },
        { status: 'active', endTime: { $lt: now } },
        { status: 'pending', endTime: { $lt: now } }
      ]
    }).populate('productId').populate('sellerId', 'name email').sort({ endTime: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        upcoming,
        live,
        closed
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active auctions
// @route   GET /api/auctions
// @access  Private
// exports.getActiveAuctions = async (req, res, next) => {
exports.getActiveAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({
      $or: [
        { status: 'active', endTime: { $gt: new Date() } },
        { status: 'pending', startTime: { $lte: new Date() }, endTime: { $gt: new Date() } }
      ]
    }).populate('productId').sort({ createdAt: -1 });

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
    const auctions = await Auction.find({ sellerId })
      .populate('productId')
      .populate('registeredBuyers', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: auctions.length,
      data: { auctions }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an auction
// @route   PATCH /api/auctions/:id/cancel
// @access  Private (Seller only)
exports.cancelAuction = async (req, res, next) => {
  try {
    const auctionId = req.params.id;
    const sellerId = req.user._id;

    const auction = await Auction.findOne({ _id: auctionId, sellerId });
    if (!auction) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found or you are not authorized to cancel it'
      });
    }

    if (auction.status === 'completed' || auction.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: `Auction is already ${auction.status}`
      });
    }

    auction.status = 'cancelled';
    await auction.save();

    // Revert product status back to available if it was on_memo
    if (auction.productId) {
      await Product.findByIdAndUpdate(auction.productId, { status: 'available' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Auction cancelled successfully',
      data: { auction }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Place a bid on an auction (REST fallback)
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

    // Verify registration
    const isRegistered = auction.registeredBuyers.some(
      (buyerId) => buyerId.toString() === bidderId.toString()
    );
    if (!isRegistered) {
      return res.status(403).json({
        status: 'error',
        message: 'You must be registered for this auction to place a bid'
      });
    }

    const now = new Date();
    if (now < new Date(auction.startTime)) {
      return res.status(400).json({
        status: 'error',
        message: 'The auction has not started yet. Bidding opens when registration closes.'
      });
    }

    if (auction.status === 'pending') {
      auction.status = 'active';
      await auction.save();
    }

    if (auction.status !== 'active' || new Date(auction.endTime) < now) {
      return res.status(400).json({
        status: 'error',
        message: 'Auction has ended or is not active'
      });
    }

    const minIncrement = auction.minIncrement || 100;
    const minBid = auction.currentHighestBid + minIncrement;
    if (Number(bidAmount) < minBid) {
      return res.status(400).json({
        status: 'error',
        message: `Bid must be at least ₹${minBid.toLocaleString('en-IN')}`
      });
    }

    // Atomic update
    const newBid = {
      bidderId,
      bidderName,
      amount: Number(bidAmount),
      timestamp: new Date()
    };

    const updatedAuction = await Auction.findOneAndUpdate(
      {
        _id: auctionId,
        currentHighestBid: { $lt: Number(bidAmount) },
        status: 'active',
        endTime: { $gt: new Date() }
      },
      {
        $set: {
          currentHighestBid: Number(bidAmount),
          highestBidder: bidderId
        },
        $inc: { bidsCount: 1 },
        $push: { bids: newBid }
      },
      { new: true }
    );

    if (!updatedAuction) {
      return res.status(400).json({
        status: 'error',
        message: 'Bid failed. Your bid may be too low or the auction has ended.'
      });
    }

    // Broadcast update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(auctionId.toString()).emit('new_bid', {
        auctionId,
        amount: Number(bidAmount),
        bidderName,
        bidderId,
        timestamp: newBid.timestamp,
        currentHighestBid: Number(bidAmount),
        bidsCount: updatedAuction.bidsCount,
        bids: updatedAuction.bids
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bid placed successfully',
      data: { auction: updatedAuction }
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
    }).populate('productId').sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: auctions.length,
      data: { auctions }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single auction details by ID
// @route   GET /api/auctions/:id
// @access  Private
exports.getAuctionById = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('productId')
      .populate('sellerId', 'name email')
      .populate('registeredBuyers', 'name email phone');

    if (!auction) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { auction }
    });
  } catch (error) {
    next(error);
  }
};
