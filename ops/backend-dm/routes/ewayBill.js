const express = require('express');
const router = express.Router();
const ewayBillController = require('../controllers/ewayBillController');
// const auth = require('../middleware/auth'); // Assuming there's auth middleware

// POST /api/eway-bill/absorption
router.post('/absorption', ewayBillController.handleAbsorption);

module.exports = router;
