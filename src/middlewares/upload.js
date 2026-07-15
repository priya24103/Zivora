const multer = require('multer');
const path = require('path');

// Memory storage keeps files temporarily in RAM as buffer
const storage = multer.memoryStorage();

// Accept only PDFs, JPGs, and PNGs
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .pdf, .jpg, .jpeg, and .png documents are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
