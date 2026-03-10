const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All transaction routes require driver role
router.use(authenticateToken);
router.use(requireRole('DRIVER'));

router.get('/my-transactions', transactionController.getMyTransactions);
router.get('/weekly-summary', transactionController.getWeeklySummary);
router.get('/:id', transactionController.getTransaction);

module.exports = router;
