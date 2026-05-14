const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy to the FairRelay AI Brain (FastAPI)
const BRAIN_URL = process.env.BRAIN_URL || 'http://localhost:8000';

// Axios instance with retry logic
const brainClient = axios.create({
    baseURL: BRAIN_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Retry interceptor (3 retries with exponential backoff)
brainClient.interceptors.response.use(null, async (error) => {
    const config = error.config;
    if (!config || config.__retryCount >= 3) return Promise.reject(error);
    
    config.__retryCount = (config.__retryCount || 0) + 1;
    const backoff = Math.pow(2, config.__retryCount) * 500;
    
    // Only retry on network errors or 5xx
    if (!error.response || error.response.status >= 500) {
        await new Promise(r => setTimeout(r, backoff));
        return brainClient(config);
    }
    return Promise.reject(error);
});

// Helper to proxy requests to the AI Brain with structured error handling
async function proxyToBrain(req, res, method, path, data = null) {
    const startTime = Date.now();
    try {
        const config = { method, url: path };
        if (data) config.data = data;
        
        const response = await brainClient(config);
        const latencyMs = Date.now() - startTime;
        
        // Add latency header for monitoring
        res.set('X-Brain-Latency-Ms', String(latencyMs));
        res.json(response.data);
    } catch (error) {
        const latencyMs = Date.now() - startTime;
        console.error(`[Dispatch] ${method} ${path} failed (${latencyMs}ms):`, error.message);
        
        if (error.response) {
            // Brain returned an error — forward it with context
            res.status(error.response.status).json({
                success: false,
                error: error.response.data?.detail || error.response.data?.error || 'Brain service error',
                status: error.response.status,
                brain_url: BRAIN_URL,
                latency_ms: latencyMs,
                path: path,
            });
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            res.status(503).json({
                success: false,
                error: 'AI Brain service unreachable',
                code: 'BRAIN_UNREACHABLE',
                brain_url: BRAIN_URL,
                hint: 'Brain service may be cold-starting on Render (30-60s). Retry shortly.',
                latency_ms: latencyMs,
            });
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            res.status(504).json({
                success: false,
                error: 'Brain service timeout — allocation may be running with large dataset',
                code: 'BRAIN_TIMEOUT',
                latency_ms: latencyMs,
                hint: 'Try again or reduce input size.',
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Unexpected error communicating with AI Brain',
                message: error.message,
                latency_ms: latencyMs,
            });
        }
    }
}

// ====== AI Dispatch Endpoints ======

// Run fair allocation with LangGraph multi-agent workflow
router.post('/allocate', async (req, res) => {
    // Validate minimum input
    if (!req.body.drivers?.length && !req.body.packages?.length) {
        return res.status(400).json({
            success: false,
            error: 'Request must include drivers and/or packages arrays',
            hint: 'See API docs at /api/docs',
        });
    }
    await proxyToBrain(req, res, 'POST', '/api/v1/allocate/langgraph', req.body);
});

// Fallback: original (non-LangGraph) allocation
router.post('/allocate/simple', async (req, res) => {
    await proxyToBrain(req, res, 'POST', '/api/v1/allocate', req.body);
});

// Get allocation status for a run
router.get('/runs/:runId', async (req, res) => {
    await proxyToBrain(req, res, 'GET', `/api/v1/runs/${req.params.runId}`);
});

// Get all allocation runs
router.get('/runs', async (req, res) => {
    await proxyToBrain(req, res, 'GET', '/api/v1/runs');
});

// Stream agent events (SSE proxy)
router.get('/agent-events/stream', async (req, res) => {
    try {
        const response = await axios({
            method: 'GET',
            url: `${BRAIN_URL}/agent-events/stream`,
            params: req.query,
            responseType: 'stream',
            timeout: 0,
        });
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        
        response.data.pipe(res);
        
        req.on('close', () => {
            response.data.destroy();
        });
    } catch (error) {
        console.error('[Dispatch] SSE stream error:', error.message);
        res.status(503).json({ error: 'Agent events stream unavailable', hint: 'Brain may be starting up' });
    }
});

// Get driver fairness stats from brain
router.get('/drivers', async (req, res) => {
    await proxyToBrain(req, res, 'GET', '/api/v1/drivers');
});

router.get('/drivers/:id', async (req, res) => {
    await proxyToBrain(req, res, 'GET', `/api/v1/drivers/${req.params.id}`);
});

// Get routes from brain
router.get('/routes/:id', async (req, res) => {
    await proxyToBrain(req, res, 'GET', `/api/v1/routes/${req.params.id}`);
});

// Submit driver feedback
router.post('/feedback', async (req, res) => {
    await proxyToBrain(req, res, 'POST', '/api/v1/feedback', req.body);
});

// Health check for brain with caching (avoid hammering brain)
let _brainHealthCache = { data: null, ts: 0 };
const HEALTH_CACHE_TTL = 15000; // 15s

router.get('/health', async (req, res) => {
    const now = Date.now();
    if (_brainHealthCache.data && (now - _brainHealthCache.ts) < HEALTH_CACHE_TTL) {
        return res.json(_brainHealthCache.data);
    }
    
    try {
        const response = await brainClient.get('/health', { timeout: 5000 });
        const result = {
            brain_status: 'connected',
            brain_health: response.data,
            gateway: 'operational',
            brain_url: BRAIN_URL,
            latency_ms: Date.now() - now,
        };
        _brainHealthCache = { data: result, ts: now };
        res.json(result);
    } catch (error) {
        const result = {
            brain_status: 'disconnected',
            error: error.message,
            gateway: 'operational',
            brain_url: BRAIN_URL,
            hint: 'Brain may be cold-starting (30-60s on free tier). Try again shortly.',
        };
        _brainHealthCache = { data: result, ts: now };
        res.json(result);
    }
});

// ====== Wellness-Aware Dispatch ======
router.post('/wellness-check', async (req, res) => {
    const { drivers } = req.body;
    
    const scoredDrivers = (drivers || []).map(driver => {
        const wrs = calculateWellnessScore(driver);
        const cli = calculateCognitiveLoad(driver);
        return {
            ...driver,
            wellnessScore: wrs,
            cognitiveLoad: cli.score,
            cognitiveState: cli.state,
            maxDifficulty: wrs < 40 ? 'EASY' : wrs < 70 ? 'MEDIUM' : 'ANY',
            wellnessStatus: wrs < 40 ? 'FATIGUED' : wrs < 70 ? 'MODERATE' : 'FIT',
        };
    });
    
    res.json({ drivers: scoredDrivers, timestamp: new Date().toISOString() });
});

function calculateWellnessScore(driver) {
    const { hoursToday = 0, hoursSinceRest = 24, isIll = false, totalHours7d = 0 } = driver;
    const fatigueFactor = Math.min(hoursToday / 12, 1.0) * 30;
    const restFactor = Math.max(0, (1 - Math.min(hoursSinceRest / 10, 1.0))) * 25;
    const illnessFactor = isIll ? 30 : 0;
    const overworkFactor = Math.min(totalHours7d / 70, 1.0) * 15;
    return Math.max(0, Math.min(100, Math.round(100 - fatigueFactor - restFactor - illnessFactor - overworkFactor)));
}

function calculateCognitiveLoad(driver) {
    const { stopsToday = 0, hoursToday = 0, cognitiveLoad } = driver;
    if (cognitiveLoad !== undefined) return { score: cognitiveLoad, state: cognitiveLoad > 70 ? 'OVERLOADED' : cognitiveLoad > 50 ? 'STRAINED' : cognitiveLoad > 30 ? 'ALERT' : 'SHARP' };
    
    // 6-factor Cognitive Load Index (CLI)
    const decisionFatigue = Math.min(stopsToday / 20, 1.0) * 25;
    const timePressure = Math.min(hoursToday / 10, 1.0) * 20;
    const taskComplexity = Math.min(stopsToday * 2.5, 25);
    const circadianDip = (new Date().getHours() >= 13 && new Date().getHours() <= 15) ? 10 : 0;
    const monotony = hoursToday > 6 ? 10 : 0;
    const environmentalStress = 5; // baseline
    
    const score = Math.min(100, Math.round(decisionFatigue + timePressure + taskComplexity + circadianDip + monotony + environmentalStress));
    const state = score > 70 ? 'OVERLOADED' : score > 50 ? 'STRAINED' : score > 30 ? 'ALERT' : 'SHARP';
    return { score, state };
}

// ====== Carbon Footprint Tracking ======
router.post('/carbon-calculate', async (req, res) => {
    const { routes } = req.body;
    const EMISSION_FACTORS = { PETROL: 2.31, DIESEL: 2.68, CNG: 1.86, ELECTRIC: 0.0, EV: 0.0 };
    
    const results = (routes || []).map(route => {
        const factor = EMISSION_FACTORS[route.vehicleType] || EMISSION_FACTORS.DIESEL;
        const loadFactor = Math.min(route.loadPercent || 70, 100) / 100;
        const co2Kg = route.distanceKm * factor * (0.5 + 0.5 * loadFactor);
        return {
            routeId: route.routeId, distanceKm: route.distanceKm,
            vehicleType: route.vehicleType,
            co2ActualKg: Math.round(co2Kg * 100) / 100,
            co2OptimalKg: 0,
            carbonSavedKg: Math.round(co2Kg * 100) / 100,
            greenScore: Math.round((1 - co2Kg / (route.distanceKm * 2.68 + 0.01)) * 100),
        };
    });
    
    const totalCO2 = results.reduce((s, r) => s + r.co2ActualKg, 0);
    const totalSaved = results.reduce((s, r) => s + r.carbonSavedKg, 0);
    
    res.json({
        routes: results,
        summary: {
            totalCO2Kg: Math.round(totalCO2 * 100) / 100,
            totalCarbonSavedKg: Math.round(totalSaved * 100) / 100,
            fleetGreenScore: results.length > 0 ? Math.round(results.reduce((s, r) => s + r.greenScore, 0) / results.length) : 0,
            evUtilizationRate: results.filter(r => r.vehicleType === 'ELECTRIC' || r.vehicleType === 'EV').length / (results.length || 1) * 100,
        }
    });
});

// ====== Night Safety Filter ======
router.post('/night-safety-filter', async (req, res) => {
    const { drivers, currentHour } = req.body;
    const hour = currentHour ?? new Date().getHours();
    const isNight = hour >= 19 || hour <= 6;
    
    const filtered = (drivers || []).map(driver => {
        const needsSafety = isNight && driver.gender === 'F';
        return {
            ...driver,
            nightSafetyActive: needsSafety,
            routeConstraints: needsSafety ? {
                maxDistanceKm: 50, avoidHighCrimeZones: true,
                preferWellLitAreas: true, preferNearPoliceStations: true, sosEnabled: true,
            } : null,
        };
    });
    
    res.json({ drivers: filtered, isNightMode: isNight, hour });
});

module.exports = router;
