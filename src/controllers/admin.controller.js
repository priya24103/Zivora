const User = require('../models/User');
const { Product } = require('../models/Product');
const Auction = require('../models/Auction');
const RFQ = require('../models/RFQ');
const jwt = require('jsonwebtoken');
const { sendKycResultEmail } = require('../utils/sendEmail');

// Helper to generate JWT token for admin session
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'zivora_fine_diamonds_secret_key_12345';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

/**
 * @desc    Authenticate admin user and return JWT
 * @route   POST /api/admin/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both email and password'
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Double check role
    if (user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You do not have administrator privileges.'
      });
    }

    // Verify password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Verify status is not suspended
    if (user.status === 'suspended') {
      return res.status(403).json({
        status: 'error',
        message: 'Your admin account has been suspended.'
      });
    }

    const token = generateToken(user._id);

    // Prepare response object
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: 'success',
      message: 'Admin logged in successfully',
      token,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get counts for dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Admin Only
 */
exports.getStats = async (req, res, next) => {
  try {
    const [
      buyersCount,
      sellersCount,
      directSaleCount,
      auctionProductCount,
      activeAuctionsCount,
      activeRfqsCount
    ] = await Promise.all([
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments({ listingType: 'direct_sale' }),
      Product.countDocuments({ listingType: 'auction_only' }),
      Auction.countDocuments({ status: 'active' }),
      RFQ.countDocuments({ status: 'open' })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: buyersCount + sellersCount,
          buyers: buyersCount,
          sellers: sellersCount
        },
        products: {
          total: directSaleCount + auctionProductCount,
          directSale: directSaleCount,
          auctionOnly: auctionProductCount
        },
        activeAuctions: activeAuctionsCount,
        activeRfqs: activeRfqsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch all users, optional role filter
 * @route   GET /api/admin/users
 * @access  Admin Only
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const query = {};
    
    if (role && ['buyer', 'seller', 'admin'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user's account status (active, suspended, pending_kyc)
 * @route   PUT /api/admin/users/:id/status
 * @access  Admin Only
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended', 'pending_kyc'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Status must be one of: active, suspended, pending_kyc'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `User status successfully updated to ${status}`,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all inventory across the entire platform
 * @route   GET /api/admin/products
 * @access  Admin Only
 */
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('sellerId', 'name company email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all auctions (past, live, upcoming)
 * @route   GET /api/admin/auctions
 * @access  Admin Only
 */
exports.getAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find()
      .populate('productId')
      .populate('highestBidder', 'name email company')
      .populate('sellerId', 'name email company')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: auctions.length,
      data: {
        auctions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all RFQs and their current statuses
 * @route   GET /api/admin/rfqs
 * @access  Admin Only
 */
exports.getRfqs = async (req, res, next) => {
  try {
    const rfqs = await RFQ.find()
      .populate('buyerId', 'name email company')
      .populate('winnerSeller', 'name email company')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: rfqs.length,
      data: {
        rfqs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pending eKYC requests for sellers
 * @route   GET /api/admin/kyc-requests
 * @access  Admin Only
 */
exports.getKycRequests = async (req, res, next) => {
  try {
    const users = await User.find({
      role: 'seller',
      isVerified: true,
      'sellerProfile.kycStatus': 'pending'
    }).sort({ createdAt: 1 }); // Process in order of signup

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        sellers: users
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject a seller's KYC document application
 * @route   PUT /api/admin/kyc/:userId/action
 * @access  Admin Only
 */
exports.takeKycAction = async (req, res, next) => {
  try {
    const { action } = req.body;
    const { userId } = req.params;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Action must be "approve" or "reject".'
      });
    }

    const seller = await User.findById(userId);
    if (!seller) {
      return res.status(404).json({
        status: 'error',
        message: 'Seller user not found'
      });
    }

    if (!seller.sellerProfile) {
      seller.sellerProfile = {};
    }

    if (action === 'approve') {
      seller.sellerProfile.kycStatus = 'approved';
    } else {
      seller.sellerProfile.kycStatus = 'rejected';
    }

    await seller.save();

    // Trigger automated email status notification
    sendKycResultEmail(
      seller.email,
      action === 'approve' ? 'Approved' : 'Rejected',
      seller.name
    ).catch(err => console.error('Failed to send eKYC result notification email:', err));

    res.status(200).json({
      status: 'success',
      message: `KYC application successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
      data: {
        seller
      }
    });
  } catch (error) {
    next(error);
  }
};
