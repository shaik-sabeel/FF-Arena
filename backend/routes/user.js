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

    const users = await User.find({}).select('username email freeFireName role isObserver');
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

module.exports = router;
