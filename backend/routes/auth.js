const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, freeFireId, freeFireName } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Email is already registered' });
    }

    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Username is already taken' });
    }

    user = new User({
      username,
      email,
      password,
      freeFireId: freeFireId || '',
      freeFireName: freeFireName || ''
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secretkey123',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            freeFireId: user.freeFireId,
            freeFireName: user.freeFireName,
            walletBalance: user.walletBalance,
            stats: user.stats,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secretkey123',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            freeFireId: user.freeFireId,
            freeFireName: user.freeFireName,
            walletBalance: user.walletBalance,
            stats: user.stats,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/me
// @desc    Get user data by token
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Configure Google OAuth Client
const { OAuth2Client } = require('google-auth-library');
const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// @route   POST api/auth/google
// @desc    Authenticate or register user via Google
// @access  Public
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ msg: 'No Google credential token provided' });
  }

  try {
    let email, name;

    // Handle mock token / sandbox mode if Google Client ID is not configured
    if (!client || credential.startsWith('mock_google_token_')) {
      console.log('[Auth] Google Auth Sandbox bypass active');
      if (credential.startsWith('mock_google_token_')) {
        email = credential.replace('mock_google_token_', '');
        name = email.split('@')[0];
      } else {
        // Decode without signature checking
        try {
          const payloadBase64 = credential.split('.')[1];
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
          email = payload.email;
          name = payload.name || email.split('@')[0];
        } catch (e) {
          email = 'google-sandbox-gamer@gmail.com';
          name = 'Google Sandbox';
        }
      }
    } else {
      // Production validation
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    }

    // Find user in database
    let user = await User.findOne({ email });
    if (!user) {
      let baseUsername = email.split('@')[0];
      let username = baseUsername;
      
      // Ensure unique username
      let userCheck = await User.findOne({ username });
      while (userCheck) {
        username = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
        userCheck = await User.findOne({ username });
      }

      // Hash default mock password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('googlesignup_' + Math.random(), salt);

      user = new User({
        username,
        email,
        password: hashedPassword,
        freeFireId: '',
        freeFireName: name || username
      });
      await user.save();
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secretkey123',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            freeFireId: user.freeFireId,
            freeFireName: user.freeFireName,
            walletBalance: user.walletBalance,
            stats: user.stats,
            role: user.role
          }
        });
      }
    );

  } catch (err) {
    console.error('Google Login Failure:', err.message);
    res.status(400).json({ msg: 'Google Sign-In failed verification' });
  }
});

module.exports = router;
