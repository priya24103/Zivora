const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const sellerProfileSchema = new mongoose.Schema({
  companyName: { type: String, trim: true, default: '' },
  panNumber: { type: String, trim: true, default: null },
  gstNumber: { type: String, trim: true, default: null },
  businessProofUrl: [{ type: String }],
  idProofUrl: { type: String, default: null },
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  kycRemarks: { type: String, default: '' },
  rating: {
    type: Number,
    default: 0.0,
    min: 0.0,
    max: 5.0
  },
  ratingsCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const buyerProfileSchema = new mongoose.Schema({
  companyName: { type: String, trim: true, default: '' }, // Optional for buyers
  panNumber: { type: String, trim: true, default: null },
  gstNumber: { type: String, trim: true, default: null },
  businessProofUrl: [{ type: String }],
  idProofUrl: { type: String, default: null },
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  kycRemarks: { type: String, default: '' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number'] // Adjust regex as needed
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    required: true,
    default: 'buyer'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending_kyc'],
    default: 'active'
  },
  sellerProfile: {
    type: sellerProfileSchema,
    required: false
  },
  buyerProfile: {
    type: buyerProfileSchema,
    required: false
  },
  emailVerificationOtp: {
    type: String,
    default: null
  },
  otpExpiresAt: {
    type: Date,
    default: null
  },
  resetPasswordOtp: {
    type: String,
    default: null
  },
  resetPasswordOtpExpiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);  
