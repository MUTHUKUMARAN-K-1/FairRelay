import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';
import '../config/constants.dart';
import '../models/user_model.dart';
import 'api_service.dart';

/// Authentication Service - Handles OTP and JWT
class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;

  final ApiService _api = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  String? _lastDevOtp; // set in dev mode when backend returns OTP in response
  String? get lastDevOtp => _lastDevOtp;

  AuthService._internal();

  /// Send OTP to phone number
  Future<bool> sendOTP(String phone) async {
    try {
      _lastDevOtp = null;
      final response = await _api.post(
        ApiConfig.sendOtp,
        data: {'phone': phone},
      );
      final data = response.data;
      // Capture dev OTP if backend returned it (demo/dev mode)
      if (data['demo'] == true && data['otp'] != null) {
        _lastDevOtp = data['otp'].toString();
      }
      return data['success'] == true;
    } catch (e) {
      rethrow;
    }
  }

  /// Verify OTP and get JWT token
  Future<User> verifyOTP(String phone, String otp, String role) async {
    try {
      final response = await _api.post(
        ApiConfig.verifyOtp,
        data: {'phone': phone, 'otp': otp, 'role': role},
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];

        // Save token
        await _storage.write(key: AppConstants.tokenKey, value: data['token']);

        // Parse and return user
        return User.fromJson(data['user']);
      } else {
        throw ApiException(
          message: response.data['message'] ?? 'Verification failed',
        );
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Get current user profile
  Future<User> getProfile() async {
    try {
      final response = await _api.get(ApiConfig.profile);

      if (response.data['success'] == true) {
        return User.fromJson(response.data['data']);
      } else {
        throw ApiException(
          message: response.data['message'] ?? 'Failed to get profile',
        );
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Refresh access token
  Future<String> refreshToken(String refreshToken) async {
    try {
      final response = await _api.post(
        ApiConfig.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.data['success'] == true) {
        final newToken = response.data['data']['accessToken'];
        await _storage.write(key: AppConstants.tokenKey, value: newToken);
        return newToken;
      } else {
        throw ApiException(message: 'Failed to refresh token');
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: AppConstants.tokenKey);
    return token != null && token.isNotEmpty;
  }

  /// Get stored token
  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  /// Save user data locally
  Future<void> saveUserData(User user) async {
    await _storage.write(key: AppConstants.userKey, value: user.id);
    await _storage.write(key: AppConstants.roleKey, value: user.role);
  }

  /// Get stored user role
  Future<String?> getUserRole() async {
    return await _storage.read(key: AppConstants.roleKey);
  }

  /// Logout - Clear all stored data
  Future<void> logout() async {
    await _storage.delete(key: AppConstants.tokenKey);
    await _storage.delete(key: AppConstants.refreshTokenKey);
    await _storage.delete(key: AppConstants.userKey);
    await _storage.delete(key: AppConstants.roleKey);
  }

  /// Clear all secure storage
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
