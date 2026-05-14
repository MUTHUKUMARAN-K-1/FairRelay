import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_theme.dart';
import '../../providers/absorption_provider.dart';
import '../../providers/delivery_provider.dart';
import '../../providers/location_provider.dart';

/// Synergy Hub Screen — LC light+orange theme
/// QR code generation and scanning for cargo handover between drivers.
class SynergyHubScreen extends StatefulWidget {
  const SynergyHubScreen({super.key});
  @override
  State<SynergyHubScreen> createState() => _SynergyHubScreenState();
}

class _SynergyHubScreenState extends State<SynergyHubScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _qrData;
  bool _isGeneratingQR = false;
  bool _isScanned = false;
  bool _isVerifying = false;
  MobileScannerController? _scannerController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _generateQR();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scannerController?.dispose();
    super.dispose();
  }

  Future<void> _generateQR() async {
    setState(() => _isGeneratingQR = true);
    final absorptionProvider = context.read<AbsorptionProvider>();
    final delivery = context.read<DeliveryProvider>().activeDelivery;
    final transfer = absorptionProvider.currentTransfer;

    if (transfer != null) {
      final qrData = await absorptionProvider.generateQRCode(transfer.id);
      setState(() {
        _qrData = qrData;
        _isGeneratingQR = false;
      });
    } else if (delivery != null) {
      setState(() {
        _qrData =
            'FAIRRELAY_HANDOVER|${delivery.id}|${delivery.packageId}|${DateTime.now().millisecondsSinceEpoch}';
        _isGeneratingQR = false;
      });
    } else {
      setState(() {
        _qrData = 'FAIRRELAY_TRANSFER_${DateTime.now().millisecondsSinceEpoch}';
        _isGeneratingQR = false;
      });
    }
  }

  Future<void> _onScan(BarcodeCapture capture) async {
    if (_isScanned || capture.barcodes.isEmpty) return;
    final barcode = capture.barcodes.first;
    if (barcode.rawValue == null) return;
    setState(() {
      _isScanned = true;
      _isVerifying = true;
    });
    final success = await context.read<AbsorptionProvider>().verifyQRCode(
      barcode.rawValue!,
    );
    setState(() => _isVerifying = false);
    if (success && mounted) {
      _showSuccess();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid QR Code. Please try again.'),
          backgroundColor: LC.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      setState(() => _isScanned = false);
    }
  }

  void _showSuccess() {
    showModalBottomSheet(
      context: context,
      backgroundColor: LC.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: LC.successLt,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.check_circle_rounded,
                size: 60,
                color: LC.success,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Handover Verified! 🎉',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: LC.text1,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Cargo transfer completed successfully',
              style: GoogleFonts.inter(fontSize: 14, color: LC.text2),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: LC.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(
                  'Complete',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openMaps(double lat, double lng) async {
    final pos = context.read<LocationProvider>().currentPosition;
    final url = pos != null
        ? 'https://www.google.com/maps/dir/${pos.latitude},${pos.longitude}/$lat,$lng'
        : 'https://www.google.com/maps/search/?api=1&query=$lat,$lng';
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri))
      await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final delivery = context.watch<DeliveryProvider>().activeDelivery;

    return Scaffold(
      backgroundColor: LC.bg,
      appBar: AppBar(
        backgroundColor: LC.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: LC.text1),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Synergy Hub',
              style: GoogleFonts.inter(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: LC.text1,
              ),
            ),
            Text(
              'Multi-driver cargo handover',
              style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: LC.primary,
          labelColor: LC.primary,
          unselectedLabelColor: LC.text3,
          labelStyle: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          tabs: const [
            Tab(icon: Icon(Icons.qr_code_rounded), text: 'My QR'),
            Tab(icon: Icon(Icons.qr_code_scanner_rounded), text: 'Scan QR'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Navigation buttons
          if (delivery != null)
            Container(
              color: LC.surface,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  Expanded(
                    child: _NavBtn(
                      icon: Icons.navigation_rounded,
                      label: 'Navigate to Pickup',
                      onTap: () =>
                          _openMaps(delivery.pickupLat, delivery.pickupLng),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _NavBtn(
                      icon: Icons.location_on_rounded,
                      label: 'Navigate to Drop',
                      onTap: () =>
                          _openMaps(delivery.dropLat, delivery.dropLng),
                      primary: true,
                    ),
                  ),
                ],
              ),
            ),
          const Divider(height: 1, color: LC.divider),

          // Tabs
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _QRTab(
                  delivery: delivery,
                  isGenerating: _isGeneratingQR,
                  qrData: _qrData,
                  onRegenerate: _generateQR,
                ),
                _ScannerTab(
                  scannerController: _scannerController ??=
                      MobileScannerController(),
                  isVerifying: _isVerifying,
                  onScan: _onScan,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
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
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: primary ? LC.primary : LC.surfaceAlt,
          borderRadius: BorderRadius.circular(12),
          boxShadow: primary
              ? [
                  BoxShadow(
                    color: LC.primary.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: primary ? Colors.white : LC.primary),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
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

class _QRTab extends StatelessWidget {
  final dynamic delivery;
  final bool isGenerating;
  final String? qrData;
  final VoidCallback onRegenerate;
  const _QRTab({
    required this.delivery,
    required this.isGenerating,
    required this.qrData,
    required this.onRegenerate,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Info banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: LC.primary.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: LC.primary.withValues(alpha: 0.25)),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline_rounded, color: LC.primary, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Show this QR code to the receiving driver to transfer cargo',
                    style: GoogleFonts.inter(fontSize: 13, color: LC.primary),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 28),

          // QR Code
          if (isGenerating)
            const SizedBox(
              width: 250,
              height: 250,
              child: Center(
                child: CircularProgressIndicator(color: LC.primary),
              ),
            )
          else if (qrData != null)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: QrImageView(
                data: qrData!,
                version: QrVersions.auto,
                size: 210,
                backgroundColor: Colors.white,
                errorCorrectionLevel: QrErrorCorrectLevel.H,
              ),
            )
          else
            Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                color: LC.surfaceAlt,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  'Failed to generate QR',
                  style: GoogleFonts.inter(color: LC.text2),
                ),
              ),
            ),

          const SizedBox(height: 24),

          if (delivery != null) ...[
            // ignore: curly_braces in expanded context
            Text(
              'Transfer Details',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: LC.text1,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: LC.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: LC.border),
              ),
              child: Column(
                children: [
                  _detailRow('Package ID', delivery.packageId),
                  _detailRow('Cargo Type', delivery.cargoType),
                  _detailRow(
                    'Weight',
                    '${delivery.cargoWeight.toStringAsFixed(1)} kg',
                  ),
                  _detailRow('Destination', delivery.dropLocation),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: isGenerating ? null : onRegenerate,
              icon: const Icon(Icons.refresh_rounded),
              label: Text(
                'Regenerate QR',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: LC.primary,
                side: const BorderSide(color: LC.primary),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: LC.text3)),
        Flexible(
          child: Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: LC.text1,
            ),
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    ),
  );
}

class _ScannerTab extends StatelessWidget {
  final MobileScannerController scannerController;
  final bool isVerifying;
  final void Function(BarcodeCapture) onScan;
  const _ScannerTab({
    required this.scannerController,
    required this.isVerifying,
    required this.onScan,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        MobileScanner(controller: scannerController, onDetect: onScan),
        Container(
          color: Colors.black.withValues(alpha: 0.45),
          child: Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: LC.primary, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.qr_code_scanner_rounded,
                    size: 60,
                    color: LC.primary.withValues(alpha: 0.6),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Position QR code here',
                    style: GoogleFonts.inter(fontSize: 14, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ),
        Positioned(
          bottom: 36,
          left: 24,
          right: 24,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: LC.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: LC.text3, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Scan the exporter driver\'s QR code to receive cargo',
                    style: GoogleFonts.inter(fontSize: 12, color: LC.text2),
                  ),
                ),
              ],
            ),
          ),
        ),
        if (isVerifying)
          Container(
            color: Colors.black54,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(color: LC.primary),
                  const SizedBox(height: 14),
                  Text(
                    'Verifying QR Code...',
                    style: GoogleFonts.inter(color: Colors.white, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
