import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/absorption_provider.dart';

/// Absorption Importer Screen — Scan QR from exporting driver to verify cargo
class AbsorptionImporterScreen extends StatefulWidget {
  const AbsorptionImporterScreen({super.key});

  @override
  State<AbsorptionImporterScreen> createState() =>
      _AbsorptionImporterScreenState();
}

class _AbsorptionImporterScreenState extends State<AbsorptionImporterScreen>
    with SingleTickerProviderStateMixin {
  final MobileScannerController _controller = MobileScannerController();
  bool _isScanned = false;
  bool _isVerifying = false;
  late AnimationController _pulseController;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 1.0, end: 1.06).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _pulseController.dispose();
    super.dispose();
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
        SnackBar(
          content: Text(
            'Invalid QR code — please try again',
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: LC.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
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
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: LC.border,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: LC.success.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.check_circle_rounded,
                size: 44,
                color: LC.success,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'QR Verified!',
              style: GoogleFonts.inter(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: LC.text1,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Cargo transfer has been confirmed',
              style: GoogleFonts.inter(fontSize: 14, color: LC.text2),
            ),
            const SizedBox(height: 28),
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
                  'Complete Transfer',
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
          'Scan Transfer QR',
          style: GoogleFonts.inter(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: LC.text1,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          // Camera feed
          MobileScanner(controller: _controller, onDetect: _onScan),

          // Frosted overlay with clear viewfinder
          Column(
            children: [
              Expanded(
                flex: 2,
                child: Container(color: Colors.black.withValues(alpha: 0.5)),
              ),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      color: Colors.black.withValues(alpha: 0.5),
                    ),
                  ),
                  // Viewfinder
                  AnimatedBuilder(
                    animation: _pulse,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _pulse.value,
                        child: Container(
                          width: 260,
                          height: 260,
                          decoration: BoxDecoration(
                            border: Border.all(color: LC.primary, width: 3),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      );
                    },
                  ),
                  Expanded(
                    child: Container(
                      color: Colors.black.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
              Expanded(
                flex: 3,
                child: Container(color: Colors.black.withValues(alpha: 0.5)),
              ),
            ],
          ),

          // Bottom instruction card
          Positioned(
            bottom: 40,
            left: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: LC.surface,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: LC.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.qr_code_scanner_rounded,
                      color: LC.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Point at the QR code',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: LC.text1,
                          ),
                        ),
                        Text(
                          'From the exporting driver\'s app',
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
          ),

          // Verifying overlay
          if (_isVerifying)
            Container(
              color: Colors.black.withValues(alpha: 0.6),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(color: LC.primary),
                    const SizedBox(height: 16),
                    Text(
                      'Verifying cargo...',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
