const prisma = require('../config/database');
const EWayBillService = require('../services/ewayBill.service');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique 12-digit numeric e-Way Bill number
 */
const generateBillNo = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

/**
 * Calculate validity days based on distance (1 day per 100km per government rules for regular cargo)
 */
const calculateValidity = (distanceKm) => {
    const days = Math.max(1, Math.ceil(distanceKm / 100)); // Refined rule: 100km per day
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);
    return validUntil;
};

/**
 * Resolve GSTIN for Recipient by traversing Delivery -> Shipment -> Customer
 */
const resolveRecipientGstin = async (delivery, tx) => {
    if (delivery.shipment && delivery.shipment.recipient && delivery.shipment.recipient.gstin) {
        return delivery.shipment.recipient.gstin;
    }
    // Fallback or detailed lookup
    const fullDelivery = await tx.delivery.findUnique({
        where: { id: delivery.id },
        include: {
            shipment: {
                include: {
                    recipient: true
                }
            }
        }
    });
    return fullDelivery?.shipment?.recipient?.gstin || '27BBBBB0000B1Z5';
};

/**
 * POST /api/eway-bill/absorption
 * Refined Handover Logic with strict identification
 */
const handleAbsorption = async (req, res) => {
    const {
        exporterPhone,
        importerPhone,
        exporterTruckPlate,
        importerTruckPlate,
        exchangedGoods
    } = req.body;

    const dispatcherId = req.user?.id; // From JWT middleware

    try {
        // 1. Resolve & Update Data using Prisma Transaction
        const transactionResult = await prisma.$transaction(async (tx) => {
            // Find Dispatcher and their Company
            const dispatcher = await tx.user.findUnique({
                where: { id: dispatcherId || 'mock-dispatcher-id' }, // Handle missing for testing
                include: { courierCompany: true }
            });

            // Find Drivers by Phone
            const exporterDriver = await tx.user.findUnique({
                where: { phone: exporterPhone },
                include: { courierCompany: true }
            });

            const importerDriver = await tx.user.findUnique({
                where: { phone: importerPhone },
                include: { courierCompany: true }
            });

            if (!exporterDriver || !importerDriver) {
                throw new Error('One or both drivers not found by phone number');
            }

            // Find Trucks by License Plate
            const truckA = await tx.truck.findUnique({
                where: { licensePlate: exporterTruckPlate }
            });
            const truckB = await tx.truck.findUnique({
                where: { licensePlate: importerTruckPlate }
            });

            if (!truckA || !truckB) {
                throw new Error('One or both trucks not found by license plate');
            }

            // Fetch Exporter's Deliveries to separate remaining from transferred
            const exporterDeliveries = await tx.delivery.findMany({
                where: {
                    driverId: exporterDriver.id,
                    status: { not: 'COMPLETED' }
                },
                include: {
                    shipment: {
                        include: { recipient: true }
                    }
                }
            });

            const transferredDeliveries = exporterDeliveries.filter(d => exchangedGoods.includes(d.id));
            const remainingDeliveries = exporterDeliveries.filter(d => !exchangedGoods.includes(d.id));

            if (transferredDeliveries.length === 0) {
                throw new Error('No valid deliveries found to transfer');
            }

            // Update Deliveries: Transfer to Truck B / Importer
            await tx.delivery.updateMany({
                where: { id: { in: exchangedGoods } },
                data: {
                    driverId: importerDriver.id,
                    truckId: truckB.id,
                    status: 'ABSORPTION_TRANSFERRED'
                }
            });

            // Resolve GSTINs
            const supplierGstin = dispatcher?.courierCompany?.gstin || exporterDriver.courierCompany?.gstin || '27AAAAA0000A1Z5';

            // Shared Validity/Date Info
            const now = new Date();
            const genDateStr = now.toLocaleString();
            const docDateStr = now.toLocaleDateString();

            // --- Generate Bill A Data (Exporter - Remaining) ---
            const billANo = generateBillNo();
            const totalDistA = remainingDeliveries.reduce((sum, d) => sum + (d.distanceKm || 0), 0);
            const validUntilA = calculateValidity(totalDistA);
            const recipientGstinA = remainingDeliveries.length > 0 ? await resolveRecipientGstin(remainingDeliveries[0], tx) : '27BBBBB0000B1Z5';

            const qrDataA = await EWayBillService.generateQRCode({
                billNo: billANo,
                driverName: exporterDriver.name,
                vehicleNo: truckA.licensePlate
            });

            const billAData = {
                billNo: billANo,
                generatedDate: genDateStr,
                generatedBy: exporterDriver.name,
                validFrom: genDateStr,
                validUntil: validUntilA.toLocaleString(),
                qrCode: qrDataA,
                supplierGstin,
                dispatchPlace: exporterDriver.homeBaseCity || 'Origin Hub',
                recipientGstin: recipientGstinA,
                deliveryPlace: remainingDeliveries[0]?.dropLocation || 'Transit Point',
                docNo: `E-ABS-${uuidv4().substring(0, 8).toUpperCase()}`,
                docDate: docDateStr,
                transactionType: 'Absorption - Remaining',
                vehicleNo: truckA.licensePlate,
                fromLocation: exporterDriver.homeBaseCity || 'Current Location',
                goods: remainingDeliveries.map(d => ({
                    hsnCode: '8708',
                    productName: d.cargoType,
                    quantity: d.packageCount,
                    unit: 'NOS',
                    value: d.baseEarnings.toFixed(2)
                }))
            };

            // --- Generate Bill B Data (Importer - Original + Absorbed) ---
            const importerExistingDeliveries = await tx.delivery.findMany({
                where: {
                    driverId: importerDriver.id,
                    status: { not: 'COMPLETED' }
                },
                include: {
                    shipment: {
                        include: { recipient: true }
                    }
                }
            });

            const combinedDeliveriesB = [...importerExistingDeliveries, ...transferredDeliveries];
            const billBNo = generateBillNo();
            const totalDistB = combinedDeliveriesB.reduce((sum, d) => sum + (d.distanceKm || 0), 0);
            const validUntilB = calculateValidity(totalDistB);
            const recipientGstinB = combinedDeliveriesB.length > 0 ? await resolveRecipientGstin(combinedDeliveriesB[0], tx) : '27CCCCC0000C1Z5';

            const qrDataB = await EWayBillService.generateQRCode({
                billNo: billBNo,
                driverName: importerDriver.name,
                vehicleNo: truckB.licensePlate
            });

            const billBData = {
                billNo: billBNo,
                generatedDate: genDateStr,
                generatedBy: importerDriver.name,
                validFrom: genDateStr,
                validUntil: validUntilB.toLocaleString(),
                qrCode: qrDataB,
                supplierGstin,
                dispatchPlace: importerDriver.homeBaseCity || 'Transit Hub',
                recipientGstin: recipientGstinB,
                deliveryPlace: combinedDeliveriesB[0]?.dropLocation || 'Final Hub',
                docNo: `I-ABS-${uuidv4().substring(0, 8).toUpperCase()}`,
                docDate: docDateStr,
                transactionType: 'Absorption - Combined',
                vehicleNo: truckB.licensePlate,
                fromLocation: importerDriver.homeBaseCity || 'Handover Point',
                goods: combinedDeliveriesB.map(d => ({
                    hsnCode: '8708',
                    productName: d.cargoType,
                    quantity: d.packageCount,
                    unit: 'NOS',
                    value: d.baseEarnings.toFixed(2)
                }))
            };

            // Create EWayBill records in DB
            await tx.eWayBill.createMany({
                data: [
                    {
                        billNo: billANo,
                        vehicleNo: truckA.licensePlate,
                        from: billAData.fromLocation,
                        to: billAData.deliveryPlace,
                        distance: totalDistA.toString(),
                        driverId: exporterDriver.id,
                        cargoValue: remainingDeliveries.reduce((sum, d) => sum + d.baseEarnings, 0).toString(),
                        validUntil: validUntilA,
                        status: 'ACTIVE'
                    },
                    {
                        billNo: billBNo,
                        vehicleNo: truckB.licensePlate,
                        from: billBData.fromLocation,
                        to: billBData.deliveryPlace,
                        distance: totalDistB.toString(),
                        driverId: importerDriver.id,
                        cargoValue: combinedDeliveriesB.reduce((sum, d) => sum + d.baseEarnings, 0).toString(),
                        validUntil: validUntilB,
                        status: 'ACTIVE'
                    }
                ]
            });

            // Update existing AbsorptionTransfer record if it exists
            await tx.absorptionTransfer.updateMany({
                where: {
                    exporterDriverId: exporterDriver.id,
                    importerDriverId: importerDriver.id,
                    status: 'PENDING'
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: now
                }
            });

            return { billAData, billBData };
        });

        // 2. Render PDFs (Outside transaction for performance)
        console.log('Generating PDFs for:', {
            billA: transactionResult.billAData.billNo,
            billB: transactionResult.billBData.billNo
        });

        const [pdfA, pdfB] = await Promise.all([
            EWayBillService.generatePDF(transactionResult.billAData),
            EWayBillService.generatePDF(transactionResult.billBData)
        ]);

        console.log('PDF Generation complete. Result types:', {
            pdfA: typeof pdfA,
            pdfB: typeof pdfB,
            isBufferA: Buffer.isBuffer(pdfA),
            isBufferB: Buffer.isBuffer(pdfB)
        });

        if (!pdfA || !pdfB) {
            throw new Error(`PDF generation returned empty: pdfA=${!!pdfA}, pdfB=${!!pdfB}`);
        }

        // 3. Zip and stream
        const zipBuffer = await EWayBillService.createZip([
            { name: `Truck_A_EWayBill_${transactionResult.billAData.billNo}.pdf`, buffer: pdfA },
            { name: `Truck_B_EWayBill_${transactionResult.billBData.billNo}.pdf`, buffer: pdfB }
        ]);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=ewaybills_absorption.zip');
        res.status(200).send(zipBuffer);

    } catch (error) {
        console.error('Absorption Handover Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

module.exports = {
    handleAbsorption
};
