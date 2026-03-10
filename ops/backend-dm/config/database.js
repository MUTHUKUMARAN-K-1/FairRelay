const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: [], // Suppress Prisma's internal logs; we handle errors in our own catch blocks
});

module.exports = prisma;
