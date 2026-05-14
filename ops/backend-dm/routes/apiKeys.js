const express = require('express');
const router = express.Router();
const { createApiKey, listApiKeys, revokeApiKey } = require('../controllers/apiKeyController');

// POST /api/keys — generate a new API key
router.post('/', createApiKey);

// GET /api/keys?userId=xxx — list keys (masked)
router.get('/', listApiKeys);

// DELETE /api/keys/:id — revoke a key
router.delete('/:id', revokeApiKey);

module.exports = router;
