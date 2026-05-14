import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_theme.dart';
import '../../models/shipment_model.dart';
import '../../providers/shipment_provider.dart';

/// Shipment Detail Screen — LC light + orange theme
class ShipmentDetailScreen extends StatefulWidget {
  final Shipment shipment;
  const ShipmentDetailScreen({super.key, required this.shipment});

  @override
  State<ShipmentDetailScreen> createState() => _ShipmentDetailScreenState();
}

class _ShipmentDetailScreenState extends State<ShipmentDetailScreen> {
  late Shipment _shipment;
  Set<Marker> _markers = {};
  Set<Polyline> _polylines = {};

  @override
  void initState() {
    super.initState();
    _shipment = widget.shipment;
    _setupMap();
    _refreshShipment();
  }

  void _setupMap() {
    _markers = {
      Marker(
        markerId: const MarkerId('pickup'),
        position: LatLng(_shipment.pickupLat, _shipment.pickupLng),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: const InfoWindow(title: 'Pickup'),
      ),
      Marker(
        markerId: const MarkerId('drop'),
        position: LatLng(_shipment.dropLat, _shipment.dropLng),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        infoWindow: const InfoWindow(title: 'Drop'),
      ),
      if (_shipment.hasDriverLocation)
        Marker(
          markerId: const MarkerId('driver'),
          position: LatLng(_shipment.driverLat!, _shipment.driverLng!),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueAzure,
          ),
          infoWindow: InfoWindow(
            title: 'Driver: ${_shipment.driverName ?? "On the way"}',
          ),
        ),
    };

    _polylines = {
      Polyline(
        polylineId: const PolylineId('route'),
        points: [
          LatLng(_shipment.pickupLat, _shipment.pickupLng),
          LatLng(_shipment.dropLat, _shipment.dropLng),
        ],
        color: LC.primary,
        width: 4,
      ),
    };
  }

  Future<void> _refreshShipment() async {
    final provider = context.read<ShipmentProvider>();
    final updated = await provider.trackShipment(_shipment.id);
    if (updated != null && mounted) {
      setState(() {
        _shipment = updated;
        _setupMap();
      });
    }
  }

  void _callDriver() async {
    if (_shipment.driverPhone == null) return;
    final url = Uri.parse('tel:${_shipment.driverPhone}');
    if (await canLaunchUrl(url)) await launchUrl(url);
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'PENDING':
        return LC.warning;
      case 'ASSIGNED':
        return LC.primary;
      case 'IN_TRANSIT':
        return LC.info;
      case 'DELIVERED':
      case 'COMPLETED':
        return LC.success;
      default:
        return LC.text3;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // ── Map ─────────────────────────────────────────────────────────
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: LatLng(_shipment.pickupLat, _shipment.pickupLng),
              zoom: 12,
            ),
            markers: _markers,
            polylines: _polylines,
            myLocationEnabled: true,
          ),

          // ── Back button ──────────────────────────────────────────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
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

          // ── Draggable bottom sheet ────────────────────────────────────────
          DraggableScrollableSheet(
            initialChildSize: 0.45,
            minChildSize: 0.3,
            maxChildSize: 0.85,
            builder: (context, controller) {
              return Container(
                decoration: BoxDecoration(
                  color: LC.surface,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(24),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 20,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: SingleChildScrollView(
                  controller: controller,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
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
                        const SizedBox(height: 18),

                        // Status badge + refresh
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: _statusColor(
                                  _shipment.status,
                                ).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                _shipment.statusDisplayName,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: _statusColor(_shipment.status),
                                ),
                              ),
                            ),
                            const Spacer(),
                            IconButton(
                              onPressed: _refreshShipment,
                              icon: const Icon(
                                Icons.refresh_rounded,
                                color: LC.text2,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Shipment ID
                        Text(
                          'Shipment ID',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: LC.text3,
                          ),
                        ),
                        Text(
                          _shipment.id,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: LC.text1,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Route card
                        _RouteCard(shipment: _shipment),
                        const SizedBox(height: 16),

                        // Cargo details
                        Text(
                          'Cargo Details',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: LC.text1,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _InfoChip(
                              icon: Icons.category_outlined,
                              label: _shipment.cargoType,
                            ),
                            const SizedBox(width: 10),
                            _InfoChip(
                              icon: Icons.scale_outlined,
                              label: '${_shipment.cargoWeight} tonnes',
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Driver info (if assigned with details)
                        if (_shipment.hasDriver) ...[
                          Text(
                            'Driver Details',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: LC.text1,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: LC.bg,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: LC.border),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: LC.primary,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Center(
                                        child: Text(
                                          _shipment.driverName
                                                  ?.substring(0, 1)
                                                  .toUpperCase() ??
                                              'D',
                                          style: GoogleFonts.inter(
                                            fontSize: 22,
                                            fontWeight: FontWeight.w800,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _shipment.driverName ?? 'Driver',
                                            style: GoogleFonts.inter(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              color: LC.text1,
                                            ),
                                          ),
                                          if (_shipment.driverRating != null)
                                            Row(
                                              children: [
                                                const Icon(
                                                  Icons.star_rounded,
                                                  size: 13,
                                                  color: Colors.amber,
                                                ),
                                                Text(
                                                  ' ${_shipment.driverRating!.toStringAsFixed(1)}',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    color: LC.text2,
                                                  ),
                                                ),
                                              ],
                                            ),
                                        ],
                                      ),
                                    ),
                                    if (_shipment.driverPhone != null)
                                      GestureDetector(
                                        onTap: _callDriver,
                                        child: Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color: LC.success.withValues(
                                              alpha: 0.1,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              10,
                                            ),
                                          ),
                                          child: const Icon(
                                            Icons.call_rounded,
                                            color: LC.success,
                                            size: 20,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                if (_shipment.truckLicensePlate != null) ...[
                                  const SizedBox(height: 12),
                                  Divider(color: LC.border, height: 1),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.local_shipping_rounded,
                                        size: 16,
                                        color: LC.text3,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _shipment.truckLicensePlate!,
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: LC.text1,
                                        ),
                                      ),
                                      if (_shipment.truckModel != null) ...[
                                        const SizedBox(width: 6),
                                        Text(
                                          '• ${_shipment.truckModel}',
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            color: LC.text2,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ] else if (_shipment.isAssigned ||
                            _shipment.isInTransit) ...[
                          Text(
                            'Driver Details',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: LC.text1,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: LC.bg,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: LC.border),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: LC.primary.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.person_rounded,
                                    color: LC.primary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Driver Assigned',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: LC.text1,
                                        ),
                                      ),
                                      Text(
                                        'On the way',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: LC.text2,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        // Pending banner
                        if (_shipment.isPending) ...[
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: LC.warning.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: LC.warning.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.schedule_rounded,
                                  color: LC.warning,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'Waiting for driver to accept',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: LC.warning,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        // Delivered banner
                        if (_shipment.isDelivered) ...[
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: LC.success.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: LC.success.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.check_circle_rounded,
                                  color: LC.success,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'Shipment delivered successfully! 🎉',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: LC.success,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _RouteCard extends StatelessWidget {
  final Shipment shipment;
  const _RouteCard({required this.shipment});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: LC.bg,
        borderRadius: BorderRadius.circular(14),
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
              Container(width: 2, height: 30, color: LC.border),
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
                  'Pickup',
                  style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                ),
                Text(
                  shipment.pickupLocation,
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
                  'Drop',
                  style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                ),
                Text(
                  shipment.dropLocation,
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
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: LC.bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: LC.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: LC.text3),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: LC.text2)),
        ],
      ),
    );
  }
}
