const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Signup endpoint (handles both buyer and seller)
router.post('/signup', authController.signup);

// Login endpoint
router.post('/login', authController.login);

module.exports = router;
