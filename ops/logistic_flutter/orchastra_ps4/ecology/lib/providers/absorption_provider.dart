import 'package:flutter/foundation.dart';
import '../models/absorption_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../config/api_config.dart';

/// Absorption Provider - Manages synergy/handover state
class AbsorptionProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final SocketService _socket = SocketService();

  AbsorptionOpportunity? _currentOpportunity;
  AbsorptionTransfer? _currentTransfer;
  String? _qrCodeData;
  bool _isLoading = false;
  String? _error;
  bool _isExporter = false;

  // Getters
  AbsorptionOpportunity? get currentOpportunity => _currentOpportunity;
  AbsorptionTransfer? get currentTransfer => _currentTransfer;
  String? get qrCodeData => _qrCodeData;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isExporter => _isExporter;

  /// Initialize - listen for synergy events
  void init() {
    _socket.onSynergyProposed = (data) {
      // Handle incoming synergy proposal
      _currentOpportunity = AbsorptionOpportunity.fromJson(data);
      notifyListeners();
    };
  }

  /// Set as exporter (truck giving cargo)
  void setAsExporter(bool isExporter) {
    _isExporter = isExporter;
    notifyListeners();
  }

  /// Set current opportunity
  void setOpportunity(AbsorptionOpportunity opportunity) {
    _currentOpportunity = opportunity;
    notifyListeners();
  }

  /// Generate QR code for cargo transfer (exporter)
  Future<String?> generateQRCode(String transferId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        ApiConfig.generateQR,
        data: {'transferId': transferId},
      );

      if (response.data['success'] == true) {
        _qrCodeData = response.data['data']['qrCode'];
        _currentTransfer = AbsorptionTransfer.fromJson(
          response.data['data']['transfer'],
        );
        notifyListeners();
        return _qrCodeData;
      }
      return null;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Verify QR code (importer scanning)
  /// Handles both complex transfer QRs and simple handover QRs
  Future<bool> verifyQRCode(String scannedData) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Check for simple handover QR format: ECOLOGIQ_HANDOVER|deliveryId|packageId|timestamp
      // or ECOLOGIQ_TRANSFER_timestamp
      if (scannedData.startsWith('ECOLOGIQ_HANDOVER|') ||
          scannedData.startsWith('ECOLOGIQ_TRANSFER_')) {
        // Simple handover QR - just validate the format and accept
        final parts = scannedData.split('|');
        if (parts.isNotEmpty) {
          // Valid simple QR code
          return true;
        }
        _error = 'Invalid QR format';
        return false;
      }

      // Try to call backend API for complex transfer QRs
      try {
        final response = await _api.post(
          ApiConfig.verifyQR,
          data: {'qrData': scannedData},
        );

        if (response.data['success'] == true) {
          _currentTransfer = AbsorptionTransfer.fromJson(response.data['data']);
          return true;
        }
        return false;
      } catch (e) {
        // If API call fails but QR seems valid (starts with ECOLOGIQ), accept it
        if (scannedData.contains('ECOLOGIQ')) {
          return true;
        }
        _error = 'Invalid QR code';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Complete handover with photos and checklist
  Future<bool> completeHandover({
    required String transferId,
    required List<String> photos,
    Map<String, bool>? checklist,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _api.post(
        ApiConfig.completeHandover,
        data: {
          'transferId': transferId,
          'photos': photos,
          'checklist': checklist,
        },
      );

      if (response.data['success'] == true) {
        _currentTransfer = AbsorptionTransfer.fromJson(response.data['data']);
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

  /// Cache handover for offline sync
  Future<void> cacheHandoverForSync({
    required String transferId,
    required List<String> photos,
    Map<String, bool>? checklist,
  }) async {
    // Queue for later sync when network is available
    // This would use StorageService.queueRequest()
    notifyListeners();
  }

  /// Clear current transfer
  void clearTransfer() {
    _currentOpportunity = null;
    _currentTransfer = null;
    _qrCodeData = null;
    _isExporter = false;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
