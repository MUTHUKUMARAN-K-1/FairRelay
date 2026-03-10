import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/delivery_model.dart';
import '../providers/delivery_provider.dart';
import '../providers/earnings_provider.dart';

/// DemoAutoPlayProvider — orchestrates the full hackathon demo pipeline:
///
/// Step 1: AI Decision flash          (0.5 s) — show FairDecisionCard
/// Step 2: Delivery appears           (1.0 s) — inject mock delivery
/// Step 3: Status → EN_ROUTE_PICKUP  (2.0 s) — animate progress
/// Step 4: Status → IN_TRANSIT       (3.0 s) — driver on the way
/// Step 5: Status → COMPLETED        (4.0 s) — delivery done
/// Step 6: Earnings update           (4.5 s) — ₹855 added to total
/// Step 7: Fairness debt cleared     (5.0 s) — show success card
class DemoAutoPlayProvider extends ChangeNotifier {
  bool _isPlaying = false;
  int _currentStep = 0; // 0 = idle, 1-7 = steps above
  String _statusText = '';
  Delivery? _demoDelivery;
  bool _showFairCard = false; // triggers FairDecisionCard display
  bool _completed = false;
  double _earningsAdded = 0;

  bool get isPlaying => _isPlaying;
  int get currentStep => _currentStep;
  String get statusText => _statusText;
  Delivery? get demoDelivery => _demoDelivery;
  bool get showFairCard => _showFairCard;
  bool get completed => _completed;
  double get earningsAdded => _earningsAdded;
  bool get isIdle => !_isPlaying && _currentStep == 0;

  static const double _mockFairnessDebt = 4200.0;
  static const double _deliveryEarnings = 855.0;

  double get currentFairnessDebt {
    if (_completed) return _mockFairnessDebt - _mockFairnessDebt; // cleared
    return _mockFairnessDebt;
  }

  /// Start the full demo sequence
  Future<void> startDemo({
    required DeliveryProvider deliveryProvider,
    required EarningsProvider earningsProvider,
  }) async {
    if (_isPlaying) return;
    _isPlaying = true;
    _completed = false;
    _earningsAdded = 0;
    _currentStep = 0;
    notifyListeners();

    // Step 1 — AI makes a decision
    _currentStep = 1;
    _statusText = '🤖  FairDispatch AI is analyzing available drivers…';
    notifyListeners();
    await Future.delayed(const Duration(milliseconds: 900));

    // Step 2 — Show FairDecisionCard signal
    _currentStep = 2;
    _statusText = '✅  You have been selected! Revealing AI decision…';
    _showFairCard = true; // Dashboard listens and shows the sheet
    notifyListeners();
    await Future.delayed(const Duration(milliseconds: 800));

    // Inject mock delivery into DeliveryProvider
    final delivery = _makeMockDelivery(status: 'ALLOCATED');
    _demoDelivery = delivery;
    deliveryProvider.injectMockDelivery(delivery);
    notifyListeners();

    // Wait for user to see FairDecisionCard (or auto-advance after 4s)
    await Future.delayed(const Duration(seconds: 4));
    _showFairCard = false;

    // Step 3 — En Route
    _currentStep = 3;
    _statusText = '🚛  Driver en route to pickup…';
    final enRoute = _makeMockDelivery(status: 'EN_ROUTE_TO_PICKUP');
    _demoDelivery = enRoute;
    deliveryProvider.injectMockDelivery(enRoute, replace: true);
    notifyListeners();
    await Future.delayed(const Duration(seconds: 2));

    // Step 4 — In Transit
    _currentStep = 4;
    _statusText = '📦  Cargo loaded — in transit!';
    final inTransit = _makeMockDelivery(status: 'IN_TRANSIT');
    _demoDelivery = inTransit;
    deliveryProvider.injectMockDelivery(inTransit, replace: true);
    notifyListeners();
    await Future.delayed(const Duration(seconds: 2));

    // Step 5 — Completed
    _currentStep = 5;
    _statusText = '🎉  Delivery completed!';
    final completed = _makeMockDelivery(status: 'COMPLETED');
    _demoDelivery = completed;
    deliveryProvider.injectMockDelivery(completed, replace: true);
    notifyListeners();
    await Future.delayed(const Duration(milliseconds: 800));

    // Step 6 — Earnings
    _currentStep = 6;
    _earningsAdded = _deliveryEarnings;
    _statusText = '💰  ₹${_deliveryEarnings.toInt()} added to your earnings!';
    earningsProvider.addMockEarnings(_deliveryEarnings);
    notifyListeners();
    await Future.delayed(const Duration(milliseconds: 800));

    // Step 7 — Fairness debt cleared
    _currentStep = 7;
    _completed = true;
    _statusText = '⚖️  Fairness debt balanced! Well done.';
    notifyListeners();
    await Future.delayed(const Duration(seconds: 2));

    // Reset
    _isPlaying = false;
    _currentStep = 0;
    _statusText = '';
    notifyListeners();
  }

  void dismissFairCard() {
    _showFairCard = false;
    notifyListeners();
  }

  void reset() {
    _isPlaying = false;
    _currentStep = 0;
    _statusText = '';
    _showFairCard = false;
    _completed = false;
    _earningsAdded = 0;
    notifyListeners();
  }

  static Delivery _makeMockDelivery({required String status}) {
    return Delivery(
      id: 'demo-delivery-001',
      dispatcherId: 'dispatcher-001',
      driverId: 'demo_driver_001',
      pickupLocation: 'Mumbai Hub, Andheri East',
      pickupLat: 19.1136,
      pickupLng: 72.8697,
      dropLocation: 'Pune Warehouse, Hinjewadi',
      dropLat: 18.5916,
      dropLng: 73.7377,
      cargoType: 'Electronics',
      cargoWeight: 2.5,
      cargoVolumeLtrs: 1200,
      packageId: 'PKG-DEMO-001',
      packageCount: 8,
      distanceKm: 148.0,
      baseEarnings: 650.0,
      marketplaceBonus: 120.0,
      absorptionBonus: 0.0,
      fuelSurcharge: 85.0,
      totalEarnings: 855.0,
      status: status,
      isMarketplaceLoad: false,
      createdAt: DateTime.now(),
      estimatedETA: DateTime.now().add(const Duration(hours: 3)),
    );
  }
}
