import '../config/api_config.dart';
import 'api_service.dart';

/// FairRelay Dispatch Service
/// Wraps all AI Dispatch endpoints: allocate, wellness-check,
/// carbon-calculate, night-safety-filter, and dispatch run history.
class DispatchService {
  static final DispatchService _instance = DispatchService._internal();
  factory DispatchService() => _instance;
  DispatchService._internal();

  final ApiService _api = ApiService();

  // ── Health ──────────────────────────────────────────────────────────────

  /// Check if the AI Brain (FastAPI on :8000) is reachable.
  Future<bool> isHealthy() async {
    try {
      final response = await _api.get(ApiConfig.dispatchHealth);
      return response.data['status'] == 'ok' ||
          response.data['brain_status'] == 'connected';
    } catch (_) {
      return false;
    }
  }

  // ── Wellness Check ──────────────────────────────────────────────────────

  /// POST /api/dispatch/wellness-check
  /// Send a list of driver objects; receive wellness scores and status labels.
  ///
  /// Driver object shape:
  /// ```json
  /// {
  ///   "id": "drv-001",
  ///   "name": "Rajesh Kumar",
  ///   "hours_today": 4,
  ///   "hours_since_rest": 8,
  ///   "is_ill": false,
  ///   "total_hours_7d": 35,
  ///   "vehicle_type": "DIESEL",
  ///   "gender": "M"
  /// }
  /// ```
  Future<List<Map<String, dynamic>>> runWellnessCheck(
    List<Map<String, dynamic>> drivers,
  ) async {
    final response = await _api.post(
      ApiConfig.wellnessCheck,
      data: {'drivers': drivers},
    );
    final data = response.data;
    final results = data['drivers'] ?? data['data']?['drivers'] ?? [];
    return List<Map<String, dynamic>>.from(results);
  }

  // ── Self-check (single driver) ──────────────────────────────────────────

  /// Convenience wrapper for a driver to self-report their wellness.
  /// Returns a map with 'wellnessStatus', 'wellnessScore', 'maxDifficulty'.
  Future<Map<String, dynamic>> selfWellnessCheck({
    required String driverId,
    required String driverName,
    required double hoursToday,
    required double hoursSinceRest,
    required bool isIll,
    required double totalHours7d,
    required String vehicleType,
    required String gender,
  }) async {
    final results = await runWellnessCheck([
      {
        'id': driverId,
        'name': driverName,
        'hours_today': hoursToday,
        'hours_since_rest': hoursSinceRest,
        'is_ill': isIll,
        'total_hours_7d': totalHours7d,
        'vehicle_type': vehicleType,
        'gender': gender,
      },
    ]);
    return results.isNotEmpty ? results.first : {'wellnessStatus': 'FIT'};
  }

  // ── Carbon Calculation ──────────────────────────────────────────────────

  /// POST /api/dispatch/carbon-calculate
  /// Pass a list of route objects; receive carbon_kg per route + total.
  Future<Map<String, dynamic>> calculateCarbon(
    List<Map<String, dynamic>> routes,
  ) async {
    final response = await _api.post(
      ApiConfig.carbonCalculate,
      data: {'routes': routes},
    );
    return Map<String, dynamic>.from(response.data);
  }

  // ── Night Safety Filter ─────────────────────────────────────────────────

  /// POST /api/dispatch/night-safety-filter
  /// Returns which drivers are safe to assign to night routes.
  Future<Map<String, dynamic>> nightSafetyFilter(
    List<Map<String, dynamic>> drivers, {
    int? currentHour,
  }) async {
    final response = await _api.post(
      ApiConfig.nightSafetyFilter,
      data: {
        'drivers': drivers,
        if (currentHour != null) 'currentHour': currentHour,
      },
    );
    return Map<String, dynamic>.from(response.data);
  }

  // ── Full Allocation ─────────────────────────────────────────────────────

  /// POST /api/dispatch/allocate
  /// Runs the full 8-agent LangGraph pipeline.
  /// Returns assignments, fairness metrics (gini), wellness, carbon.
  Future<Map<String, dynamic>> runAllocation({
    required List<Map<String, dynamic>> drivers,
    required List<Map<String, dynamic>> routes,
  }) async {
    final response = await _api.post(
      ApiConfig.dispatchAllocate,
      data: {'drivers': drivers, 'routes': routes},
    );
    return Map<String, dynamic>.from(response.data);
  }

  // ── Run History ─────────────────────────────────────────────────────────

  /// GET /api/dispatch/runs
  /// Returns the list of recent dispatch runs with gini, carbon, timestamp.
  Future<List<Map<String, dynamic>>> getDispatchRuns() async {
    final response = await _api.get(ApiConfig.dispatchRuns);
    final data = response.data;
    final runs = data['runs'] ?? data['data'] ?? [];
    return List<Map<String, dynamic>>.from(runs);
  }

  // ── Driver Feedback ─────────────────────────────────────────────────────

  /// POST /api/dispatch/feedback
  /// Drivers submit post-delivery feedback (fatigue, rating, issues).
  Future<bool> submitFeedback({
    required String driverId,
    required int fatigueLevel, // 1-5
    required int rating, // 1-5
    String? comments,
    String? runId,
  }) async {
    try {
      final response = await _api.post(
        ApiConfig.driverWellnessFeedback,
        data: {
          'driverId': driverId,
          'fatigueLevel': fatigueLevel,
          'rating': rating,
          if (comments != null) 'comments': comments,
          if (runId != null) 'runId': runId,
        },
      );
      return response.data['success'] == true;
    } catch (_) {
      return false;
    }
  }
}
