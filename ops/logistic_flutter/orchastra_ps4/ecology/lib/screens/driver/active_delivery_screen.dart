import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_theme.dart';
import '../../providers/delivery_provider.dart';
import '../../providers/location_provider.dart';
import 'route_map_screen.dart';
import 'synergy_hub_screen.dart';

/// Active Delivery Screen — LC light+orange theme, no google_maps_flutter dependency
class ActiveDeliveryScreen extends StatefulWidget {
  const ActiveDeliveryScreen({super.key});
  @override
  State<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends State<ActiveDeliveryScreen> {
  @override
  void initState() {
    super.initState();
    context.read<LocationProvider>().startTracking();
  }

  @override
  void dispose() {
    context.read<LocationProvider>().stopTracking();
    super.dispose();
  }

  Future<void> _openGMaps(double lat, double lng) async {
    final loc = context.read<LocationProvider>();
    String url;
    if (loc.currentPosition != null) {
      url =
          'https://www.google.com/maps/dir/'
          '${loc.currentPosition!.latitude},${loc.currentPosition!.longitude}/'
          '$lat,$lng';
    } else {
      url = 'https://www.google.com/maps/search/?api=1&query=$lat,$lng';
    }
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri))
      await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LC.bg,
      body: Consumer<DeliveryProvider>(
        builder: (_, provider, __) {
          final delivery = provider.activeDelivery;
          if (delivery == null) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.local_shipping_outlined,
                    size: 64,
                    color: LC.text3,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No active delivery',
                    style: GoogleFonts.inter(fontSize: 16, color: LC.text2),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: LC.primary,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Go back'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // ── Mini Route Map Preview ──────────────────────────────────────
              GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RouteMapScreen()),
                ),
                child: Stack(
                  children: [
                    SizedBox(
                      height: 260,
                      child: const RouteMapScreen(miniMode: true),
                    ),
                    // Overlay "Open Map" chip
                    Positioned(
                      bottom: 14,
                      right: 14,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: LC.primary,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: LC.primary.withOpacity(0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.fullscreen_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Open Map',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Back button
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 8,
                      left: 12,
                      child: GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: LC.surface,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.arrow_back_ios_rounded,
                            color: LC.text1,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // ── Scrollable Delivery Details ─────────────────────────────────
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Status + earnings
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: LC.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              delivery.statusDisplayName,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: LC.primary,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '₹${delivery.totalEarnings.toInt()}',
                            style: GoogleFonts.inter(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: LC.success,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Route card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: LC.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: LC.border),
                        ),
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
                                Container(
                                  width: 2,
                                  height: 40,
                                  color: LC.border,
                                ),
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
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    delivery.pickupLocation,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: LC.text1,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 24),
                                  Text(
                                    delivery.dropLocation,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: LC.text2,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Info chips
                      Row(
                        children: [
                          _Chip(
                            icon: Icons.inventory_2_outlined,
                            label:
                                '${delivery.cargoWeight.toStringAsFixed(1)} kg',
                          ),
                          const SizedBox(width: 8),
                          _Chip(
                            icon: Icons.straighten_outlined,
                            label:
                                '${delivery.distanceKm?.toStringAsFixed(1) ?? '—'} km',
                          ),
                          const SizedBox(width: 8),
                          _Chip(
                            icon: Icons.category_outlined,
                            label: delivery.cargoType,
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Navigate buttons
                      Row(
                        children: [
                          Expanded(
                            child: _NavBtn(
                              icon: Icons.navigation_rounded,
                              label: 'Navigate to Pickup',
                              onTap: () => _openGMaps(
                                delivery.pickupLat,
                                delivery.pickupLng,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _NavBtn(
                              icon: Icons.location_on_rounded,
                              label: 'Navigate to Drop',
                              onTap: () => _openGMaps(
                                delivery.dropLat,
                                delivery.dropLng,
                              ),
                              primary: true,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      // Synergy Hub button
                      if (delivery.status == 'IN_TRANSIT' ||
                          delivery.status == 'CARGO_LOADED' ||
                          delivery.status == 'EN_ROUTE_TO_DROP')
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const SynergyHubScreen(),
                              ),
                            ),
                            icon: const Icon(Icons.sync_alt_rounded, size: 16),
                            label: Text(
                              'Synergy Hub — Transfer Cargo',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: LC.info,
                              side: BorderSide(color: LC.info),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),

                      const SizedBox(height: 16),

                      // Main CTA
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: ElevatedButton(
                          onPressed: provider.isLoading
                              ? null
                              : () =>
                                    _handleAction(context, provider, delivery),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: LC.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: provider.isLoading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  _actionLabel(delivery.status),
                                  style: GoogleFonts.inter(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _actionLabel(String status) {
    switch (status) {
      case 'ALLOCATED':
        return '▶  Start Delivery';
      case 'EN_ROUTE_TO_PICKUP':
        return '📦  Confirm Pickup';
      case 'CARGO_LOADED':
      case 'IN_TRANSIT':
      case 'EN_ROUTE_TO_DROP':
        return '✅  Complete Delivery';
      default:
        return 'Continue';
    }
  }

  Future<void> _handleAction(
    BuildContext ctx,
    DeliveryProvider provider,
    dynamic delivery,
  ) async {
    HapticFeedback.mediumImpact();
    bool success = false;
    switch (delivery.status) {
      case 'ALLOCATED':
        success = await provider.startDelivery(delivery.id);
        break;
      case 'EN_ROUTE_TO_PICKUP':
        success = await provider.pickupCargo(delivery.id);
        break;
      case 'CARGO_LOADED':
      case 'IN_TRANSIT':
      case 'EN_ROUTE_TO_DROP':
        success = await provider.completeDelivery(delivery.id);
        if (success && ctx.mounted) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            const SnackBar(
              content: Text('🎉 Delivery completed! Great work!'),
              backgroundColor: Color(0xFF2E7D32),
              behavior: SnackBarBehavior.floating,
            ),
          );
          Navigator.pop(ctx);
        }
        break;
    }
    if (!success && ctx.mounted) {
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Action failed'),
          backgroundColor: LC.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Chip({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
    decoration: BoxDecoration(
      color: LC.surfaceAlt,
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: LC.text3),
        const SizedBox(width: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: LC.text2)),
      ],
    ),
  );
}

class _NavBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool primary;
  const _NavBtn({
    required this.icon,
    required this.label,
    required this.onTap,
    this.primary = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
        decoration: BoxDecoration(
          color: primary ? LC.primary : LC.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
          boxShadow: primary
              ? [
                  BoxShadow(
                    color: LC.primary.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: primary ? Colors.white : LC.primary, size: 18),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: primary ? Colors.white : LC.primary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
