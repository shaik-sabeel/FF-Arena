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

    // Deduct and save balance temporarily
    user.walletBalance -= numericAmount;
    await user.save();

    let payoutId = `mock_payout_${Date.now()}`;
    let payoutStatus = 'completed';
    let description = `Withdrawn to UPI: ${payoutDetails}`;

    const hasRazorpayX = process.env.RAZORPAY_KEY_ID && 
                         process.env.RAZORPAY_KEY_SECRET && 
                         process.env.RAZORPAYX_ACCOUNT_NUMBER && 
                         process.env.RAZORPAYX_ACCOUNT_NUMBER.trim() !== '' && 
                         !process.env.RAZORPAYX_ACCOUNT_NUMBER.includes('your_razorpayx_account_number_here') &&
                         process.env.RAZORPAYX_ACCOUNT_NUMBER !== 'undefined';

    // If RazorpayX is configured, perform real payout
    if (hasRazorpayX) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
        
        // 1. Create Contact
        console.log('[Payout] Registering RazorpayX contact for user:', user.email);
        const contactRes = await makeHttpsPost('https://api.razorpay.com/v1/contacts', {
          'Authorization': authHeader
        }, {
          name: user.username,
          email: user.email,
          type: 'customer',
          reference_id: user._id.toString()
        });
        
        if (!contactRes.ok) {
          const errText = contactRes.text();
          throw new Error(`RazorpayX Contact registration failed: ${errText}`);
        }
        
        const contactData = contactRes.json();
        const contactId = contactData.id;
        console.log('[Payout] Created RazorpayX contact:', contactId);
        
        // 2. Create Fund Account (UPI)
        console.log('[Payout] Linking RazorpayX fund account (UPI) for contact:', contactId);
        const fundRes = await makeHttpsPost('https://api.razorpay.com/v1/fund_accounts', {
          'Authorization': authHeader
        }, {
          contact_id: contactId,
          account_type: 'vpa',
          vpa: {
            address: payoutDetails
          }
        });
        
        if (!fundRes.ok) {
          const errText = fundRes.text();
          throw new Error(`RazorpayX Fund Account linking failed: ${errText}`);
        }
        
        const fundData = fundRes.json();
        const fundAccountId = fundData.id;
        console.log('[Payout] Linked fund account ID:', fundAccountId);
        
        // 3. Create Payout
        console.log('[Payout] Initiating RazorpayX payout for amount (paise):', Math.round(numericAmount * 100));
        const payoutRes = await makeHttpsPost('https://api.razorpay.com/v1/payouts', {
          'Authorization': authHeader
        }, {
          account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
          fund_account_id: fundAccountId,
          amount: Math.round(numericAmount * 100), // convert to paise
          currency: 'INR',
          mode: 'UPI',
          purpose: 'payout',
          queue_if_low_balance: true,
          narration: 'BL Battle Wallet Payout'
        });
        
        if (!payoutRes.ok) {
          const errText = payoutRes.text();
          throw new Error(`RazorpayX Payout execution failed: ${errText}`);
        }
        
        const payoutData = payoutRes.json();
        payoutId = payoutData.id;
        payoutStatus = payoutData.status; // e.g. processing, queued, processed
        description = `Withdrawn to UPI: ${payoutDetails} (Ref: ${payoutId})`;
        console.log('[Payout] Payout succeeded. Status:', payoutStatus, 'ID:', payoutId);
        
      } catch (payoutError) {
        console.error('[Payout] Real-world RazorpayX payout transaction failed:', payoutError.message);
        
        // Rollback balance deduction
        user.walletBalance += numericAmount;
        await user.save();
        
        // Return clear error message to frontend
        return res.status(400).json({ msg: `Transaction aborted: ${payoutError.message}` });
      }
    } else {
      console.log('[Payout] RazorpayX credentials not fully configured. Performing mock transaction bypass.');
    }

    // Log the transaction
    const transaction = new Transaction({
      user: req.user.id,
      type: 'withdraw',
      amount: numericAmount,
      status: payoutStatus === 'rejected' || payoutStatus === 'reversed' || payoutStatus === 'failed' ? 'failed' : 'completed',
      description
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
