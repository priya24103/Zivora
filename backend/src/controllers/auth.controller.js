const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendEmail');

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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Prepare user fields
    const userData = {
      name,
      email,
      password,
      phone,
      role: role || 'buyer',
      isVerified: false,
      emailVerificationOtp: otp,
      otpExpiresAt
    };

    // If role is seller, validate and inject seller profile
    if (role === 'seller') {
      if (!sellerProfile) {
        return res.status(400).json({
          status: 'error',
          message: 'Seller profile information is required for seller accounts'
        });
      }

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
        businessProofUrl: businessProofUrl || [],
        idProofUrl: idProofUrl || null,
        kycStatus: 'pending',
        kycRemarks: ''
      };
    }

    // Create user in DB
    const user = await User.create(userData);

    // Send the verification OTP
    await sendOtpEmail(user.email, otp);

    // Generate JWT token
    const token = generateToken(user._id);

    // Remove password before returning
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully. Please verify your email with the OTP sent.',
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

// @desc    Register a new user (Alias for compatibility)
// @route   POST /api/auth/register
// @access  Public
exports.register = exports.signup;

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both email and OTP'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user account found with this email'
      });
    }

    // Check if OTP matches and has not expired
    if (!user.emailVerificationOtp || user.emailVerificationOtp !== otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification code has expired.'
      });
    }

    // Set user verified state
    user.isVerified = true;
    user.emailVerificationOtp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: 'success',
      message: 'Email address verified successfully.',
      token,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP verification code
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email address'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user account found with this email'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'This email is already verified. Please log in.'
      });
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.emailVerificationOtp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Trigger email utility
    await sendOtpEmail(user.email, otp);

    res.status(200).json({
      status: 'success',
      message: 'A new verification code has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};
