const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Calculate wellness score for a driver
function calculateWellnessScore(driver) {
    const hoursToday = driver.hoursToday || 0;
    const hoursSinceRest = driver.hoursSinceRest || 24;
    const isIll = driver.isIll || false;
    const totalHours7d = driver.totalHours7d || 0;

    const fatigueFactor = Math.min(hoursToday / 12, 1.0) * 30;
    const restFactor = Math.max(0, (1 - Math.min(hoursSinceRest / 10, 1.0))) * 25;
    const illnessFactor = isIll ? 30 : 0;
    const overworkFactor = Math.min(totalHours7d / 70, 1.0) * 15;
    const rawScore = 100 - fatigueFactor - restFactor - illnessFactor - overworkFactor;
    return Math.max(0, Math.min(100, Math.round(rawScore)));
}

// ====== COGNITIVE LOAD INDEX (CLI) ======
// 6-factor composite score grounded in cognitive psychology research.
// Higher CLI = MORE cognitive load = driver needs lighter routes.
function calculateCognitiveLoad(driver) {
    // 1. Fatigue Load — hours driven → reaction time degrades
    //    Dawson & Reid (2000): 17h awake ≈ 0.05% BAC
    const fatigue = Math.min((driver.hoursToday || 0) / 14, 1.0) * 100;

    // 2. Decision Fatigue — delivery stops deplete willpower
    //    Baumeister (1998): each decision drains self-regulation capacity
    const stopsToday = driver.stopsToday || 0;
    const decisionFatigue = Math.min(stopsToday / 20, 1.0) * 100;

    // 3. Circadian Penalty — time-of-day alertness curve
    //    Monk (2005): alertness dips at 2–4 AM and 1–3 PM (post-lunch dip)
    const hour = new Date().getHours();
    const circadian = (hour >= 2 && hour <= 4) ? 90
        : (hour >= 13 && hour <= 15) ? 50
        : (hour >= 22 || hour <= 5) ? 70
        : 10;

    // 4. Monotony Index — same route repetition → vigilance decrement
    //    Mackworth (1948): sustained attention drops after 30 min of repetition
    const routeRepeatCount = driver.routeRepeatCount || 0;
    const monotony = Math.min(routeRepeatCount / 5, 1.0) * 100;

    // 5. Route Complexity Stress — urban turns, traffic density
    //    Yerkes-Dodson (1908): optimal arousal curve; high stress = errors
    const complexity = driver.lastRouteComplexity || 'MEDIUM';
    const complexityScore = complexity === 'HIGH' ? 80
        : complexity === 'MEDIUM' ? 40 : 15;

    // 6. Recovery Deficit — sleep debt accumulation over 7 days
    //    Van Dongen (2003): sleep debt accumulates linearly
    const avgRestPerDay = (driver.totalRestHours7d || 56) / 7;
    const recoveryDeficit = Math.max(0, (8 - avgRestPerDay) / 8) * 100;

    // Weighted composite (weights from cognitive science literature)
    const CLI = Math.round(
        fatigue * 0.25 +
        decisionFatigue * 0.20 +
        circadian * 0.15 +
        monotony * 0.10 +
        complexityScore * 0.15 +
        recoveryDeficit * 0.15
    );

    // Cognitive state classification
    const clampedCLI = Math.min(100, Math.max(0, CLI));
    const state = clampedCLI <= 30 ? 'SHARP'
        : clampedCLI <= 55 ? 'ALERT'
        : clampedCLI <= 75 ? 'STRAINED'
        : 'OVERLOADED';

    return {
        cognitiveLoadIndex: clampedCLI,
        cognitiveState: state,
        factors: {
            fatigue: Math.round(fatigue),
            decisionFatigue: Math.round(decisionFatigue),
            circadian: Math.round(circadian),
            monotony: Math.round(monotony),
            complexityStress: Math.round(complexityScore),
            recoveryDeficit: Math.round(recoveryDeficit),
        },
        maxSafeComplexity: clampedCLI <= 30 ? 'ANY'
            : clampedCLI <= 55 ? 'HIGH'
            : clampedCLI <= 75 ? 'MEDIUM'
            : 'EASY_ONLY',
        recommendation: clampedCLI > 75 ? '⛔ Rest recommended — cognitive overload detected'
            : clampedCLI > 55 ? '⚠️ Assign simple routes only — brain strain detected'
            : clampedCLI > 30 ? '✅ Moderately alert — normal operations'
            : '🧠 Peak cognitive readiness — ready for complex routes',
    };
}

// Get all drivers with wellness data
exports.getDriversWithWellness = async (req, res) => {
    try {
        const drivers = await prisma.user.findMany({
            where: { role: "DRIVER" },
            select: {
                id: true, name: true, phone: true, status: true,
                vehicleType: true, totalDistanceKm: true, rating: true,
                hoursToday: true, hoursSinceRest: true, isIll: true,
                totalHours7d: true, wellnessScore: true, maxDifficulty: true,
                gender: true, credits: true, totalCreditsEarned: true,
                homeBaseCity: true, totalEarnings: true, weeklyEarnings: true,
            },
        });

        const enriched = drivers.map(d => {
            const wrs = calculateWellnessScore(d);
            const cli = calculateCognitiveLoad(d);
            return {
                ...d,
                wellnessScore: wrs,
                maxDifficulty: wrs < 40 ? 'EASY' : wrs < 70 ? 'MEDIUM' : 'ANY',
                wellnessStatus: wrs < 40 ? 'FATIGUED' : wrs < 70 ? 'MODERATE' : 'FIT',
                nightSafetyRequired: d.gender === 'F',
                ...cli,
            };
        });

        res.json({ drivers: enriched, count: enriched.length });
    } catch (error) {
        console.error("Error fetching wellness data:", error);
        res.status(500).json({ error: error.message });
    }
};

// Update driver wellness status
exports.updateWellness = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { hoursToday, hoursSinceRest, isIll, totalHours7d } = req.body;
        
        const updateData = {};
        if (hoursToday !== undefined) updateData.hoursToday = hoursToday;
        if (hoursSinceRest !== undefined) updateData.hoursSinceRest = hoursSinceRest;
        if (isIll !== undefined) updateData.isIll = isIll;
        if (totalHours7d !== undefined) updateData.totalHours7d = totalHours7d;

        const driver = await prisma.user.update({
            where: { id: driverId },
            data: updateData,
        });

        const wrs = calculateWellnessScore(driver);
        await prisma.user.update({
            where: { id: driverId },
            data: {
                wellnessScore: wrs,
                maxDifficulty: wrs < 40 ? 'EASY' : wrs < 70 ? 'MEDIUM' : 'ANY',
            },
        });

        res.json({
            driverId,
            wellnessScore: wrs,
            maxDifficulty: wrs < 40 ? 'EASY' : wrs < 70 ? 'MEDIUM' : 'ANY',
            wellnessStatus: wrs < 40 ? 'FATIGUED' : wrs < 70 ? 'MODERATE' : 'FIT',
        });
    } catch (error) {
        console.error("Error updating wellness:", error);
        res.status(500).json({ error: error.message });
    }
};

// ====== Credit Economy ======
exports.getDriverCredits = async (req, res) => {
    try {
        const { driverId } = req.params;
        const driver = await prisma.user.findUnique({
            where: { id: driverId },
            select: { id: true, name: true, credits: true, totalCreditsEarned: true },
        });
        
        if (!driver) return res.status(404).json({ error: "Driver not found" });
        res.json(driver);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addCredits = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { amount, reason } = req.body;

        const driver = await prisma.user.update({
            where: { id: driverId },
            data: {
                credits: { increment: amount },
                totalCreditsEarned: { increment: Math.max(0, amount) },
            },
        });

        // Log the credit transaction
        await prisma.transaction.create({
            data: {
                driverId,
                amount,
                type: amount > 0 ? 'BONUS' : 'PENALTY',
                description: reason || `Credit ${amount > 0 ? 'earned' : 'spent'}: ${Math.abs(amount)} credits`,
            },
        });

        res.json({
            driverId,
            credits: driver.credits,
            totalCreditsEarned: driver.totalCreditsEarned,
            change: amount,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get wellness summary for fleet
exports.getFleetWellnessSummary = async (req, res) => {
    try {
        const drivers = await prisma.user.findMany({
            where: { role: "DRIVER" },
            select: {
                hoursToday: true, hoursSinceRest: true, isIll: true,
                totalHours7d: true, gender: true, status: true,
            },
        });

        const scores = drivers.map(d => calculateWellnessScore(d));
        const fitCount = scores.filter(s => s >= 70).length;
        const moderateCount = scores.filter(s => s >= 40 && s < 70).length;
        const fatiguedCount = scores.filter(s => s < 40).length;
        const femaleDrivers = drivers.filter(d => d.gender === 'F').length;
        const illDrivers = drivers.filter(d => d.isIll).length;

        res.json({
            totalDrivers: drivers.length,
            fit: fitCount,
            moderate: moderateCount,
            fatigued: fatiguedCount,
            averageWellness: Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1)),
            femaleDrivers,
            illDrivers,
            nightSafetyEligible: femaleDrivers,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ====== COGNITIVE LOAD ENDPOINTS ======

// Get cognitive load for a single driver
exports.getDriverCognitive = async (req, res) => {
    try {
        const { driverId } = req.params;
        const driver = await prisma.user.findUnique({
            where: { id: driverId },
            select: {
                id: true, name: true, phone: true,
                hoursToday: true, hoursSinceRest: true, isIll: true,
                totalHours7d: true, vehicleType: true, gender: true,
            },
        });

        if (!driver) return res.status(404).json({ error: "Driver not found" });

        const wellness = calculateWellnessScore(driver);
        const cognitive = calculateCognitiveLoad(driver);

        res.json({
            ...driver,
            wellnessScore: wellness,
            ...cognitive,
        });
    } catch (error) {
        console.error("Error fetching cognitive data:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get fleet-wide cognitive summary
exports.getFleetCognitiveSummary = async (req, res) => {
    try {
        const drivers = await prisma.user.findMany({
            where: { role: "DRIVER" },
            select: {
                hoursToday: true, hoursSinceRest: true, isIll: true,
                totalHours7d: true, gender: true, status: true, name: true,
            },
        });

        const results = drivers.map(d => {
            const cli = calculateCognitiveLoad(d);
            return { name: d.name, ...cli };
        });

        const scores = results.map(r => r.cognitiveLoadIndex);
        const sharpCount = results.filter(r => r.cognitiveState === 'SHARP').length;
        const alertCount = results.filter(r => r.cognitiveState === 'ALERT').length;
        const strainedCount = results.filter(r => r.cognitiveState === 'STRAINED').length;
        const overloadedCount = results.filter(r => r.cognitiveState === 'OVERLOADED').length;

        res.json({
            totalDrivers: drivers.length,
            averageCLI: Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1)),
            sharp: sharpCount,
            alert: alertCount,
            strained: strainedCount,
            overloaded: overloadedCount,
            drivers: results,
        });
    } catch (error) {
        console.error("Error fetching fleet cognitive summary:", error);
        res.status(500).json({ error: error.message });
    }
};
