const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Upload a single file (e.g. ID Proof)
// @route   POST /api/upload/single
// @access  Public (or Protected)
exports.uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'zivora/proofs',
      resource_type: 'auto'
    });

    // Delete local temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully',
      url: result.secure_url
    });
  } catch (error) {
    // Make sure to clean up temporary file even on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      status: 'error',
      message: error.message || 'File upload to Cloudinary failed'
    });
  }
};

// @desc    Upload multiple files (e.g. multiple Business Proofs)
// @route   POST /api/upload/multiple
// @access  Public (or Protected)
exports.uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded'
      });
    }

    // Upload all files to Cloudinary concurrently
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'zivora/proofs',
          resource_type: 'auto'
        });

        // Delete local temporary file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return result.secure_url;
      } catch (uploadError) {
        // Clean up even if individual upload fails
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw uploadError;
      }
    });

    const urls = await Promise.all(uploadPromises);

    res.status(200).json({
      status: 'success',
      message: `${urls.length} files uploaded successfully`,
      urls
    });
  } catch (error) {
    // Final emergency cleanup for any lingering files in case of bulk error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Multiple files upload to Cloudinary failed'
    });
  }
};
