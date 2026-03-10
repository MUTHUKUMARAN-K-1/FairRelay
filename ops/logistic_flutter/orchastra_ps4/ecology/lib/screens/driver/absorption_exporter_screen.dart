import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../config/app_theme.dart';
import '../../providers/absorption_provider.dart';
import '../../providers/delivery_provider.dart';

/// Absorption Exporter Screen — Generate QR for cargo handover (LC theme)
class AbsorptionExporterScreen extends StatefulWidget {
  const AbsorptionExporterScreen({super.key});

  @override
  State<AbsorptionExporterScreen> createState() =>
      _AbsorptionExporterScreenState();
}

class _AbsorptionExporterScreenState extends State<AbsorptionExporterScreen> {
  String? _qrData;
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _generateQR();
  }

  Future<void> _generateQR() async {
    setState(() => _isGenerating = true);
    final absorptionProvider = context.read<AbsorptionProvider>();
    final transfer = absorptionProvider.currentTransfer;
    if (transfer != null) {
      final qrData = await absorptionProvider.generateQRCode(transfer.id);
      setState(() {
        _qrData = qrData;
        _isGenerating = false;
      });
    } else {
      await Future.delayed(const Duration(milliseconds: 800));
      setState(() {
        _qrData = 'FAIRRELAY_TRANSFER_${DateTime.now().millisecondsSinceEpoch}';
        _isGenerating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final delivery = context.watch<DeliveryProvider>().activeDelivery;

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
          'Cargo Handover',
          style: GoogleFonts.inter(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: LC.text1,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // ── Info banner ──────────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: LC.primary.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: LC.primary.withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      color: LC.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Show this QR to the receiving driver to transfer cargo',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: LC.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // ── QR Code card ─────────────────────────────────────────────
              if (_isGenerating)
                Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    color: LC.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: LC.border),
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(color: LC.primary),
                  ),
                )
              else if (_qrData != null)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.10),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      QrImageView(
                        data: _qrData!,
                        version: QrVersions.auto,
                        size: 220,
                        backgroundColor: Colors.white,
                        errorCorrectionLevel: QrErrorCorrectLevel.H,
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: LC.success.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.verified_rounded,
                              color: LC.success,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Ready to scan',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: LC.success,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    color: LC.surfaceAlt,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Center(
                    child: Text(
                      'Failed to generate QR',
                      style: GoogleFonts.inter(color: LC.text2),
                    ),
                  ),
                ),

              const SizedBox(height: 28),

              // ── Transfer details ─────────────────────────────────────────
              if (delivery != null) ...[
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
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: LC.border),
                  ),
                  child: Column(
                    children: [
                      _DetailRow('Package ID', delivery.packageId),
                      _DetailRow('Cargo Type', delivery.cargoType),
                      _DetailRow(
                        'Weight',
                        '${delivery.cargoWeight.toStringAsFixed(1)} kg',
                      ),
                      _DetailRow('Destination', delivery.dropLocation),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // ── Regenerate button ────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: _isGenerating ? null : _generateQR,
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: Text(
                    'Regenerate QR Code',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: LC.primary,
                    side: const BorderSide(color: LC.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // ── Cancel button ────────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                height: 44,
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(
                    'Cancel Transfer',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: LC.error,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label, value;
  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
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
}
