const prisma = require('../config/database');

/**
 * GET /api/transactions/my-transactions - Earnings history
 */
const getMyTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                driverId: req.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                delivery: {
                    select: {
                        pickupLocation: true,
                        dropLocation: true,
                        cargoType: true,
                        completedAt: true,
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
        });
    }
};

/**
 * GET /api/transactions/weekly-summary - Weekly earnings + km driven
 */
const getWeeklySummary = async (req, res) => {
    try {
        // Get current driver performance data from User model
        const driver = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                weeklyEarnings: true,
                weeklyKmDriven: true,
                totalEarnings: true,
                totalDistanceKm: true,
                weekResetDate: true,
            }
        });

        // We can also aggregate from transactions for the last 7 days for more detail
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyTransactions = await prisma.transaction.findMany({
            where: {
                driverId: req.user.id,
                createdAt: {
                    gte: sevenDaysAgo,
                }
            },
            orderBy: {
                createdAt: 'asc',
            }
        });

        // Group by day for a chart-friendly format
        const dailyEarnings = {};
        weeklyTransactions.forEach(t => {
            const date = t.createdAt.toISOString().split('T')[0];
            dailyEarnings[date] = (dailyEarnings[date] || 0) + t.amount;
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    earnings: driver.weeklyEarnings,
                    distance: driver.weeklyKmDriven,
                    totalEarnings: driver.totalEarnings,
                    totalDistance: driver.totalDistanceKm,
                    resetDate: driver.weekResetDate,
                },
                dailyBreakdown: dailyEarnings,
            }
        });
    } catch (error) {
        console.error('Get weekly summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weekly summary',
        });
    }
};

/**
 * GET /api/transactions/:id - Single transaction details
 */
const getTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                delivery: true,
            }
        });

        if (!transaction || transaction.driverId !== req.user.id) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }

        res.status(200).json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction details',
        });
    }
};

module.exports = {
    getMyTransactions,
    getWeeklySummary,
    getTransaction,
};
