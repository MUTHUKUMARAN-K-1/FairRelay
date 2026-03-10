const prisma = require('../config/database');
const { generateAccessToken, refreshAccessToken } = require('../config/jwt');
const Joi = require('joi');
const twilio = require('twilio');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

// In-memory OTP store: phone → { otp, expiresAt, attempts }
const otpStore = new Map();
const OTP_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_ATT = 3;

function makeTwilioClient() {
  try {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch { return null; }
}

/**
 * POST /api/auth/login — Send OTP via Twilio SMS
 */
const sendOTP = async (req, res) => {
  try {
    const schema = Joi.object({
      phone: Joi.string().pattern(/^\+?\d{7,15}$/).required().messages({
        'string.pattern.base': 'Phone must be a valid number (e.g. +91XXXXXXXXXX)',
      }),
      role: Joi.string().valid('DRIVER', 'SHIPPER', 'DISPATCHER').default('DRIVER'),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { phone } = req.body;

    // Rate limit: block if previous OTP not expired & too many attempts
    const existing = otpStore.get(phone);
    if (existing && Date.now() < existing.expiresAt && existing.attempts >= MAX_ATT) {
      const wait = Math.ceil((existing.expiresAt - Date.now()) / 1000);
      return res.status(429).json({ success: false, message: `Too many attempts. Retry in ${wait}s.` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL, attempts: 0 });

    // Try Twilio — fall back gracefully in demo mode
    const client = makeTwilioClient();
    let smsSent = false;
    if (client && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await client.messages.create({
          body: `Your FairRelay login code is: ${otp}. Valid for 5 minutes. Do not share.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
        smsSent = true;
        console.log(`[OTP] SMS sent to ${phone.slice(0, 5)}***`);
      } catch (twilioErr) {
        console.warn('[OTP] Twilio send failed (demo mode):', twilioErr.message);
      }
    }

    const IS_PROD = process.env.NODE_ENV === 'production';
    res.status(200).json({
      success: true,
      message: smsSent ? 'OTP sent to your phone.' : (IS_PROD ? 'OTP service unavailable. Please try again later.' : `Demo mode — OTP is: ${otp}`),
      data: { phone, demo: !smsSent, otp: (!IS_PROD && !smsSent) ? otp : undefined },
    });
  } catch (err) {
    console.error('sendOTP error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to send OTP' });
  }
};

/**
 * POST /api/auth/verify-otp — Verify OTP and issue JWT
 */
const verifyOTP = async (req, res) => {
  try {
    const schema = Joi.object({
      phone: Joi.string().pattern(/^\+?\d{7,15}$/).required(),
      otp: Joi.string().length(6).required(),
      role: Joi.string().valid('DRIVER', 'SHIPPER', 'DISPATCHER').optional(),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { phone, otp, role } = req.body;

    // Validate OTP from in-memory store
    const record = otpStore.get(phone);
    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP found. Request a new one.' });
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
    }
    record.attempts += 1;
    if (record.otp !== otp.trim()) {
      if (record.attempts >= MAX_ATT) {
        otpStore.delete(phone);
        return res.status(429).json({ success: false, message: 'Too many failed attempts. Request a new OTP.' });
      }
      return res.status(400).json({ success: false, message: `Invalid OTP. ${MAX_ATT - record.attempts} attempt(s) left.` });
    }
    otpStore.delete(phone); // ✅ OTP matched — clean up

    // Find or create user — with full DB offline fallback
    let user;
    let isDemo = false;
    try {
      user = await prisma.user.findUnique({
        where: { phone },
        include: { trucks: { select: { id: true, licensePlate: true, model: true } } },
      });
      if (!user) {
        user = await prisma.user.create({
          data: { phone, role: role || 'DISPATCHER', name: `User_${phone.slice(-4)}` },
          include: { trucks: true },
        });
      }
      await prisma.user.update({ where: { id: user.id }, data: { lastActiveDate: new Date() } });
    } catch (dbErr) {
      console.warn('[Auth] DB offline — using demo user:', dbErr.message);
      isDemo = true;
      user = {
        id: `demo-${crypto.randomUUID()}`,
        name: `Dispatcher_${phone.slice(-4)}`,
        phone,
        role: role || 'DISPATCHER',
        status: 'ACTIVE',
        rating: 5.0,
        deliveriesCount: 0,
        totalEarnings: 0,
        weeklyEarnings: 0,
        trucks: [],
      };
    }

    const token = generateAccessToken({ userId: user.id, role: user.role });

    res.status(200).json({
      success: true,
      message: isDemo ? 'Login successful (demo mode)' : 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          rating: user.rating,
          deliveriesCount: user.deliveriesCount,
          totalEarnings: user.totalEarnings,
          weeklyEarnings: user.weeklyEarnings,
          trucks: user.trucks || [],
        },
      },
    });
  } catch (err) {
    console.error('verifyOTP error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'OTP verification failed' });
  }
};

/**
 * GET /api/auth/profile — Get authenticated user profile (PROTECTED)
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trucks: { select: { id: true, licensePlate: true, model: true, capacity: true, currentLat: true, currentLng: true } },
        transactions: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, amount: true, type: true, description: true, route: true, createdAt: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({
      success: true,
      data: {
        id: user.id, name: user.name, phone: user.phone, role: user.role,
        status: user.status, rating: user.rating, deliveriesCount: user.deliveriesCount,
        totalEarnings: user.totalEarnings, weeklyEarnings: user.weeklyEarnings,
        weeklyKmDriven: user.weeklyKmDriven, trucks: user.trucks || [],
        recentTransactions: user.transactions || [], lastActiveDate: user.lastActiveDate,
      },
    });
  } catch (err) {
    console.error('getProfile error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

/**
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { error } = Joi.object({ refreshToken: Joi.string().required().label('Refresh token') }).validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const newAccessToken = refreshAccessToken(req.body.refreshToken);
    res.status(200).json({ success: true, message: 'Token refreshed successfully', data: { accessToken: newAccessToken } });
  } catch (err) {
    console.error('refreshToken error:', err.message);
    if (err.message === 'Invalid refresh token') {
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

module.exports = { sendOTP, verifyOTP, getProfile, refreshToken };
