import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/app_theme.dart';

// ── Badge Model ───────────────────────────────────────────────────────────────
class _Badge {
  final String emoji, title, description;
  final bool earned;
  final double progress; // 0.0 – 1.0 for locked badges
  final Color color;
  const _Badge({
    required this.emoji,
    required this.title,
    required this.description,
    required this.earned,
    this.progress = 0,
    required this.color,
  });
}

const _kBadges = [
  _Badge(
    emoji: '🚀',
    title: 'First Delivery',
    description: 'Completed your very first delivery',
    earned: true,
    color: Color(0xFF2979FF),
  ),
  _Badge(
    emoji: '📦',
    title: '50 Deliveries',
    description: 'Completed 50 deliveries successfully',
    earned: true,
    color: Color(0xFF00BCD4),
  ),
  _Badge(
    emoji: '⚖️',
    title: 'Fair Champion',
    description: 'Maintained Gini score below 0.10 for 4 weeks',
    earned: true,
    color: Color(0xFF4CAF50),
  ),
  _Badge(
    emoji: '⭐',
    title: '5-Star Driver',
    description: 'Maintained 4.8+ rating for 30 deliveries',
    earned: true,
    color: Color(0xFFFFC107),
  ),
  _Badge(
    emoji: '🌿',
    title: 'Green Hero',
    description: 'Saved 100 kg of CO₂ through smart routing',
    earned: true,
    color: Color(0xFF2E7D32),
  ),
  _Badge(
    emoji: '🤖',
    title: 'Demo Pioneer',
    description: 'Ran the FairDispatch AI live demo',
    earned: false,
    progress: 0.0,
    color: Color(0xFF7B1FA2),
  ),
  _Badge(
    emoji: '🔗',
    title: 'Synergy Expert',
    description: 'Used the Synergy Hub for 5 backhaul matches',
    earned: false,
    progress: 0.4,
    color: Color(0xFFE65100),
  ),
  _Badge(
    emoji: '🏆',
    title: 'Top 10 Fleet',
    description: 'Reached top 10 on the Fleet Leaderboard',
    earned: false,
    progress: 0.75,
    color: Color(0xFFD4A017),
  ),
];

class BadgesScreen extends StatefulWidget {
  const BadgesScreen({super.key});
  @override
  State<BadgesScreen> createState() => _BadgesScreenState();
}

class _BadgesScreenState extends State<BadgesScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
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
    final earned = _kBadges.where((b) => b.earned).toList();
    final locked = _kBadges.where((b) => !b.earned).toList();

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
                  'Badges & Achievements',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: LC.text1,
                  ),
                ),
                Text(
                  '${earned.length} of ${_kBadges.length} earned',
                  style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                ),
              ],
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(height: 1, color: LC.border),
            ),
          ),

          // ── Progress summary ──────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: LC.success.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${earned.length} Badges Earned',
                            style: GoogleFonts.inter(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${locked.length} more to unlock · Keep delivering!',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white70,
                            ),
                          ),
                          const SizedBox(height: 12),
                          AnimatedBuilder(
                            animation: _anim,
                            builder: (_, __) => ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value:
                                    (earned.length / _kBadges.length) *
                                    _anim.value,
                                minHeight: 8,
                                backgroundColor: Colors.white.withValues(
                                  alpha: 0.2,
                                ),
                                valueColor: const AlwaysStoppedAnimation(
                                  Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Big trophy
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Center(
                        child: Text('🏆', style: TextStyle(fontSize: 34)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Earned section ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              child: Text(
                'Earned',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: LC.text1,
                ),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverGrid(
              delegate: SliverChildBuilderDelegate((context, i) {
                final delay = i / earned.length * 0.6;
                return AnimatedBuilder(
                  animation: _anim,
                  builder: (_, child) {
                    final t = ((_anim.value - delay) / (1 - delay)).clamp(
                      0.0,
                      1.0,
                    );
                    return Opacity(
                      opacity: t,
                      child: Transform.scale(
                        scale: 0.85 + 0.15 * t,
                        child: child,
                      ),
                    );
                  },
                  child: _BadgeTile(badge: earned[i]),
                );
              }, childCount: earned.length),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.1,
              ),
            ),
          ),

          // ── Locked section ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              child: Row(
                children: [
                  Text(
                    'In Progress',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: LC.text1,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: LC.surfaceAlt,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: LC.border),
                    ),
                    child: Text(
                      '${locked.length} locked',
                      style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _LockedBadgeRow(badge: locked[i], animation: _anim),
                ),
                childCount: locked.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Earned Badge Tile ─────────────────────────────────────────────────────────
class _BadgeTile extends StatelessWidget {
  final _Badge badge;
  const _BadgeTile({required this.badge});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: badge.color.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: badge.color.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      badge.color.withValues(alpha: 0.2),
                      badge.color.withValues(alpha: 0.08),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    badge.emoji,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              Icon(Icons.check_circle_rounded, color: badge.color, size: 18),
            ],
          ),
          const Spacer(),
          Text(
            badge.title,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: LC.text1,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            badge.description,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: LC.text3,
              height: 1.3,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ── Locked Badge Row ──────────────────────────────────────────────────────────
class _LockedBadgeRow extends StatelessWidget {
  final _Badge badge;
  final Animation<double> animation;
  const _LockedBadgeRow({required this.badge, required this.animation});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: LC.border),
      ),
      child: Row(
        children: [
          // Greyscale badge icon
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: LC.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
            ),
            child: ColorFiltered(
              colorFilter: const ColorFilter.matrix([
                0.2126,
                0.7152,
                0.0722,
                0,
                0,
                0.2126,
                0.7152,
                0.0722,
                0,
                0,
                0.2126,
                0.7152,
                0.0722,
                0,
                0,
                0,
                0,
                0,
                1,
                0,
              ]),
              child: Center(
                child: Text(badge.emoji, style: const TextStyle(fontSize: 24)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      badge.title,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: LC.text2,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      badge.progress > 0
                          ? '${(badge.progress * 100).toInt()}%'
                          : 'Locked',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: badge.progress > 0 ? badge.color : LC.text3,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  badge.description,
                  style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (badge.progress > 0) ...[
                  const SizedBox(height: 6),
                  AnimatedBuilder(
                    animation: animation,
                    builder: (_, __) => ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: badge.progress * animation.value,
                        minHeight: 5,
                        backgroundColor: LC.border,
                        valueColor: AlwaysStoppedAnimation(badge.color),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
