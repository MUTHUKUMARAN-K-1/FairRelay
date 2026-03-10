/// EWayBill model matching Prisma EWayBill schema
class EWayBill {
  final String id;
  final String billNo;
  final String vehicleNo;
  final String from;
  final String to;
  final String distance;
  final String driverId;
  final String cargoValue;
  final DateTime validUntil;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  EWayBill({
    required this.id,
    required this.billNo,
    required this.vehicleNo,
    required this.from,
    required this.to,
    required this.distance,
    required this.driverId,
    required this.cargoValue,
    required this.validUntil,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EWayBill.fromJson(Map<String, dynamic> json) {
    return EWayBill(
      id: json['id'] ?? '',
      billNo: json['billNo'] ?? '',
      vehicleNo: json['vehicleNo'] ?? '',
      from: json['from'] ?? '',
      to: json['to'] ?? '',
      distance: json['distance'] ?? '',
      driverId: json['driverId'] ?? '',
      cargoValue: json['cargoValue'] ?? '',
      validUntil: DateTime.parse(json['validUntil']),
      status: json['status'] ?? 'ACTIVE',
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
      'billNo': billNo,
      'vehicleNo': vehicleNo,
      'from': from,
      'to': to,
      'distance': distance,
      'driverId': driverId,
      'cargoValue': cargoValue,
      'validUntil': validUntil.toIso8601String(),
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isActive => status == 'ACTIVE';
  bool get isExpiringSoon => status == 'EXPIRING_SOON';
  bool get isExpired => DateTime.now().isAfter(validUntil);

  int get daysUntilExpiry => validUntil.difference(DateTime.now()).inDays;
}

/// Transaction model matching Prisma Transaction schema
class Transaction {
  final String id;
  final String driverId;
  final String? deliveryId;
  final double amount;
  final String type;
  final String description;
  final String? route;
  final DateTime createdAt;

  Transaction({
    required this.id,
    required this.driverId,
    this.deliveryId,
    required this.amount,
    required this.type,
    required this.description,
    this.route,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? '',
      driverId: json['driverId'] ?? '',
      deliveryId: json['deliveryId'],
      amount: (json['amount'] ?? 0).toDouble(),
      type: json['type'] ?? '',
      description: json['description'] ?? '',
      route: json['route'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  bool get isPositive => amount >= 0;

  String get typeDisplayName {
    switch (type) {
      case 'BASE_DELIVERY':
        return 'Base Delivery';
      case 'MARKETPLACE_BONUS':
        return 'Marketplace Bonus';
      case 'ABSORPTION_BONUS':
        return 'Absorption Bonus';
      case 'FUEL_SURCHARGE':
        return 'Fuel Surcharge';
      case 'TOLL_REIMBURSEMENT':
        return 'Toll Reimbursement';
      case 'PENALTY':
        return 'Penalty';
      case 'BONUS':
        return 'Bonus';
      case 'ADJUSTMENT':
        return 'Adjustment';
      case 'BACKHAUL_BONUS':
        return 'Backhaul Bonus';
      default:
        return type;
    }
  }
}

/// VirtualHub model
class VirtualHub {
  final String id;
  final String name;
  final String? address;
  final double latitude;
  final double longitude;
  final String? type;
  final double? radius;

  VirtualHub({
    required this.id,
    required this.name,
    this.address,
    required this.latitude,
    required this.longitude,
    this.type,
    this.radius,
  });

  factory VirtualHub.fromJson(Map<String, dynamic> json) {
    return VirtualHub(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'],
      latitude: (json['latitude'] ?? 0).toDouble(),
      longitude: (json['longitude'] ?? 0).toDouble(),
      type: json['type'],
      radius: json['radius']?.toDouble(),
    );
  }
}
