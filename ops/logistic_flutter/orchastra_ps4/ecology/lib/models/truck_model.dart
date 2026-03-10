/// Truck model matching Prisma Truck schema
class Truck {
  final String id;
  final String licensePlate;
  final String? model;
  final String? type;
  final double? capacity;
  final double? fuelLevel;
  final double? mileage;
  final double? nextService;

  final String ownerId;
  final String? courierCompanyId;
  final String? gstin;

  // Location
  final double? currentLat;
  final double? currentLng;

  // Capacity
  final double maxWeight;
  final double maxVolume;
  final double currentWeight;
  final double currentVolume;

  // Fuel & emissions
  final String? fuelType;
  final double? co2PerKm;
  final double? fuelConsumption;

  final bool isAvailable;
  final String registrationStatus;
  final String? sourceHubId;

  final DateTime createdAt;
  final DateTime updatedAt;

  Truck({
    required this.id,
    required this.licensePlate,
    this.model,
    this.type,
    this.capacity,
    this.fuelLevel,
    this.mileage,
    this.nextService,
    required this.ownerId,
    this.courierCompanyId,
    this.gstin,
    this.currentLat,
    this.currentLng,
    required this.maxWeight,
    required this.maxVolume,
    this.currentWeight = 0.0,
    this.currentVolume = 0.0,
    this.fuelType,
    this.co2PerKm,
    this.fuelConsumption,
    this.isAvailable = true,
    this.registrationStatus = 'PENDING',
    this.sourceHubId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Truck.fromJson(Map<String, dynamic> json) {
    return Truck(
      id: json['id'] ?? '',
      licensePlate: json['licensePlate'] ?? '',
      model: json['model'],
      type: json['type'],
      capacity: json['capacity']?.toDouble(),
      fuelLevel: json['fuelLevel']?.toDouble(),
      mileage: json['mileage']?.toDouble(),
      nextService: json['nextService']?.toDouble(),
      ownerId: json['ownerId'] ?? '',
      courierCompanyId: json['courierCompanyId'],
      gstin: json['gstin'],
      currentLat: json['currentLat']?.toDouble(),
      currentLng: json['currentLng']?.toDouble(),
      maxWeight: (json['maxWeight'] ?? 0).toDouble(),
      maxVolume: (json['maxVolume'] ?? 0).toDouble(),
      currentWeight: (json['currentWeight'] ?? 0).toDouble(),
      currentVolume: (json['currentVolume'] ?? 0).toDouble(),
      fuelType: json['fuelType'],
      co2PerKm: json['co2PerKm']?.toDouble(),
      fuelConsumption: json['fuelConsumption']?.toDouble(),
      isAvailable: json['isAvailable'] ?? true,
      registrationStatus: json['registrationStatus'] ?? 'PENDING',
      sourceHubId: json['sourceHubId'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'licensePlate': licensePlate,
      'model': model,
      'type': type,
      'capacity': capacity,
      'fuelLevel': fuelLevel,
      'mileage': mileage,
      'nextService': nextService,
      'ownerId': ownerId,
      'courierCompanyId': courierCompanyId,
      'gstin': gstin,
      'currentLat': currentLat,
      'currentLng': currentLng,
      'maxWeight': maxWeight,
      'maxVolume': maxVolume,
      'currentWeight': currentWeight,
      'currentVolume': currentVolume,
      'fuelType': fuelType,
      'co2PerKm': co2PerKm,
      'fuelConsumption': fuelConsumption,
      'isAvailable': isAvailable,
      'registrationStatus': registrationStatus,
      'sourceHubId': sourceHubId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // Capacity helpers
  double get availableWeight => maxWeight - currentWeight;
  double get availableVolume => maxVolume - currentVolume;
  double get weightUtilization =>
      maxWeight > 0 ? (currentWeight / maxWeight) * 100 : 0;
  double get volumeUtilization =>
      maxVolume > 0 ? (currentVolume / maxVolume) * 100 : 0;

  bool get hasLocation => currentLat != null && currentLng != null;
  bool get isEmpty => currentWeight == 0 && currentVolume == 0;
  bool get isApproved => registrationStatus == 'APPROVED';
}
