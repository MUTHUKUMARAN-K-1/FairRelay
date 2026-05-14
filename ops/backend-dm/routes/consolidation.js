const express = require('express');
const router = express.Router();
const consolidationController = require('../controllers/consolidationController');

router.post('/optimize', consolidationController.optimize);
router.post('/simulate', consolidationController.simulate);
router.get('/history', consolidationController.history);
router.get('/demo', consolidationController.demo);

module.exports = router;
