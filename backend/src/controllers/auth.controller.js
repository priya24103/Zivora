const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'zivora_fine_diamonds_secret_key_12345';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

// @desc    Register a new user (Buyer or Seller)
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, sellerProfile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is already in use'
      });
    }

    // Prepare user fields
    const userData = {
      name,
      email,
      password,
      phone,
      role: role || 'buyer'
    };

    // If role is seller, validate and inject seller profile
    if (role === 'seller') {
      if (!sellerProfile) {
        return res.status(400).json({
          status: 'error',
          message: 'Seller profile information is required for seller accounts'
        });
      }

      // Ensure mandatory fields exist for registration (optional at schema, but checked here)
      const { panNumber, gstNumber, businessProofUrl, idProofUrl } = sellerProfile;
      if (!panNumber || !gstNumber) {
        return res.status(400).json({
          status: 'error',
          message: 'PAN Number and GST Number are required for Seller registration'
        });
      }

      userData.sellerProfile = {
        panNumber,
        gstNumber,
        businessProofUrl: businessProofUrl || null,
        idProofUrl: idProofUrl || null,
        kycStatus: 'pending',
        kycRemarks: ''
      };
    }

    // Create user in DB
    const user = await User.create(userData);

    // Generate JWT token
    const token = generateToken(user._id);

    // Remove password before returning
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      token,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
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

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password are provided
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

    // Verify password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Remove password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      token,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};
