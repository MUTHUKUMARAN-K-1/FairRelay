/// API Configuration for FairRelay Driver App
class ApiConfig {
  // ── Base URL ──────────────────────────────────────────────────────────────
  // Set via --dart-define=API_BASE_URL=... for different environments
  static const String baseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000');
  // Android emulator: http://10.0.2.2:3000
  // Physical device: http://192.168.x.x:3000
  // Production: https://fairrelay-api.onrender.com

  // ── Auth endpoints ────────────────────────────────────────────────────────
  static const String sendOtp = '/api/otp/send';
  static const String verifyOtp = '/api/otp/verify';
  static const String profile = '/api/auth/profile';
  static const String refreshToken = '/api/auth/refresh-token';

  // ── Delivery endpoints ────────────────────────────────────────────────────
  static const String assignedDeliveries = '/api/deliveries/assigned';
  static const String createDelivery = '/api/deliveries/create';
  static const String acceptDelivery = '/api/deliveries'; // /:id/accept
  static const String startDelivery = '/api/deliveries'; // /:id/start
  static const String pickupCargo = '/api/deliveries'; // /:id/pickup
  static const String completeDelivery = '/api/deliveries'; // /:id/complete
  static const String uploadPhotos = '/api/deliveries'; // /:id/upload-photos

  // ── Shipment endpoints ────────────────────────────────────────────────────
  static const String createShipment = '/api/shipments/create';
  static const String myShipments = '/api/shipments/my-shipments';
  static const String shipmentById = '/api/shipments'; // /:id
  static const String pendingShipments = '/api/shipments/pending';
  static const String acceptShipment = '/api/shipments'; // /:id/accept

  // ── Synergy/Absorption endpoints ──────────────────────────────────────────
  static const String generateQR = '/api/synergy/generate-qr';
  static const String verifyQR = '/api/synergy/verify-qr';
  static const String completeHandover = '/api/synergy/complete-handover';

  // ── Backhaul endpoints ────────────────────────────────────────────────────
  static const String backhaulOpportunities = '/api/backhaul/opportunities';
  static const String checkBackhaulOpportunities =
      '/api/backhaul/check-opportunities';
  static const String acceptBackhaul = '/api/backhaul'; // /:id/accept

  // ── Dashboard / Stats ─────────────────────────────────────────────────────
  static const String dashboardStats = '/api/dashboard/stats';
  static const String transactions = '/api/transaction';

  // ── Driver endpoints ──────────────────────────────────────────────────────
  static const String updateLocation = '/api/drivers/location';
  static const String activeRoute = '/api/drivers'; // /:truckId/active-route

  // ── Truck endpoints ───────────────────────────────────────────────────────
  static const String trucks = '/api/trucks';

  // ── E-Way Bill endpoints ──────────────────────────────────────────────────
  static const String ewayBills = '/api/eway-bills';
  static const String generateEwayBill = '/api/eway-bills/generate';
  static const String downloadEwayBill = '/api/eway-bills'; // /:id/download

  // ── FairRelay AI Dispatch endpoints ───────────────────────────────────────
  static const String dispatchAllocate = '/api/dispatch/allocate';
  static const String dispatchRuns = '/api/dispatch/runs';
  static const String dispatchHealth = '/api/dispatch/health';
  static const String wellnessCheck = '/api/dispatch/wellness-check';
  static const String carbonCalculate = '/api/dispatch/carbon-calculate';
  static const String nightSafetyFilter = '/api/dispatch/night-safety-filter';
  static const String driverWellnessFeedback = '/api/dispatch/feedback';
  static const String cognitiveCheck = '/api/wellness/cognitive';

  // ── FairRelay Public v1 API ───────────────────────────────────────────────
  static const String v1Allocate = '/api/v1/allocate';
  static const String v1Gini = '/api/v1/gini';
  static const String v1Runs = '/api/v1/runs';
  static const String v1NightSafety = '/api/v1/night-safety';

  // ── Google Maps & Socket ──────────────────────────────────────────────────
  // Set via --dart-define=GOOGLE_MAPS_API_KEY=...
  static const String googleMapsApiKey =
      String.fromEnvironment('GOOGLE_MAPS_API_KEY', defaultValue: '');
  static const String socketUrl = baseUrl;

  // ── Timeouts ──────────────────────────────────────────────────────────────
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
