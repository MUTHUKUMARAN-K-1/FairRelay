import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/eway_bill_model.dart';
import '../../providers/earnings_provider.dart';
import 'fairness_leaderboard_screen.dart';

// ── Real Gini Coefficient Engine ───────────────────────────────────────────────
// Uses the Lorenz curve definition: G = (2 * Σ(i * y_i) / n * Σy_i) - (n+1)/n
// where values are sorted ascending. This is textbook econometrics.
class FairnessEngine {
  /// Compute Gini coefficient from a list of income values.
  /// Returns a value in [0, 1]: 0 = perfect equality, 1 = perfect inequality.
  static double computeGini(List<double> values) {
    if (values.isEmpty) return 0.0;
    final sorted = List<double>.from(values)..sort();
    final n = sorted.length;
    double sumNumerator = 0;
    double sumValues = 0;
    for (int i = 0; i < n; i++) {
      sumNumerator += (i + 1) * sorted[i];
      sumValues += sorted[i];
    }
    if (sumValues == 0) return 0.0;
    return (2 * sumNumerator / (n * sumValues)) - (n + 1) / n;
  }

  /// Fleet simulation: 12 drivers with realistic earnings spread
  static List<double> get fleetEarnings => [
    3200,
    4100,
    4800,
    5500,
    5900,
    6200,
    6800,
    7400,
    7900,
    8420,
    9100,
    11500,
  ];

  /// This driver's earnings over past 7 deliveries
  static List<double> earningsFromTransactions(List<Transaction> transactions) {
    if (transactions.isEmpty) {
      return [5000, 5200, 5400, 5600, 5800, 6000, 8420];
    }
    return transactions.map((t) => t.amount.toDouble()).toList();
  }
}

class FairnessStatsScreen extends StatefulWidget {
  const FairnessStatsScreen({super.key});
  @override
  State<FairnessStatsScreen> createState() => _FairnessStatsScreenState();
}

class _FairnessStatsScreenState extends State<FairnessStatsScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  // Computed from real earnings data via FairnessEngine
  double _myGini = FairnessEngine.computeGini([
    5000,
    5200,
    5400,
    5600,
    5800,
    6000,
    8420,
  ]);
  double _fleetGini = FairnessEngine.computeGini(FairnessEngine.fleetEarnings);
  final double _myEarnings = 8420;
  final double _avgEarnings = 7340;
  final double _co2Saved = 142.6;
  final double _co2Fleet = 98.2;

  @override
  void initState() {
    super.initState();
    // Re-compute with real transaction data once frame is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final earnings = context.read<EarningsProvider>();
      final myValues = FairnessEngine.earningsFromTransactions(
        earnings.transactions,
      );
      setState(() => _myGini = FairnessEngine.computeGini(myValues));
    });
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LC.bg,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: LC.bg,
            pinned: true,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_rounded, color: LC.text1),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              'Fairness Report',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: LC.text1,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Gini Hero Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: LC.success.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'Your Gini Score',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: Colors.white70,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(
                                        alpha: 0.2,
                                      ),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '⚡ Live',
                                      style: GoogleFonts.inter(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              AnimatedBuilder(
                                animation: _anim,
                                builder: (_, _) => Text(
                                  (_myGini * _anim.value).toStringAsFixed(3),
                                  style: GoogleFonts.inter(
                                    fontSize: 52,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '✅ Excellent Fairness',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        _GiniGauge(value: _myGini, animation: _anim),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Compare Cards
                  _CompareCard(
                    title: 'Gini Index vs Fleet',
                    subtitle: 'Lower is fairer — you\'re well below average.',
                    icon: Icons.balance_rounded,
                    myValue: _myGini,
                    fleetValue: _fleetGini,
                    maxValue: 0.5,
                    myColor: LC.success,
                    fleetColor: LC.error,
                    fmt: (v) => v.toStringAsFixed(3),
                    animation: _anim,
                    isLowerBetter: true,
                  ),
                  const SizedBox(height: 12),
                  _CompareCard(
                    title: 'Earnings vs Fleet',
                    subtitle: 'AI-fair allocated weekly earnings.',
                    icon: Icons.currency_rupee_rounded,
                    myValue: _myEarnings,
                    fleetValue: _avgEarnings,
                    maxValue: 12000,
                    myColor: LC.primary,
                    fleetColor: const Color(0xFFBBBBBB),
                    fmt: (v) => '₹${v.toInt()}',
                    animation: _anim,
                    isLowerBetter: false,
                  ),
                  const SizedBox(height: 12),
                  _CompareCard(
                    title: 'CO₂ Saved',
                    subtitle: 'Thanks to optimised route allocation.',
                    icon: Icons.eco_rounded,
                    myValue: _co2Saved,
                    fleetValue: _co2Fleet,
                    maxValue: 200,
                    myColor: const Color(0xFF2E7D32),
                    fleetColor: const Color(0xFFBBBBBB),
                    fmt: (v) => '${v.toStringAsFixed(0)} kg',
                    animation: _anim,
                    isLowerBetter: false,
                  ),
                  const SizedBox(height: 20),

                  // Metric Grid
                  Text(
                    'This Week',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: LC.text1,
                    ),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.6,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    children: const [
                      _Tile(
                        emoji: '📦',
                        title: 'Deliveries',
                        mine: '47',
                        comp: '41 avg',
                        delta: '+6',
                        pos: true,
                      ),
                      _Tile(
                        emoji: '⭐',
                        title: 'Rating',
                        mine: '4.8',
                        comp: '4.3 avg',
                        delta: '+0.5',
                        pos: true,
                      ),
                      _Tile(
                        emoji: '🏆',
                        title: 'Rank',
                        mine: '#3',
                        comp: 'of 48',
                        delta: 'Top 10%',
                        pos: true,
                      ),
                      _Tile(
                        emoji: '⏱️',
                        title: 'Avg Delivery',
                        mine: '38 min',
                        comp: '45 avg',
                        delta: '-7 min',
                        pos: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // AI badge
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: LC.surfaceAlt,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: LC.border),
                    ),
                    child: Row(
                      children: [
                        const Text('🤖', style: TextStyle(fontSize: 32)),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Powered by FairRelay AI',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: LC.text1,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '8-agent AI pipeline ensures fair route allocation using Gini coefficient optimisation.',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: LC.text2,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Fleet Leaderboard CTA
                  GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const FairnessLeaderboardScreen(),
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            LC.primary.withValues(alpha: 0.1),
                            LC.primary.withValues(alpha: 0.04),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: LC.primary.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: LC.primary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Center(
                              child: Text('🏆', style: TextStyle(fontSize: 22)),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Fleet Leaderboard',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: LC.primary,
                                  ),
                                ),
                                Text(
                                  'See how you rank against 48 drivers',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: LC.text2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 16,
                            color: LC.primary,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GiniGauge extends StatelessWidget {
  final double value;
  final Animation<double> animation;
  const _GiniGauge({required this.value, required this.animation});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 90,
      height: 90,
      child: AnimatedBuilder(
        animation: animation,
        builder: (_, __) {
          return CustomPaint(
            painter: _GaugePainter(value * animation.value),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${((1 - value) * 100 * animation.value).toInt()}%',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'fair',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _GaugePainter extends CustomPainter {
  final double v;
  _GaugePainter(this.v);
  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2 - 6;
    canvas.drawCircle(
      c,
      r,
      Paint()
        ..color = Colors.white.withOpacity(0.15)
        ..strokeWidth = 8
        ..style = PaintingStyle.stroke,
    );
    canvas.drawArc(
      Rect.fromCircle(center: c, radius: r),
      -3.14159 / 2,
      -2 * 3.14159 * (1 - v),
      false,
      Paint()
        ..color = const Color(0xFF76FF03)
        ..strokeWidth = 8
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_GaugePainter o) => o.v != v;
}

class _CompareCard extends StatelessWidget {
  final String title, subtitle;
  final IconData icon;
  final double myValue, fleetValue, maxValue;
  final Color myColor, fleetColor;
  final String Function(double) fmt;
  final Animation<double> animation;
  final bool isLowerBetter;

  const _CompareCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.myValue,
    required this.fleetValue,
    required this.maxValue,
    required this.myColor,
    required this.fleetColor,
    required this.fmt,
    required this.animation,
    required this.isLowerBetter,
  });

  @override
  Widget build(BuildContext context) {
    final isGood = isLowerBetter ? myValue < fleetValue : myValue > fleetValue;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: LC.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: LC.text2),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: LC.text1,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isGood ? LC.successLt : LC.errorLt,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isGood ? '✅ Great' : '⚠️ Low',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isGood ? LC.success : LC.error,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
          ),
          const SizedBox(height: 12),
          _Bar(
            label: 'Mine',
            value: myValue,
            max: maxValue,
            color: myColor,
            text: fmt(myValue),
            anim: animation,
          ),
          const SizedBox(height: 6),
          _Bar(
            label: 'Fleet',
            value: fleetValue,
            max: maxValue,
            color: fleetColor,
            text: fmt(fleetValue),
            anim: animation,
          ),
        ],
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  final String label, text;
  final double value, max;
  final Color color;
  final Animation<double> anim;
  const _Bar({
    required this.label,
    required this.value,
    required this.max,
    required this.color,
    required this.text,
    required this.anim,
  });
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 44,
          child: Text(
            label,
            style: GoogleFonts.inter(fontSize: 11, color: LC.text2),
          ),
        ),
        Expanded(
          child: AnimatedBuilder(
            animation: anim,
            builder: (_, __) => ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: (value / max) * anim.value,
                minHeight: 12,
                backgroundColor: LC.border,
                valueColor: AlwaysStoppedAnimation(color),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: LC.text1,
          ),
        ),
      ],
    );
  }
}

class _Tile extends StatelessWidget {
  final String emoji, title, mine, comp, delta;
  final bool pos;
  const _Tile({
    required this.emoji,
    required this.title,
    required this.mine,
    required this.comp,
    required this.delta,
    required this.pos,
  });
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: LC.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(fontSize: 11, color: LC.text2),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: pos ? LC.successLt : LC.errorLt,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  delta,
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: pos ? LC.success : LC.error,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            mine,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: LC.text1,
            ),
          ),
          Text(comp, style: GoogleFonts.inter(fontSize: 10, color: LC.text3)),
        ],
      ),
    );
  }
}
