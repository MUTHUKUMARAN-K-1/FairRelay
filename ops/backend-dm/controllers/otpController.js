const twilio = require('twilio');
const { generateAccessToken } = require('../config/jwt');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = process.env.TWILIO_PHONE_NUMBER;
const IS_DEV     = process.env.NODE_ENV !== 'production';

// In-memory OTP store  phone → { otp, expiresAt, attempts }
const otpStore     = new Map();
const OTP_TTL_MS   = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── POST /api/otp/send  ────────────────────────────────────────────────────
// Body: { phone: "+918925036049" }  or bare 10-digit
exports.sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^\+?\d{7,15}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone. Use E.164 format (+918925036049) or bare 10 digits.',
    });
  }

  // Normalise: prepend +91 for bare 10-digit numbers
  const normalised = phone.startsWith('+') ? phone : `+91${phone}`;

  // Rate limit
  const existing = otpStore.get(normalised);
  if (existing && Date.now() < existing.expiresAt && existing.attempts >= MAX_ATTEMPTS) {
    const waitSec = Math.ceil((existing.expiresAt - Date.now()) / 1000);
    return res.status(429).json({ success: false, error: `Too many attempts. Try again in ${waitSec}s.` });
  }

  const otp       = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpStore.set(normalised, { otp, expiresAt, attempts: 0 });

  // Try Twilio — DO NOT delete OTP on failure (keeps it usable for dev verify)
  let smsSent = false;
  try {
    if (accountSid && authToken && fromPhone) {
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        body: `Your FairRelay code: ${otp}. Valid 5 mins. Do not share.`,
        from: fromPhone,
        to:   normalised,
      });
      smsSent = true;
      console.log(`[OTP] SMS sent to ${normalised.slice(0, 7)}****`);
    }
  } catch (err) {
    console.warn('[OTP] Twilio failed (demo mode):', err.message);
  }

  const payload = {
    success:   true,
    message:   smsSent ? 'OTP sent to your phone.' : '[Demo] Twilio not configured — use the code below.',
    expiresIn: OTP_TTL_MS / 1000,
    phone:     normalised,
  };

  // Return real OTP in dev so Flutter/Postman can autofill
  if (IS_DEV && !smsSent) {
    payload.demo = true;
    payload.otp  = otp;
  } else if (!smsSent) {
    // Production with Twilio not configured — don't leak the OTP
    payload.message = 'OTP service unavailable. Please try again later.';
  }

  res.json(payload);
};

// ── POST /api/otp/verify  ─────────────────────────────────────────────────
// Body: { phone, otp, role? }
exports.verifyOtp = async (req, res) => {
  const { phone, otp, role } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, error: 'phone and otp are required.' });
  }

  const normalised = phone.startsWith('+') ? phone : `+91${phone}`;

  // Dev bypass: OTP '000000' always succeeds in development
  const isBypass = IS_DEV && otp.toString().trim() === '000000';

  if (!isBypass) {
    const record = otpStore.get(normalised);
    if (!record) {
      return res.status(400).json({ success: false, error: 'No OTP found. Request a new one.' });
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalised);
      return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' });
    }
    record.attempts += 1;
    if (record.otp !== otp.toString().trim()) {
      const remaining = MAX_ATTEMPTS - record.attempts;
      if (remaining <= 0) {
        otpStore.delete(normalised);
        return res.status(429).json({ success: false, error: 'Too many attempts. Request a new OTP.' });
      }
      return res.status(400).json({ success: false, error: `Invalid OTP. ${remaining} attempt(s) remaining.` });
    }
    otpStore.delete(normalised);
  }

  console.log(`[OTP] Verified ${normalised.slice(0, 7)}**** ${isBypass ? '(dev bypass)' : ''}`);

  const userRole = role || 'DRIVER';
  const token = generateAccessToken(
    { phone: normalised, role: userRole, id: `dev-${normalised.slice(-4)}` }
  );

  res.json({
    success: true,
    message: 'Phone verified.',
    data: {
      token,
      user: {
        id:    `dev-${normalised.slice(-4)}`,
        phone: normalised,
        role:  userRole,
        name:  `Driver ${normalised.slice(-4)}`,
        demo:  isBypass,
      },
    },
  });
};

// -- POST /api/otp/resend  --
exports.resendOtp = async (req, res) => {
  const { phone } = req.body;
  if (phone) {
    const normalised = phone.startsWith('+') ? phone : `+91${phone}`;
    otpStore.delete(normalised);
  }
  return exports.sendOtp(req, res);
};
