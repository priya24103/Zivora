const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT and restrict access to admin role only
 */
exports.isAdmin = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided. Please log in as an administrator.'
      });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'zivora_fine_diamonds_secret_key_12345';
    const decoded = jwt.verify(token, secret);

    // Find the user
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Verify admin role
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Administrator privileges required.'
      });
    }

    // Check account status
    if (currentUser.status === 'suspended') {
      return res.status(403).json({
        status: 'error',
        message: 'Your administrator account has been suspended.'
      });
    }

    // Attach user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};
