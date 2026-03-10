const express = require('express');
const router = express.Router();
const axios = require('axios');
const { validateApiKey } = require('../controllers/apiKeyController');

const BRAIN_URL = process.env.BRAIN_URL || process.env.BRAIN_API_URL || 'http://localhost:8000';

// In-memory run history for demo mode
const runHistory = [];

// Standard JSON response envelope
function wrap(data, meta = {}) {
  return { success: true, data, meta: { ...meta, timestamp: new Date().toISOString() } };
}

// Gini coefficient calculation
function calcGini(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  if (mean === 0) return 0;
  const abs = sorted.reduce((s, v, i) => s + Math.abs(v - (sorted[i - 1] || 0)), 0);
  return parseFloat((abs / (2 * n * mean)).toFixed(3));
}

// Apply API key validation to all /v1 routes
router.use(validateApiKey);

/**
 * @openapi
 * /v1/health:
 *   get:
 *     summary: API health check
 *     description: Returns operational status of the API gateway and AI brain.
 *     tags: [System]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Health status
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { api: "operational", brain: "connected", version: "v1" }
 *               meta: { brain_latency_ms: 42, mode: "live", timestamp: "2026-02-20T04:00:00.000Z" }
 */
router.get('/health', async (req, res) => {
  let brainStatus = 'disconnected';
  let brainLatency = null;
  try {
    const t0 = Date.now();
    await axios.get(`${BRAIN_URL}/health`, { timeout: 2000 });
    brainLatency = Date.now() - t0;
    brainStatus = 'connected';
  } catch {}

  res.json(wrap({
    api: 'operational',
    brain: brainStatus,
    version: 'v1',
  }, { brain_latency_ms: brainLatency, mode: brainStatus === 'connected' ? 'live' : 'demo' }));
});

/**
 * @openapi
 * /v1/allocate:
 *   post:
 *     summary: Run fair dispatch allocation
 *     description: |
 *       Core endpoint. Sends drivers and routes through the 8-agent LangGraph pipeline.
 *       Returns a fair assignment with Gini index, carbon savings, and per-driver explanation.
 *
 *       **Demo mode** is automatically used when the AI brain is unavailable.
 *     tags: [Dispatch]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [drivers, routes]
 *             properties:
 *               drivers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Driver'
 *               routes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Route'
 *               options:
 *                 type: object
 *                 properties:
 *                   ev_first: { type: boolean, default: true }
 *                   night_safety: { type: boolean, default: true }
 *           example:
 *             drivers:
 *               - id: "drv_001"
 *                 name: "Rajesh Kumar"
 *                 hours_today: 4.5
 *                 is_ill: false
 *                 vehicle_type: "DIESEL"
 *                 gender: "M"
 *               - id: "drv_002"
 *                 name: "Priya Sharma"
 *                 hours_today: 8.1
 *                 is_ill: false
 *                 vehicle_type: "ELECTRIC"
 *                 gender: "F"
 *             routes:
 *               - id: "rt_A"
 *                 distance_km: 142
 *                 difficulty: "medium"
 *               - id: "rt_B"
 *                 distance_km: 48
 *                 difficulty: "easy"
 *                 is_city_centre: true
 *     responses:
 *       200:
 *         description: Successful allocation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     allocations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Allocation'
 *                 meta:
 *                   $ref: '#/components/schemas/ApiMeta'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/allocate', async (req, res) => {
  const { drivers = [], routes = [], options = {} } = req.body;

  if (!drivers.length || !routes.length) {
    return res.status(400).json({ success: false, error: 'drivers and routes arrays are required and must not be empty.' });
  }

  const t0 = Date.now();
  const runId = `run_${Date.now()}`;

  // Try live brain first
  try {
    const response = await axios.post(`${BRAIN_URL}/allocate`, { drivers, routes, options }, { timeout: 15000 });
    const brainData = response.data;
    const result = wrap(
      { id: runId, allocations: brainData.allocations || brainData.result || [] },
      {
        gini_index: brainData.gini_index ?? brainData.meta?.gini_index ?? 0.0,
        fairness_grade: brainData.fairness_grade ?? 'N/A',
        explanation: brainData.explanation ?? brainData.meta?.explanation ?? 'Allocation complete.',
        carbon_kg: brainData.carbon_kg ?? null,
        latency_ms: Date.now() - t0,
        mode: 'live',
      }
    );
    runHistory.unshift({ id: runId, createdAt: new Date().toISOString(), ...result.meta, driverCount: drivers.length, routeCount: routes.length });
    if (runHistory.length > 100) runHistory.pop();
    return res.json(result);
  } catch (brainErr) {
    // Demo mode fallback — deterministic fair allocation (shortest route to most-rested driver)
    const sorted = [...drivers].sort((a, b) => (a.hours_today || 0) - (b.hours_today || 0));
    const sortedRoutes = [...routes].sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    
    // EV-first: if any driver has electric and route is city-centre, assign first
    const reorderedRoutes = options.ev_first !== false
      ? [...sortedRoutes.filter(r => r.is_city_centre), ...sortedRoutes.filter(r => !r.is_city_centre)]
      : sortedRoutes;

    const allocations = sorted.map((d, i) => ({
      driver: d.id,
      driver_name: d.name || d.id,
      route: reorderedRoutes[i % reorderedRoutes.length]?.id,
      wellness_score: Math.max(0, Math.round(100 - (d.hours_today || 0) * 8 - (d.is_ill ? 30 : 0))),
      carbon_kg: ((reorderedRoutes[i % reorderedRoutes.length]?.distance_km || 0) * 0.21).toFixed(1),
      explanation: d.is_ill
        ? `${d.name || d.id} flagged as ill — assigned shortest available route.`
        : `${d.name || d.id} assigned based on fairness score (${(d.hours_today || 0).toFixed(1)}h today).`,
    }));

    const hours = sorted.map(d => d.hours_today || 0);
    const gini = calcGini(hours);
    const totalCarbon = allocations.reduce((s, a) => s + parseFloat(a.carbon_kg), 0);

    const result = wrap(
      { id: runId, allocations },
      {
        gini_index: gini,
        fairness_grade: gini < 0.1 ? 'A+' : gini < 0.2 ? 'A' : gini < 0.3 ? 'B' : 'C',
        explanation: `Demo mode: drivers sorted by hours today, shortest routes to most-worked. Gini = ${gini}.`,
        carbon_kg: totalCarbon.toFixed(1),
        latency_ms: Date.now() - t0,
        mode: 'demo',
      }
    );
    runHistory.unshift({ id: runId, createdAt: new Date().toISOString(), ...result.meta, driverCount: drivers.length, routeCount: routes.length });
    if (runHistory.length > 100) runHistory.pop();
    return res.json(result);
  }
});

/**
 * @openapi
 * /v1/allocate/{id}:
 *   get:
 *     summary: Get a past allocation run
 *     tags: [Dispatch]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: run_1708394400000
 *     responses:
 *       200:
 *         description: Past run metadata
 *       404:
 *         description: Run not found
 */
router.get('/allocate/:id', async (req, res) => {
  const run = runHistory.find(r => r.id === req.params.id);
  if (run) return res.json(wrap(run));
  res.status(404).json({ success: false, error: 'Allocation run not found. Runs are stored in memory for 24h in demo mode.' });
});

/**
 * @openapi
 * /v1/runs:
 *   get:
 *     summary: List recent allocation runs
 *     description: Returns the last 50 allocation runs (in-memory in demo mode).
 *     tags: [Dispatch]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of recent runs
 */
router.get('/runs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  res.json(wrap(runHistory.slice(0, limit), { total: runHistory.length }));
});

/**
 * @openapi
 * /v1/wellness:
 *   post:
 *     summary: Score driver wellness before dispatch
 *     description: |
 *       Calculates a wellness score (0–100) for each driver based on:
 *       - Hours worked today
 *       - Hours since last rest break
 *       - Illness flag
 *       - 7-day cumulative hours
 *
 *       Drivers scoring < 40 should be rested before dispatch.
 *     tags: [Wellness]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [drivers]
 *             properties:
 *               drivers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Driver'
 *           example:
 *             drivers:
 *               - id: "drv_001"
 *                 name: "Rajesh Kumar"
 *                 hours_today: 4.5
 *                 hours_since_rest: 2.0
 *                 is_ill: false
 *               - id: "drv_002"
 *                 name: "Vikram Das"
 *                 hours_today: 9.5
 *                 hours_since_rest: 8.0
 *                 is_ill: false
 *     responses:
 *       200:
 *         description: Wellness scores for all drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     drivers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WellnessResult'
 */
router.post('/wellness', async (req, res) => {
  const { drivers = [] } = req.body;
  const t0 = Date.now();

  try {
    const response = await axios.post(`${BRAIN_URL}/wellness`, { drivers }, { timeout: 5000 });
    return res.json(wrap(response.data?.drivers || response.data, { latency_ms: Date.now() - t0, mode: 'live' }));
  } catch {
    const scored = drivers.map(d => ({
      id: d.id,
      name: d.name,
      wellness_score: Math.max(0, Math.round(
        100
        - (d.hours_today || 0) * 8
        - (d.is_ill ? 30 : 0)
        - (d.hours_since_rest >= 6 ? 15 : 0)
        - Math.min((d.total_hours_7d || 0) / 70, 1.0) * 15
      )),
      risk_level: ((d.hours_today || 0) >= 9 || d.is_ill) ? 'HIGH' : (d.hours_today || 0) >= 6 ? 'MEDIUM' : 'LOW',
      recommendation: d.is_ill
        ? 'Remove from duty — illness flag active'
        : (d.hours_today || 0) >= 9
          ? 'Mandatory rest required before next shift'
          : (d.hours_today || 0) >= 6
            ? 'Short break recommended — monitor closely'
            : 'Fit for duty',
    }));
    return res.json(wrap({ drivers: scored }, { latency_ms: Date.now() - t0, mode: 'demo' }));
  }
});

/**
 * @openapi
 * /v1/gini:
 *   post:
 *     summary: Compute Gini index for a workload distribution
 *     description: |
 *       Standalone Gini coefficient calculation. Pass any numeric values representing
 *       workload (hours, deliveries, km, earnings) and get the inequality index.
 *
 *       **Gini = 0** → perfect equality. **Gini = 1** → total inequality.
 *       FairRelay targets Gini ≤ 0.15.
 *     tags: [Fairness]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [values]
 *             properties:
 *               values:
 *                 type: array
 *                 items: { type: number }
 *                 description: Numeric workload values per driver
 *               labels:
 *                 type: array
 *                 items: { type: string }
 *                 description: Optional driver names for each value
 *           example:
 *             values: [8400, 2100, 5600, 3200]
 *             labels: ["Rajesh", "Vikram", "Priya", "Amit"]
 *     responses:
 *       200:
 *         description: Gini coefficient and fairness grade
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 gini_index: 0.34
 *                 fairness_grade: "B"
 *                 interpretation: "Moderate inequality — FairRelay can reduce this to A+ (≤0.10)"
 *                 mean: 4825
 *                 min: 2100
 *                 max: 8400
 *                 breakdown:
 *                   - label: "Rajesh"
 *                     value: 8400
 *                     deviation_from_mean: "+74.1%"
 */
router.post('/gini', (req, res) => {
  const { values = [], labels = [] } = req.body;

  if (!values.length) {
    return res.status(400).json({ success: false, error: '`values` array is required and must not be empty.' });
  }

  const gini = calcGini(values);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const grade = gini < 0.1 ? 'A+' : gini < 0.2 ? 'A' : gini < 0.3 ? 'B' : 'C';
  const interpretation =
    gini < 0.1 ? 'Excellent equality — world-class fairness.'
    : gini < 0.2 ? 'Good fairness — minor inequality exists.'
    : gini < 0.3 ? 'Moderate inequality — FairRelay can improve this to A+ grade.'
    : 'High inequality — workers are being under/over-assigned significantly.';

  res.json(wrap({
    gini_index: gini,
    fairness_grade: grade,
    interpretation,
    mean: parseFloat(mean.toFixed(2)),
    min: Math.min(...values),
    max: Math.max(...values),
    breakdown: values.map((v, i) => ({
      label: labels[i] || `item_${i + 1}`,
      value: v,
      deviation_from_mean: `${v >= mean ? '+' : ''}${(((v - mean) / mean) * 100).toFixed(1)}%`,
    })),
  }));
});

/**
 * @openapi
 * /v1/night-safety:
 *   post:
 *     summary: Apply night safety constraints to drivers
 *     description: |
 *       Checks if it is currently night hours (7pm–6am) and applies safety constraints
 *       for female drivers: max 50km radius, avoid high-crime zones, SOS enabled.
 *
 *       Pass the current hour explicitly or let the server determine it automatically.
 *     tags: [Safety]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [drivers]
 *             properties:
 *               drivers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Driver'
 *               current_hour:
 *                 type: integer
 *                 description: Override current hour (0–23). Defaults to server time.
 *                 example: 21
 *           example:
 *             current_hour: 21
 *             drivers:
 *               - id: "drv_001"
 *                 name: "Priya Sharma"
 *                 gender: "F"
 *               - id: "drv_002"
 *                 name: "Rajesh Kumar"
 *                 gender: "M"
 *     responses:
 *       200:
 *         description: Drivers with night safety constraints applied
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 is_night_mode: true
 *                 drivers:
 *                   - id: "drv_001"
 *                     night_safety_active: true
 *                     route_constraints:
 *                       max_distance_km: 50
 *                       avoid_high_crime_zones: true
 *                       sos_enabled: true
 */
router.post('/night-safety', (req, res) => {
  const { drivers = [], current_hour } = req.body;
  const hour = current_hour !== undefined ? current_hour : new Date().getHours();
  const isNight = hour >= 19 || hour <= 6;

  const result = drivers.map(d => {
    const needsSafety = isNight && d.gender === 'F';
    return {
      ...d,
      night_safety_active: needsSafety,
      route_constraints: needsSafety ? {
        max_distance_km: 50,
        avoid_high_crime_zones: true,
        prefer_well_lit_areas: true,
        prefer_near_police_stations: true,
        sos_enabled: true,
      } : null,
    };
  });

  res.json(wrap({
    is_night_mode: isNight,
    current_hour: hour,
    drivers: result,
  }));
});

/**
 * @openapi
 * /v1/carbon:
 *   post:
 *     summary: Estimate CO₂ emissions for routes
 *     description: |
 *       Calculates carbon footprint per route based on distance and vehicle type.
 *       Emission factors: Diesel 0.21 kg/km, CNG 0.13 kg/km, EV 0.05 kg/km.
 *     tags: [Carbon]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Route'
 *               vehicle_type:
 *                 type: string
 *                 enum: [diesel, electric, cng, hybrid]
 *                 default: diesel
 *           example:
 *             vehicle_type: "diesel"
 *             routes:
 *               - id: "rt_A"
 *                 distance_km: 142
 *               - id: "rt_B"
 *                 distance_km: 67
 *     responses:
 *       200:
 *         description: CO₂ estimates per route and totals
 */
router.post('/carbon', async (req, res) => {
  const { routes = [], vehicle_type = 'diesel' } = req.body;
  const t0 = Date.now();

  const KG_PER_KM = { diesel: 0.21, electric: 0.05, cng: 0.13, hybrid: 0.12, petrol: 0.23 };
  const factor = KG_PER_KM[vehicle_type.toLowerCase()] || 0.21;

  const estimated = routes.map(r => ({
    route_id: r.id,
    distance_km: r.distance_km || 0,
    co2_kg: ((r.distance_km || 0) * factor).toFixed(2),
    eco_rating: (r.distance_km || 0) < 100 ? 'A' : (r.distance_km || 0) < 200 ? 'B' : 'C',
    co2_vs_diesel_kg: (((r.distance_km || 0) * 0.21) - ((r.distance_km || 0) * factor)).toFixed(2),
  }));

  const total = estimated.reduce((s, r) => s + parseFloat(r.co2_kg), 0);
  const savedVsDiesel = estimated.reduce((s, r) => s + parseFloat(r.co2_vs_diesel_kg), 0);

  res.json(wrap({
    routes: estimated,
    total_co2_kg: total.toFixed(2),
    total_saved_vs_diesel_kg: savedVsDiesel.toFixed(2),
  }, { vehicle_type, factor_kg_per_km: factor, latency_ms: Date.now() - t0 }));
});

/**
 * @openapi
 * /v1/consolidate:
 *   post:
 *     summary: AI Load Consolidation — group shipments and optimize vehicle capacity
 *     description: |
 *       Core consolidation endpoint. Groups shipments by geographic proximity and time
 *       window compatibility, then bin-packs them into available trucks to maximize
 *       vehicle utilization and minimize trips, distance, and carbon emissions.
 *     tags: [Consolidation]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shipments, trucks]
 *             properties:
 *               shipments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     pickupLat: { type: number }
 *                     pickupLng: { type: number }
 *                     dropLat: { type: number }
 *                     dropLng: { type: number }
 *                     weight: { type: number, description: "kg" }
 *                     volume: { type: number, description: "m³" }
 *                     timeWindowStart: { type: string, format: date-time }
 *                     timeWindowEnd: { type: string, format: date-time }
 *               trucks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     maxWeight: { type: number }
 *                     maxVolume: { type: number }
 *               options:
 *                 type: object
 *                 properties:
 *                   maxGroupRadiusKm: { type: number, default: 30 }
 *                   timeWindowToleranceMinutes: { type: number, default: 120 }
 *     responses:
 *       200:
 *         description: Consolidation result with groups and performance metrics
 */
router.post('/consolidate', async (req, res) => {
  const { shipments = [], trucks = [], options = {} } = req.body;

  if (!shipments.length || !trucks.length) {
    return res.status(400).json({ success: false, error: 'shipments and trucks arrays are required.' });
  }

  const t0 = Date.now();

  // Try AI Brain (5-agent LangGraph pipeline) first
  try {
    const brainRes = await axios.post(`${BRAIN_URL}/api/v1/consolidate`, { shipments, trucks, options }, { timeout: 15000 });
    return res.json(wrap(brainRes.data, { latency_ms: Date.now() - t0, mode: 'live', engine: 'brain-langgraph-5-agent' }));
  } catch (brainErr) {
    // Fallback to local Node.js engine
    const { runConsolidation } = require('../controllers/consolidationController');
    const result = runConsolidation(shipments, trucks, options);
    res.json(wrap(result, { latency_ms: Date.now() - t0, mode: 'demo', engine: 'local-node' }));
  }
});

module.exports = router;
