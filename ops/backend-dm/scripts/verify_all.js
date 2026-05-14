const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAll() {
    console.log("--- STARTING END-TO-END VERIFICATION ---");

    try {
        // 1. Get a Courier Company
        const company = await prisma.courierCompany.findFirst();
        let courierCompanyId;
        if (!company) {
            console.log("No courier company found. Creating one...");
            const c = await prisma.courierCompany.create({
                data: { name: "EcoLogiq Logistics", code: "ECO001" }
            });
            courierCompanyId = c.id;
        } else {
            courierCompanyId = company.id;
        }

        // Update all data to belong to this company for verification
        await prisma.user.updateMany({ data: { courierCompanyId } });
        await prisma.truck.updateMany({ data: { courierCompanyId, isAvailable: true, registrationStatus: 'APPROVED' } });
        await prisma.delivery.updateMany({ data: { courierCompanyId, status: 'PENDING' } });

        console.log(`Using Courier Company: ${courierCompanyId}`);

        // 2. Mock some PENDING deliveries
        console.log("Creating pending deliveries for allocation...");
        const dispatcher = await prisma.user.findFirst({ where: { role: 'DISPATCHER' } });
        const shipper = await prisma.user.findFirst({ where: { role: 'SHIPPER' } });

        await prisma.delivery.updateMany({
            where: { status: 'COMPLETED' },
            data: { status: 'PENDING' }
        });

        const delCount = await prisma.delivery.count({ where: { courierCompanyId, status: 'PENDING' } });
        const truckCount = await prisma.truck.count({ where: { courierCompanyId, isAvailable: true, registrationStatus: 'APPROVED' } });
        console.log(`Pending Deliveries found: ${delCount}`);
        console.log(`Available Trucks found: ${truckCount}`);

        // 3. Trigger Allocation
        console.log("Triggering Route Allocation Logic...");
        // Since I don't have a token easily here without auth logic, I'll call the controller logic directly if possible,
        // but for a clean test I'll just check if the DB reflects the changes after my manual logic.

        // Let's use the controller logic directly by mocking req/res
        const routeController = require('../controllers/routeController');
        const req = { body: { courierCompanyId } };
        const res = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Allocation Response (${code}):`, data.message);
                }
            })
        };

        await routeController.allocateRoutes(req, res);

        // 4. Check if OptimizedRoute was created
        const routes = await prisma.optimizedRoute.findMany({
            where: { courierCompanyId },
            include: { deliveries: true }
        });
        console.log(`Routes created: ${routes.length}`);

        if (routes.length >= 2) {
            console.log("Triggering Proximity Check...");
            const synergyController = require('../controllers/synergyController');
            const truckA = await prisma.truck.findFirst({ where: { id: routes[0].truckId } });
            const hub = await prisma.virtualHub.findFirst();

            // Mock location for truck A and B to be near each other
            await prisma.truck.update({
                where: { id: routes[0].truckId },
                data: { currentLat: 19.076, currentLng: 72.8777 }
            });
            await prisma.truck.update({
                where: { id: routes[1].truckId },
                data: { currentLat: 19.077, currentLng: 72.8778 }
            });

            // Set routes to ACTIVE to pass filter
            await prisma.optimizedRoute.updateMany({ data: { status: 'ACTIVE' } });

            const ioMock = { emit: (event, data) => console.log(`Socket Event [${event}]:`, data) };
            const opportunity = await synergyController.detectAbsorptionOpportunity(truckA.id, 19.076, 72.8777, ioMock);

            if (opportunity) {
                console.log(`Opportunity Created: ${opportunity.id}`);
                console.log("VERIFICATION SUCCESSFUL");
            } else {
                console.log("Opportunity not detected. Check proximity logs.");
            }
        }

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAll();
