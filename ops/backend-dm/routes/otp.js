const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, resendOtp } = require('../controllers/otpController');

// POST /api/otp/send    — send OTP to phone
router.post('/send', sendOtp);

// POST /api/otp/verify  — verify OTP
router.post('/verify', verifyOtp);

// POST /api/otp/resend  — resend (clears old OTP and sends fresh one)
router.post('/resend', resendOtp);

module.exports = router;
