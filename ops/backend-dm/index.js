const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
const { PrismaClient } = require("@prisma/client");
const shipmentRoutes = require('./routes/shipments');
const deliveryRoutes = require('./routes/delivery');
const transactionRoutes = require('./routes/transaction');
const synergyRoutes = require('./routes/synergy');
const optimizationRoutes = require('./routes/routes');
const truckRoutes = require('./routes/truck');
const backhaulRoutes = require('./routes/backhaul');
const absorptionRoutes = require('./routes/absorption');
const packagesRoutes = require('./routes/packages');
const virtualHubRoutes = require('./routes/virtualHub');
const ewayBillRoutes = require('./routes/ewayBill');
const dispatchRoutes = require('./routes/dispatch');
const wellnessRoutes = require('./routes/wellness');
const apiKeyRoutes = require('./routes/apiKeys');
const consolidationRoutes = require('./routes/consolidation');
const v1Routes = require('./routes/v1');
const otpRoutes = require('./routes/otp');
const SynergyMonitor = require('./services/synergyMonitor');


dotenv.config();

const IS_PROD = process.env.NODE_ENV === 'production';

// Allowed origins for CORS
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// In dev, allow localhost
if (!IS_PROD) {
    ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000', 'http://localhost:8000');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: IS_PROD ? ALLOWED_ORIGINS : "*",
        methods: ["GET", "POST"]
    }
});

const prisma = new PrismaClient();

// Trust proxy (Render sits behind a reverse proxy)
app.set('trust proxy', 1);

// Make io accessible to our routers
app.set('io', io);

// Initialize Synergy Monitor
let synergyMonitor;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow Swagger UI inline scripts
}));
app.use(cors({
    origin: IS_PROD ? ALLOWED_ORIGINS : '*',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Simple rate limiter for auth endpoints (in-memory, no extra dependency)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window

function rateLimit(req, res, next) {
    const key = req.ip + ':' + req.path;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(key, { start: now, count: 1 });
        return next();
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }
    return next();
}

// Apply rate limiting to auth/OTP routes
app.use('/api/otp', rateLimit);
app.use('/api/auth', rateLimit);

app.get('/', (req, res) => {
    res.json({ status: 'healthy', service: 'FairRelay Backend API' });
});

app.get('/health', (req, res) => {
    res.json({
        status: prisma ? 'healthy' : 'degraded',
        service: 'FairRelay Backend API',
        uptime: process.uptime(),
    });
});


// --- API Docs (Swagger UI) - only in non-production ---
if (!IS_PROD) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'FairRelay API Docs',
        customCss: '.swagger-ui .topbar { background: linear-gradient(135deg, #f97316, #ea580c); } .swagger-ui .topbar-wrapper .link { content: none; }',
        swaggerOptions: { tryItOutEnabled: true, persistAuthorization: true }
    }));
    app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
}

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/synergy', synergyRoutes);
app.use('/api/routes', optimizationRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/backhaul', backhaulRoutes);
app.use('/api/absorption', absorptionRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/virtual-hubs', virtualHubRoutes);
app.use('/api/eway-bill', ewayBillRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/consolidation', consolidationRoutes);
app.use('/v1', v1Routes);
app.use('/api/otp', otpRoutes);


// Global error handler - prevent stack trace leaks
app.use((err, req, res, _next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    if (!IS_PROD) console.error(err.stack);
    res.status(err.status || 500).json({
        error: IS_PROD ? 'Internal server error' : err.message,
    });
});


// Socket.io connection logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.name, err.message);
    if (!IS_PROD) console.error(err.stack);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err?.message || err);
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log("Checking database connection...");
        await prisma.$connect();
        console.log("Database connected successfully.");
        synergyMonitor = new SynergyMonitor(io);
        synergyMonitor.start();
    } catch (error) {
        console.warn("Database unavailable - running in DEMO MODE.");
        console.warn("   Start PostgreSQL and restart to enable live data.");
    }

    server.listen(PORT, () => {
        console.log(`FairRelay Backend running on port ${PORT}`);
        if (!IS_PROD) {
            console.log(`   Dashboard: http://localhost:${PORT}`);
            console.log(`   API Docs: http://localhost:${PORT}/api/docs`);
        }
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Error: Port ${PORT} is already in use.`);
        } else {
            console.error('Server error:', err);
        }
        process.exit(1);
    });
}

// Graceful shutdown
function gracefulShutdown(signal) {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        await prisma.$disconnect();
        console.log('Server closed.');
        process.exit(0);
    });
    // Force shutdown after 10s
    setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
