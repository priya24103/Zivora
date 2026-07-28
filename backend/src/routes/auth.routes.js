const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Signup endpoint (handles both buyer and seller)
router.post('/signup', authController.signup);
router.post('/register', authController.register);

// Verify Email endpoint
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOtp);

// Login endpoint
router.post('/login', authController.login);

// Forgot & Reset Password endpoints
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
