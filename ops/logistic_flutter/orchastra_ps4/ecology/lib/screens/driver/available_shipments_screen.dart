import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/shipment_provider.dart';
import '../../models/shipment_model.dart';

/// Available Shipments Screen — LC Light + Orange theme
class AvailableShipmentsScreen extends StatefulWidget {
  const AvailableShipmentsScreen({super.key});
  @override
  State<AvailableShipmentsScreen> createState() =>
      _AvailableShipmentsScreenState();
}

class _AvailableShipmentsScreenState extends State<AvailableShipmentsScreen> {
  String _sort = 'Earnings';
  final _sorts = ['Earnings', 'Distance', 'Weight'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ShipmentProvider>().fetchPendingShipments();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LC.bg,
      body: SafeArea(
        child: Consumer<ShipmentProvider>(
          builder: (context, provider, _) {
            List<Shipment> shipments = List.from(provider.pendingShipments);
            // Sort
            if (_sort == 'Earnings') {
              shipments.sort(
                (a, b) => (b.cargoWeight * 1000 + 500).compareTo(
                  a.cargoWeight * 1000 + 500,
                ),
              );
            } else if (_sort == 'Distance') {
              shipments.sort(
                (a, b) => a.pickupLocation.compareTo(b.pickupLocation),
              );
            } else {
              shipments.sort((a, b) => b.cargoWeight.compareTo(a.cargoWeight));
            }

            return RefreshIndicator(
              color: LC.primary,
              onRefresh: () => provider.fetchPendingShipments(),
              child: CustomScrollView(
                slivers: [
                  // Header
                  SliverToBoxAdapter(
                    child: Container(
                      color: LC.surface,
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Available Shipments',
                            style: GoogleFonts.inter(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: LC.text1,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${provider.pendingShipments.length} shipments waiting for a driver',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: LC.text3,
                            ),
                          ),
                          const SizedBox(height: 14),
                          // Sort chips
                          Row(
                            children: [
                              Text(
                                'Sort by:',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: LC.text2,
                                ),
                              ),
                              const SizedBox(width: 10),
                              ..._sorts.map((s) {
                                final sel = s == _sort;
                                return GestureDetector(
                                  onTap: () => setState(() => _sort = s),
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    margin: const EdgeInsets.only(right: 8),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: sel ? LC.primary : LC.surfaceAlt,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Text(
                                      s,
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: sel ? Colors.white : LC.text2,
                                      ),
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(
                    child: Divider(height: 1, color: LC.divider),
                  ),

                  if (provider.isLoading)
                    const SliverFillRemaining(
                      child: Center(
                        child: CircularProgressIndicator(color: LC.primary),
                      ),
                    )
                  else if (shipments.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.local_shipping_outlined,
                              size: 72,
                              color: LC.text3,
                            ),
                            const SizedBox(height: 14),
                            Text(
                              'No shipments right now',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: LC.text2,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Pull down to refresh',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: LC.text3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (ctx, i) => _ShipmentCard(
                            shipment: shipments[i],
                            index: i,
                            onAccept: () async {
                              HapticFeedback.mediumImpact();
                              final ok = await provider.acceptShipment(
                                shipments[i].id,
                              );
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      ok
                                          ? '✅ Shipment accepted! Check Home tab.'
                                          : provider.error ??
                                                'Failed to accept',
                                    ),
                                    backgroundColor: ok ? LC.success : LC.error,
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                              }
                            },
                          ),
                          childCount: shipments.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ShipmentCard extends StatelessWidget {
  final Shipment shipment;
  final int index;
  final VoidCallback onAccept;
  const _ShipmentCard({
    required this.shipment,
    required this.index,
    required this.onAccept,
  });

  double get _estEarnings => (shipment.cargoWeight * 1000) + 500;
  bool get _isUrgent => index == 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _isUrgent ? LC.primary.withOpacity(0.4) : LC.border,
        ),
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
          // Header band
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: _isUrgent ? LC.primary.withOpacity(0.06) : LC.surfaceAlt,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                if (_isUrgent)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    margin: const EdgeInsets.only(right: 10),
                    decoration: BoxDecoration(
                      color: LC.primary,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '🔥 HOT',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: LC.warning.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'NEW REQUEST',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: LC.warning,
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.category_outlined, size: 14, color: LC.text3),
                const SizedBox(width: 4),
                Text(
                  shipment.cargoType,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: LC.text2,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),

          // Route
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
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
                    Container(width: 2, height: 32, color: LC.border),
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
                        shipment.pickupLocation,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: LC.text1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 18),
                      Text(
                        shipment.dropLocation,
                        style: GoogleFonts.inter(fontSize: 13, color: LC.text2),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Info chips
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                _Chip(
                  icon: Icons.scale_outlined,
                  label: '${shipment.cargoWeight.toStringAsFixed(1)} T',
                ),
                const SizedBox(width: 8),
                _Chip(
                  icon: Icons.straighten_rounded,
                  label: '~${(shipment.cargoWeight * 80).toInt()} km',
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    gradient: LC.orangeGrad,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '₹${_estEarnings.toInt()}',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: onAccept,
                style: ElevatedButton.styleFrom(
                  backgroundColor: LC.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle_rounded, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Accept Shipment',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Chip({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: LC.surfaceAlt,
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: LC.text3),
        const SizedBox(width: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: LC.text2,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    ),
  );
}
