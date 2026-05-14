const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FairRelay API',
      version: '1.0.0',
      description: `## The Fair Logistics API

FairRelay uses an **8-agent LangGraph AI pipeline** to allocate delivery routes with fairness scoring, driver wellness checks, and carbon tracking.

### Quick Start
\`\`\`bash
curl -X POST https://api.fairrelay.io/v1/allocate \\
  -H "x-api-key: fr_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"drivers":[{"id":"d1","hours_today":4}],"routes":[{"id":"r1","distance_km":80}]}'
\`\`\`

### Authentication
All \`/v1\` endpoints require an API key in the \`x-api-key\` header.
Use \`fr_demo_key\` to try without registration.

### Fairness
Every response includes a **Gini index** (0 = perfect equality, 1 = total inequality).
FairRelay guarantees Gini ≤ 0.15 on live allocations.
`,
      contact: { name: 'FairRelay Team', email: 'api@fairrelay.io' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local Development' },
      { url: 'https://fairrelay-backend.onrender.com', description: 'Production (Render)' },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Use `fr_demo_key` for testing without registration',
        },
      },
      schemas: {
        Driver: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', example: 'drv_001' },
            name: { type: 'string', example: 'Rajesh Kumar' },
            hours_today: { type: 'number', example: 4.5, description: 'Hours worked today' },
            hours_since_rest: { type: 'number', example: 2.0, description: 'Hours since last rest break' },
            is_ill: { type: 'boolean', example: false },
            total_hours_7d: { type: 'number', example: 32, description: 'Total hours worked in last 7 days' },
            vehicle_type: { type: 'string', enum: ['DIESEL', 'CNG', 'ELECTRIC', 'PETROL'], example: 'DIESEL' },
            gender: { type: 'string', enum: ['M', 'F'], example: 'M' },
          },
        },
        Route: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', example: 'rt_A' },
            distance_km: { type: 'number', example: 142 },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], example: 'medium' },
            is_city_centre: { type: 'boolean', example: false },
          },
        },
        Allocation: {
          type: 'object',
          properties: {
            driver: { type: 'string', example: 'drv_001' },
            driver_name: { type: 'string', example: 'Rajesh Kumar' },
            route: { type: 'string', example: 'rt_A' },
            wellness_score: { type: 'number', example: 82 },
            carbon_kg: { type: 'string', example: '29.8' },
          },
        },
        ApiMeta: {
          type: 'object',
          properties: {
            gini_index: { type: 'number', example: 0.12, description: '0 = perfect equality' },
            fairness_grade: { type: 'string', example: 'A', enum: ['A+', 'A', 'B', 'C'] },
            explanation: { type: 'string', example: 'Drivers sorted by fairness score. Gini = 0.12.' },
            carbon_kg: { type: 'string', example: '14.2' },
            latency_ms: { type: 'number', example: 284 },
            mode: { type: 'string', enum: ['live', 'demo'], example: 'demo' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        WellnessResult: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            wellness_score: { type: 'number', example: 82, description: '0–100. ≥70 Fit, 40–70 Moderate, <40 Fatigued' },
            risk_level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            recommendation: { type: 'string', example: 'Fit for duty' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'drivers and routes arrays are required.' },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
  },
  apis: ['./routes/v1.js'],
};

module.exports = swaggerJsdoc(options);
