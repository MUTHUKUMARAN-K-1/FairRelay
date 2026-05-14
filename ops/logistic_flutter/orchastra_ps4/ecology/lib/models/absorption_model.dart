/// Absorption Opportunity model matching Prisma AbsorptionOpportunity schema
class AbsorptionOpportunity {
  final String id;
  final String route1Id;
  final String route2Id;

  final double overlapDistanceKm;
  final DateTime overlapStartTime;
  final DateTime overlapEndTime;

  final String nearestHubId;
  final String? hubName;
  final String? overlapPolyline;
  final double overlapCenterLat;
  final double overlapCenterLng;

  final DateTime estimatedMeetTime;
  final int timeWindow;

  final String eligibleDeliveryIds;

  final double truck1DistanceBefore;
  final double truck1DistanceAfter;
  final double truck2DistanceBefore;
  final double truck2DistanceAfter;

  final double totalDistanceSaved;
  final double potentialCarbonSaved;

  final double spaceRequiredVolume;
  final double spaceRequiredWeight;
  final double truck1SpaceAvailable;
  final double truck2SpaceAvailable;

  final String status;
  final DateTime proposedAt;
  final DateTime expiresAt;

  final DateTime? acceptedByRoute1At;
  final DateTime? acceptedByRoute2At;

  AbsorptionOpportunity({
    required this.id,
    required this.route1Id,
    required this.route2Id,
    required this.overlapDistanceKm,
    required this.overlapStartTime,
    required this.overlapEndTime,
    required this.nearestHubId,
    this.hubName,
    this.overlapPolyline,
    required this.overlapCenterLat,
    required this.overlapCenterLng,
    required this.estimatedMeetTime,
    required this.timeWindow,
    required this.eligibleDeliveryIds,
    required this.truck1DistanceBefore,
    required this.truck1DistanceAfter,
    required this.truck2DistanceBefore,
    required this.truck2DistanceAfter,
    required this.totalDistanceSaved,
    required this.potentialCarbonSaved,
    required this.spaceRequiredVolume,
    required this.spaceRequiredWeight,
    required this.truck1SpaceAvailable,
    required this.truck2SpaceAvailable,
    required this.status,
    required this.proposedAt,
    required this.expiresAt,
    this.acceptedByRoute1At,
    this.acceptedByRoute2At,
  });

  factory AbsorptionOpportunity.fromJson(Map<String, dynamic> json) {
    return AbsorptionOpportunity(
      id: json['id'] ?? '',
      route1Id: json['route1Id'] ?? '',
      route2Id: json['route2Id'] ?? '',
      overlapDistanceKm: (json['overlapDistanceKm'] ?? 0).toDouble(),
      overlapStartTime: DateTime.parse(json['overlapStartTime']),
      overlapEndTime: DateTime.parse(json['overlapEndTime']),
      nearestHubId: json['nearestHubId'] ?? '',
      hubName: json['hubName'] ?? json['nearestHub']?['name'],
      overlapPolyline: json['overlapPolyline'],
      overlapCenterLat: (json['overlapCenterLat'] ?? 0).toDouble(),
      overlapCenterLng: (json['overlapCenterLng'] ?? 0).toDouble(),
      estimatedMeetTime: DateTime.parse(json['estimatedMeetTime']),
      timeWindow: json['timeWindow'] ?? 30,
      eligibleDeliveryIds: json['eligibleDeliveryIds'] ?? '',
      truck1DistanceBefore: (json['truck1DistanceBefore'] ?? 0).toDouble(),
      truck1DistanceAfter: (json['truck1DistanceAfter'] ?? 0).toDouble(),
      truck2DistanceBefore: (json['truck2DistanceBefore'] ?? 0).toDouble(),
      truck2DistanceAfter: (json['truck2DistanceAfter'] ?? 0).toDouble(),
      totalDistanceSaved: (json['totalDistanceSaved'] ?? 0).toDouble(),
      potentialCarbonSaved: (json['potentialCarbonSaved'] ?? 0).toDouble(),
      spaceRequiredVolume: (json['spaceRequiredVolume'] ?? 0).toDouble(),
      spaceRequiredWeight: (json['spaceRequiredWeight'] ?? 0).toDouble(),
      truck1SpaceAvailable: (json['truck1SpaceAvailable'] ?? 0).toDouble(),
      truck2SpaceAvailable: (json['truck2SpaceAvailable'] ?? 0).toDouble(),
      status: json['status'] ?? 'PENDING',
      proposedAt: json['proposedAt'] != null
          ? DateTime.parse(json['proposedAt'])
          : DateTime.now(),
      expiresAt: DateTime.parse(json['expiresAt']),
      acceptedByRoute1At: json['acceptedByRoute1At'] != null
          ? DateTime.parse(json['acceptedByRoute1At'])
          : null,
      acceptedByRoute2At: json['acceptedByRoute2At'] != null
          ? DateTime.parse(json['acceptedByRoute2At'])
          : null,
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isPending => status == 'PENDING';
  bool get isBothAccepted => status == 'BOTH_ACCEPTED';

  List<String> get deliveryIdsList => eligibleDeliveryIds.split(',');
}

/// Absorption Transfer model matching Prisma AbsorptionTransfer schema
class AbsorptionTransfer {
  final String id;
  final String absorptionOpportunityId;

  final String exporterDriverId;
  final String importerDriverId;
  final String hubId;

  final String deliveryIdsToTransfer;
  final String? exportedDeliveryId;
  final String? importedDeliveryId;

  final bool qrCodeScanned;
  final String? qrCodeData;
  final DateTime? scannedAt;

  final Map<String, dynamic>? checklistData;
  final List<String>? photos;

  final double spaceAvailableExporter;
  final double spaceAvailableImporter;

  final double distanceSavedKm;
  final double carbonSavedKg;

  final String status;
  final DateTime createdAt;
  final DateTime? completedAt;

  AbsorptionTransfer({
    required this.id,
    required this.absorptionOpportunityId,
    required this.exporterDriverId,
    required this.importerDriverId,
    required this.hubId,
    required this.deliveryIdsToTransfer,
    this.exportedDeliveryId,
    this.importedDeliveryId,
    this.qrCodeScanned = false,
    this.qrCodeData,
    this.scannedAt,
    this.checklistData,
    this.photos,
    required this.spaceAvailableExporter,
    required this.spaceAvailableImporter,
    required this.distanceSavedKm,
    required this.carbonSavedKg,
    required this.status,
    required this.createdAt,
    this.completedAt,
  });

  factory AbsorptionTransfer.fromJson(Map<String, dynamic> json) {
    return AbsorptionTransfer(
      id: json['id'] ?? '',
      absorptionOpportunityId: json['absorptionOpportunityId'] ?? '',
      exporterDriverId: json['exporterDriverId'] ?? '',
      importerDriverId: json['importerDriverId'] ?? '',
      hubId: json['hubId'] ?? '',
      deliveryIdsToTransfer: json['deliveryIdsToTransfer'] ?? '',
      exportedDeliveryId: json['exportedDeliveryId'],
      importedDeliveryId: json['importedDeliveryId'],
      qrCodeScanned: json['qrCodeScanned'] ?? false,
      qrCodeData: json['qrCodeData'],
      scannedAt: json['scannedAt'] != null
          ? DateTime.parse(json['scannedAt'])
          : null,
      checklistData: json['checklistData'],
      photos: json['photos'] != null ? List<String>.from(json['photos']) : null,
      spaceAvailableExporter: (json['spaceAvailableExporter'] ?? 0).toDouble(),
      spaceAvailableImporter: (json['spaceAvailableImporter'] ?? 0).toDouble(),
      distanceSavedKm: (json['distanceSavedKm'] ?? 0).toDouble(),
      carbonSavedKg: (json['carbonSavedKg'] ?? 0).toDouble(),
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : null,
    );
  }

  bool get isPending => status == 'PENDING';
  bool get isQrScanned => status == 'QR_SCANNED';
  bool get isCompleted => status == 'COMPLETED';

  List<String> get deliveryIdsList => deliveryIdsToTransfer.split(',');
}
