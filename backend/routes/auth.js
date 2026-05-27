const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Email dispatcher utility helper
const sendEmail = async (to, subject, text, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n======================================================
[MOCK EMAIL DISPATCH LOG]
------------------------------------------------------
To:      ${to}
Subject: ${subject}
Content: ${text}
======================================================\n`);
    return { mock: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"BL Battle Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Dispatch] Sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email Dispatch] Failed to send email:', err.message);
    return { success: false, error: err.message };
  }
};


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

    // Send Welcome Email asynchronously
    sendEmail(
      user.email,
      `Welcome to BL Battle, ${user.username}!`,
      `Hello ${user.username},\n\nWelcome to BL Battle! We are thrilled to have you join our Free Fire gaming community.\n\nYour account has been successfully created. You can now browse active lobbies, participate in custom matches, track your statistics, and earn cash rewards.\n\nBest regards,\nThe BL Battle Team`,
      `<div style="font-family: sans-serif; background-color: #0b0e11; color: #ffffff; padding: 20px; border-radius: 10px; max-width: 600px; border: 1px solid #1f2731;">
        <h2 style="color: #35d5fa; margin-top: 0;">Welcome to BL Battle, ${user.username}!</h2>
        <p style="color: #a0aab5;">We are thrilled to have you join our Free Fire gaming community.</p>
        <p style="color: #a0aab5;">Your account has been successfully created. You can now:</p>
        <ul style="color: #ffffff; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Browse active custom lobbies</li>
          <li style="margin-bottom: 8px;">Participate in matches and accumulate kills</li>
          <li style="margin-bottom: 8px;">Track your stats and leaderboard ranking</li>
          <li style="margin-bottom: 8px;">Earn cash rewards and cashout directly to your UPI ID</li>
        </ul>
        <p style="color: #a0aab5; margin-top: 20px;">Get ready to enter the battlefield and rise to the top!</p>
        <hr style="border: 0; border-top: 1px solid #1f2731; margin: 20px 0;">
        <p style="color: #35d5fa; font-size: 11px;">Best regards,<br><strong style="color: #ffffff;">The BL Battle Team</strong></p>
      </div>`
    ).catch(err => console.error('Welcome email dispatch error:', err.message));

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

// @route   POST api/auth/forgot-password
// @desc    Generate OTP and send it via email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'Please provide an email address' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ msg: 'No user registered with this email address' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in User document with 15 mins expiry
    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const isMock = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;
    
    // Send email
    await sendEmail(
      user.email,
      'BL Battle Password Reset OTP',
      `Hello ${user.username},\n\nYour OTP for password recovery is: ${otp}\n\nThis OTP is valid for 15 minutes. If you did not request this reset, please ignore this email.\n\nBest regards,\nThe BL Battle Team`,
      `<div style="font-family: sans-serif; background-color: #0b0e11; color: #ffffff; padding: 20px; border-radius: 10px; max-width: 600px; border: 1px solid #1f2731;">
        <h2 style="color: #35d5fa; margin-top: 0;">Password Recovery Verification</h2>
        <p style="color: #a0aab5;">Hello ${user.username},</p>
        <p style="color: #a0aab5;">Use the following 6-digit One-Time Password (OTP) to reset your account password:</p>
        <div style="background-color: #1a222d; border: 1px solid #35d5fa; font-size: 24px; font-weight: bold; color: #35d5fa; text-align: center; padding: 12px 20px; letter-spacing: 6px; border-radius: 8px; margin: 20px auto; max-width: 200px;">
          ${otp}
        </div>
        <p style="color: #ef4444; font-size: 11px;">Note: This OTP is confidential and will expire in 15 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #1f2731; margin: 20px 0;">
        <p style="color: #35d5fa; font-size: 11px;">Best regards,<br><strong style="color: #ffffff;">The BL Battle Team</strong></p>
      </div>`
    );

    res.json({
      success: true,
      msg: isMock ? 'OTP verification code has been generated. Please check your backend terminal/logs.' : 'OTP verification code has been dispatched to your email.'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/reset-password
// @desc    Verify OTP and configure new password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ msg: 'Please provide email, verification code, and new password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Verify OTP matches and is not expired
    if (!user.resetOtp || user.resetOtp !== otp || !user.resetOtpExpiry || user.resetOtpExpiry < Date.now()) {
      return res.status(400).json({ msg: 'The verification code (OTP) is invalid or has expired' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({
      success: true,
      msg: 'Your password has been successfully reset. You can now log in.'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
