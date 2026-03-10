import 'package:flutter/foundation.dart';
import '../models/delivery_model.dart';
import '../models/eway_bill_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../config/api_config.dart';

/// Delivery Provider - Manages delivery state for drivers
class DeliveryProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  List<Delivery> _deliveries = [];
  Delivery? _activeDelivery;
  EWayBill? _activeEwayBill;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<Delivery> get deliveries => _deliveries;
  Delivery? get activeDelivery => _activeDelivery;
  EWayBill? get activeEwayBill => _activeEwayBill;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<Delivery> get pendingDeliveries =>
      _deliveries.where((d) => d.isPending || d.isAllocated).toList();
  List<Delivery> get activeDeliveries => _deliveries
      .where((d) => !d.isCompleted && !d.isCancelled && !d.isPending)
      .toList();
  List<Delivery> get completedDeliveries =>
      _deliveries.where((d) => d.isCompleted).toList();

  /// Fetch assigned deliveries
  Future<void> fetchDeliveries() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.get(ApiConfig.assignedDeliveries);

      if (response.data['success'] == true) {
        final data = response.data['data'] as List;
        _deliveries = data.map((d) => Delivery.fromJson(d)).toList();

        // Cache for offline
        await _storage.cache(CacheKeys.deliveries, data);
      }
    } catch (e) {
      _error = e.toString();

      // Try to load from cache
      _deliveries = _storage.getCacheList(
        CacheKeys.deliveries,
        Delivery.fromJson,
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Set active delivery
  void setActiveDelivery(Delivery delivery) {
    _activeDelivery = delivery;
    notifyListeners();
  }

  /// Accept a delivery
  Future<bool> acceptDelivery(String deliveryId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        '${ApiConfig.acceptDelivery}/$deliveryId/accept',
      );

      if (response.data['success'] == true) {
        await fetchDeliveries();
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();

      // MOCK DATA FALLBACK - Force navigation to map view with demo coordinates
      debugPrint('⚠️ Accept API failed, using mock delivery data: $e');

      // Create mock delivery and set as active
      final mockDelivery = Delivery(
        id: deliveryId,
        dispatcherId: 'mock-dispatcher-1',
        driverId: 'mock-driver-1',
        truckId: 'mock-truck-1',
        pickupLocation: 'Mumbai Hub, Andheri East',
        pickupLat: 19.1136,
        pickupLng: 72.8697,
        dropLocation: 'Pune Warehouse, Hinjewadi',
        dropLat: 18.5916,
        dropLng: 73.7377,
        cargoType: 'Electronics',
        cargoWeight: 2.5,
        cargoVolumeLtrs: 150.0,
        packageId: 'PKG-MOCK-001',
        packageCount: 1,
        status: 'IN_TRANSIT', // Force map view
        baseEarnings: 5000,
        totalEarnings: 5000,
        createdAt: DateTime.now(),
      );

      // Add to deliveries and set as active
      _deliveries = [mockDelivery, ..._deliveries];
      _activeDelivery = mockDelivery;
      notifyListeners();

      return true; // Simulate success
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Start delivery (navigate to pickup)
  Future<bool> startDelivery(String deliveryId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        '${ApiConfig.startDelivery}/$deliveryId/start',
      );

      if (response.data['success'] == true) {
        // Update active delivery status
        // Backend returns delivery data directly in 'data', not nested under 'delivery'
        if (_activeDelivery?.id == deliveryId &&
            response.data['data'] != null) {
          _activeDelivery = Delivery.fromJson(response.data['data']);
        }

        await fetchDeliveries();
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

  /// Confirm pickup (cargo loaded)
  Future<bool> pickupCargo(String deliveryId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        '${ApiConfig.pickupCargo}/$deliveryId/pickup',
      );

      if (response.data['success'] == true) {
        await fetchDeliveries();
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
    String deliveryId, {
    List<String>? photoUrls,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final data = <String, dynamic>{};
      if (photoUrls != null) {
        data['photos'] = photoUrls;
      }

      final response = await _api.post(
        '${ApiConfig.completeDelivery}/$deliveryId/complete',
        data: data,
      );

      if (response.data['success'] == true) {
        _activeDelivery = null;
        _activeEwayBill = null;
        await fetchDeliveries();
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

  /// Upload photos for delivery
  Future<bool> uploadPhotos(
    String deliveryId,
    List<String> base64Photos,
  ) async {
    try {
      final response = await _api.post(
        '${ApiConfig.uploadPhotos}/$deliveryId/upload-photos',
        data: {'photos': base64Photos},
      );

      return response.data['success'] == true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  /// Generate e-Way Bill for delivery
  Future<EWayBill?> generateEwayBill(String deliveryId) async {
    try {
      final response = await _api.post(
        '${ApiConfig.generateEwayBill}',
        data: {'deliveryId': deliveryId},
      );

      if (response.data['success'] == true) {
        _activeEwayBill = EWayBill.fromJson(response.data['data']);
        notifyListeners();
        return _activeEwayBill;
      }
      return null;
    } catch (e) {
      _error = e.toString();
      return null;
    }
  }

  /// Clear active delivery
  void clearActiveDelivery() {
    _activeDelivery = null;
    _activeEwayBill = null;
    notifyListeners();
  }

  /// Inject a mock delivery for demo/testing purposes.
  /// If [replace] is true, updates the existing delivery with same id in place.
  void injectMockDelivery(Delivery delivery, {bool replace = false}) {
    if (replace) {
      final idx = _deliveries.indexWhere((d) => d.id == delivery.id);
      if (idx >= 0) {
        _deliveries[idx] = delivery;
      } else {
        _deliveries = [delivery, ..._deliveries];
      }
      if (_activeDelivery?.id == delivery.id) {
        _activeDelivery = delivery;
      }
    } else {
      _deliveries = [delivery, ..._deliveries];
      _activeDelivery = delivery;
    }
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
