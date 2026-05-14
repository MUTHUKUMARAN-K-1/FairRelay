const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Shipper-only routes
router.post('/create', requireRole('SHIPPER'), shipmentController.createShipment);
router.get('/my-shipments', requireRole('SHIPPER'), shipmentController.getMyShipments);

// Driver routes - MUST be before /:id to prevent 'pending' from being captured as an ID
router.get('/pending', requireRole('DRIVER'), shipmentController.getPendingShipments);
router.post('/:id/accept', requireRole('DRIVER'), shipmentController.acceptShipment);

// Dynamic ID routes (must come after specific named routes)
router.get('/:id', shipmentController.getShipment);
router.put('/:id/cancel', requireRole('SHIPPER'), shipmentController.cancelShipment);

module.exports = router;