/**
 * Middleware to restrict access to fully verified sellers who have completed eKYC
 */
module.exports = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.'
      });
    }

    // Guard 1: Verify Role
    if (user.role !== 'seller') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only seller accounts can access this resource.'
      });
    }

    // Guard 2: Verify Email OTP Verification
    if (user.isVerified !== true) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Please verify your email address to enable seller actions.'
      });
    }

    const isKycApproved = user.sellerProfile && user.sellerProfile.kycStatus === 'approved';

    if (!isKycApproved) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Complete eKYC is required to list products. Your verification is either unsubmitted, pending, or rejected.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
