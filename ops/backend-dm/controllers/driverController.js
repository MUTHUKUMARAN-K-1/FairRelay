const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MOCK_DRIVERS = [
    { id: 'drv-001', name: 'Rajesh Kumar', vehicle: 'Tata Ace', plate: 'MH-12-AB-1234', rating: 4.8, trips: 142, status: 'On Duty', avatar: 'RK', color: 'bg-orange-500', phone: '+91-9876543210', type: 'DIESEL', loc: 'Mumbai' },
    { id: 'drv-002', name: 'Priya Sharma', vehicle: 'Mahindra Treo EV', plate: 'KA-05-CD-4567', rating: 4.9, trips: 98, status: 'On Duty', avatar: 'PS', color: 'bg-emerald-500', phone: '+91-9876543211', type: 'ELECTRIC', loc: 'Bangalore' },
    { id: 'drv-003', name: 'Amit Patel', vehicle: 'Ashok Leyland', plate: 'DL-01-XY-9876', rating: 4.5, trips: 201, status: 'In Transit', avatar: 'AP', color: 'bg-blue-500', phone: '+91-9876543212', type: 'DIESEL', loc: 'Delhi' },
    { id: 'drv-004', name: 'Sunita Devi', vehicle: 'Tata Magic CNG', plate: 'TN-07-EF-3210', rating: 4.7, trips: 67, status: 'On Duty', avatar: 'SD', color: 'bg-purple-500', phone: '+91-9876543213', type: 'CNG', loc: 'Chennai' },
    { id: 'drv-005', name: 'Vikram Singh', vehicle: 'Eicher Pro', plate: 'GJ-18-PQ-5678', rating: 4.3, trips: 315, status: 'Off Duty', avatar: 'VS', color: 'bg-red-500', phone: '+91-9876543214', type: 'DIESEL', loc: 'Ahmedabad' },
];

exports.getAllDrivers = async (req, res) => {
    try {
        const { search, status } = req.query;
        const drivers = await prisma.user.findMany({
            where: {
                role: 'DRIVER',
                AND: [
                    search ? { OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { currentVehicleNo: { contains: search, mode: 'insensitive' } },
                        { homeBaseCity: { contains: search, mode: 'insensitive' } }
                    ]} : {},
                    status ? { status: status.toUpperCase().replace(' ', '_') } : {},
                    { registrationStatus: { not: 'REJECTED' } }
                ]
            },
            include: { trucks: true }
        });

        const formattedDrivers = drivers.map(d => ({
            id: d.id,
            name: d.name,
            vehicle: d.trucks?.[0]?.model || d.vehicleType || 'Unknown Vehicle',
            plate: d.currentVehicleNo || d.trucks?.[0]?.licensePlate || 'N/A',
            rating: d.rating,
            trips: d.deliveriesCount,
            status: d.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
            avatar: d.initials || d.name.split(' ').map(n => n[0]).join(''),
            color: d.avatarColor || 'bg-orange-500',
            phone: d.phone,
            type: d.vehicleType || d.trucks?.[0]?.type || 'Standard',
            loc: d.homeBaseCity || 'Unknown'
        }));

        res.json(formattedDrivers);
    } catch (error) {
        console.warn('[Demo Mode] getAllDrivers using mock data');
        res.json(MOCK_DRIVERS);
    }
};

exports.getDriverById = async (req, res) => {
    try {
        const driver = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        res.json(driver);
    } catch (error) {
        const mock = MOCK_DRIVERS.find(d => d.id === req.params.id) || MOCK_DRIVERS[0];
        res.json(mock);
    }
};

exports.createDriver = async (req, res) => {
    try {
        const driver = await prisma.user.create({ data: { ...req.body, role: 'DRIVER' } });
        res.status(201).json(driver);
    } catch (error) {
        console.warn('[Demo Mode] createDriver - DB unavailable, returning mock success');
        res.status(201).json({ id: `drv-${Date.now()}`, ...req.body, role: 'DRIVER', message: 'Demo mode: driver created locally' });
    }
};

exports.updateDriver = async (req, res) => {
    try {
        const driver = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
        res.json(driver);
    } catch (error) {
        console.warn('[Demo Mode] updateDriver - DB unavailable');
        res.json({ id: req.params.id, ...req.body, message: 'Demo mode: update acknowledged' });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const timestamp = Date.now();
        await prisma.user.update({
            where: { id: req.params.id },
            data: { registrationStatus: 'REJECTED', status: 'OFF_DUTY', name: 'Deleted Driver', phone: `deleted_${timestamp}_${req.params.id.substring(0, 5)}`, qrCode: `deleted_${timestamp}_${req.params.id.substring(0, 5)}`, currentVehicleNo: null }
        });
        res.status(204).send();
    } catch (error) {
        console.warn('[Demo Mode] deleteDriver - DB unavailable');
        res.status(204).send();
    }
};

exports.getActiveRoute = async (req, res) => {
    try {
        const { truckId } = req.params;
        const activeRoute = await prisma.optimizedRoute.findFirst({
            where: { truckId, status: { in: ['Allocated', 'Active'] } },
            orderBy: { createdAt: 'desc' }
        });
        if (!activeRoute) return res.status(404).json({ message: 'No active route found' });
        res.json({ truckId, routeId: activeRoute.id, polyline: activeRoute.routePolyline, checkpoints: activeRoute.waypoints || [] });
    } catch (error) {
        res.status(404).json({ message: 'No active route found (demo mode)' });
    }
};
