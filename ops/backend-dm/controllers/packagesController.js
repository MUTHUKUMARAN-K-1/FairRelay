const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MOCK_PACKAGES = [
    { id: 'pkg-001', trackingNo: 'PKG-A1B2C3D4', pickup: { location: 'Mumbai Warehouse', lat: 19.0760, lng: 72.8777 }, delivery: { location: 'Pune Hub', lat: 18.5204, lng: 73.8567 }, driver: 'Rajesh Kumar', status: 'IN_TRANSIT', date: new Date(), weight: 450 },
    { id: 'pkg-002', trackingNo: 'PKG-E5F6G7H8', pickup: { location: 'Bangalore Depot', lat: 12.9716, lng: 77.5946 }, delivery: { location: 'Chennai Port', lat: 13.0827, lng: 80.2707 }, driver: 'Priya Sharma', status: 'COMPLETED', date: new Date(Date.now() - 86400000), weight: 280 },
    { id: 'pkg-003', trackingNo: 'PKG-I9J0K1L2', pickup: { location: 'Delhi NCR', lat: 28.6139, lng: 77.2090 }, delivery: { location: 'Jaipur City', lat: 26.9124, lng: 75.7873 }, driver: 'Amit Patel', status: 'CARGO_LOADED', date: new Date(), weight: 620 },
];

async function fetchPackages() {
    return prisma.delivery.findMany({
        where: { status: { in: ['COMPLETED', 'IN_TRANSIT', 'EN_ROUTE_TO_DROP', 'CARGO_LOADED'] } },
        include: { driver: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
}

function formatPackage(pkg) {
    return {
        id: pkg.id,
        trackingNo: pkg.trackingNumber || `PKG-${pkg.id.substring(0, 8)}`,
        pickup: { location: pkg.pickupLocation, lat: pkg.pickupLat, lng: pkg.pickupLng },
        delivery: { location: pkg.dropLocation, lat: pkg.dropLat, lng: pkg.dropLng },
        driver: pkg.driver?.name || 'Unassigned',
        status: pkg.status,
        date: pkg.createdAt,
        weight: pkg.cargoWeight || 0
    };
}

// GET /api/packages/history - Get last 10 package deliveries with location data
const getHistory = async (req, res) => {
    try {
        const packages = await fetchPackages();
        res.json(packages.map(formatPackage));
    } catch (error) {
        console.warn('[Demo Mode] getHistory using mock data');
        res.json(MOCK_PACKAGES);
    }
};

const getHistoryWeb = async (req, res) => {
    try {
        const packages = await fetchPackages();
        res.json(packages.map(formatPackage));
    } catch (error) {
        console.warn('[Demo Mode] getHistoryWeb using mock data');
        res.json(MOCK_PACKAGES);
    }
};

module.exports = { getHistory, getHistoryWeb };
