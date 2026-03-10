import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/app_theme.dart';
import '../services/dispatch_service.dart';
import '../services/storage_service.dart';

/// WellnessCheckInScreen — LC light + orange theme.
/// Driver self-reports hours worked, rest hours, and illness.
/// Calls AI wellness endpoint; falls back to local computation if offline.
class WellnessCheckInScreen extends StatefulWidget {
  const WellnessCheckInScreen({super.key});

  @override
  State<WellnessCheckInScreen> createState() => _WellnessCheckInScreenState();
}

class _WellnessCheckInScreenState extends State<WellnessCheckInScreen> {
  final _dispatchService = DispatchService();
  final _storageService = StorageService();

  double _hoursToday = 0;
  double _hoursSinceRest = 8;
  bool _isIll = false;
  bool _loading = false;
  Map<String, dynamic>? _result;

  Future<void> _checkWellness() async {
    setState(() {
      _loading = true;
      _result = null;
    });
    try {
      final userId = _storageService.getSetting<String>('userId') ?? 'driver';
      final result = await _dispatchService.selfWellnessCheck(
        driverId: userId,
        driverName: 'Driver',
        hoursToday: _hoursToday,
        hoursSinceRest: _hoursSinceRest,
        isIll: _isIll,
        totalHours7d: _hoursToday * 3,
        vehicleType: 'DIESEL',
        gender: 'M',
      );
      setState(() => _result = result);
    } catch (_) {
      final score = _computeLocalScore();
      setState(() {
        _result = {
          'wellnessStatus': score >= 70
              ? 'FIT'
              : score >= 40
              ? 'MODERATE'
              : 'FATIGUED',
          'wellnessScore': score,
          'maxDifficulty': score >= 70
              ? 'ANY'
              : score >= 40
              ? 'EASY'
              : 'REST',
        };
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  int _computeLocalScore() {
    int score = 100;
    if (_hoursToday > 8) score -= ((_hoursToday - 8) * 8).toInt();
    if (_hoursSinceRest > 12) score -= ((_hoursSinceRest - 12) * 5).toInt();
    if (_isIll) score -= 40;
    return score.clamp(0, 100);
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
          '🩺 Wellness Check-in',
          style: GoogleFonts.inter(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: LC.text1,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Info card ────────────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: LC.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: LC.primary.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: LC.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.health_and_safety_rounded,
                        color: LC.primary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Before your next run',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: LC.text1,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'FairRelay checks your wellness before assigning routes. Honest answers protect you.',
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
              const SizedBox(height: 24),

              // ── Sliders ──────────────────────────────────────────────────
              _WellnessSlider(
                label: 'Hours worked today',
                value: _hoursToday,
                min: 0,
                max: 14,
                divisions: 28,
                suffix: 'hrs',
                color: _hoursToday >= 10 ? LC.error : LC.primary,
                onChanged: (v) => setState(() => _hoursToday = v),
              ),
              const SizedBox(height: 14),

              _WellnessSlider(
                label: 'Hours since last proper rest',
                value: _hoursSinceRest,
                min: 0,
                max: 24,
                divisions: 48,
                suffix: 'hrs',
                color: _hoursSinceRest >= 16 ? LC.error : LC.info,
                onChanged: (v) => setState(() => _hoursSinceRest = v),
              ),
              const SizedBox(height: 14),

              // ── Ill toggle ───────────────────────────────────────────────
              GestureDetector(
                onTap: () => setState(() => _isIll = !_isIll),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: _isIll
                        ? LC.error.withValues(alpha: 0.07)
                        : LC.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _isIll
                          ? LC.error.withValues(alpha: 0.4)
                          : LC.border,
                      width: _isIll ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '🤒  Feeling unwell (fever, nausea, etc.)',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: _isIll ? LC.error : LC.text1,
                        ),
                      ),
                      Switch(
                        value: _isIll,
                        activeThumbColor: LC.error,
                        activeTrackColor: LC.error.withValues(alpha: 0.4),
                        onChanged: (v) => setState(() => _isIll = v),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // ── Result card ──────────────────────────────────────────────
              if (_result != null) ...[
                _buildResultCard(_result!),
                const SizedBox(height: 16),
              ],

              // ── CTA button ───────────────────────────────────────────────
              if (_result == null)
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _checkWellness,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: LC.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            'Check My Wellness',
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
      ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> result) {
    final status = result['wellnessStatus'] ?? 'FIT';
    final score = result['wellnessScore'] ?? 75;
    final maxDifficulty = result['maxDifficulty'] ?? 'ANY';
    final isFit = status == 'FIT';
    final isModerate = status == 'MODERATE';
    final color = isFit
        ? LC.success
        : isModerate
        ? LC.warning
        : LC.error;
    final icon = isFit
        ? '💚'
        : isModerate
        ? '🟡'
        : '🔴';
    final message = isFit
        ? 'Great! You\'re fully fit for any route today.'
        : isModerate
        ? 'Doing okay — FairRelay will assign lighter routes to protect you.'
        : 'You need rest before your next run. The AI will not assign difficult routes.';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(icon, style: const TextStyle(fontSize: 44)),
          const SizedBox(height: 10),
          Text(
            status,
            style: GoogleFonts.inter(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Wellness Score: $score / 100',
            style: GoogleFonts.inter(fontSize: 13, color: LC.text2),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Max Route Difficulty: $maxDifficulty',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            message,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 13, color: LC.text2),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context, result),
              style: ElevatedButton.styleFrom(
                backgroundColor: color,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                'Done — return to dashboard',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _WellnessSlider extends StatelessWidget {
  final String label;
  final double value;
  final double min;
  final double max;
  final int divisions;
  final String suffix;
  final Color color;
  final ValueChanged<double> onChanged;

  const _WellnessSlider({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.divisions,
    required this.suffix,
    required this.color,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: LC.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: LC.text2,
                ),
              ),
              Text(
                '${value.toStringAsFixed(1)} $suffix',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderThemeData(
              activeTrackColor: color,
              inactiveTrackColor: color.withValues(alpha: 0.15),
              thumbColor: color,
              overlayColor: color.withValues(alpha: 0.1),
            ),
            child: Slider(
              value: value,
              min: min,
              max: max,
              divisions: divisions,
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
}
