import 'package:flutter/material.dart';
import 'dart:math';
import 'package:google_fonts/google_fonts.dart';
import '../../config/app_theme.dart';

/// CognitiveDashboardScreen — Premium animated cognitive load analysis.
/// Shows a driver their real-time Cognitive Load Index (CLI) with a
/// 6-factor breakdown based on cognitive psychology research.
class CognitiveDashboardScreen extends StatefulWidget {
  const CognitiveDashboardScreen({super.key});

  @override
  State<CognitiveDashboardScreen> createState() =>
      _CognitiveDashboardScreenState();
}

class _CognitiveDashboardScreenState extends State<CognitiveDashboardScreen>
    with TickerProviderStateMixin {
  late AnimationController _gaugeController;
  late AnimationController _pulseController;
  late Animation<double> _gaugeAnimation;

  // Simulated cognitive data (in production, from /api/wellness/cognitive/:id)
  final int _cognitiveLoadIndex = 34;
  final String _cognitiveState = 'ALERT';
  final Map<String, int> _factors = {
    'fatigue': 29,
    'decisionFatigue': 25,
    'circadian': 10,
    'monotony': 40,
    'complexityStress': 45,
    'recoveryDeficit': 15,
  };
  final String _recommendation = '✅ Moderately alert — normal operations';
  final String _nextBreakIn = '47 min';

  @override
  void initState() {
    super.initState();
    _gaugeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _gaugeAnimation = Tween<double>(begin: 0, end: _cognitiveLoadIndex / 100)
        .animate(
          CurvedAnimation(parent: _gaugeController, curve: Curves.easeOutCubic),
        );
    _gaugeController.forward();
  }

  @override
  void dispose() {
    _gaugeController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Color _stateColor() {
    switch (_cognitiveState) {
      case 'SHARP':
        return const Color(0xFF06B6D4); // cyan
      case 'ALERT':
        return const Color(0xFF3B82F6); // blue
      case 'STRAINED':
        return const Color(0xFFF59E0B); // amber
      case 'OVERLOADED':
        return const Color(0xFFEF4444); // red
      default:
        return const Color(0xFF3B82F6);
    }
  }

  String _stateEmoji() {
    switch (_cognitiveState) {
      case 'SHARP':
        return '🧠';
      case 'ALERT':
        return '⚡';
      case 'STRAINED':
        return '⚠️';
      case 'OVERLOADED':
        return '🔴';
      default:
        return '⚡';
    }
  }

  @override
  Widget build(BuildContext context) {
    final stateColor = _stateColor();

    return Scaffold(
      backgroundColor: LC.bg,
      appBar: AppBar(
        backgroundColor: LC.bg,
        elevation: 0,
        title: Text(
          'Cognitive Load Index',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: LC.text1,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: LC.text1, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: stateColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: stateColor.withValues(alpha: 0.3)),
            ),
            child: Text(
              '${_stateEmoji()} $_cognitiveState',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: stateColor,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── GAUGE ──
            _buildGauge(stateColor),
            const SizedBox(height: 20),

            // ── RECOMMENDATION CARD ──
            _buildRecommendation(stateColor),
            const SizedBox(height: 16),

            // ── MICRO-BREAK TIMER ──
            _buildBreakTimer(stateColor),
            const SizedBox(height: 16),

            // ── 6-FACTOR BREAKDOWN ──
            _buildFactorBreakdown(),
            const SizedBox(height: 16),

            // ── SCIENCE FOOTER ──
            _buildScienceFooter(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildGauge(Color stateColor) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: stateColor.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            'COGNITIVE LOAD INDEX',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Colors.grey[500],
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            width: 180,
            child: AnimatedBuilder(
              animation: _gaugeAnimation,
              builder: (context, child) {
                return CustomPaint(
                  painter: _GaugePainter(
                    progress: _gaugeAnimation.value,
                    color: stateColor,
                    label: _cognitiveLoadIndex.toString(),
                  ),
                  size: const Size(180, 180),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _cognitiveState,
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: stateColor,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'out of 100 (lower = better)',
            style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendation(Color stateColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: stateColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: stateColor.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Text(_stateEmoji(), style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI Recommendation',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: stateColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _recommendation,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: LC.text1.withValues(alpha: 0.9),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBreakTimer(Color stateColor) {
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        final opacity = 0.7 + _pulseController.value * 0.3;
        return Opacity(
          opacity: opacity,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  stateColor.withValues(alpha: 0.12),
                  stateColor.withValues(alpha: 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: stateColor.withValues(alpha: 0.15)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.timer_outlined, color: stateColor, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Suggested micro-break in ',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: Colors.grey[400],
                  ),
                ),
                Text(
                  _nextBreakIn,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: stateColor,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFactorBreakdown() {
    final factors = [
      _FactorData('Fatigue Load', 'fatigue', '🧠', 'Dawson & Reid (2000)'),
      _FactorData(
        'Decision Fatigue',
        'decisionFatigue',
        '🎯',
        'Baumeister (1998)',
      ),
      _FactorData('Circadian Rhythm', 'circadian', '🌙', 'Monk (2005)'),
      _FactorData('Monotony Index', 'monotony', '🔁', 'Mackworth (1948)'),
      _FactorData(
        'Route Complexity',
        'complexityStress',
        '🏙️',
        'Yerkes-Dodson (1908)',
      ),
      _FactorData(
        'Recovery Deficit',
        'recoveryDeficit',
        '💤',
        'Van Dongen (2003)',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '6-FACTOR BREAKDOWN',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Colors.grey[500],
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 14),
          ...factors.map((f) {
            final value = _factors[f.key] ?? 0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _FactorRow(
                label: f.label,
                value: value,
                icon: f.icon,
                source: f.source,
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildScienceFooter() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
      ),
      child: Column(
        children: [
          Text(
            '🔬 Powered by Cognitive Science',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'CLI computed using Kahneman\'s Cognitive Load Theory, '
            'Mackworth\'s Vigilance Decrement model, and the '
            'Yerkes-Dodson Law of optimal arousal.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: Colors.grey[600],
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ── GAUGE PAINTER ──
class _GaugePainter extends CustomPainter {
  final double progress;
  final Color color;
  final String label;

  _GaugePainter({
    required this.progress,
    required this.color,
    required this.label,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 12;

    // Background arc
    final bgPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.06)
      ..strokeWidth = 12
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi * 0.75,
      pi * 1.5,
      false,
      bgPaint,
    );

    // Progress arc
    final progressPaint = Paint()
      ..color = color
      ..strokeWidth = 12
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi * 0.75,
      pi * 1.5 * progress,
      false,
      progressPaint,
    );

    // Glow
    final glowPaint = Paint()
      ..color = color.withValues(alpha: 0.3)
      ..strokeWidth = 20
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi * 0.75,
      pi * 1.5 * progress,
      false,
      glowPaint,
    );

    // Center text
    final textPainter = TextPainter(
      text: TextSpan(
        text: label,
        style: TextStyle(
          fontSize: 42,
          fontWeight: FontWeight.w800,
          color: color,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    textPainter.paint(
      canvas,
      Offset(
        center.dx - textPainter.width / 2,
        center.dy - textPainter.height / 2,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant _GaugePainter old) =>
      old.progress != progress || old.color != color;
}

// ── FACTOR DATA MODEL ──
class _FactorData {
  final String label;
  final String key;
  final String icon;
  final String source;
  _FactorData(this.label, this.key, this.icon, this.source);
}

// ── FACTOR ROW WIDGET ──
class _FactorRow extends StatelessWidget {
  final String label;
  final int value;
  final String icon;
  final String source;

  const _FactorRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.source,
  });

  Color _barColor() {
    if (value <= 30) return const Color(0xFF06B6D4);
    if (value <= 55) return const Color(0xFF3B82F6);
    if (value <= 75) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: LC.text1.withValues(alpha: 0.85),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Text(
              source,
              style: GoogleFonts.inter(
                fontSize: 9,
                color: Colors.grey[700],
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$value',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                fontFeatures: const [FontFeature.tabularFigures()],
                color: _barColor(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: value / 100,
            minHeight: 5,
            backgroundColor: Colors.white.withValues(alpha: 0.05),
            valueColor: AlwaysStoppedAnimation<Color>(_barColor()),
          ),
        ),
      ],
    );
  }
}
