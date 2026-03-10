import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/delivery_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/delivery_provider.dart';
import '../../providers/earnings_provider.dart';
import '../../providers/shipment_provider.dart';
import '../../providers/demo_auto_play_provider.dart';
import '../../widgets/fair_decision_card.dart';
import 'active_delivery_screen.dart';
import 'available_shipments_screen.dart';
import 'driver_profile_screen.dart';
import 'earnings_screen.dart';
import 'fairness_stats_screen.dart';
import 'notifications_screen.dart';
import 'route_map_screen.dart';
import 'synergy_hub_screen.dart';
import 'cognitive_dashboard_screen.dart';
import '../wellness_checkin_screen.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});
  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  int _currentIndex = 0;
  bool _fairCardShown = false;

  final _pages = const [
    _HomeTab(),
    AvailableShipmentsScreen(),
    EarningsScreen(),
    DriverProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
    await context.read<DeliveryProvider>().fetchDeliveries();
    await context.read<ShipmentProvider>().fetchPendingShipments();
  }

  /// Called by DemoAutoPlayProvider signal — shows FairDecisionCard as bottom sheet
  Future<void> _onFairCardSignal(DemoAutoPlayProvider demo) async {
    if (_fairCardShown) return;
    _fairCardShown = true;
    final delivery = demo.demoDelivery;
    if (delivery == null) return;
    await FairDecisionCard.show(
      context,
      delivery: delivery,
      fairnessDebt: 4200,
      onAccept: () {
        // Switch to home tab to see delivery card
        setState(() => _currentIndex = 0);
      },
    );
    _fairCardShown = false;
    demo.dismissFairCard();
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );
    return Consumer<DemoAutoPlayProvider>(
      builder: (context, demo, child) {
        // React to showFairCard signal
        if (demo.showFairCard && !_fairCardShown) {
          WidgetsBinding.instance.addPostFrameCallback(
            (_) => _onFairCardSignal(demo),
          );
        }
        return Scaffold(
          backgroundColor: LC.bg,
          body: Stack(
            children: [
              IndexedStack(index: _currentIndex, children: _pages),
              // ── Demo status overlay ──────────────────────────────────────
              if (demo.isPlaying && demo.statusText.isNotEmpty)
                Positioned(
                  bottom: 100,
                  left: 16,
                  right: 16,
                  child: _DemoStatusBanner(
                    text: demo.statusText,
                    step: demo.currentStep,
                  ),
                ),
            ],
          ),
          bottomNavigationBar: _BottomNav(
            currentIndex: _currentIndex,
            onTap: (i) => setState(() => _currentIndex = i),
          ),
          floatingActionButton: _DemoFab(demo: demo),
          floatingActionButtonLocation:
              FloatingActionButtonLocation.centerDocked,
        );
      },
    );
  }
}

class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final items = [
      _NavItem(icon: Icons.home_rounded, label: 'Home'),
      _NavItem(icon: Icons.local_shipping_rounded, label: 'Shipments'),
      _NavItem(icon: Icons.account_balance_wallet_rounded, label: 'Earnings'),
      _NavItem(icon: Icons.person_rounded, label: 'Profile'),
    ];
    return Container(
      decoration: BoxDecoration(
        color: LC.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            children: items.asMap().entries.map((e) {
              final i = e.key;
              final item = e.value;
              final selected = i == currentIndex;
              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    onTap(i);
                    HapticFeedback.lightImpact();
                  },
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: selected
                          ? LC.primary.withOpacity(0.1)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          item.icon,
                          color: selected ? LC.primary : LC.text3,
                          size: 24,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: selected
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: selected ? LC.primary : LC.text3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  const _NavItem({required this.icon, required this.label});
}

// ── Home Tab ──────────────────────────────────────────────────────────────────
class _HomeTab extends StatelessWidget {
  const _HomeTab();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;
    final now = DateTime.now();
    final hour = now.hour;
    final greeting = hour < 12
        ? '🌅 Good Morning'
        : hour < 17
        ? '☀️ Good Afternoon'
        : '🌙 Good Evening';

    return SafeArea(
      child: RefreshIndicator(
        color: LC.primary,
        onRefresh: () => context.read<DeliveryProvider>().fetchDeliveries(),
        child: CustomScrollView(
          slivers: [
            // ── Header ────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(color: LC.surface),
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top row
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const DriverProfileScreen(),
                            ),
                          ),
                          child: Container(
                            width: 46,
                            height: 46,
                            decoration: BoxDecoration(
                              gradient: LC.orangeGrad,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Center(
                              child: Text(
                                user?.displayInitials ?? 'D',
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                greeting,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: LC.text2,
                                ),
                              ),
                              Text(
                                user?.name ?? 'Driver',
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: LC.text1,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Notification bell with badge
                        GestureDetector(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const NotificationsScreen(),
                            ),
                          ),
                          child: Stack(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: LC.surfaceAlt,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.notifications_outlined,
                                  color: LC.text1,
                                  size: 22,
                                ),
                              ),
                              Positioned(
                                right: 8,
                                top: 8,
                                child: Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                    color: LC.primary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Stats Row
                    Row(
                      children: [
                        _StatChip(
                          icon: Icons.local_shipping_rounded,
                          value: '${user?.deliveriesCount ?? 312}',
                          label: 'Done',
                          color: LC.primary,
                        ),
                        const SizedBox(width: 10),
                        _StatChip(
                          icon: Icons.star_rounded,
                          value: '${(user?.rating ?? 4.8).toStringAsFixed(1)}',
                          label: 'Rating',
                          color: const Color(0xFFF9A825),
                        ),
                        const SizedBox(width: 10),
                        _StatChip(
                          icon: Icons.currency_rupee_rounded,
                          value: '₹${(user?.weeklyEarnings ?? 8420).toInt()}',
                          label: 'Week',
                          color: LC.success,
                        ),
                        const SizedBox(width: 10),
                        _StatChip(
                          icon: Icons.eco_rounded,
                          value: '143 kg',
                          label: 'CO₂ ↓',
                          color: const Color(0xFF2E7D32),
                        ),
                      ],
                    ), // end stats Row

                    const SizedBox(height: 14),

                    // ── Fairness Debt Live Counter ─────────────────────────
                    Consumer<DemoAutoPlayProvider>(
                      builder: (context, demo, _) {
                        final debt = demo.completed ? 0.0 : 4200.0;
                        final isCleared = demo.completed;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 600),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: isCleared
                                  ? [
                                      LC.success.withValues(alpha: 0.12),
                                      LC.success.withValues(alpha: 0.04),
                                    ]
                                  : [
                                      LC.primary.withValues(alpha: 0.12),
                                      LC.primary.withValues(alpha: 0.04),
                                    ],
                            ),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isCleared
                                  ? LC.success.withValues(alpha: 0.3)
                                  : LC.primary.withValues(alpha: 0.25),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isCleared
                                    ? Icons.check_circle_rounded
                                    : Icons.balance_rounded,
                                color: isCleared ? LC.success : LC.primary,
                                size: 20,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      isCleared
                                          ? '✅ Fairness Debt Cleared!'
                                          : 'Your Fairness Debt: ₹${debt.toInt()}',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: isCleared
                                            ? LC.success
                                            : LC.primary,
                                      ),
                                    ),
                                    Text(
                                      isCleared
                                          ? 'AI balanced the ledger — great work!'
                                          : 'AI will prioritize your next ${(debt / 1500).ceil()} deliveries',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: LC.text2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: (isCleared ? LC.success : LC.primary)
                                      .withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  isCleared ? 'BALANCED' : 'AI OWES YOU',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: isCleared ? LC.success : LC.primary,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),

            // ── Quick Action Buttons ────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Actions',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: LC.text3,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _QuickAction(
                          icon: Icons.map_rounded,
                          label: 'Route\nMap',
                          color: LC.primary,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const RouteMapScreen(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.bar_chart_rounded,
                          label: 'Fairness\nStats',
                          color: const Color(0xFF2E7D32),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const FairnessStatsScreen(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.hub_rounded,
                          label: 'Synergy\nHub',
                          color: LC.info,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const SynergyHubScreen(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.health_and_safety_rounded,
                          label: 'Wellness\nCheck',
                          color: const Color(0xFF6A1B9A),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const WellnessCheckInScreen(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _QuickAction(
                          icon: Icons.psychology_rounded,
                          label: 'Brain\nLoad',
                          color: const Color(0xFF0891B2),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const CognitiveDashboardScreen(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── Live Delivery Banner (if active) ───────────────────────────
            Consumer<DeliveryProvider>(
              builder: (context, provider, _) {
                final active = provider.activeDeliveries;
                if (active.isEmpty)
                  return const SliverToBoxAdapter(child: SizedBox());
                final d = active.first;
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: GestureDetector(
                      onTap: () {
                        context.read<DeliveryProvider>().setActiveDelivery(d);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const ActiveDeliveryScreen(),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LC.orangeGrad,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: LC.primary.withOpacity(0.3),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.navigation_rounded,
                                color: Colors.white,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Live Delivery',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: Colors.white70,
                                    ),
                                  ),
                                  Text(
                                    d.pickupLocation,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Tap to open map',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: Colors.white70,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF76FF03),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Live',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),

            // ── Assigned Deliveries ────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Assigned Deliveries',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: LC.text1,
                      ),
                    ),
                    Consumer<DeliveryProvider>(
                      builder: (_, p, __) => Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: LC.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${p.activeDeliveries.length} active',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: LC.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Delivery list
            Consumer<DeliveryProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) {
                  return const SliverFillRemaining(
                    child: Center(
                      child: CircularProgressIndicator(color: LC.primary),
                    ),
                  );
                }
                if (provider.deliveries.isEmpty) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.inbox_rounded, size: 64, color: LC.text3),
                          const SizedBox(height: 12),
                          Text(
                            'No deliveries yet',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: LC.text2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'New deliveries will appear here',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: LC.text3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _DeliveryCard(
                        delivery: provider.deliveries[index],
                        onTap: () {
                          provider.setActiveDelivery(
                            provider.deliveries[index],
                          );
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ActiveDeliveryScreen(),
                            ),
                          );
                        },
                      ),
                      childCount: provider.deliveries.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Stat Chip ─────────────────────────────────────────────────────────────────
class _StatChip extends StatelessWidget {
  final IconData icon;
  final String value, label;
  final Color color;
  const _StatChip({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: LC.bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: LC.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: LC.text1,
              ),
            ),
            Text(label, style: GoogleFonts.inter(fontSize: 9, color: LC.text3)),
          ],
        ),
      ),
    );
  }
}

// ── Quick Action ──────────────────────────────────────────────────────────────
class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 26),
              const SizedBox(height: 6),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: color,
                  height: 1.2,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Delivery Card ─────────────────────────────────────────────────────────────
class _DeliveryCard extends StatelessWidget {
  final Delivery delivery;
  final VoidCallback onTap;
  const _DeliveryCard({required this.delivery, required this.onTap});

  Color _statusColor(String s) {
    switch (s) {
      case 'PENDING':
      case 'ALLOCATED':
        return LC.warning;
      case 'IN_TRANSIT':
      case 'EN_ROUTE_TO_PICKUP':
      case 'EN_ROUTE_TO_DROP':
        return LC.info;
      case 'COMPLETED':
        return LC.success;
      case 'CANCELLED':
        return LC.error;
      default:
        return LC.text3;
    }
  }

  @override
  Widget build(BuildContext context) {
    final sColor = _statusColor(delivery.status);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: LC.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: LC.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: sColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    delivery.statusDisplayName,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: sColor,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '₹${delivery.totalEarnings.toInt()}',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: LC.success,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            // Route timeline
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: LC.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    Container(width: 2, height: 28, color: LC.border),
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: LC.success,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        delivery.pickupLocation,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: LC.text1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        delivery.dropLocation,
                        style: GoogleFonts.inter(fontSize: 13, color: LC.text2),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(height: 1, color: LC.divider),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.inventory_2_outlined, size: 14, color: LC.text3),
                const SizedBox(width: 4),
                Text(
                  '${delivery.cargoWeight.toStringAsFixed(1)} kg',
                  style: GoogleFonts.inter(fontSize: 12, color: LC.text2),
                ),
                const SizedBox(width: 14),
                Icon(Icons.straighten_outlined, size: 14, color: LC.text3),
                const SizedBox(width: 4),
                Text(
                  '${delivery.distanceKm?.toStringAsFixed(1) ?? '-'} km',
                  style: GoogleFonts.inter(fontSize: 12, color: LC.text2),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    gradient: LC.orangeGrad,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'View',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Demo Status Banner ────────────────────────────────────────────────────────
class _DemoStatusBanner extends StatelessWidget {
  final String text;
  final int step;
  const _DemoStatusBanner({required this.text, required this.step});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E).withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Step indicator dots
            SizedBox(
              width: 44,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$step/7',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: LC.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: step / 7,
                      minHeight: 4,
                      backgroundColor: Colors.white.withValues(alpha: 0.15),
                      valueColor: AlwaysStoppedAnimation<Color>(LC.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
            // Pulsing AI dot
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: LC.primary,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Demo FAB ──────────────────────────────────────────────────────────────────
class _DemoFab extends StatelessWidget {
  final DemoAutoPlayProvider demo;
  const _DemoFab({required this.demo});

  @override
  Widget build(BuildContext context) {
    if (demo.isPlaying) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: FloatingActionButton.extended(
        onPressed: () {
          final deliveryProvider = context.read<DeliveryProvider>();
          final earningsProvider = context.read<EarningsProvider>();
          demo.startDemo(
            deliveryProvider: deliveryProvider,
            earningsProvider: earningsProvider,
          );
        },
        backgroundColor: LC.primary,
        elevation: 6,
        icon: const Icon(
          Icons.play_circle_filled_rounded,
          color: Colors.white,
          size: 22,
        ),
        label: Text(
          '▶  Watch Live Demo',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
