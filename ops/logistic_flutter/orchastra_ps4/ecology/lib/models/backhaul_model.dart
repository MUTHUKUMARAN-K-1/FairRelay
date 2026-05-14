/// BackhaulPickup model matching Prisma BackhaulPickup schema
class BackhaulPickup {
  final String id;
  final String truckId;
  final String driverId;

  // Shipper info
  final String shipperId;
  final String shipperName;
  final String shipperPhone;
  final String shipperLocation;
  final double shipperLat;
  final double shipperLng;

  // Destination
  final String destinationHubId;
  final String? destinationHubName;

  // Package info
  final int packageCount;
  final double totalWeight;
  final double totalVolume;

  // Metrics
  final double distanceKm;
  final double carbonSavedKg;

  // Status & timestamps
  final String status;
  final DateTime proposedAt;
  final DateTime? pickedUpAt;
  final DateTime? deliveredAt;

  BackhaulPickup({
    required this.id,
    required this.truckId,
    required this.driverId,
    required this.shipperId,
    required this.shipperName,
    required this.shipperPhone,
    required this.shipperLocation,
    required this.shipperLat,
    required this.shipperLng,
    required this.destinationHubId,
    this.destinationHubName,
    required this.packageCount,
    required this.totalWeight,
    required this.totalVolume,
    required this.distanceKm,
    required this.carbonSavedKg,
    required this.status,
    required this.proposedAt,
    this.pickedUpAt,
    this.deliveredAt,
  });

  factory BackhaulPickup.fromJson(Map<String, dynamic> json) {
    return BackhaulPickup(
      id: json['id'] ?? '',
      truckId: json['truckId'] ?? '',
      driverId: json['driverId'] ?? '',
      shipperId: json['shipperId'] ?? '',
      shipperName: json['shipperName'] ?? '',
      shipperPhone: json['shipperPhone'] ?? '',
      shipperLocation: json['shipperLocation'] ?? '',
      shipperLat: (json['shipperLat'] ?? 0).toDouble(),
      shipperLng: (json['shipperLng'] ?? 0).toDouble(),
      destinationHubId: json['destinationHubId'] ?? '',
      destinationHubName:
          json['destinationHub']?['name'] ?? json['destinationHubName'],
      packageCount: json['packageCount'] ?? 0,
      totalWeight: (json['totalWeight'] ?? 0).toDouble(),
      totalVolume: (json['totalVolume'] ?? 0).toDouble(),
      distanceKm: (json['distanceKm'] ?? 0).toDouble(),
      carbonSavedKg: (json['carbonSavedKg'] ?? 0).toDouble(),
      status: json['status'] ?? 'PROPOSED',
      proposedAt: json['proposedAt'] != null
          ? DateTime.parse(json['proposedAt'])
          : DateTime.now(),
      pickedUpAt: json['pickedUpAt'] != null
          ? DateTime.parse(json['pickedUpAt'])
          : null,
      deliveredAt: json['deliveredAt'] != null
          ? DateTime.parse(json['deliveredAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'truckId': truckId,
      'driverId': driverId,
      'shipperId': shipperId,
      'shipperName': shipperName,
      'shipperPhone': shipperPhone,
      'shipperLocation': shipperLocation,
      'shipperLat': shipperLat,
      'shipperLng': shipperLng,
      'destinationHubId': destinationHubId,
      'packageCount': packageCount,
      'totalWeight': totalWeight,
      'totalVolume': totalVolume,
      'distanceKm': distanceKm,
      'carbonSavedKg': carbonSavedKg,
      'status': status,
      'proposedAt': proposedAt.toIso8601String(),
      'pickedUpAt': pickedUpAt?.toIso8601String(),
      'deliveredAt': deliveredAt?.toIso8601String(),
    };
  }

  // Status helpers
  bool get isProposed => status == 'PROPOSED';
  bool get isAccepted => status == 'ACCEPTED';
  bool get isEnRouteToPickup => status == 'EN_ROUTE_TO_PICKUP';
  bool get isPickedUp => status == 'PICKED_UP';
  bool get isDelivered => status == 'DELIVERED';
  bool get isRejected => status == 'REJECTED';

  bool get canAccept => status == 'PROPOSED';
  bool get canPickup => status == 'ACCEPTED' || status == 'EN_ROUTE_TO_PICKUP';
  bool get canDeliver => status == 'PICKED_UP';

  String get statusDisplayName {
    switch (status) {
      case 'PROPOSED':
        return 'New Opportunity';
      case 'ACCEPTED':
        return 'Accepted';
      case 'EN_ROUTE_TO_PICKUP':
        return 'En Route to Pickup';
      case 'PICKED_UP':
        return 'Picked Up';
      case 'DELIVERED':
        return 'Delivered';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  }
}
