const prisma = require('../config/database');

/**
 * Phase 4: The Backhaul (Step 12)
 * GET /api/backhaul/opportunities
 * For drivers on a return journey, show marketplace loads near their path
 */
exports.getOpportunities = async (req, res) => {
    try {
        const { truckId } = req.query;
        const userId = req.user.id;

        // If truckId is provided, use it; otherwise find opportunities for the driver
        let opportunities;

        if (truckId) {
            // 1. Fetch Truck and its sourceHub
            const truck = await prisma.truck.findUnique({
                where: { id: truckId },
                include: { sourceHub: true }
            });

            if (!truck || !truck.currentLat || !truck.currentLng) {
                return res.status(404).json({ success: false, message: 'Truck or location not found' });
            }

            // 2. Find Shipments that are marketplace loads and near the current position
            const nearbyShipments = await prisma.$queryRaw`
                SELECT id, "pickupLocation", "pickupLat", "pickupLng", "dropLocation", "dropLat", "dropLng", "cargoType", "cargoWeight", "cargoVolume",
                ( 6371 * acos( cos( radians(${truck.currentLat}) ) * cos( radians( "pickupLat" ) ) 
                * cos( radians( "pickupLng" ) - radians(${truck.currentLng}) ) + sin( radians(${truck.currentLat}) ) 
                * sin( radians( "pickupLat" ) ) ) ) AS distance 
                FROM "Shipment" 
                WHERE "isMarketplaceLoad" = true
                AND status = 'PENDING'
                AND (6371 * acos( cos( radians(${truck.currentLat}) ) * cos( radians( "pickupLat" ) ) 
                * cos( radians( "pickupLng" ) - radians(${truck.currentLng}) ) + sin( radians(${truck.currentLat}) ) 
                * sin( radians( "pickupLat" ) ) )) < 20
                ORDER BY distance;
            `;
            opportunities = nearbyShipments;
        } else {
            // Fetch backhaul pickups assigned to this driver
            opportunities = await prisma.backhaulPickup.findMany({
                where: { driverId: userId },
                include: {
                    destinationHub: true,
                    truck: true,
                },
                orderBy: { proposedAt: 'desc' },
            });
        }

        res.status(200).json({
            success: true,
            data: opportunities
        });

    } catch (error) {
        console.error('Backhaul Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * POST /api/backhaul/:id/accept - Driver accepts backhaul opportunity
 */
exports.acceptBackhaul = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const io = req.app.get('io');

        const backhaul = await prisma.backhaulPickup.findUnique({
            where: { id },
            include: { driver: true, truck: true },
        });

        if (!backhaul) {
            return res.status(404).json({ success: false, message: 'Backhaul not found' });
        }

        if (backhaul.driverId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (backhaul.status !== 'PROPOSED') {
            return res.status(400).json({ success: false, message: 'Cannot accept this backhaul' });
        }

        const updated = await prisma.backhaulPickup.update({
            where: { id },
            data: { status: 'ACCEPTED' },
        });

        // Notify dispatcher
        io.emit('BACKHAUL_ACCEPTED', {
            backhaulId: id,
            driverName: backhaul.driver.name,
            truckId: backhaul.truckId,
            shipperName: backhaul.shipperName,
            timestamp: new Date().toISOString(),
        });

        res.status(200).json({
            success: true,
            message: 'Backhaul accepted',
            data: updated,
        });
    } catch (error) {
        console.error('Accept backhaul error:', error);
        res.status(500).json({ success: false, message: 'Failed to accept backhaul' });
    }
};

/**
 * POST /api/backhaul/:id/reject - Driver rejects backhaul opportunity
 */
exports.rejectBackhaul = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        const backhaul = await prisma.backhaulPickup.findUnique({
            where: { id },
            include: { driver: true },
        });

        if (!backhaul) {
            return res.status(404).json({ success: false, message: 'Backhaul not found' });
        }

        if (backhaul.driverId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const updated = await prisma.backhaulPickup.update({
            where: { id },
            data: { status: 'REJECTED' },
        });

        // Notify dispatcher
        io.emit('BACKHAUL_REJECTED', {
            backhaulId: id,
            driverName: backhaul.driver.name,
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString(),
        });

        res.status(200).json({
            success: true,
            message: 'Backhaul rejected',
            data: updated,
        });
    } catch (error) {
        console.error('Reject backhaul error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject backhaul' });
    }
};

/**
 * POST /api/backhaul/:id/start-pickup - Driver starts heading to pickup
 */
exports.startPickup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const io = req.app.get('io');

        const backhaul = await prisma.backhaulPickup.findUnique({
            where: { id },
            include: { driver: true },
        });

        if (!backhaul) {
            return res.status(404).json({ success: false, message: 'Backhaul not found' });
        }

        if (backhaul.driverId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (backhaul.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: 'Cannot start pickup' });
        }

        const updated = await prisma.backhaulPickup.update({
            where: { id },
            data: { status: 'EN_ROUTE_TO_PICKUP' },
        });

        // Notify dispatcher
        io.emit('BACKHAUL_EN_ROUTE', {
            backhaulId: id,
            driverName: backhaul.driver.name,
            shipperLocation: backhaul.shipperLocation,
            timestamp: new Date().toISOString(),
        });

        res.status(200).json({
            success: true,
            message: 'Started heading to pickup',
            data: updated,
        });
    } catch (error) {
        console.error('Start pickup error:', error);
        res.status(500).json({ success: false, message: 'Failed to start pickup' });
    }
};

/**
 * POST /api/backhaul/:id/confirm-pickup - Driver confirms cargo pickup
 */
exports.confirmPickup = async (req, res) => {
    try {
        const { id } = req.params;
        const { photos } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        const backhaul = await prisma.backhaulPickup.findUnique({
            where: { id },
            include: { driver: true, truck: true },
        });

        if (!backhaul) {
            return res.status(404).json({ success: false, message: 'Backhaul not found' });
        }

        if (backhaul.driverId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (backhaul.status !== 'EN_ROUTE_TO_PICKUP') {
            return res.status(400).json({ success: false, message: 'Cannot confirm pickup' });
        }

        const updated = await prisma.backhaulPickup.update({
            where: { id },
            data: {
                status: 'PICKED_UP',
                pickedUpAt: new Date(),
            },
        });

        // Update truck capacity
        await prisma.truck.update({
            where: { id: backhaul.truckId },
            data: {
                currentWeight: { increment: backhaul.totalWeight },
                currentVolume: { increment: backhaul.totalVolume },
            },
        });

        // Notify dispatcher
        io.emit('BACKHAUL_PICKED_UP', {
            backhaulId: id,
            driverName: backhaul.driver.name,
            shipperName: backhaul.shipperName,
            packageCount: backhaul.packageCount,
            totalWeight: backhaul.totalWeight,
            timestamp: new Date().toISOString(),
        });

        res.status(200).json({
            success: true,
            message: 'Pickup confirmed',
            data: updated,
        });
    } catch (error) {
        console.error('Confirm pickup error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm pickup' });
    }
};

/**
 * POST /api/backhaul/:id/complete - Driver completes backhaul delivery
 */
exports.completeBackhaul = async (req, res) => {
    try {
        const { id } = req.params;
        const { photos } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        const backhaul = await prisma.backhaulPickup.findUnique({
            where: { id },
            include: { driver: true, truck: true, destinationHub: true },
        });

        if (!backhaul) {
            return res.status(404).json({ success: false, message: 'Backhaul not found' });
        }

        if (backhaul.driverId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (backhaul.status !== 'PICKED_UP') {
            return res.status(400).json({ success: false, message: 'Cannot complete delivery' });
        }

        // Complete the backhaul and create transaction
        const [updated, transaction] = await prisma.$transaction([
            prisma.backhaulPickup.update({
                where: { id },
                data: {
                    status: 'DELIVERED',
                    deliveredAt: new Date(),
                },
            }),
            prisma.transaction.create({
                data: {
                    driverId: userId,
                    amount: 100, // Fixed backhaul bonus
                    type: 'BACKHAUL_BONUS',
                    description: `Backhaul delivery to ${backhaul.destinationHub?.name || 'Hub'}`,
                    route: `${backhaul.shipperLocation} → Hub`,
                },
            }),
        ]);

        // Update truck capacity (remove cargo)
        await prisma.truck.update({
            where: { id: backhaul.truckId },
            data: {
                currentWeight: { decrement: backhaul.totalWeight },
                currentVolume: { decrement: backhaul.totalVolume },
            },
        });

        // Update driver earnings
        await prisma.user.update({
            where: { id: userId },
            data: {
                totalEarnings: { increment: 100 },
                weeklyEarnings: { increment: 100 },
            },
        });

        // Notify dispatcher - Backhaul completed!
        io.emit('BACKHAUL_COMPLETED', {
            backhaulId: id,
            driverName: backhaul.driver.name,
            shipperName: backhaul.shipperName,
            destinationHub: backhaul.destinationHub?.name,
            carbonSaved: backhaul.carbonSavedKg,
            timestamp: new Date().toISOString(),
        });

        res.status(200).json({
            success: true,
            message: 'Backhaul delivery completed!',
            data: {
                backhaul: updated,
                transaction,
            },
        });
    } catch (error) {
        console.error('Complete backhaul error:', error);
        res.status(500).json({ success: false, message: 'Failed to complete backhaul' });
    }
};

/**
 * POST /api/backhaul/check-opportunities - Check for backhaul opportunities after delivery completion
 * Called when a delivery is completed and truck is empty/heading back
 */
exports.checkOpportunities = async (req, res) => {
    try {
        const { truckId, currentLat, currentLng, destinationLat, destinationLng } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        if (!truckId || !currentLat || !currentLng) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Find the truck
        const truck = await prisma.truck.findUnique({
            where: { id: truckId },
            include: { owner: true, sourceHub: true },
        });

        if (!truck) {
            return res.status(404).json({ success: false, message: 'Truck not found' });
        }

        // Find marketplace shipments within geofence (20km) and along route to destination
        const nearbyShipments = await prisma.$queryRaw`
            SELECT id, "shipperId", "pickupLocation", "pickupLat", "pickupLng", 
                   "dropLocation", "dropLat", "dropLng", "cargoType", "cargoWeight", "cargoVolume",
            ( 6371 * acos( cos( radians(${currentLat}) ) * cos( radians( "pickupLat" ) ) 
            * cos( radians( "pickupLng" ) - radians(${currentLng}) ) + sin( radians(${currentLat}) ) 
            * sin( radians( "pickupLat" ) ) ) ) AS distance 
            FROM "Shipment" 
            WHERE "isMarketplaceLoad" = true
            AND status = 'PENDING'
            AND (6371 * acos( cos( radians(${currentLat}) ) * cos( radians( "pickupLat" ) ) 
            * cos( radians( "pickupLng" ) - radians(${currentLng}) ) + sin( radians(${currentLat}) ) 
            * sin( radians( "pickupLat" ) ) )) < 20
            ORDER BY distance
            LIMIT 5;
        `;

        if (nearbyShipments.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No backhaul opportunities found',
                data: [],
            });
        }

        // Create BackhaulPickup records and notify dispatcher
        const backhaulRecords = [];
        for (const shipment of nearbyShipments) {
            // Get shipper info
            const shipper = await prisma.user.findUnique({
                where: { id: shipment.shipperId },
            });

            // Calculate carbon saved (rough estimate: 0.1 kg CO2 per km saved)
            const carbonSaved = shipment.distance * 0.1;

            // Create backhaul pickup record
            const backhaul = await prisma.backhaulPickup.create({
                data: {
                    truckId: truck.id,
                    driverId: userId,
                    shipperId: shipment.shipperId,
                    shipperName: shipper?.name || 'Unknown Shipper',
                    shipperPhone: shipper?.phone || '',
                    shipperLocation: shipment.pickupLocation || 'Unknown',
                    shipperLat: shipment.pickupLat,
                    shipperLng: shipment.pickupLng,
                    destinationHubId: truck.sourceHubId || truck.sourceHub?.id,
                    packageCount: 1,
                    totalWeight: shipment.cargoWeight || 0,
                    totalVolume: shipment.cargoVolume || 0,
                    distanceKm: shipment.distance,
                    carbonSavedKg: carbonSaved,
                    status: 'PROPOSED',
                },
            });
            backhaulRecords.push(backhaul);
        }

        // Notify dispatcher about new backhaul opportunities
        io.emit('BACKHAUL_OPPORTUNITIES_FOUND', {
            truckId: truck.id,
            driverName: truck.owner.name,
            licensePlate: truck.licensePlate,
            opportunityCount: backhaulRecords.length,
            opportunities: backhaulRecords,
            timestamp: new Date().toISOString(),
        });

        // Also notify the driver
        io.to(`driver_${userId}`).emit('BACKHAUL_AVAILABLE', {
            message: `${backhaulRecords.length} backhaul opportunities found!`,
            opportunities: backhaulRecords,
        });

        res.status(200).json({
            success: true,
            message: `Found ${backhaulRecords.length} backhaul opportunities`,
            data: backhaulRecords,
        });
    } catch (error) {
        console.error('Check opportunities error:', error);
        res.status(500).json({ success: false, message: 'Failed to check opportunities' });
    }
};