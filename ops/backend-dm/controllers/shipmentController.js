const prisma = require('../config/database');
const axios = require('axios');
const Joi = require('joi');
const { AI_SERVICE_URL } = process.env;

/**
 * POST /api/shipments/create - Create shipment (calls XGBoost)
 */
const createShipment = async (req, res) => {
  try {
    // Validation
    const schema = Joi.object({
      pickupLat: Joi.number().required(),
      pickupLng: Joi.number().required(),
      pickupLocation: Joi.string().max(200).required(),
      dropLat: Joi.number().required(),
      dropLng: Joi.number().required(),
      dropLocation: Joi.string().max(200).required(),
      cargoType: Joi.string().valid(
        'Electronics', 'Industrial Machinery', 'Textiles',
        'Automotive Parts', 'FMCG Products', 'Pharmaceuticals',
        'Steel & Metal', 'Agricultural Products', 'Furniture'
      ).required(),
      cargoWeight: Joi.number().min(0.1).max(50).required(),
      specialInstructions: Joi.string().max(500).optional(),
      priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('LOW'),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      pickupLat, pickupLng, pickupLocation,
      dropLat, dropLng, dropLocation,
      cargoType, cargoWeight, specialInstructions, priority
    } = req.body;

    // Calculate distance (Haversine formula)
    const distanceKm = calculateDistance(
      { lat: pickupLat, lng: pickupLng },
      { lat: dropLat, lng: dropLng }
    );

    // Call XGBoost AI Pricing Service
    let aiPriceResponse;
    try {
      aiPriceResponse = await axios.post(`${AI_SERVICE_URL}/pricing/predict`, {
        distance_km: distanceKm,
        cargo_weight_tonnes: cargoWeight,
        cargo_type: cargoType,
        pickup_city: extractCity(pickupLocation),
        drop_city: extractCity(dropLocation),
        time_of_day: new Date().getHours() < 18 ? 'day' : 'night',
        day_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()],
        fuel_price: 98.5,
        traffic_level: 'medium',
        urgency: priority.toLowerCase(),
      }, { timeout: 5000 });
    } catch (aiError) {
      console.log('❌ AI service unavailable, using fallback pricing');
      // Fallback pricing formula
      aiPriceResponse = {
        data: {
          predicted_price: Math.round((distanceKm * 18 + cargoWeight * 100) / 10) * 10,
          confidence: 0.75,
          price_breakdown: {
            base_rate: Math.round(distanceKm * 15),
            distance_premium: Math.round(distanceKm * 2),
            weight_premium: Math.round(cargoWeight * 80),
          }
        }
      };
    }

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        shipperId: req.user.id,
        pickupLocation,
        pickupLat,
        pickupLng,
        dropLocation,
        dropLat,
        dropLng,
        cargoType,
        cargoWeight,
        specialInstructions: specialInstructions || null,
        estimatedPrice: aiPriceResponse.data.predicted_price,
        status: 'PENDING',
        priority,
        isMarketplaceLoad: Math.random() > 0.7, // 30% chance
      },
      include: {
        shipper: {
          select: { name: true, phone: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: {
        id: shipment.id,
        status: shipment.status,
        estimatedPrice: shipment.estimatedPrice,
        aiConfidence: aiPriceResponse.data.confidence,
        distanceKm,
        priceBreakdown: aiPriceResponse.data.price_breakdown,
        shipment,
      },
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shipment',
    });
  }
};

/**
 * GET /api/shipments/my-shipments - List shipper's shipments
 */
const getMyShipments = async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      where: { shipperId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        dispatcher: {
          select: { name: true }
        },
        delivery: {
          include: {
            driver: {
              select: { name: true, rating: true, phone: true }
            },
            truck: {
              select: { licensePlate: true, model: true }
            }
          }
        }
      },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: shipments,
      count: shipments.length,
    });
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipments',
    });
  }
};

/**
 * GET /api/shipments/:id - Get single shipment
 */
const getShipment = async (req, res) => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        shipper: {
          select: { name: true, phone: true }
        },
        dispatcher: {
          select: { name: true }
        },
        delivery: {
          include: {
            driver: {
              select: { name: true, rating: true, phone: true }
            },
            truck: {
              select: { licensePlate: true, model: true }
            }
          }
        }
      },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // Only shipper or dispatcher can view
    if (shipment.shipperId !== req.user.id && req.user.role !== 'DISPATCHER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipment',
    });
  }
};

/**
 * PUT /api/shipments/:id/cancel - Cancel pending shipment
 */
const cancelShipment = async (req, res) => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // Only shipper can cancel their own shipment
    if (shipment.shipperId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Only cancel PENDING shipments
    if (!['PENDING', 'AWAITING_DISPATCHER'].includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending shipments can be cancelled',
      });
    }

    await prisma.shipment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.status(200).json({
      success: true,
      message: 'Shipment cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel shipment',
    });
  }
};

/**
 * GET /api/shipments/pending - Get all pending shipments for drivers
 */
const getPendingShipments = async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        shipper: {
          select: { name: true, phone: true }
        }
      },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: shipments,
      count: shipments.length,
    });
  } catch (error) {
    console.error('Get pending shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending shipments',
    });
  }
};

/**
 * POST /api/shipments/:id/accept - Driver accepts a shipment
 */
const acceptShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.id;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    if (shipment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Shipment already assigned',
      });
    }

    // Get driver's truck
    const truck = await prisma.truck.findFirst({
      where: { driverId },
    });

    if (!truck) {
      return res.status(400).json({
        success: false,
        message: 'No truck assigned to driver',
      });
    }

    // Create delivery and update shipment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update shipment status
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: { status: 'ASSIGNED' },
      });

      // Create delivery record
      const delivery = await tx.delivery.create({
        data: {
          driverId,
          truckId: truck.id,
          shipmentId: id,
          pickupLocation: shipment.pickupLocation,
          pickupLat: shipment.pickupLat,
          pickupLng: shipment.pickupLng,
          dropLocation: shipment.dropLocation,
          dropLat: shipment.dropLat,
          dropLng: shipment.dropLng,
          cargoType: shipment.cargoType,
          cargoWeight: shipment.cargoWeight,
          status: 'ALLOCATED',
          estimatedPrice: shipment.estimatedPrice || 0,
        },
      });

      return { shipment: updatedShipment, delivery };
    });

    res.status(200).json({
      success: true,
      message: 'Shipment accepted! Check your deliveries.',
      data: result,
    });
  } catch (error) {
    console.error('Accept shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept shipment',
    });
  }
};

// Helper functions
const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const extractCity = (location) => {
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai'];
  const city = cities.find(city => location.includes(city));
  return city || 'Other';
};

module.exports = {
  createShipment,
  getMyShipments,
  getShipment,
  cancelShipment,
  getPendingShipments,
  acceptShipment,
};