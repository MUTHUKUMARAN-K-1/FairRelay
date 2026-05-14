import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/app_theme.dart';

// ── Mock driver data ──────────────────────────────────────────────────────────
class _Driver {
  final String initials, name, city;
  final double gini, earnings;
  final int deliveries;
  final bool isMe;
  final bool trendUp;
  const _Driver({
    required this.initials,
    required this.name,
    required this.city,
    required this.gini,
    required this.earnings,
    required this.deliveries,
    this.isMe = false,
    this.trendUp = true,
  });
}

const _kDrivers = [
  _Driver(
    initials: 'AK',
    name: 'Arjun Kumar',
    city: 'Mumbai',
    gini: 0.042,
    earnings: 11200,
    deliveries: 61,
    trendUp: true,
  ),
  _Driver(
    initials: 'SR',
    name: 'Suresh Reddy',
    city: 'Hyderabad',
    gini: 0.055,
    earnings: 10840,
    deliveries: 58,
    trendUp: true,
  ),
  _Driver(
    initials: 'MK',
    name: 'Mukesh Khanna',
    city: 'Pune',
    gini: 0.071,
    earnings: 10100,
    deliveries: 55,
    trendUp: false,
  ),
  _Driver(
    initials: 'RP',
    name: 'Ravi Pillai',
    city: 'Chennai',
    gini: 0.080,
    earnings: 9850,
    deliveries: 52,
    trendUp: true,
    isMe: true,
  ),
  _Driver(
    initials: 'VN',
    name: 'Vijay Nair',
    city: 'Bangalore',
    gini: 0.091,
    earnings: 9200,
    deliveries: 49,
    trendUp: true,
  ),
  _Driver(
    initials: 'DS',
    name: 'Deepak Singh',
    city: 'Delhi',
    gini: 0.108,
    earnings: 8700,
    deliveries: 47,
    trendUp: false,
  ),
  _Driver(
    initials: 'PM',
    name: 'Pradeep Mehta',
    city: 'Surat',
    gini: 0.124,
    earnings: 8200,
    deliveries: 44,
    trendUp: true,
  ),
  _Driver(
    initials: 'RY',
    name: 'Rajesh Yadav',
    city: 'Nagpur',
    gini: 0.138,
    earnings: 7900,
    deliveries: 42,
    trendUp: false,
  ),
  _Driver(
    initials: 'KP',
    name: 'Kartik Patel',
    city: 'Ahmedabad',
    gini: 0.152,
    earnings: 7400,
    deliveries: 40,
    trendUp: true,
  ),
  _Driver(
    initials: 'SP',
    name: 'Santosh Pawar',
    city: 'Nasik',
    gini: 0.171,
    earnings: 6900,
    deliveries: 37,
    trendUp: false,
  ),
  _Driver(
    initials: 'MR',
    name: 'Mahesh Raut',
    city: 'Kolhapur',
    gini: 0.193,
    earnings: 6400,
    deliveries: 34,
    trendUp: false,
  ),
  _Driver(
    initials: 'BK',
    name: 'Bharat Kumar',
    city: 'Solapur',
    gini: 0.218,
    earnings: 5900,
    deliveries: 31,
    trendUp: false,
  ),
];

class FairnessLeaderboardScreen extends StatefulWidget {
  const FairnessLeaderboardScreen({super.key});
  @override
  State<FairnessLeaderboardScreen> createState() =>
      _FairnessLeaderboardScreenState();
}

class _FairnessLeaderboardScreenState extends State<FairnessLeaderboardScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
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
          // ── App Bar ──────────────────────────────────────────────────────
          SliverAppBar(
            backgroundColor: LC.surface,
            pinned: true,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_rounded, color: LC.text1),
              onPressed: () => Navigator.pop(context),
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Fleet Leaderboard',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: LC.text1,
                  ),
                ),
                Text(
                  'Ranked by Gini Fairness Score',
                  style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                ),
              ],
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(height: 1, color: LC.border),
            ),
          ),

          // ── Podium Hero ───────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: _Podium(animation: _anim),
            ),
          ),

          // ── My Rank Banner ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      LC.primary.withValues(alpha: 0.12),
                      LC.primary.withValues(alpha: 0.04),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: LC.primary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: LC.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(
                          '#4',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Your Position',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: LC.primary,
                            ),
                          ),
                          Text(
                            'Gini 0.080 · Top 33% · ↑ 2 spots this week',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: LC.text2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Text('🏅', style: TextStyle(fontSize: 24)),
                  ],
                ),
              ),
            ),
          ),

          // ── List header ───────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 36,
                    child: Text(
                      'Rank',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: LC.text3,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Driver',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: LC.text3,
                      ),
                    ),
                  ),
                  Text(
                    'Gini',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: LC.text3,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Driver List ───────────────────────────────────────────────────
          SliverList(
            delegate: SliverChildBuilderDelegate((context, i) {
              final d = _kDrivers[i];
              final rank = i + 1;
              // stagger delay per row
              final delay = i / _kDrivers.length;
              return AnimatedBuilder(
                animation: _anim,
                builder: (_, child) {
                  final t = (((_anim.value - delay) / (1 - delay)).clamp(
                    0.0,
                    1.0,
                  ));
                  return Opacity(
                    opacity: t,
                    child: Transform.translate(
                      offset: Offset(0, 20 * (1 - t)),
                      child: child,
                    ),
                  );
                },
                child: _LeaderRow(rank: rank, driver: d, animation: _anim),
              );
            }, childCount: _kDrivers.length),
          ),

          // ── Footer note ───────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: LC.surfaceAlt,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: LC.border),
                ),
                child: Row(
                  children: [
                    const Text('🤖', style: TextStyle(fontSize: 20)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Gini score is recalculated by FairRelay AI after each delivery. '
                        'Lower score = more evenly distributed earnings.',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: LC.text2,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Podium ────────────────────────────────────────────────────────────────────
class _Podium extends StatelessWidget {
  final Animation<double> animation;
  const _Podium({required this.animation});

  @override
  Widget build(BuildContext context) {
    final top = _kDrivers.take(3).toList();
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // 2nd
        Expanded(
          child: _PodiumPillar(
            driver: top[1],
            rank: 2,
            height: 100,
            animation: animation,
          ),
        ),
        const SizedBox(width: 8),
        // 1st
        Expanded(
          child: _PodiumPillar(
            driver: top[0],
            rank: 1,
            height: 130,
            animation: animation,
          ),
        ),
        const SizedBox(width: 8),
        // 3rd
        Expanded(
          child: _PodiumPillar(
            driver: top[2],
            rank: 3,
            height: 76,
            animation: animation,
          ),
        ),
      ],
    );
  }
}

class _PodiumPillar extends StatelessWidget {
  final _Driver driver;
  final int rank;
  final double height;
  final Animation<double> animation;
  const _PodiumPillar({
    required this.driver,
    required this.rank,
    required this.height,
    required this.animation,
  });

  static const _colors = [
    Color(0xFFFFD700), // gold
    Color(0xFFC0C0C0), // silver
    Color(0xFFCD7F32), // bronze
  ];
  static const _crowns = ['🥇', '🥈', '🥉'];

  @override
  Widget build(BuildContext context) {
    final col = _colors[rank - 1];
    return Column(
      children: [
        Text(_crowns[rank - 1], style: const TextStyle(fontSize: 24)),
        const SizedBox(height: 6),
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [col.withValues(alpha: 0.9), col],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: col.withValues(alpha: 0.4),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: Text(
              driver.initials,
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: rank == 1 ? Colors.brown[900] : Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          driver.name.split(' ').first,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: LC.text1,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        Text(
          'Gini ${driver.gini.toStringAsFixed(3)}',
          style: GoogleFonts.inter(fontSize: 10, color: LC.text3),
        ),
        const SizedBox(height: 6),
        AnimatedBuilder(
          animation: animation,
          builder: (_, __) => Container(
            height: height * animation.value,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  col.withValues(alpha: 0.6),
                  col.withValues(alpha: 0.3),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
            ),
            child: Center(
              child: Text(
                '#$rank',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: rank == 1 ? Colors.brown[800] : Colors.white70,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Leaderboard Row ───────────────────────────────────────────────────────────
class _LeaderRow extends StatelessWidget {
  final int rank;
  final _Driver driver;
  final Animation<double> animation;
  const _LeaderRow({
    required this.rank,
    required this.driver,
    required this.animation,
  });

  @override
  Widget build(BuildContext context) {
    final isTop3 = rank <= 3;
    final topColors = [
      LC.primary,
      const Color(0xFFC0C0C0),
      const Color(0xFFCD7F32),
    ];
    final borderColor = driver.isMe
        ? LC.primary
        : isTop3
        ? topColors[rank - 1]
        : LC.border;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: driver.isMe ? LC.primary.withValues(alpha: 0.06) : LC.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: borderColor.withValues(alpha: driver.isMe ? 0.5 : 0.3),
          ),
        ),
        child: Row(
          children: [
            // Rank
            SizedBox(
              width: 36,
              child: Text(
                isTop3 ? ['🥇', '🥈', '🥉'][rank - 1] : '#$rank',
                style: GoogleFonts.inter(
                  fontSize: isTop3 ? 18 : 13,
                  fontWeight: FontWeight.w700,
                  color: LC.text2,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Avatar
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                gradient: driver.isMe
                    ? LC.orangeGrad
                    : LinearGradient(colors: [LC.surfaceAlt, LC.border]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  driver.initials,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: driver.isMe ? Colors.white : LC.text2,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        driver.name,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: LC.text1,
                        ),
                      ),
                      if (driver.isMe) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: LC.primary,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'You',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  Text(
                    '${driver.city} · ${driver.deliveries} deliveries · ₹${(driver.earnings / 1000).toStringAsFixed(1)}k',
                    style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                  ),
                ],
              ),
            ),
            // Gini + trend
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  driver.gini.toStringAsFixed(3),
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: driver.gini < 0.1 ? LC.success : LC.text1,
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      driver.trendUp
                          ? Icons.trending_up_rounded
                          : Icons.trending_down_rounded,
                      size: 12,
                      color: driver.trendUp ? LC.success : LC.error,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      driver.trendUp ? '↑' : '↓',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: driver.trendUp ? LC.success : LC.error,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
