const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   PUT api/user/profile
// @desc    Update user Free Fire details
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { freeFireId, freeFireName, role } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (freeFireId !== undefined) user.freeFireId = freeFireId;
    if (freeFireName !== undefined) user.freeFireName = freeFireName;
    if (role !== undefined && ['user', 'host'].includes(role)) user.role = role;

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user/leaderboard
// @desc    Get top players ranked by earnings
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const players = await User.find({})
      .select('username freeFireName stats')
      .sort({ 'stats.earnings': -1 })
      .limit(10);
      
    res.json(players);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user/all
// @desc    Get all users (Host/Admin only)
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    const caller = await User.findById(req.user.id);
    if (!caller || (caller.role !== 'host' && caller.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied: Only Hosts or Admins can fetch all users.' });
    }

    const users = await User.find({}).select('username email freeFireName freeFireId role isObserver');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/user/:id/toggle-observer
// @desc    Toggle user isObserver status (Host/Admin only)
// @access  Private
router.put('/:id/toggle-observer', auth, async (req, res) => {
  try {
    const caller = await User.findById(req.user.id);
    if (!caller || (caller.role !== 'host' && caller.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied: Only Hosts or Admins can assign observers.' });
    }

    let userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ msg: 'User to update not found' });
    }

    userToUpdate.isObserver = !userToUpdate.isObserver;
    await userToUpdate.save();

    res.json({ success: true, user: userToUpdate });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/user/kyc
// @desc    Submit KYC details
// @access  Private
router.post('/kyc', auth, async (req, res) => {
  const { fullName, dob, pan, documentType, documentUrl, upiId } = req.body;

  if (!fullName || !dob || !documentType || !upiId) {
    return res.status(400).json({ msg: 'Please provide all required KYC fields: Full Name, Date of Birth, Document Type, and UPI ID.' });
  }

  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.kycStatus = 'pending';
    user.kycDetails = {
      fullName,
      dob: new Date(dob),
      pan: pan || '',
      documentType,
      documentUrl: documentUrl || 'mock_document_url',
      upiId,
      submittedAt: new Date(),
      rejectionReason: ''
    };

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/user/accept-policies
// @desc    Accept Terms, Privacy and other site policies
// @access  Private
router.post('/accept-policies', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.policiesAcceptedAt = new Date();
    await user.save();

    res.json({ success: true, policiesAcceptedAt: user.policiesAcceptedAt });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user/kyc/pending
// @desc    Get all users with pending KYC status (Host/Admin only)
// @access  Private
router.get('/kyc/pending', auth, async (req, res) => {
  try {
    const caller = await User.findById(req.user.id);
    if (!caller || (caller.role !== 'host' && caller.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied: Only Hosts or Admins can fetch pending KYCs.' });
    }

    const pendingUsers = await User.find({ kycStatus: 'pending' }).select('-password');
    res.json(pendingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/user/:id/verify-kyc
// @desc    Approve or reject a user's KYC verification (Host/Admin only)
// @access  Private
router.put('/:id/verify-kyc', auth, async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!status || !['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ msg: 'Please provide a valid KYC resolution status: verified or rejected.' });
  }

  try {
    const caller = await User.findById(req.user.id);
    if (!caller || (caller.role !== 'host' && caller.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied: Only Hosts or Admins can verify KYCs.' });
    }

    let userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ msg: 'User not found' });
    }

    userToUpdate.kycStatus = status;
    if (status === 'rejected') {
      userToUpdate.kycDetails.rejectionReason = rejectionReason || 'Information does not match identity records.';
    } else {
      userToUpdate.kycDetails.rejectionReason = '';
    }

    await userToUpdate.save();
    res.json({ success: true, user: userToUpdate });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
