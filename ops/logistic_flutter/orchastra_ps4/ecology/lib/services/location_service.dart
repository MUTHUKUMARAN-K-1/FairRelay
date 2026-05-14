import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../config/api_config.dart';
import 'api_service.dart';

/// Location Service - GPS tracking and updates
class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;

  final ApiService _api = ApiService();

  StreamSubscription<Position>? _positionSubscription;
  Position? _currentPosition;
  bool _isTracking = false;

  // Callbacks
  Function(Position)? onLocationUpdate;
  Function(String)? onError;

  LocationService._internal();

  Position? get currentPosition => _currentPosition;
  bool get isTracking => _isTracking;

  /// Request location permissions
  Future<bool> requestPermission() async {
    // Check if location service is enabled
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      onError?.call('Location services are disabled. Please enable them.');
      return false;
    }

    // Request permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        onError?.call('Location permission denied.');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      onError?.call(
        'Location permissions are permanently denied. Please enable them in settings.',
      );
      return false;
    }

    return true;
  }

  /// Get current position once
  Future<Position?> getCurrentLocation() async {
    try {
      final hasPermission = await requestPermission();
      if (!hasPermission) return null;

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      return _currentPosition;
    } catch (e) {
      onError?.call('Failed to get location: ${e.toString()}');
      return null;
    }
  }

  /// Start continuous location tracking
  Future<void> startTracking({String? truckId}) async {
    if (_isTracking) return;

    final hasPermission = await requestPermission();
    if (!hasPermission) return;

    _isTracking = true;

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // Update every 10 meters
    );

    _positionSubscription =
        Geolocator.getPositionStream(locationSettings: locationSettings).listen(
          (Position position) {
            _currentPosition = position;
            onLocationUpdate?.call(position);

            // Send to backend if truckId provided
            if (truckId != null) {
              _sendLocationToBackend(truckId, position);
            }
          },
          onError: (error) {
            onError?.call('Location tracking error: ${error.toString()}');
          },
        );
  }

  /// Stop location tracking
  void stopTracking() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
    _isTracking = false;
  }

  /// Send location update to backend
  Future<void> _sendLocationToBackend(String truckId, Position position) async {
    try {
      await _api.post(
        ApiConfig.updateLocation,
        data: {
          'truckId': truckId,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'speed': position.speed,
          'heading': position.heading,
          'accuracy': position.accuracy,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      // Silently fail - don't interrupt tracking
      debugPrint('Failed to send location: $e');
    }
  }

  /// Calculate distance between two points in km
  double calculateDistance(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng) /
        1000; // Convert to km
  }

  /// Check if position is within geofence
  bool isWithinGeofence(double centerLat, double centerLng, double radiusKm) {
    if (_currentPosition == null) return false;

    final distance = calculateDistance(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      centerLat,
      centerLng,
    );

    return distance <= radiusKm;
  }

  /// Get bearing between two points
  double getBearing(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) {
    return Geolocator.bearingBetween(startLat, startLng, endLat, endLng);
  }

  /// Dispose resources
  void dispose() {
    stopTracking();
  }
}
