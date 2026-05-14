/// Application-wide constants
class AppConstants {
  // App info
  static const String appName = 'EcoLogiq';
  static const String appVersion = '1.0.0';

  // Storage keys
  static const String tokenKey = 'jwt_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
  static const String roleKey = 'user_role';

  // Hive box names
  static const String settingsBox = 'settings';
  static const String cacheBox = 'cache';
  static const String pendingRequestsBox = 'pending_requests';

  // GPS settings
  static const int gpsUpdateIntervalMs = 5000; // 5 seconds
  static const double gpsDistanceFilterMeters = 10.0;

  // Geofence settings
  static const double backhaulGeofenceRadiusKm = 5.0;
  static const double synergyProximityKm = 10.0;

  // OTP settings
  static const int otpLength = 6;
  static const int otpResendSeconds = 60;

  // Timeouts
  static const int apiTimeoutSeconds = 30;
  static const int socketReconnectDelayMs = 3000;

  // Pagination
  static const int defaultPageSize = 20;

  // Image settings
  static const int maxImageSizeBytes = 5 * 1024 * 1024; // 5MB
  static const int imageQuality = 80;
  static const int photoAnglesRequired = 4;

  // Date formats
  static const String dateFormat = 'dd MMM yyyy';
  static const String timeFormat = 'hh:mm a';
  static const String dateTimeFormat = 'dd MMM yyyy, hh:mm a';
}

/// User roles
class UserRole {
  static const String driver = 'DRIVER';
  static const String shipper = 'SHIPPER';
  static const String dispatcher = 'DISPATCHER';
}

/// Driver status values
class DriverStatus {
  static const String onDuty = 'ON_DUTY';
  static const String inTransit = 'IN_TRANSIT';
  static const String resting = 'RESTING';
  static const String offDuty = 'OFF_DUTY';
}

/// Delivery status values
class DeliveryStatus {
  static const String pending = 'PENDING';
  static const String allocated = 'ALLOCATED';
  static const String enRouteToPickup = 'EN_ROUTE_TO_PICKUP';
  static const String cargoLoaded = 'CARGO_LOADED';
  static const String inTransit = 'IN_TRANSIT';
  static const String absorptionProposed = 'ABSORPTION_PROPOSED';
  static const String absorptionAccepted = 'ABSORPTION_ACCEPTED';
  static const String absorptionTransferred = 'ABSORPTION_TRANSFERRED';
  static const String enRouteToDrop = 'EN_ROUTE_TO_DROP';
  static const String awaitingConfirmation = 'AWAITING_CONFIRMATION';
  static const String completed = 'COMPLETED';
  static const String cancelled = 'CANCELLED';
}

/// Absorption/Transfer status values
class TransferStatus {
  static const String pending = 'PENDING';
  static const String qrScanned = 'QR_SCANNED';
  static const String checklistVerified = 'CHECKLIST_VERIFIED';
  static const String inProgress = 'IN_PROGRESS';
  static const String completed = 'COMPLETED';
  static const String failed = 'FAILED';
}

/// Backhaul status values
class BackhaulStatus {
  static const String proposed = 'PROPOSED';
  static const String accepted = 'ACCEPTED';
  static const String enRouteToPickup = 'EN_ROUTE_TO_PICKUP';
  static const String pickedUp = 'PICKED_UP';
  static const String delivered = 'DELIVERED';
  static const String rejected = 'REJECTED';
}
