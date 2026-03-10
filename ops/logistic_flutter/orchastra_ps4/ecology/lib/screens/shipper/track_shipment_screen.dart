import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/shipment_provider.dart';
import '../../models/shipment_model.dart';

/// Track Shipment Screen — LC theme
class TrackShipmentScreen extends StatefulWidget {
  const TrackShipmentScreen({super.key});

  @override
  State<TrackShipmentScreen> createState() => _TrackShipmentScreenState();
}

class _TrackShipmentScreenState extends State<TrackShipmentScreen> {
  final _trackingController = TextEditingController();
  Shipment? _trackedShipment;
  bool _isSearching = false;
  String? _error;

  @override
  void dispose() {
    _trackingController.dispose();
    super.dispose();
  }

  Future<void> _trackShipment() async {
    if (_trackingController.text.trim().isEmpty) {
      setState(() => _error = 'Please enter a tracking ID');
      return;
    }
    setState(() {
      _isSearching = true;
      _error = null;
    });
    final provider = context.read<ShipmentProvider>();
    final shipment = await provider.trackShipment(
      _trackingController.text.trim(),
    );
    setState(() {
      _isSearching = false;
      _trackedShipment = shipment;
      if (shipment == null) _error = 'Shipment not found';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LC.bg,
      appBar: AppBar(
        backgroundColor: LC.surface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          color: LC.text1,
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Track Shipment',
          style: GoogleFonts.inter(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: LC.text1,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Search bar ──────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: LC.surface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: LC.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Enter Tracking ID',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: LC.text1,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _trackingController,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: LC.text1,
                          ),
                          decoration: InputDecoration(
                            hintText: 'e.g. SHP-123456',
                            hintStyle: GoogleFonts.inter(color: LC.text3),
                            filled: true,
                            fillColor: LC.bg,
                            prefixIcon: const Icon(
                              Icons.search_rounded,
                              color: LC.text3,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: LC.border),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: LC.border),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: LC.primary,
                                width: 2,
                              ),
                            ),
                            errorText: _error,
                            errorStyle: GoogleFonts.inter(color: LC.error),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 14,
                            ),
                          ),
                          onSubmitted: (_) => _trackShipment(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      SizedBox(
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isSearching ? null : _trackShipment,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: LC.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: _isSearching
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  'Track',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Result ──────────────────────────────────────────────────────
            if (_trackedShipment != null)
              _ShipmentTrackingCard(shipment: _trackedShipment!)
            else
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(top: 64),
                  child: Column(
                    children: [
                      Icon(
                        Icons.local_shipping_outlined,
                        size: 72,
                        color: LC.text3,
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Enter a tracking ID to track\nyour shipment',
                        style: GoogleFonts.inter(fontSize: 14, color: LC.text2),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ShipmentTrackingCard extends StatelessWidget {
  final Shipment shipment;
  const _ShipmentTrackingCard({required this.shipment});

  Color _statusColor(String s) {
    switch (s) {
      case 'PENDING':
        return LC.warning;
      case 'ASSIGNED':
      case 'PICKED_UP':
        return LC.primary;
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

  @override
  Widget build(BuildContext context) {
    final sColor = _statusColor(shipment.status);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(20),
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
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: sColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  shipment.statusDisplayName,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: sColor,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                'ID: ${shipment.id.substring(0, shipment.id.length > 8 ? 8 : shipment.id.length)}...',
                style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Route display
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
                      'From',
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
                    const SizedBox(height: 20),
                    Text(
                      'To',
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

          const SizedBox(height: 16),

          // Cargo details row
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: LC.bg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _InfoItem(Icons.category_outlined, shipment.cargoType),
                _InfoItem(
                  Icons.scale_outlined,
                  '${shipment.cargoWeight.toStringAsFixed(0)} kg',
                ),
                if (shipment.cargoVolume != null)
                  _InfoItem(
                    Icons.straighten_outlined,
                    '${shipment.cargoVolume!.toStringAsFixed(0)} L',
                  ),
              ],
            ),
          ),

          // Driver info if assigned
          if (shipment.driverName != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(
                  Icons.drive_eta_rounded,
                  size: 16,
                  color: LC.primary,
                ),
                const SizedBox(width: 6),
                Text(
                  shipment.driverName!,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: LC.text1,
                  ),
                ),
                const Spacer(),
                if (shipment.driverRating != null)
                  Row(
                    children: [
                      const Icon(
                        Icons.star_rounded,
                        size: 14,
                        color: Colors.amber,
                      ),
                      Text(
                        ' ${shipment.driverRating!.toStringAsFixed(1)}',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoItem(this.icon, this.label);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: LC.text3),
        const SizedBox(width: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: LC.text2)),
      ],
    );
  }
}
