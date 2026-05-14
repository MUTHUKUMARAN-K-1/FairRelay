const express = require('express');
const router = express.Router();
const wellnessController = require('../controllers/wellnessController');

// GET fleet wellness summary
router.get('/summary', wellnessController.getFleetWellnessSummary);

// GET all drivers with wellness data
router.get('/drivers', wellnessController.getDriversWithWellness);

// PUT update driver wellness status
router.put('/drivers/:driverId', wellnessController.updateWellness);

// GET driver credits
router.get('/credits/:driverId', wellnessController.getDriverCredits);

// POST add credits to a driver
router.post('/credits/:driverId', wellnessController.addCredits);

// GET cognitive load for a single driver
router.get('/cognitive/:driverId', wellnessController.getDriverCognitive);

// GET fleet-wide cognitive summary
router.get('/cognitive-fleet', wellnessController.getFleetCognitiveSummary);

module.exports = router;
