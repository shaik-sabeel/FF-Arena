const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  freeFireId: {
    type: String,
    default: ''
  },
  freeFireName: {
    type: String,
    default: ''
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    matchesLost: { type: Number, default: 0 },
    kills: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 }
  },
  role: {
    type: String,
    enum: ['user', 'host', 'admin'],
    default: 'user'
  },
  isObserver: {
    type: Boolean,
    default: false
  },
  resetOtp: {
    type: String,
    default: null
  },
  resetOtpExpiry: {
    type: Date,
    default: null
  },
  kycStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  kycDetails: {
    fullName: { type: String, default: '' },
    dob: { type: Date, default: null },
    pan: { type: String, default: '' },
    documentType: { type: String, default: '' },
    documentUrl: { type: String, default: '' },
    upiId: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' }
  },
  policiesAcceptedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
