const express = require('express');
const router = express.Router();
const backhaulController = require('../controllers/backhaulController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Get backhaul opportunities
router.get('/opportunities', backhaulController.getOpportunities);

// Check for new backhaul opportunities (called after delivery completion)
router.post('/check-opportunities', backhaulController.checkOpportunities);

// Accept backhaul opportunity
router.post('/:id/accept', backhaulController.acceptBackhaul);

// Reject backhaul opportunity
router.post('/:id/reject', backhaulController.rejectBackhaul);

// Start pickup (en route to shipper)
router.post('/:id/start-pickup', backhaulController.startPickup);

// Confirm pickup (cargo loaded)
router.post('/:id/confirm-pickup', backhaulController.confirmPickup);

// Complete backhaul delivery
router.post('/:id/complete', backhaulController.completeBackhaul);

module.exports = router;