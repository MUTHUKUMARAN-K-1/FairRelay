const express = require('express');
const router = express.Router();
const truckController = require('../controllers/truckController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/location', truckController.updateLocation);

module.exports = router;
