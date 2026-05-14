import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_theme.dart';
import '../../models/backhaul_model.dart';
import '../../providers/backhaul_provider.dart';
import '../../providers/location_provider.dart';
import '../../services/directions_service.dart';

/// Backhaul Detail Screen — LC light + orange theme
class BackhaulDetailScreen extends StatefulWidget {
  final BackhaulPickup backhaul;
  const BackhaulDetailScreen({super.key, required this.backhaul});

  @override
  State<BackhaulDetailScreen> createState() => _BackhaulDetailScreenState();
}

class _BackhaulDetailScreenState extends State<BackhaulDetailScreen> {
  Set<Marker> _markers = {};
  Set<Polyline> _polylines = {};
  DirectionsResult? _directionsResult;
  bool _isLoadingRoute = true;

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  Future<void> _initializeMap() async {
    final backhaul = widget.backhaul;
    final loc = context.read<LocationProvider>();

    _markers = {
      if (loc.currentPosition != null)
        Marker(
          markerId: const MarkerId('driver'),
          position: LatLng(
            loc.currentPosition!.latitude,
            loc.currentPosition!.longitude,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: const InfoWindow(title: 'Your Location'),
        ),
      Marker(
        markerId: const MarkerId('pickup'),
        position: LatLng(backhaul.shipperLat, backhaul.shipperLng),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
        infoWindow: InfoWindow(title: 'Pickup: ${backhaul.shipperName}'),
      ),
    };

    if (loc.currentPosition != null) {
      final directions = await DirectionsService().getDirections(
        origin: LatLng(
          loc.currentPosition!.latitude,
          loc.currentPosition!.longitude,
        ),
        destination: LatLng(backhaul.shipperLat, backhaul.shipperLng),
      );
      if (directions != null && mounted) {
        setState(() {
          _directionsResult = directions;
          _isLoadingRoute = false;
          _polylines = {
            Polyline(
              polylineId: const PolylineId('route'),
              points: directions.polylinePoints,
              color: LC.primary,
              width: 5,
            ),
          };
        });
      } else {
        setState(() => _isLoadingRoute = false);
      }
    } else {
      setState(() => _isLoadingRoute = false);
    }
  }

  Future<void> _openGoogleMaps() async {
    final backhaul = widget.backhaul;
    final loc = context.read<LocationProvider>();
    String url;
    if (loc.currentPosition != null) {
      url =
          'https://www.google.com/maps/dir/'
          '${loc.currentPosition!.latitude},${loc.currentPosition!.longitude}/'
          '${backhaul.shipperLat},${backhaul.shipperLng}';
    } else {
      url =
          'https://www.google.com/maps/search/?api=1&query=${backhaul.shipperLat},${backhaul.shipperLng}';
    }
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'PROPOSED':
        return LC.warning;
      case 'ACCEPTED':
      case 'EN_ROUTE_TO_PICKUP':
        return LC.primary;
      case 'PICKED_UP':
        return LC.info;
      case 'DELIVERED':
        return LC.success;
      case 'REJECTED':
        return LC.error;
      default:
        return LC.text3;
    }
  }

  @override
  Widget build(BuildContext context) {
    final backhaul = widget.backhaul;
    return Scaffold(
      body: Consumer<BackhaulProvider>(
        builder: (context, provider, _) {
          return Stack(
            children: [
              // Map
              GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: LatLng(backhaul.shipperLat, backhaul.shipperLng),
                  zoom: 13,
                ),
                markers: _markers,
                polylines: _polylines,
                myLocationEnabled: true,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
              ),

              // Back button
              Positioned(
                top: MediaQuery.of(context).padding.top + 10,
                left: 16,
                child: Container(
                  decoration: BoxDecoration(
                    color: LC.surface,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 18,
                      color: LC.text1,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ),

              // Bottom sheet
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  decoration: BoxDecoration(
                    color: LC.surface,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(24),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 20,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(20),
                  child: SafeArea(
                    top: false,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Handle
                        Center(
                          child: Container(
                            width: 40,
                            height: 4,
                            decoration: BoxDecoration(
                              color: LC.border,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Status + CO₂
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: _statusColor(
                                  backhaul.status,
                                ).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                backhaul.statusDisplayName,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: _statusColor(backhaul.status),
                                ),
                              ),
                            ),
                            const Spacer(),
                            const Icon(
                              Icons.eco_rounded,
                              size: 14,
                              color: LC.success,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${backhaul.carbonSavedKg.toStringAsFixed(1)} kg CO₂ saved',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: LC.success,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // Shipper name
                        Text(
                          backhaul.shipperName,
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: LC.text1,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on_outlined,
                              size: 14,
                              color: LC.text3,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                backhaul.shipperLocation,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: LC.text2,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Info chips
                        Row(
                          children: [
                            _InfoChip(
                              icon: Icons.inventory_2_outlined,
                              label: '${backhaul.packageCount} pkg',
                            ),
                            const SizedBox(width: 10),
                            _InfoChip(
                              icon: Icons.scale_outlined,
                              label:
                                  '${backhaul.totalWeight.toStringAsFixed(0)} kg',
                            ),
                            const SizedBox(width: 10),
                            _InfoChip(
                              icon: Icons.straighten_outlined,
                              label: _isLoadingRoute
                                  ? '...'
                                  : _directionsResult != null
                                  ? _directionsResult!.distanceText
                                  : '${backhaul.distanceKm.toStringAsFixed(1)} km',
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Navigate button
                        SizedBox(
                          width: double.infinity,
                          height: 46,
                          child: OutlinedButton.icon(
                            onPressed: _openGoogleMaps,
                            icon: const Icon(
                              Icons.navigation_rounded,
                              size: 18,
                            ),
                            label: Text(
                              'Open in Google Maps',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: LC.primary,
                              side: const BorderSide(color: LC.primary),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),

                        // Action buttons
                        _buildActionButtons(provider, backhaul),
                      ],
                    ),
                  ),
                ),
              ),

              // Loading overlay
              if (provider.isLoading)
                Container(
                  color: Colors.black.withValues(alpha: 0.45),
                  child: const Center(
                    child: CircularProgressIndicator(color: LC.primary),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildActionButtons(
    BackhaulProvider provider,
    BackhaulPickup backhaul,
  ) {
    void showSnack(String msg, Color bg) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            msg,
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: bg,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }

    final btnShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(14),
    );

    switch (backhaul.status) {
      case 'PROPOSED':
        return Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () async {
                  final ok = await provider.rejectBackhaul(backhaul.id);
                  if (ok && mounted) Navigator.pop(context);
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: LC.error,
                  side: const BorderSide(color: LC.error),
                  shape: btnShape,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  'Decline',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () async {
                  final ok = await provider.acceptBackhaul(backhaul.id);
                  if (ok && mounted)
                    showSnack('Backhaul accepted!', LC.success);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: LC.primary,
                  foregroundColor: Colors.white,
                  shape: btnShape,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  'Accept Pickup',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        );

      case 'ACCEPTED':
        return SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: () async {
              final ok = await provider.startPickup(backhaul.id);
              if (ok && mounted) showSnack('Heading to pickup...', LC.primary);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: LC.primary,
              foregroundColor: Colors.white,
              shape: btnShape,
              elevation: 0,
            ),
            child: Text(
              'Start Pickup',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700),
            ),
          ),
        );

      case 'EN_ROUTE_TO_PICKUP':
        return SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: () async {
              final ok = await provider.confirmPickup(backhaul.id);
              if (ok && mounted) showSnack('Pickup confirmed!', LC.success);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: LC.primary,
              foregroundColor: Colors.white,
              shape: btnShape,
              elevation: 0,
            ),
            child: Text(
              'Confirm Pickup',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700),
            ),
          ),
        );

      case 'PICKED_UP':
        return SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: () async {
              final ok = await provider.completeDelivery(backhaul.id);
              if (ok && mounted) {
                showSnack('Backhaul completed! +₹100 bonus 🎉', LC.success);
                Navigator.pop(context);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: LC.success,
              foregroundColor: Colors.white,
              shape: btnShape,
              elevation: 0,
            ),
            child: Text(
              'Complete Delivery',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700),
            ),
          ),
        );

      default:
        return const SizedBox.shrink();
    }
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: LC.bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: LC.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: LC.text3),
          const SizedBox(width: 5),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: LC.text2)),
        ],
      ),
    );
  }
}
