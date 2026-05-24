const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

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

  // Enforce ₹150 minimum withdrawal limit
  if (numericAmount < 150) {
    return res.status(400).json({ msg: 'Minimum withdrawal amount is ₹150' });
  }

  if (!payoutDetails) {
    return res.status(400).json({ msg: 'Please specify a valid UPI ID for checkout.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.walletBalance < numericAmount) {
      return res.status(400).json({ msg: 'Insufficient wallet balance for withdrawal' });
    }

    // Deduct and save balance
    user.walletBalance -= numericAmount;
    await user.save();

    // Log the transaction
    const transaction = new Transaction({
      user: req.user.id,
      type: 'withdraw',
      amount: numericAmount,
      status: 'completed',
      description: `Withdrawn to UPI: ${payoutDetails}`
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

// @route   POST api/wallet/razorpay/order
// @desc    Create a Razorpay payment order ID
// @access  Private
router.post('/razorpay/order', auth, async (req, res) => {
  const { amount } = req.body;
  const numericAmount = Number(amount);
  
  if (!amount || isNaN(numericAmount) || numericAmount < 10) {
    return res.status(400).json({ msg: 'Minimum deposit amount is ₹10' });
  }

  try {
    const options = {
      amount: Math.round(numericAmount * 100), // in paise (e.g. ₹10 = 1000 paise)
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    if (razorpayInstance) {
      const order = await razorpayInstance.orders.create(options);
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    } else {
      // Mock Sandbox response fallback
      console.log('[Wallet] Razorpay credentials missing. Emulating sandbox order.');
      const mockOrderId = `order_mock_${Math.random().toString(36).substr(2, 9)}`;
      return res.json({
        success: true,
        orderId: mockOrderId,
        amount: options.amount,
        keyId: 'rzp_test_mockkey12345',
        isSandbox: true
      });
    }
  } catch (err) {
    console.error('Razorpay Order creation error:', err.message);
    res.status(500).send('Razorpay Init Server Error');
  }
});

// @route   POST api/wallet/razorpay/verify
// @desc    Verify Razorpay Payment signature and credit wallet balance
// @access  Private
router.post('/razorpay/verify', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !amount) {
    return res.status(400).json({ msg: 'Missing verification credentials' });
  }

  try {
    let verified = false;

    if (razorpayInstance && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        verified = true;
      }
    } else {
      // Sandbox verify bypass
      console.log('[Wallet] Razorpay Sandbox payment verification bypass');
      if (razorpay_order_id.startsWith('order_mock_') || razorpay_payment_id.startsWith('pay_mock_')) {
        verified = true;
      }
    }

    if (!verified) {
      return res.status(400).json({ msg: 'Payment verification failed' });
    }

    // Process Credit transaction
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.walletBalance += Number(amount);
    await user.save();

    const transaction = new Transaction({
      user: req.user.id,
      type: 'deposit',
      amount: Number(amount),
      status: 'completed',
      description: `Deposited via Razorpay (${razorpay_payment_id})`
    });
    await transaction.save();

    res.json({
      success: true,
      walletBalance: user.walletBalance,
      transaction
    });

  } catch (err) {
    console.error('Razorpay Verify error:', err.message);
    res.status(500).send('Razorpay Verification Server Error');
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
