const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const https = require('https');

// Helper to make native HTTP/HTTPS POST requests
const makeHttpsPost = (url, headers, body) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      method: 'POST',
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        const isOk = res.statusCode >= 200 && res.statusCode < 300;
        resolve({
          ok: isOk,
          statusCode: res.statusCode,
          json: () => {
            try {
              return JSON.parse(responseBody);
            } catch (e) {
              return {};
            }
          },
          text: () => responseBody
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};


// Initialize Razorpay Instance if credentials are set
const razorpayInstance = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

// @route   POST api/wallet/deposit
// @desc    Deposit funds into user wallet (Simulated direct deposit backup)
// @access  Private
router.post('/deposit', auth, async (req, res) => {
  const { amount, paymentMethod } = req.body;

  const numericAmount = Number(amount);
  if (!amount || isNaN(numericAmount) || numericAmount < 10) {
    return res.status(400).json({ msg: 'Minimum deposit amount is ₹10' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.walletBalance += numericAmount;
    await user.save();

    const transaction = new Transaction({
      user: req.user.id,
      type: 'deposit',
      amount: numericAmount,
      status: 'completed',
      description: `Deposited via ${paymentMethod || 'Mock Payment Gateway'}`
    });
    await transaction.save();

    res.json({
      walletBalance: user.walletBalance,
      transaction
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/wallet/withdraw
// @desc    Withdraw funds from user wallet (Simulated UPI Payout)
// @access  Private
router.post('/withdraw', auth, async (req, res) => {
  const { amount, payoutDetails } = req.body; // payoutDetails is the user's UPI ID

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ msg: 'Please provide a valid withdrawal amount' });
  }

  const numericAmount = Number(amount);

  // Enforce ₹50 minimum withdrawal limit
  if (numericAmount < 50) {
    return res.status(400).json({ msg: 'Minimum withdrawal amount is ₹50' });
  }

  if (!payoutDetails) {
    return res.status(400).json({ msg: 'Please specify a valid UPI ID for payout.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Enforce KYC verification before payouts
    if (user.kycStatus !== 'verified') {
      return res.status(400).json({ msg: 'KYC verification is mandatory before making withdrawals. Please complete your KYC verification in Settings.' });
    }

    if (user.walletBalance < numericAmount) {
      return res.status(400).json({ msg: 'Insufficient wallet balance for withdrawal' });
    }

    // Deduct amount immediately to hold it
    user.walletBalance -= numericAmount;
    await user.save();

    // Log the transaction as pending manual withdrawal
    const transaction = new Transaction({
      user: req.user.id,
      type: 'withdraw',
      amount: numericAmount,
      status: 'pending',
      description: `Manual UPI withdrawal request (UPI: ${payoutDetails})`
    });
    await transaction.save();

    // Send Telegram Notification to Admin
    try {
      const axios = require('axios');
      const botToken = '8836741801:AAFyaSg4679txpxZ69ji9lAwGEJICx0ZzgA';
      const chatId = '6480716218';
      const text = `💸 *New Wallet Withdrawal Request* \n\n` +
                   `👤 *User:* @${user.username} (${user.freeFireName || 'No FF Name'})\n` +
                   `📧 *Email:* ${user.email}\n` +
                   `💰 *Amount:* ₹${numericAmount.toFixed(2)}\n` +
                   `💳 *Payout UPI ID:* \`${payoutDetails.trim()}\`\n\n` +
                   `⚠️ _Please transfer the amount manually via UPI QR and approve the request in the admin settings._`;

      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      });
      console.log('Telegram withdrawal notification sent.');
    } catch (telegramErr) {
      console.error('Failed to send Telegram withdrawal notification:', telegramErr.message);
    }

    res.json({
      walletBalance: user.walletBalance,
      transaction
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/wallet/manual-deposit
// @desc    Request manual wallet refill via UPI UTR
// @access  Private
router.post('/manual-deposit', auth, async (req, res) => {
  const { amount, utr } = req.body;
  const numericAmount = Number(amount);

  if (!amount || isNaN(numericAmount) || numericAmount < 10) {
    return res.status(400).json({ msg: 'Minimum deposit is ₹10.' });
  }

  if (!utr || utr.trim().length < 8) {
    return res.status(400).json({ msg: 'Valid transaction UTR/Reference ID is required.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Create a pending transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'deposit',
      amount: numericAmount,
      status: 'pending', // Pending admin verification
      description: `Manual UPI deposit request (UTR: ${utr})`
    });
    await transaction.save();

    // Send Telegram Notification to Admin
    try {
      const axios = require('axios');
      const botToken = '8836741801:AAFyaSg4679txpxZ69ji9lAwGEJICx0ZzgA';
      const chatId = '6480716218';
      const text = `🔌 *New Wallet Deposit Request* \n\n` +
                   `👤 *User:* @${user.username} (${user.freeFireName || 'No FF Name'})\n` +
                   `📧 *Email:* ${user.email}\n` +
                   `💰 *Amount:* ₹${numericAmount.toFixed(2)}\n` +
                   `🔑 *Transaction UTR:* \`${utr.trim()}\`\n\n` +
                   `⚠️ _Please log in to your admin board to verify and approve/reject._`;

      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      });
      console.log('Telegram deposit notification sent.');
    } catch (telegramErr) {
      console.error('Failed to send Telegram notification:', telegramErr.message);
    }

    res.json({
      msg: 'Deposit request submitted successfully! Credits will be updated once verified by admin.',
      transaction
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/wallet/transactions/:id/approve
// @desc    Approve a pending manual deposit/withdrawal transaction (Admin only)
// @access  Private
router.put('/transactions/:id/approve', auth, async (req, res) => {
  try {
    const userObj = await User.findById(req.user.id);
    if (userObj.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied: Only Admins can approve wallet transactions.' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ msg: 'Transaction is already resolved.' });
    }

    // Approve transaction
    transaction.status = 'completed';
    await transaction.save();

    // If it's a deposit, credit user's wallet (Withdrawal is already deducted and held, so no extra deduction)
    if (transaction.type === 'deposit') {
      const targetUser = await User.findById(transaction.user);
      if (targetUser) {
        targetUser.walletBalance += transaction.amount;
        await targetUser.save();
      }
    }

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/wallet/transactions/:id/reject
// @desc    Reject a pending manual deposit/withdrawal transaction (Admin only)
// @access  Private
router.put('/transactions/:id/reject', auth, async (req, res) => {
  try {
    const userObj = await User.findById(req.user.id);
    if (userObj.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied: Only Admins can reject wallet transactions.' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ msg: 'Transaction is already resolved.' });
    }

    // Reject transaction
    transaction.status = 'failed';
    transaction.description += ' (Rejected by Admin)';
    await transaction.save();

    // If it's a withdrawal, refund the held funds back to the user's wallet
    if (transaction.type === 'withdraw') {
      const targetUser = await User.findById(transaction.user);
      if (targetUser) {
        targetUser.walletBalance += transaction.amount;
        await targetUser.save();
      }
    }

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/wallet/pending-deposits
// @desc    Get all pending manual deposit and withdrawal transactions (Admin only)
// @access  Private
router.get('/pending-deposits', auth, async (req, res) => {
  try {
    const userObj = await User.findById(req.user.id);
    if (userObj.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied.' });
    }

    const pendingTransactions = await Transaction.find({ 
      type: { $in: ['deposit', 'withdraw'] },
      status: 'pending' 
    })
      .populate('user', 'username email freeFireName')
      .sort({ createdAt: -1 });

    res.json(pendingTransactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/wallet/history
// @desc    Get user transaction ledger history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const history = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
