import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/shipment_provider.dart';
import 'create_shipment_screen.dart';
import 'dispatcher_command_center.dart';
import 'track_shipment_screen.dart';
import 'shipment_detail_screen.dart';

/// Shipper Dashboard — LC light + orange theme
class ShipperDashboardScreen extends StatefulWidget {
  const ShipperDashboardScreen({super.key});
  @override
  State<ShipperDashboardScreen> createState() => _ShipperDashboardScreenState();
}

class _ShipperDashboardScreenState extends State<ShipperDashboardScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ShipmentProvider>().fetchMyShipments();
    });
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );
    return Scaffold(
      backgroundColor: LC.bg,
      body: IndexedStack(
        index: _currentIndex,
        children: const [_HomeTab(), _ShipmentsTab(), _ProfileTab()],
      ),
      bottomNavigationBar: _BottomNav(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
      ),
    );
  }
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final items = [
      _NavItem(icon: Icons.home_rounded, label: 'Home'),
      _NavItem(icon: Icons.local_shipping_outlined, label: 'Shipments'),
      _NavItem(icon: Icons.person_rounded, label: 'Profile'),
    ];
    return Container(
      decoration: BoxDecoration(
        color: LC.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
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
                          ? LC.primary.withValues(alpha: 0.1)
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
    final user = context.watch<AuthProvider>().currentUser;
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
        onRefresh: () => context.read<ShipmentProvider>().fetchMyShipments(),
        child: CustomScrollView(
          slivers: [
            // ── Header ──────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Container(
                color: LC.surface,
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            gradient: LC.orangeGrad,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Center(
                            child: Text(
                              user?.displayInitials ?? 'S',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
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
                                user?.name ?? 'Shipper',
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: LC.text1,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Notification dot
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
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Stats row
                    Consumer<ShipmentProvider>(
                      builder: (_, p, _) => Row(
                        children: [
                          _StatChip(
                            icon: Icons.local_shipping_rounded,
                            value: '${p.shipments.length}',
                            label: 'Total',
                            color: LC.primary,
                          ),
                          const SizedBox(width: 10),
                          _StatChip(
                            icon: Icons.pending_actions_rounded,
                            value:
                                '${p.shipments.where((s) => s.status == 'PENDING' || s.status == 'IN_TRANSIT').length}',
                            label: 'Active',
                            color: LC.warning,
                          ),
                          const SizedBox(width: 10),
                          _StatChip(
                            icon: Icons.check_circle_rounded,
                            value:
                                '${p.shipments.where((s) => s.status == 'COMPLETED' || s.status == 'DELIVERED').length}',
                            label: 'Done',
                            color: LC.success,
                          ),
                          const SizedBox(width: 10),
                          _StatChip(
                            icon: Icons.eco_rounded,
                            value: '87 kg',
                            label: 'CO₂ ↓',
                            color: const Color(0xFF2E7D32),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Quick Actions ────────────────────────────────────────────────
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
                    // ── 4-tile Row ──────────────────────────────────────────
                    Row(
                      children: [
                        _QuickAction(
                          icon: Icons.add_box_rounded,
                          label: 'New\nShipment',
                          color: LC.primary,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const CreateShipmentScreen(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.qr_code_scanner_rounded,
                          label: 'Track\nShipment',
                          color: LC.info,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const TrackShipmentScreen(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.analytics_rounded,
                          label: 'Analytics',
                          color: const Color(0xFF7B1FA2),
                          onTap: () => _showAnalyticsSheet(context),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.support_agent_rounded,
                          label: 'Support',
                          color: LC.success,
                          onTap: () => _showSupportDialog(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // ── Live Dispatch featured CTA ───────────────────────────
                    GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const DispatcherCommandCenter(),
                        ),
                      ),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              const Color(0xFF006064).withValues(alpha: 0.12),
                              const Color(0xFF00BCD4).withValues(alpha: 0.06),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: const Color(
                              0xFF00BCD4,
                            ).withValues(alpha: 0.35),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFF00BCD4,
                                ).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Center(
                                child: Text(
                                  '🎮',
                                  style: TextStyle(fontSize: 22),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Live Dispatch Command Center',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF006064),
                                    ),
                                  ),
                                  Text(
                                    'Real-time fleet map · Gini meter · AI allocation feed',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: LC.text2,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 14,
                              color: Color(0xFF00BCD4),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Recent Shipments header ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
                child: Text(
                  'Recent Shipments',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: LC.text1,
                  ),
                ),
              ),
            ),

            // ── Shipment cards ───────────────────────────────────────────────
            Consumer<ShipmentProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) {
                  return const SliverFillRemaining(
                    child: Center(
                      child: CircularProgressIndicator(color: LC.primary),
                    ),
                  );
                }
                if (provider.shipments.isEmpty) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.inventory_2_outlined,
                            size: 64,
                            color: LC.text3,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No shipments yet',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: LC.text2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Tap "New Shipment" to get started',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: LC.text3,
                            ),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const CreateShipmentScreen(),
                              ),
                            ),
                            icon: const Icon(Icons.add_rounded, size: 18),
                            label: const Text('Create Shipment'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: LC.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
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
                      (context, index) => _ShipmentCard(
                        shipment: provider.shipments[index],
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ShipmentDetailScreen(
                              shipment: provider.shipments[index],
                            ),
                          ),
                        ),
                      ),
                      childCount: provider.shipments.length,
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

// ── Shipments Tab (mirrors home list) ─────────────────────────────────────────
class _ShipmentsTab extends StatelessWidget {
  const _ShipmentsTab();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            color: LC.surface,
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            child: Text(
              'My Shipments',
              style: GoogleFonts.inter(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: LC.text1,
              ),
            ),
          ),
          Expanded(
            child: Consumer<ShipmentProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) {
                  return const Center(
                    child: CircularProgressIndicator(color: LC.primary),
                  );
                }
                if (provider.shipments.isEmpty) {
                  return Center(
                    child: Text(
                      'No shipments',
                      style: GoogleFonts.inter(color: LC.text2),
                    ),
                  );
                }
                return RefreshIndicator(
                  color: LC.primary,
                  onRefresh: () => provider.fetchMyShipments(),
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                    itemCount: provider.shipments.length,
                    itemBuilder: (context, index) => _ShipmentCard(
                      shipment: provider.shipments[index],
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ShipmentDetailScreen(
                            shipment: provider.shipments[index],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
class _ProfileTab extends StatelessWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 24),
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                gradient: LC.orangeGrad,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: LC.primary.withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  user?.displayInitials ?? 'S',
                  style: GoogleFonts.inter(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              user?.name ?? 'Shipper',
              style: GoogleFonts.inter(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: LC.text1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              user?.phone ?? '',
              style: GoogleFonts.inter(fontSize: 14, color: LC.text3),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: LC.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'SHIPPER',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: LC.primary,
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Info tiles
            _InfoTile(
              icon: Icons.business_rounded,
              label: 'Account Type',
              value: 'Business Shipper',
            ),
            _InfoTile(
              icon: Icons.verified_rounded,
              label: 'Status',
              value: user?.registrationStatus ?? 'PENDING',
            ),
            _InfoTile(
              icon: Icons.eco_rounded,
              label: 'CO₂ Saved',
              value: '87 kg this month',
            ),

            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await context.read<AuthProvider>().logout();
                },
                icon: const Icon(Icons.logout_rounded, color: LC.error),
                label: Text(
                  'Logout',
                  style: GoogleFonts.inter(
                    color: LC.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: LC.error),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared Widgets ────────────────────────────────────────────────────────────
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
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.2)),
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

Color _shipmentStatusColor(String s) {
  switch (s) {
    case 'PENDING':
      return LC.warning;
    case 'ASSIGNED':
    case 'IN_TRANSIT':
      return LC.info;
    case 'DELIVERED':
    case 'COMPLETED':
      return LC.success;
    case 'CANCELLED':
      return LC.error;
    default:
      return LC.text3;
  }
}

class _ShipmentCard extends StatelessWidget {
  final dynamic shipment;
  final VoidCallback onTap;
  const _ShipmentCard({required this.shipment, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final sColor = _shipmentStatusColor(shipment.status as String);
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
              color: Colors.black.withValues(alpha: 0.04),
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
                    color: sColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    shipment.statusDisplayName as String,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: sColor,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  (shipment.id as String).substring(
                    0,
                    (shipment.id as String).length > 8
                        ? 8
                        : (shipment.id as String).length,
                  ),
                  style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 12,
                  color: LC.text3,
                ),
              ],
            ),
            const SizedBox(height: 14),
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
                    Container(width: 2, height: 26, color: LC.border),
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
                        shipment.pickupLocation as String,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: LC.text1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 18),
                      Text(
                        shipment.dropLocation as String,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: LC.text1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.category_outlined, size: 13, color: LC.text3),
                const SizedBox(width: 4),
                Text(
                  shipment.cargoType as String,
                  style: GoogleFonts.inter(fontSize: 12, color: LC.text2),
                ),
                const SizedBox(width: 16),
                Icon(Icons.scale_outlined, size: 13, color: LC.text3),
                const SizedBox(width: 4),
                Text(
                  '${shipment.cargoWeight} kg',
                  style: GoogleFonts.inter(fontSize: 12, color: LC.text2),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label, value;
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: LC.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: LC.primary, size: 20),
          const SizedBox(width: 14),
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: LC.text2)),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: LC.text1,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Analytics Bottom Sheet ─────────────────────────────────────────────────────
void _showAnalyticsSheet(BuildContext context) {
  final provider = context.read<ShipmentProvider>();
  final shipments = provider.shipments;
  final total = shipments.length;
  final pending = shipments.where((s) => s.status == 'PENDING').length;
  final inTransit = shipments.where((s) => s.status == 'IN_TRANSIT').length;
  final delivered = shipments
      .where((s) => s.status == 'DELIVERED' || s.status == 'COMPLETED')
      .length;

  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => Container(
      decoration: const BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: LC.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Shipment Analytics',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: LC.text1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Overview of your shipment activity',
            style: GoogleFonts.inter(fontSize: 13, color: LC.text2),
          ),
          const SizedBox(height: 24),
          // Stats grid
          Row(
            children: [
              _AnalyticsTile(
                label: 'Total',
                value: '$total',
                color: LC.primary,
              ),
              const SizedBox(width: 12),
              _AnalyticsTile(
                label: 'Pending',
                value: '$pending',
                color: const Color(0xFFF9A825),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _AnalyticsTile(
                label: 'In Transit',
                value: '$inTransit',
                color: LC.info,
              ),
              const SizedBox(width: 12),
              _AnalyticsTile(
                label: 'Delivered',
                value: '$delivered',
                color: LC.success,
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Fulfilment rate
          Text(
            'Fulfilment Rate',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: LC.text2,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: total == 0 ? 0 : delivered / total,
              minHeight: 10,
              backgroundColor: LC.border,
              valueColor: const AlwaysStoppedAnimation<Color>(LC.success),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            total == 0
                ? '—'
                : '${((delivered / total) * 100).toStringAsFixed(0)}% of shipments delivered',
            style: GoogleFonts.inter(fontSize: 12, color: LC.text3),
          ),
        ],
      ),
    ),
  );
}

class _AnalyticsTile extends StatelessWidget {
  final String label, value;
  final Color color;
  const _AnalyticsTile({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: LC.text2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Support Dialog ─────────────────────────────────────────────────────────────
void _showSupportDialog(BuildContext context) {
  showDialog(
    context: context,
    builder: (_) => Dialog(
      backgroundColor: LC.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: LC.success.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.support_agent_rounded,
                color: LC.success,
                size: 28,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Contact Support',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: LC.text1,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'We\'re here to help 24/7',
              style: GoogleFonts.inter(fontSize: 13, color: LC.text2),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            _SupportButton(
              icon: Icons.chat_rounded,
              label: 'WhatsApp Us',
              hint: '+91 98765 43210',
              color: const Color(0xFF25D366),
            ),
            const SizedBox(height: 10),
            _SupportButton(
              icon: Icons.email_rounded,
              label: 'Email Support',
              hint: 'support@fairrelay.in',
              color: LC.primary,
            ),
            const SizedBox(height: 10),
            _SupportButton(
              icon: Icons.phone_rounded,
              label: 'Call Us',
              hint: '+91 1800-100-FAIR',
              color: LC.info,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  'Close',
                  style: GoogleFonts.inter(
                    color: LC.text2,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _SupportButton extends StatelessWidget {
  final IconData icon;
  final String label, hint;
  final Color color;
  const _SupportButton({
    required this.icon,
    required this.label,
    required this.hint,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: LC.text1,
                  ),
                ),
                Text(
                  hint,
                  style: GoogleFonts.inter(fontSize: 12, color: LC.text2),
                ),
              ],
            ),
            const Spacer(),
            Icon(Icons.chevron_right_rounded, color: LC.text3, size: 20),
          ],
        ),
      ),
    );
  }
}
