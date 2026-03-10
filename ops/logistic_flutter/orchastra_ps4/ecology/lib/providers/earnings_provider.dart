import 'package:flutter/foundation.dart';
import '../models/eway_bill_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

/// Earnings Provider — manages driver transactions and earnings.
/// Falls back to rich mock data if the API is offline.
class EarningsProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<Transaction> _transactions = [];
  double _totalEarnings = 0;
  double _weeklyEarnings = 0;
  double _todayEarnings = 0;
  bool _isLoading = false;
  String? _error;

  List<Transaction> get transactions => _transactions;
  double get totalEarnings => _totalEarnings;
  double get weeklyEarnings => _weeklyEarnings;
  double get todayEarnings => _todayEarnings;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch transactions — falls back to mock data if API is offline
  Future<void> fetchTransactions({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final queryParams = <String, dynamic>{};
      if (startDate != null)
        queryParams['startDate'] = startDate.toIso8601String();
      if (endDate != null) queryParams['endDate'] = endDate.toIso8601String();

      final response = await _api.get(
        ApiConfig.transactions,
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        if (data['transactions'] != null) {
          _transactions = (data['transactions'] as List)
              .map((t) => Transaction.fromJson(t))
              .toList();
        }
        _totalEarnings = (data['totalEarnings'] ?? 0).toDouble();
        _weeklyEarnings = (data['weeklyEarnings'] ?? 0).toDouble();
        _todayEarnings = (data['todayEarnings'] ?? 0).toDouble();
      }
    } catch (e) {
      debugPrint('⚠️ Earnings API failed, using mock data: $e');
      _loadMockData();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Populate rich mock earnings data for offline/demo mode
  void _loadMockData() {
    final now = DateTime.now();
    _transactions = [
      Transaction(
        id: 'txn-001',
        driverId: 'demo-driver-001',
        deliveryId: 'del-001',
        type: 'BASE_DELIVERY',
        amount: 5000,
        description: 'Mumbai → Pune Electronics Delivery',
        createdAt: now.subtract(const Duration(hours: 3)),
      ),
      Transaction(
        id: 'txn-002',
        driverId: 'demo-driver-001',
        deliveryId: 'del-001',
        type: 'BONUS',
        amount: 800,
        description: 'On-time delivery bonus',
        createdAt: now.subtract(const Duration(hours: 3)),
      ),
      Transaction(
        id: 'txn-003',
        driverId: 'demo-driver-001',
        deliveryId: 'del-003',
        type: 'BASE_DELIVERY',
        amount: 3200,
        description: 'Delhi → Jaipur Textiles Delivery',
        createdAt: now.subtract(const Duration(days: 1)),
      ),
      Transaction(
        id: 'txn-004',
        driverId: 'demo-driver-001',
        deliveryId: 'del-004',
        type: 'BACKHAUL_BONUS',
        amount: 1500,
        description: 'Backhaul pickup — return trip bonus',
        createdAt: now.subtract(const Duration(days: 1, hours: 4)),
      ),
      Transaction(
        id: 'txn-005',
        driverId: 'demo-driver-001',
        deliveryId: 'del-005',
        type: 'BASE_DELIVERY',
        amount: 4200,
        description: 'Bangalore → Chennai Automotive Parts',
        createdAt: now.subtract(const Duration(days: 2)),
      ),
      Transaction(
        id: 'txn-006',
        driverId: 'demo-driver-001',
        deliveryId: 'del-005',
        type: 'MARKETPLACE_BONUS',
        amount: 1200,
        description: 'Safe driving bonus',
        createdAt: now.subtract(const Duration(days: 2)),
      ),
      Transaction(
        id: 'txn-007',
        driverId: 'demo-driver-001',
        deliveryId: 'del-007',
        type: 'BASE_DELIVERY',
        amount: 2800,
        description: 'Hyderabad → Visakhapatnam FMCG',
        createdAt: now.subtract(const Duration(days: 3)),
      ),
    ];

    _todayEarnings = _transactions
        .where(
          (t) => t.createdAt.isAfter(now.subtract(const Duration(hours: 24))),
        )
        .fold(0.0, (sum, t) => sum + t.amount);
    _weeklyEarnings = _transactions
        .where(
          (t) => t.createdAt.isAfter(now.subtract(const Duration(days: 7))),
        )
        .fold(0.0, (sum, t) => sum + t.amount);
    _totalEarnings = _transactions.fold(0.0, (sum, t) => sum + t.amount);
  }

  List<Transaction> getByType(String type) =>
      _transactions.where((t) => t.type == type).toList();

  double getTotalByType(String type) =>
      getByType(type).fold(0, (sum, t) => sum + t.amount);

  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Inject demo earnings directly — used by DemoAutoPlayProvider
  void addMockEarnings(double amount) {
    final t = Transaction(
      id: 'demo-txn-${DateTime.now().millisecondsSinceEpoch}',
      driverId: 'demo_driver_001',
      deliveryId: 'demo-delivery-001',
      amount: amount,
      type: 'BASE',
      description: 'FairDispatch Demo Delivery — Mumbai → Pune',
      route: 'Mumbai Hub → Pune Warehouse',
      createdAt: DateTime.now(),
    );
    _transactions = [t, ..._transactions];
    _todayEarnings += amount;
    _weeklyEarnings += amount;
    _totalEarnings += amount;
    notifyListeners();
  }
}
