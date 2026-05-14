import 'package:flutter/foundation.dart';
import '../models/backhaul_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

/// Backhaul Provider - Manages return load opportunities
class BackhaulProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<BackhaulPickup> _opportunities = [];
  BackhaulPickup? _activeBackhaul;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<BackhaulPickup> get opportunities => _opportunities;
  BackhaulPickup? get activeBackhaul => _activeBackhaul;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<BackhaulPickup> get pendingOpportunities =>
      _opportunities.where((b) => b.isProposed).toList();
  List<BackhaulPickup> get acceptedOpportunities =>
      _opportunities.where((b) => b.isAccepted || b.isEnRouteToPickup).toList();

  /// Fetch backhaul opportunities
  Future<void> fetchOpportunities() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.get(ApiConfig.backhaulOpportunities);

      if (response.data['success'] == true) {
        final data = response.data['data'] as List;
        _opportunities = data.map((b) => BackhaulPickup.fromJson(b)).toList();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Check for backhaul opportunities after delivery completion
  /// Called when truck is empty and returning to hub
  Future<List<BackhaulPickup>> checkOpportunities({
    required String truckId,
    required double currentLat,
    required double currentLng,
    double? destinationLat,
    double? destinationLng,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        ApiConfig.checkBackhaulOpportunities,
        data: {
          'truckId': truckId,
          'currentLat': currentLat,
          'currentLng': currentLng,
          'destinationLat': destinationLat,
          'destinationLng': destinationLng,
        },
      );

      if (response.data['success'] == true) {
        final data = response.data['data'] as List;
        final opportunities = data
            .map((b) => BackhaulPickup.fromJson(b))
            .toList();
        _opportunities = [...opportunities, ..._opportunities];
        notifyListeners();
        return opportunities;
      }
      return [];
    } catch (e) {
      _error = e.toString();
      return [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Set active backhaul
  void setActiveBackhaul(BackhaulPickup backhaul) {
    _activeBackhaul = backhaul;
    notifyListeners();
  }

  /// Accept backhaul opportunity
  Future<bool> acceptBackhaul(String backhaulId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        '${ApiConfig.acceptBackhaul}/$backhaulId/accept',
      );

      if (response.data['success'] == true) {
        await fetchOpportunities();
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Reject backhaul opportunity
  Future<bool> rejectBackhaul(String backhaulId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        '${ApiConfig.acceptBackhaul}/$backhaulId/reject',
      );

      if (response.data['success'] == true) {
        await fetchOpportunities();
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Start pickup (en route)
  Future<bool> startPickup(String backhaulId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        '${ApiConfig.acceptBackhaul}/$backhaulId/start-pickup',
      );

      if (response.data['success'] == true) {
        await fetchOpportunities();
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Confirm pickup
  Future<bool> confirmPickup(String backhaulId, {List<String>? photos}) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final data = <String, dynamic>{};
      if (photos != null) {
        data['photos'] = photos;
      }

      final response = await _api.post(
        '${ApiConfig.acceptBackhaul}/$backhaulId/confirm-pickup',
        data: data,
      );

      if (response.data['success'] == true) {
        await fetchOpportunities();
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Complete delivery
  Future<bool> completeDelivery(
    String backhaulId, {
    List<String>? photos,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final data = <String, dynamic>{};
      if (photos != null) {
        data['photos'] = photos;
      }

      final response = await _api.post(
        '${ApiConfig.acceptBackhaul}/$backhaulId/complete',
        data: data,
      );

      if (response.data['success'] == true) {
        _activeBackhaul = null;
        await fetchOpportunities();
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear active backhaul
  void clearActiveBackhaul() {
    _activeBackhaul = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
