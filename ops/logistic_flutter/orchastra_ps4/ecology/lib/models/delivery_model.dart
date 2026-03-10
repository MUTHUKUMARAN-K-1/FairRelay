/// Delivery model matching Prisma Delivery schema
class Delivery {
  final String id;
  final String dispatcherId;
  final String? driverId;
  final String? truckId;
  final String? shipmentId;

  // Pickup info
  final String pickupLocation;
  final double pickupLat;
  final double pickupLng;
  final DateTime? pickupTime;

  // Drop info
  final String dropLocation;
  final double dropLat;
  final double dropLng;
  final DateTime? dropTime;
  final DateTime? estimatedETA;

  // Cargo info
  final String cargoType;
  final double cargoWeight;
  final double cargoVolumeLtrs;
  final double? distanceKm;
  final String packageId;
  final int packageCount;
  final String? postalCode;

  // Time windows
  final DateTime? timeWindowStart;
  final DateTime? timeWindowEnd;

  // Route info
  final String? optimizedRouteId;
  final double? distanceTraveled;
  final double? carbonEmitted;
  final double? baselineDistance;

  // Earnings
  final double baseEarnings;
  final double marketplaceBonus;
  final double absorptionBonus;
  final double fuelSurcharge;
  final double totalEarnings;

  // Status
  final String status;
  final bool isMarketplaceLoad;

  // Timestamps
  final DateTime createdAt;
  final DateTime? completedAt;

  Delivery({
    required this.id,
    required this.dispatcherId,
    this.driverId,
    this.truckId,
    this.shipmentId,
    required this.pickupLocation,
    required this.pickupLat,
    required this.pickupLng,
    this.pickupTime,
    required this.dropLocation,
    required this.dropLat,
    required this.dropLng,
    this.dropTime,
    this.estimatedETA,
    required this.cargoType,
    required this.cargoWeight,
    required this.cargoVolumeLtrs,
    this.distanceKm,
    required this.packageId,
    this.packageCount = 1,
    this.postalCode,
    this.timeWindowStart,
    this.timeWindowEnd,
    this.optimizedRouteId,
    this.distanceTraveled,
    this.carbonEmitted,
    this.baselineDistance,
    this.baseEarnings = 0.0,
    this.marketplaceBonus = 0.0,
    this.absorptionBonus = 0.0,
    this.fuelSurcharge = 0.0,
    this.totalEarnings = 0.0,
    required this.status,
    this.isMarketplaceLoad = false,
    required this.createdAt,
    this.completedAt,
  });

  factory Delivery.fromJson(Map<String, dynamic> json) {
    return Delivery(
      id: json['id'] ?? '',
      dispatcherId: json['dispatcherId'] ?? '',
      driverId: json['driverId'],
      truckId: json['truckId'],
      shipmentId: json['shipmentId'],
      pickupLocation: json['pickupLocation'] ?? '',
      pickupLat: (json['pickupLat'] ?? 0).toDouble(),
      pickupLng: (json['pickupLng'] ?? 0).toDouble(),
      pickupTime: json['pickupTime'] != null
          ? DateTime.parse(json['pickupTime'])
          : null,
      dropLocation: json['dropLocation'] ?? '',
      dropLat: (json['dropLat'] ?? 0).toDouble(),
      dropLng: (json['dropLng'] ?? 0).toDouble(),
      dropTime: json['dropTime'] != null
          ? DateTime.parse(json['dropTime'])
          : null,
      estimatedETA: json['estimatedETA'] != null
          ? DateTime.parse(json['estimatedETA'])
          : null,
      cargoType: json['cargoType'] ?? '',
      cargoWeight: (json['cargoWeight'] ?? 0).toDouble(),
      cargoVolumeLtrs: (json['cargoVolumeLtrs'] ?? 0).toDouble(),
      distanceKm: json['distanceKm']?.toDouble(),
      packageId: json['packageId'] ?? '',
      packageCount: json['packageCount'] ?? 1,
      postalCode: json['postalCode'],
      timeWindowStart: json['timeWindowStart'] != null
          ? DateTime.parse(json['timeWindowStart'])
          : null,
      timeWindowEnd: json['timeWindowEnd'] != null
          ? DateTime.parse(json['timeWindowEnd'])
          : null,
      optimizedRouteId: json['optimizedRouteId'],
      distanceTraveled: json['distanceTraveled']?.toDouble(),
      carbonEmitted: json['carbonEmitted']?.toDouble(),
      baselineDistance: json['baselineDistance']?.toDouble(),
      baseEarnings: (json['baseEarnings'] ?? 0).toDouble(),
      marketplaceBonus: (json['marketplaceBonus'] ?? 0).toDouble(),
      absorptionBonus: (json['absorptionBonus'] ?? 0).toDouble(),
      fuelSurcharge: (json['fuelSurcharge'] ?? 0).toDouble(),
      totalEarnings: (json['totalEarnings'] ?? 0).toDouble(),
      status: json['status'] ?? 'PENDING',
      isMarketplaceLoad: json['isMarketplaceLoad'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'dispatcherId': dispatcherId,
      'driverId': driverId,
      'truckId': truckId,
      'shipmentId': shipmentId,
      'pickupLocation': pickupLocation,
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'pickupTime': pickupTime?.toIso8601String(),
      'dropLocation': dropLocation,
      'dropLat': dropLat,
      'dropLng': dropLng,
      'dropTime': dropTime?.toIso8601String(),
      'estimatedETA': estimatedETA?.toIso8601String(),
      'cargoType': cargoType,
      'cargoWeight': cargoWeight,
      'cargoVolumeLtrs': cargoVolumeLtrs,
      'distanceKm': distanceKm,
      'packageId': packageId,
      'packageCount': packageCount,
      'postalCode': postalCode,
      'timeWindowStart': timeWindowStart?.toIso8601String(),
      'timeWindowEnd': timeWindowEnd?.toIso8601String(),
      'optimizedRouteId': optimizedRouteId,
      'distanceTraveled': distanceTraveled,
      'carbonEmitted': carbonEmitted,
      'baselineDistance': baselineDistance,
      'baseEarnings': baseEarnings,
      'marketplaceBonus': marketplaceBonus,
      'absorptionBonus': absorptionBonus,
      'fuelSurcharge': fuelSurcharge,
      'totalEarnings': totalEarnings,
      'status': status,
      'isMarketplaceLoad': isMarketplaceLoad,
      'createdAt': createdAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
    };
  }

  // Status helpers
  bool get isPending => status == 'PENDING';
  bool get isAllocated => status == 'ALLOCATED';
  bool get isEnRouteToPickup => status == 'EN_ROUTE_TO_PICKUP';
  bool get isCargoLoaded => status == 'CARGO_LOADED';
  bool get isInTransit => status == 'IN_TRANSIT';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';

  bool get canStart => status == 'ALLOCATED';
  bool get canPickup => status == 'EN_ROUTE_TO_PICKUP';
  bool get canComplete =>
      status == 'IN_TRANSIT' || status == 'EN_ROUTE_TO_DROP';

  String get statusDisplayName {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'ALLOCATED':
        return 'Assigned';
      case 'EN_ROUTE_TO_PICKUP':
        return 'En Route to Pickup';
      case 'CARGO_LOADED':
        return 'Cargo Loaded';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'EN_ROUTE_TO_DROP':
        return 'En Route to Drop';
      case 'AWAITING_CONFIRMATION':
        return 'Awaiting Confirmation';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
