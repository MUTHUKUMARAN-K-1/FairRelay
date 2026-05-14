const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy to the FairRelay AI Brain (FastAPI)
const BRAIN_URL = process.env.BRAIN_URL || 'http://localhost:8000';

// Helper to proxy requests to the AI Brain
async function proxyToBrain(req, res, method, path, data = null) {
    try {
        const config = {
            method,
            url: `${BRAIN_URL}${path}`,
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        };
        if (data) config.data = data;
        
        const response = await axios(config);
        res.json(response.data);
    } catch (error) {
        console.error(`[Dispatch Proxy] Error proxying to brain: ${error.message}`);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(503).json({ 
                error: 'AI Brain service unavailable',
                message: error.message,
                hint: 'Make sure the FastAPI brain is running on port 8000'
            });
        }
    }
}

// ====== AI Dispatch Endpoints ======

// Run fair allocation with LangGraph multi-agent workflow
router.post('/allocate', async (req, res) => {
    await proxyToBrain(req, res, 'POST', '/api/v1/allocate/langgraph', req.body);
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
            responseType: 'stream',
            timeout: 0,
        });
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        response.data.pipe(res);
        
        req.on('close', () => {
            response.data.destroy();
        });
    } catch (error) {
        console.error('[Dispatch Proxy] SSE stream error:', error.message);
        res.status(503).json({ error: 'Agent events stream unavailable' });
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

// Health check for brain
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${BRAIN_URL}/health`, { timeout: 5000 });
        res.json({ 
            brain_status: 'connected',
            brain_health: response.data,
            gateway: 'operational'
        });
    } catch (error) {
        res.json({ 
            brain_status: 'disconnected',
            error: error.message,
            gateway: 'operational',
            hint: 'Start the AI Brain: cd brain && uvicorn app.main:app --port 8000'
        });
    }
});

// ====== NEW: Wellness-Aware Dispatch ======
router.post('/wellness-check', async (req, res) => {
    // Wellness scoring for drivers before dispatch
    const { drivers } = req.body;
    
    const scoredDrivers = (drivers || []).map(driver => {
        const wrs = calculateWellnessScore(driver);
        return {
            ...driver,
            wellnessScore: wrs,
            maxDifficulty: wrs < 40 ? 'EASY' : wrs < 70 ? 'MEDIUM' : 'ANY',
            wellnessStatus: wrs < 40 ? 'FATIGUED' : wrs < 70 ? 'MODERATE' : 'FIT',
        };
    });
    
    res.json({ drivers: scoredDrivers });
});

function calculateWellnessScore(driver) {
    const {
        hoursToday = 0,
        hoursSinceRest = 24,
        isIll = false,
        totalHours7d = 0,
    } = driver;
    
    // Max 8 hrs/day, fatigue increases after that
    const fatigueFactor = Math.min(hoursToday / 12, 1.0) * 30;
    
    // Less rest = lower score
    const restFactor = Math.max(0, (1 - Math.min(hoursSinceRest / 10, 1.0))) * 25;
    
    // Illness flag
    const illnessFactor = isIll ? 30 : 0;
    
    // Weekly overwork (>50 hrs = concerning)
    const overworkFactor = Math.min(totalHours7d / 70, 1.0) * 15;
    
    const rawScore = 100 - fatigueFactor - restFactor - illnessFactor - overworkFactor;
    return Math.max(0, Math.min(100, Math.round(rawScore)));
}

// ====== NEW: Carbon Footprint Tracking ======
router.post('/carbon-calculate', async (req, res) => {
    const { routes } = req.body;
    const EMISSION_FACTORS = {
        PETROL: 2.31,
        DIESEL: 2.68,
        CNG: 1.86,
        ELECTRIC: 0.0,
        EV: 0.0,
    };
    
    const results = (routes || []).map(route => {
        const factor = EMISSION_FACTORS[route.vehicleType] || EMISSION_FACTORS.DIESEL;
        const loadFactor = Math.min(route.loadPercent || 70, 100) / 100;
        const co2Kg = route.distanceKm * factor * (0.5 + 0.5 * loadFactor);
        const evOptimal = 0; // If EV was used
        const carbonSaved = co2Kg - evOptimal;
        
        return {
            routeId: route.routeId,
            distanceKm: route.distanceKm,
            vehicleType: route.vehicleType,
            co2ActualKg: Math.round(co2Kg * 100) / 100,
            co2OptimalKg: 0,
            carbonSavedKg: Math.round(carbonSaved * 100) / 100,
            greenScore: Math.round((1 - co2Kg / (route.distanceKm * 2.68 + 0.01)) * 100),
        };
    });
    
    const totalCO2 = results.reduce((sum, r) => sum + r.co2ActualKg, 0);
    const totalSaved = results.reduce((sum, r) => sum + r.carbonSavedKg, 0);
    const fleetGreenScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.greenScore, 0) / results.length)
        : 0;
    
    res.json({
        routes: results,
        summary: {
            totalCO2Kg: Math.round(totalCO2 * 100) / 100,
            totalCarbonSavedKg: Math.round(totalSaved * 100) / 100,
            fleetGreenScore,
            evUtilizationRate: results.filter(r => r.vehicleType === 'ELECTRIC' || r.vehicleType === 'EV').length / (results.length || 1) * 100,
        }
    });
});

// ====== NEW: Night Safety Filter ======
router.post('/night-safety-filter', async (req, res) => {
    const { drivers, currentHour } = req.body;
    const isNight = (currentHour || new Date().getHours()) >= 19 || (currentHour || new Date().getHours()) <= 6;
    
    const filtered = (drivers || []).map(driver => {
        const needsSafety = isNight && driver.gender === 'F';
        return {
            ...driver,
            nightSafetyActive: needsSafety,
            routeConstraints: needsSafety ? {
                maxDistanceKm: 50,
                avoidHighCrimeZones: true,
                preferWellLitAreas: true,
                preferNearPoliceStations: true,
                sosEnabled: true,
            } : null,
        };
    });
    
    res.json({ drivers: filtered, isNightMode: isNight });
});

module.exports = router;
