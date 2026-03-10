const crypto = require('crypto');
const prisma = require('../config/database');

// In-memory store for demo mode (when DB is unavailable)
const memoryKeys = new Map();

function generateKey() {
  const raw = crypto.randomBytes(24).toString('base64url');
  return `fr_live_${raw}`;
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Generate an API key
exports.createApiKey = async (req, res) => {
  const { name = 'Default Key', userId = 'demo-user' } = req.body;
  const key = generateKey();
  const keyHash = hashKey(key);
  const id = crypto.randomUUID();
  const record = {
    id,
    name,
    keyPreview: key.substring(0, 12) + '••••••••••••',
    createdAt: new Date().toISOString(),
    lastUsed: null,
    active: true,
    userId,
  };

  // Try Prisma first, fall back to memory
  try {
    await prisma.apiKey.create({
      data: { id, name, keyHash, userId, active: true }
    });
  } catch {
    // Demo mode — store in memory
    memoryKeys.set(keyHash, { ...record, keyHash });
  }

  // Return the actual key ONCE (never again)
  res.status(201).json({ ...record, key, message: 'Save this key — it will not be shown again.' });
};

// List keys for a user (masked)
exports.listApiKeys = async (req, res) => {
  const { userId = 'demo-user' } = req.query;

  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId, active: true },
      select: { id: true, name: true, keyPreview: true, createdAt: true, lastUsed: true, active: true }
    });
    return res.json(keys);
  } catch {
    // Demo mode — return memory + some seed data
    const seedKeys = [
      { id: 'seed-001', name: 'Production Key', keyPreview: 'fr_live_••••••••', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), lastUsed: new Date().toISOString(), active: true },
      { id: 'seed-002', name: 'Development Key', keyPreview: 'fr_live_••••••••', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), lastUsed: null, active: true },
    ];
    const memKeys = Array.from(memoryKeys.values()).map(k => ({
      id: k.id, name: k.name, keyPreview: k.keyPreview, createdAt: k.createdAt, lastUsed: k.lastUsed, active: k.active
    }));
    return res.json([...seedKeys, ...memKeys]);
  }
};

// Revoke a key
exports.revokeApiKey = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.apiKey.update({ where: { id }, data: { active: false } });
  } catch {
    memoryKeys.delete(id);
  }
  res.json({ success: true, message: 'Key revoked' });
};

// Middleware: validate x-api-key on /v1/* routes
exports.validateApiKey = async (req, res, next) => {
  const key = req.headers['x-api-key'];

  // Allow demo key only in non-production
  const IS_PROD = process.env.NODE_ENV === 'production';
  if (!IS_PROD && (key === 'fr_demo_key' || key === 'fr_live_demo')) return next();

  if (!key || !key.startsWith('fr_')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid API key. Pass your key in the x-api-key header.' });
  }

  const keyHash = hashKey(key);

  try {
    const record = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (!record || !record.active) throw new Error('Invalid key');
    await prisma.apiKey.update({ where: { keyHash }, data: { lastUsed: new Date() } });
    req.apiKeyRecord = record;
    return next();
  } catch (dbErr) {
    // Demo mode -- check memory store
    const memRecord = memoryKeys.get(keyHash);
    if (memRecord && memRecord.active) {
      memRecord.lastUsed = new Date().toISOString();
      return next();
    }
    return res.status(401).json({ success: false, error: 'Invalid API key.' });
  }
};
