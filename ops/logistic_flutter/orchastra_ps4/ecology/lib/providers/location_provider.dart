import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';

/// Location Provider - Manages GPS state
class LocationProvider extends ChangeNotifier {
  final LocationService _locationService = LocationService();

  Position? _currentPosition;
  bool _isTracking = false;
  bool _hasPermission = false;
  String? _error;

  // Getters
  Position? get currentPosition => _currentPosition;
  bool get isTracking => _isTracking;
  bool get hasPermission => _hasPermission;
  String? get error => _error;

  double? get latitude => _currentPosition?.latitude;
  double? get longitude => _currentPosition?.longitude;

  /// Initialize and request permission
  Future<bool> init() async {
    _hasPermission = await _locationService.requestPermission();

    if (_hasPermission) {
      _currentPosition = await _locationService.getCurrentLocation();
    } else {
      _error = 'Location permission not granted';
    }

    notifyListeners();
    return _hasPermission;
  }

  /// Get current location once
  Future<Position?> getCurrentLocation() async {
    try {
      _error = null;
      _currentPosition = await _locationService.getCurrentLocation();
      notifyListeners();
      return _currentPosition;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  /// Start continuous tracking
  Future<void> startTracking({String? truckId}) async {
    if (_isTracking) return;

    _locationService.onLocationUpdate = (Position position) {
      _currentPosition = position;
      notifyListeners();
    };

    _locationService.onError = (String error) {
      _error = error;
      notifyListeners();
    };

    await _locationService.startTracking(truckId: truckId);
    _isTracking = true;
    notifyListeners();
  }

  /// Stop tracking
  void stopTracking() {
    _locationService.stopTracking();
    _isTracking = false;
    notifyListeners();
  }

  /// Calculate distance to a point
  double? distanceTo(double lat, double lng) {
    if (_currentPosition == null) return null;

    return _locationService.calculateDistance(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      lat,
      lng,
    );
  }

  /// Check if within geofence
  bool isWithinGeofence(double centerLat, double centerLng, double radiusKm) {
    return _locationService.isWithinGeofence(centerLat, centerLng, radiusKm);
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _locationService.dispose();
    super.dispose();
  }
}
