/// Shipment Model for EcoLogiq
class Shipment {
  final String id;
  final String shipperId;
  final String pickupLocation;
  final double pickupLat;
  final double pickupLng;
  final String dropLocation;
  final double dropLat;
  final double dropLng;
  final String cargoType;
  final double cargoWeight;
  final double? cargoVolume;
  final String? description;
  final String status;
  final bool isMarketplaceLoad;
  final DateTime createdAt;
  final DateTime? pickupTime;
  final DateTime? deliveryTime;

  // Driver & Truck details (from nested delivery)
  final String? driverName;
  final String? driverPhone;
  final double? driverRating;
  final String? truckLicensePlate;
  final String? truckModel;
  final double? driverLat;
  final double? driverLng;

  Shipment({
    required this.id,
    required this.shipperId,
    required this.pickupLocation,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropLocation,
    required this.dropLat,
    required this.dropLng,
    required this.cargoType,
    required this.cargoWeight,
    this.cargoVolume,
    this.description,
    required this.status,
    this.isMarketplaceLoad = false,
    required this.createdAt,
    this.pickupTime,
    this.deliveryTime,
    this.driverName,
    this.driverPhone,
    this.driverRating,
    this.truckLicensePlate,
    this.truckModel,
    this.driverLat,
    this.driverLng,
  });

  factory Shipment.fromJson(Map<String, dynamic> json) {
    // Extract driver/truck from nested delivery object
    final delivery = json['delivery'];
    final driver = delivery?['driver'];
    final truck = delivery?['truck'];

    return Shipment(
      id: json['id'] ?? '',
      shipperId: json['shipperId'] ?? '',
      pickupLocation: json['pickupLocation'] ?? '',
      pickupLat: (json['pickupLat'] ?? 0.0).toDouble(),
      pickupLng: (json['pickupLng'] ?? 0.0).toDouble(),
      dropLocation: json['dropLocation'] ?? '',
      dropLat: (json['dropLat'] ?? 0.0).toDouble(),
      dropLng: (json['dropLng'] ?? 0.0).toDouble(),
      cargoType: json['cargoType'] ?? '',
      cargoWeight: (json['cargoWeight'] ?? 0.0).toDouble(),
      cargoVolume: json['cargoVolume']?.toDouble(),
      description: json['description'],
      status: json['status'] ?? 'PENDING',
      isMarketplaceLoad: json['isMarketplaceLoad'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      pickupTime: json['pickupTime'] != null
          ? DateTime.parse(json['pickupTime'])
          : null,
      deliveryTime: json['deliveryTime'] != null
          ? DateTime.parse(json['deliveryTime'])
          : null,
      // Driver details
      driverName: driver?['name'],
      driverPhone: driver?['phone'],
      driverRating: driver?['rating']?.toDouble(),
      // Truck details
      truckLicensePlate: truck?['licensePlate'],
      truckModel: truck?['model'],
      // Driver location
      driverLat: delivery?['currentLat']?.toDouble(),
      driverLng: delivery?['currentLng']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'shipperId': shipperId,
      'pickupLocation': pickupLocation,
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'dropLocation': dropLocation,
      'dropLat': dropLat,
      'dropLng': dropLng,
      'cargoType': cargoType,
      'cargoWeight': cargoWeight,
      'cargoVolume': cargoVolume,
      'description': description,
      'status': status,
      'isMarketplaceLoad': isMarketplaceLoad,
      'createdAt': createdAt.toIso8601String(),
      'pickupTime': pickupTime?.toIso8601String(),
      'deliveryTime': deliveryTime?.toIso8601String(),
    };
  }

  String get statusDisplayName {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'ASSIGNED':
        return 'Assigned';
      case 'PICKED_UP':
        return 'Picked Up';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  bool get isPending => status == 'PENDING';
  bool get isAssigned => status == 'ASSIGNED';
  bool get isInTransit => status == 'IN_TRANSIT';
  bool get isDelivered => status == 'DELIVERED' || status == 'COMPLETED';
  bool get hasDriver => driverName != null;
  bool get hasDriverLocation => driverLat != null && driverLng != null;
}
