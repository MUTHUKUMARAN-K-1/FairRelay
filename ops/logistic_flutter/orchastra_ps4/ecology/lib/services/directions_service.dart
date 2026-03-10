import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../config/api_config.dart';

/// Directions Service - Fetches real road routes from Google Directions API
class DirectionsService {
  static final DirectionsService _instance = DirectionsService._internal();
  factory DirectionsService() => _instance;
  DirectionsService._internal();

  final Dio _dio = Dio();

  /// Fetch directions between two points
  /// Returns route data including polyline points, distance, and duration
  Future<DirectionsResult?> getDirections({
    required LatLng origin,
    required LatLng destination,
  }) async {
    final url =
        'https://maps.googleapis.com/maps/api/directions/json'
        '?origin=${origin.latitude},${origin.longitude}'
        '&destination=${destination.latitude},${destination.longitude}'
        '&mode=driving'
        '&key=${ApiConfig.googleMapsApiKey}';

    try {
      final response = await _dio.get(url);

      if (response.statusCode != 200) {
        debugPrint('Directions API error: ${response.statusCode}');
        return null;
      }

      final data = response.data;

      if (data['status'] != 'OK') {
        debugPrint('Directions API status: ${data['status']}');
        return null;
      }

      if (data['routes'] == null || (data['routes'] as List).isEmpty) {
        debugPrint('No routes found');
        return null;
      }

      final route = data['routes'][0];
      final leg = route['legs'][0];

      // Decode polyline points
      final polylinePoints = _decodePolyline(
        route['overview_polyline']['points'],
      );

      return DirectionsResult(
        polylinePoints: polylinePoints,
        distanceMeters: leg['distance']['value'],
        distanceText: leg['distance']['text'],
        durationSeconds: leg['duration']['value'],
        durationText: leg['duration']['text'],
        startAddress: leg['start_address'],
        endAddress: leg['end_address'],
      );
    } catch (e) {
      debugPrint('Error fetching directions: $e');
      return null;
    }
  }

  /// Decode Google polyline encoded string into list of LatLng points
  List<LatLng> _decodePolyline(String encoded) {
    List<LatLng> points = [];
    int index = 0;
    int lat = 0;
    int lng = 0;

    while (index < encoded.length) {
      // Decode latitude
      int shift = 0;
      int result = 0;
      int byte;
      do {
        byte = encoded.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      int deltaLat = ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);
      lat += deltaLat;

      // Decode longitude
      shift = 0;
      result = 0;
      do {
        byte = encoded.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      int deltaLng = ((result & 1) != 0) ? ~(result >> 1) : (result >> 1);
      lng += deltaLng;

      points.add(LatLng(lat / 1E5, lng / 1E5));
    }

    return points;
  }
}

/// Result from Directions API
class DirectionsResult {
  final List<LatLng> polylinePoints;
  final int distanceMeters;
  final String distanceText;
  final int durationSeconds;
  final String durationText;
  final String startAddress;
  final String endAddress;

  DirectionsResult({
    required this.polylinePoints,
    required this.distanceMeters,
    required this.distanceText,
    required this.durationSeconds,
    required this.durationText,
    required this.startAddress,
    required this.endAddress,
  });

  /// Get distance in kilometers
  double get distanceKm => distanceMeters / 1000;

  /// Get estimated arrival time from now
  DateTime get estimatedArrival =>
      DateTime.now().add(Duration(seconds: durationSeconds));
}
