const prisma = require('../config/database');
const { detectAbsorptionOpportunity } = require('./synergyController');

/**
 * POST /api/trucks/location
 * Updates truck GPS and triggers proximity check
 */
exports.updateLocation = async (req, res) => {
    try {
        const { truckId, lat, lng, speed, heading } = req.body;
        const io = req.app.get('io');

        if (!truckId || lat === undefined || lng === undefined) {
            return res.status(400).json({ success: false, message: 'truckId, lat, and lng are required' });
        }

        // 1. Update Truck current location
        const truck = await prisma.truck.update({
            where: { id: truckId },
            data: {
                currentLat: lat,
                currentLng: lng
            }
        });

        // 2. Log GPS coordinate
        await prisma.gPSLog.create({
            data: {
                truckId,
                latitude: lat,
                longitude: lng,
                speed,
                heading
            }
        });

        // 3. Trigger Proximity Check
        // We do this asynchronously or after response in a real app, but here we process it
        const opportunity = await detectAbsorptionOpportunity(truckId, lat, lng, io);

        res.status(200).json({
            success: true,
            message: 'Location updated',
            opportunityDetected: !!opportunity
        });

    } catch (error) {
        console.error('Update Location Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
