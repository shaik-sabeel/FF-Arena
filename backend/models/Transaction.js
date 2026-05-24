const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdraw', 'entry_fee', 'prize']
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
