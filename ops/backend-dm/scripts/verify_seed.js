const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const deliveries = await prisma.delivery.count();
    const users = await prisma.user.count();
    const trucks = await prisma.truck.count();
    const hubs = await prisma.virtualHub.count();
    console.log({ deliveries, users, trucks, hubs });
    await prisma.$disconnect();
}

check();
