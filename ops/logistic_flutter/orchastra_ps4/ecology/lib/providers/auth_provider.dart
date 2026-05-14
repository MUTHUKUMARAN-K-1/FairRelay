import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/socket_service.dart';

/// Authentication Provider - Manages login state
class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();
  final SocketService _socketService = SocketService();

  User? _currentUser;
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _error;
  String _selectedRole = 'DRIVER';
  String? _devOtp; // populated in dev mode when backend returns the OTP

  // Getters
  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _currentUser != null;
  bool get isInitialized => _isInitialized;
  String? get error => _error;
  String get selectedRole => _selectedRole;
  String? get devOtp => _devOtp;

  bool get isDriver => _currentUser?.role == 'DRIVER';
  bool get isShipper => _currentUser?.role == 'SHIPPER';
  bool get isDispatcher => _currentUser?.role == 'DISPATCHER';

  /// Initialize provider - check existing session
  Future<void> init() async {
    if (_isInitialized) return;

    try {
      _isLoading = true;
      notifyListeners();

      // Initialize storage
      await _storageService.init();

      // Check if logged in
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        // Try to get profile
        try {
          _currentUser = await _authService.getProfile();

          // Connect socket
          final token = await _authService.getToken();
          _socketService.connect(token: token, userId: _currentUser?.id);
        } catch (e) {
          // Token might be expired, clear and require login
          await _authService.logout();
        }
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  /// Set selected role for registration
  void setSelectedRole(String role) {
    _selectedRole = role;
    notifyListeners();
  }

  /// Send OTP to phone
  Future<bool> sendOTP(String phone) async {
    try {
      _isLoading = true;
      _error = null;
      _devOtp = null;
      notifyListeners();

      final success = await _authService.sendOTP(phone);
      // sendOTP returns bool — dev OTP is surfaced via AuthService.lastDevOtp
      _devOtp = _authService.lastDevOtp;
      return success;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Verify OTP and login
  Future<bool> verifyOTP(String phone, String otp) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _currentUser = await _authService.verifyOTP(phone, otp, _selectedRole);
      await _authService.saveUserData(_currentUser!);

      // Connect socket
      final token = await _authService.getToken();
      _socketService.connect(token: token, userId: _currentUser?.id);

      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Refresh user profile
  Future<void> refreshProfile() async {
    try {
      _currentUser = await _authService.getProfile();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      _isLoading = true;
      notifyListeners();

      await _authService.logout();
      _socketService.disconnect();

      _currentUser = null;
      _error = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// 🧪 DEMO BYPASS — skip Twilio OTP, inject mock user for hackathon demo
  void bypassLogin() {
    _currentUser = User(
      id: 'demo_${_selectedRole.toLowerCase()}_001',
      name: _selectedRole == 'DRIVER' ? 'Demo Driver' : 'Demo Shipper',
      phone: '+919999999999',
      role: _selectedRole,
      status: 'ON_DUTY',
      weeklyEarnings: 12450.0,
      deliveriesCount: 47,
      rating: 4.8,
    );
    _isInitialized = true; // ← required: AuthWrapper checks isInitialized first
    _error = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
