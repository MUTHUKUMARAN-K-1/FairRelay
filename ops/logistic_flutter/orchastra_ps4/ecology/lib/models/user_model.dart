/// User model matching Prisma User schema
class User {
  final String id;
  final String name;
  final String phone;
  final String role;
  final String status;
  final double rating;
  final int deliveriesCount;
  final double totalEarnings;
  final double weeklyEarnings;
  final double weeklyKmDriven;
  final String? avatarColor;
  final String? initials;
  final String? vehicleType;
  final String? currentVehicleNo;
  final String? homeBaseCity;
  final String? qrCode;
  final String registrationStatus;
  final List<TruckSummary>? trucks;
  final DateTime? lastActiveDate;

  User({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    this.status = 'ON_DUTY',
    this.rating = 0.0,
    this.deliveriesCount = 0,
    this.totalEarnings = 0.0,
    this.weeklyEarnings = 0.0,
    this.weeklyKmDriven = 0.0,
    this.avatarColor,
    this.initials,
    this.vehicleType,
    this.currentVehicleNo,
    this.homeBaseCity,
    this.qrCode,
    this.registrationStatus = 'PENDING',
    this.trucks,
    this.lastActiveDate,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'DRIVER',
      status: json['status'] ?? 'ON_DUTY',
      rating: (json['rating'] ?? 0).toDouble(),
      deliveriesCount: json['deliveriesCount'] ?? 0,
      totalEarnings: (json['totalEarnings'] ?? 0).toDouble(),
      weeklyEarnings: (json['weeklyEarnings'] ?? 0).toDouble(),
      weeklyKmDriven: (json['weeklyKmDriven'] ?? 0).toDouble(),
      avatarColor: json['avatarColor'],
      initials: json['initials'],
      vehicleType: json['vehicleType'],
      currentVehicleNo: json['currentVehicleNo'],
      homeBaseCity: json['homeBaseCity'],
      qrCode: json['qrCode'],
      registrationStatus: json['registrationStatus'] ?? 'PENDING',
      trucks: json['trucks'] != null
          ? (json['trucks'] as List)
                .map((t) => TruckSummary.fromJson(t))
                .toList()
          : null,
      lastActiveDate: json['lastActiveDate'] != null
          ? DateTime.parse(json['lastActiveDate'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'role': role,
      'status': status,
      'rating': rating,
      'deliveriesCount': deliveriesCount,
      'totalEarnings': totalEarnings,
      'weeklyEarnings': weeklyEarnings,
      'weeklyKmDriven': weeklyKmDriven,
      'avatarColor': avatarColor,
      'initials': initials,
      'vehicleType': vehicleType,
      'currentVehicleNo': currentVehicleNo,
      'homeBaseCity': homeBaseCity,
      'qrCode': qrCode,
      'registrationStatus': registrationStatus,
      'trucks': trucks?.map((t) => t.toJson()).toList(),
      'lastActiveDate': lastActiveDate?.toIso8601String(),
    };
  }

  bool get isDriver => role == 'DRIVER';
  bool get isShipper => role == 'SHIPPER';
  bool get isDispatcher => role == 'DISPATCHER';
  bool get isApproved => registrationStatus == 'APPROVED';

  String get displayInitials {
    if (initials != null && initials!.isNotEmpty) return initials!;
    if (name.isEmpty) return '?';
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
  }
}

/// Lightweight truck summary for user profile
class TruckSummary {
  final String id;
  final String licensePlate;
  final String? model;
  final double? capacity;

  TruckSummary({
    required this.id,
    required this.licensePlate,
    this.model,
    this.capacity,
  });

  factory TruckSummary.fromJson(Map<String, dynamic> json) {
    return TruckSummary(
      id: json['id'] ?? '',
      licensePlate: json['licensePlate'] ?? '',
      model: json['model'],
      capacity: json['capacity']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'licensePlate': licensePlate,
      'model': model,
      'capacity': capacity,
    };
  }
}
