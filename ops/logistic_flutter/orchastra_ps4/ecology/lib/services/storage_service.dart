import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import '../config/constants.dart';

/// Storage Service - Hive-based offline cache
class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;

  late Box _settingsBox;
  late Box _cacheBox;
  late Box _pendingRequestsBox;
  bool _isInitialized = false;

  StorageService._internal();

  bool get isInitialized => _isInitialized;

  /// Initialize Hive storage
  Future<void> init() async {
    if (_isInitialized) return;

    await Hive.initFlutter();

    _settingsBox = await Hive.openBox(AppConstants.settingsBox);
    _cacheBox = await Hive.openBox(AppConstants.cacheBox);
    _pendingRequestsBox = await Hive.openBox(AppConstants.pendingRequestsBox);

    _isInitialized = true;
  }

  // ==================== Settings ====================

  /// Get a setting value
  T? getSetting<T>(String key, {T? defaultValue}) {
    return _settingsBox.get(key, defaultValue: defaultValue);
  }

  /// Set a setting value
  Future<void> setSetting<T>(String key, T value) async {
    await _settingsBox.put(key, value);
  }

  /// Remove a setting
  Future<void> removeSetting(String key) async {
    await _settingsBox.delete(key);
  }

  // ==================== Cache ====================

  /// Cache data with optional expiry
  Future<void> cache(String key, dynamic data, {Duration? expiry}) async {
    final cacheEntry = {
      'data': jsonEncode(data),
      'timestamp': DateTime.now().toIso8601String(),
      'expiry': expiry?.inMilliseconds,
    };
    await _cacheBox.put(key, cacheEntry);
  }

  /// Get cached data
  T? getCache<T>(String key, T Function(Map<String, dynamic>) fromJson) {
    final entry = _cacheBox.get(key);
    if (entry == null) return null;

    // Check expiry
    if (entry['expiry'] != null) {
      final timestamp = DateTime.parse(entry['timestamp']);
      final expiry = Duration(milliseconds: entry['expiry']);
      if (DateTime.now().isAfter(timestamp.add(expiry))) {
        _cacheBox.delete(key);
        return null;
      }
    }

    try {
      final data = jsonDecode(entry['data']);
      return fromJson(data);
    } catch (e) {
      return null;
    }
  }

  /// Get cached list
  List<T> getCacheList<T>(
    String key,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final entry = _cacheBox.get(key);
    if (entry == null) return [];

    // Check expiry
    if (entry['expiry'] != null) {
      final timestamp = DateTime.parse(entry['timestamp']);
      final expiry = Duration(milliseconds: entry['expiry']);
      if (DateTime.now().isAfter(timestamp.add(expiry))) {
        _cacheBox.delete(key);
        return [];
      }
    }

    try {
      final data = jsonDecode(entry['data']) as List;
      return data
          .map((item) => fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Delete cached data
  Future<void> deleteCache(String key) async {
    await _cacheBox.delete(key);
  }

  /// Clear all cache
  Future<void> clearCache() async {
    await _cacheBox.clear();
  }

  // ==================== Pending Requests ====================

  /// Queue a request for later (when offline)
  Future<void> queueRequest(Map<String, dynamic> request) async {
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    await _pendingRequestsBox.put(id, {
      'id': id,
      'request': jsonEncode(request),
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  /// Get all pending requests
  List<Map<String, dynamic>> getPendingRequests() {
    final requests = <Map<String, dynamic>>[];
    for (var key in _pendingRequestsBox.keys) {
      final entry = _pendingRequestsBox.get(key);
      if (entry != null) {
        requests.add({
          'id': entry['id'],
          'request': jsonDecode(entry['request']),
          'timestamp': entry['timestamp'],
        });
      }
    }
    return requests;
  }

  /// Remove a pending request
  Future<void> removePendingRequest(String id) async {
    await _pendingRequestsBox.delete(id);
  }

  /// Clear all pending requests
  Future<void> clearPendingRequests() async {
    await _pendingRequestsBox.clear();
  }

  /// Get count of pending requests
  int get pendingRequestCount => _pendingRequestsBox.length;

  // ==================== Utilities ====================

  /// Clear all data
  Future<void> clearAll() async {
    await _settingsBox.clear();
    await _cacheBox.clear();
    await _pendingRequestsBox.clear();
  }

  /// Close all boxes
  Future<void> close() async {
    await _settingsBox.close();
    await _cacheBox.close();
    await _pendingRequestsBox.close();
    _isInitialized = false;
  }
}

/// Cache keys for easy reference
class CacheKeys {
  static const String deliveries = 'cached_deliveries';
  static const String userProfile = 'cached_user_profile';
  static const String transactions = 'cached_transactions';
  static const String backhauls = 'cached_backhauls';
  static const String ewayBills = 'cached_eway_bills';
}
