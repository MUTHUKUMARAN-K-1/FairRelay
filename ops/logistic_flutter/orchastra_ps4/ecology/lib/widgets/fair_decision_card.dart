import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/app_theme.dart';
import '../models/delivery_model.dart';

/// FairDecisionCard — shows WHY FairDispatch AI picked this driver.
/// Call via: FairDecisionCard.show(context, delivery: d, fairnessDebt: 4200)
class FairDecisionCard extends StatefulWidget {
  final Delivery delivery;
  final double fairnessDebt;
  final VoidCallback? onAccept;

  const FairDecisionCard({
    super.key,
    required this.delivery,
    required this.fairnessDebt,
    this.onAccept,
  });

  /// Convenience method to show as bottom sheet
  static Future<void> show(
    BuildContext context, {
    required Delivery delivery,
    required double fairnessDebt,
    VoidCallback? onAccept,
  }) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => FairDecisionCard(
        delivery: delivery,
        fairnessDebt: fairnessDebt,
        onAccept: onAccept,
      ),
    );
  }

  @override
  State<FairDecisionCard> createState() => _FairDecisionCardState();
}

class _FairDecisionCardState extends State<FairDecisionCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  // Staggered reveal flags
  bool _showReason1 = false;
  bool _showReason2 = false;
  bool _showReason3 = false;
  bool _showRejected = false;
  bool _showCta = false;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));

    _ctrl.forward();
    _staggerReasons();
  }

  Future<void> _staggerReasons() async {
    await Future.delayed(const Duration(milliseconds: 400));
    if (mounted) setState(() => _showReason1 = true);
    await Future.delayed(const Duration(milliseconds: 350));
    if (mounted) setState(() => _showReason2 = true);
    await Future.delayed(const Duration(milliseconds: 350));
    if (mounted) setState(() => _showReason3 = true);
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) setState(() => _showRejected = true);
    await Future.delayed(const Duration(milliseconds: 300));
    if (mounted) setState(() => _showCta = true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  double get _distKm => widget.delivery.distanceKm ?? 2.1;
  String get _cargo => widget.delivery.cargoType;
  double get _weight => widget.delivery.cargoWeight;
  double get _debt => widget.fairnessDebt;

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnim,
      child: FadeTransition(
        opacity: _fadeAnim,
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.88,
          ),
          decoration: const BoxDecoration(
            color: LC.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: LC.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Header
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: LC.orangeGrad,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.auto_awesome_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'FairDispatch AI Decision',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: LC.text1,
                            ),
                          ),
                          Text(
                            'Why YOU were selected for this delivery',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: LC.text2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Pulsing AI badge
                    _PulsingBadge(),
                  ],
                ),

                const SizedBox(height: 20),

                // Delivery summary
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: LC.bg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: LC.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.local_shipping_rounded,
                        color: LC.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.delivery.pickupLocation,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: LC.text1,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              '→ ${widget.delivery.dropLocation}',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: LC.text2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: LC.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${_distKm.toStringAsFixed(1)} km',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: LC.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                Text(
                  '✅  Reasons AI Selected You',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: LC.text2,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 10),

                // Reason 1 — Fairness debt
                _AnimatedReason(
                  visible: _showReason1,
                  icon: Icons.balance_rounded,
                  color: LC.primary,
                  title: 'Highest Fairness Debt',
                  subtitle:
                      'System owes you ₹${_debt.toStringAsFixed(0)} — prioritizing your next ${(_debt / 1500).ceil()} deliveries to balance the ledger.',
                  badge: '+₹${_debt.toStringAsFixed(0)} owed',
                  badgeColor: LC.primary,
                ),

                // Reason 2 — Distance
                _AnimatedReason(
                  visible: _showReason2,
                  icon: Icons.near_me_rounded,
                  color: const Color(0xFF2E7D32),
                  title: 'Nearest Qualified Driver',
                  subtitle:
                      'You are ${_distKm.toStringAsFixed(1)} km away — closest available driver with matching vehicle capacity.',
                  badge: '${_distKm.toStringAsFixed(1)} km away',
                  badgeColor: const Color(0xFF2E7D32),
                ),

                // Reason 3 — Cargo match
                _AnimatedReason(
                  visible: _showReason3,
                  icon: Icons.inventory_2_rounded,
                  color: LC.info,
                  title: 'Perfect Cargo Match',
                  subtitle:
                      'Your truck capacity matches $_weight T of $_cargo. No wasted space, maximum efficiency score.',
                  badge: '$_weight T matched',
                  badgeColor: LC.info,
                ),

                const SizedBox(height: 16),

                // Who was rejected
                AnimatedOpacity(
                  opacity: _showRejected ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 400),
                  child: _RejectedDriverCard(),
                ),

                const SizedBox(height: 20),

                // Earnings breakdown
                AnimatedOpacity(
                  opacity: _showCta ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 400),
                  child: _EarningsBreakdown(delivery: widget.delivery),
                ),

                const SizedBox(height: 16),

                // CTA
                AnimatedSlide(
                  offset: _showCta ? Offset.zero : const Offset(0, 0.5),
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeOutCubic,
                  child: AnimatedOpacity(
                    opacity: _showCta ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 400),
                    child: SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          widget.onAccept?.call();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: LC.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        icon: const Icon(Icons.check_circle_rounded, size: 20),
                        label: Text(
                          'Accept Delivery',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                AnimatedOpacity(
                  opacity: _showCta ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 400),
                  child: SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        'Skip for now',
                        style: GoogleFonts.inter(
                          color: LC.text3,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Pulsing AI badge ──────────────────────────────────────────────────────────
class _PulsingBadge extends StatefulWidget {
  @override
  State<_PulsingBadge> createState() => _PulsingBadgeState();
}

class _PulsingBadgeState extends State<_PulsingBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _scale = Tween<double>(
      begin: 0.92,
      end: 1.08,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          gradient: LC.orangeGrad,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: LC.primary.withValues(alpha: 0.4),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Text(
          '🤖 AI LIVE',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}

// ── Animated reason row ───────────────────────────────────────────────────────
class _AnimatedReason extends StatelessWidget {
  final bool visible;
  final IconData icon;
  final Color color;
  final String title, subtitle, badge;
  final Color badgeColor;

  const _AnimatedReason({
    required this.visible,
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.badgeColor,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSlide(
      offset: visible ? Offset.zero : const Offset(-0.15, 0),
      duration: const Duration(milliseconds: 380),
      curve: Curves.easeOutCubic,
      child: AnimatedOpacity(
        opacity: visible ? 1.0 : 0.0,
        duration: const Duration(milliseconds: 380),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: 0.18)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: LC.text1,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: badgeColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            badge,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: badgeColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
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
      ),
    );
  }
}

// ── Rejected driver comparison ────────────────────────────────────────────────
class _RejectedDriverCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: LC.error.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: LC.error.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.block_rounded, color: LC.error, size: 16),
              const SizedBox(width: 8),
              Text(
                'Instead of (rejected by AI)',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: LC.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _RejectedRow(
            name: 'Ramesh K.',
            reason: 'Already earned ₹8,900 this week — fairness debt cleared',
            icon: Icons.currency_rupee_rounded,
          ),
          const SizedBox(height: 6),
          _RejectedRow(
            name: 'Vijay M.',
            reason: 'Truck capacity mismatch — overweight by 2.3T',
            icon: Icons.scale_rounded,
          ),
        ],
      ),
    );
  }
}

class _RejectedRow extends StatelessWidget {
  final String name, reason;
  final IconData icon;
  const _RejectedRow({
    required this.name,
    required this.reason,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: LC.error.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: LC.error, size: 13),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: LC.text1,
                  decoration: TextDecoration.lineThrough,
                  decorationColor: LC.error,
                ),
              ),
              Text(
                reason,
                style: GoogleFonts.inter(fontSize: 11, color: LC.text2),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Earnings breakdown ────────────────────────────────────────────────────────
class _EarningsBreakdown extends StatelessWidget {
  final Delivery delivery;
  const _EarningsBreakdown({required this.delivery});

  @override
  Widget build(BuildContext context) {
    final base = delivery.baseEarnings > 0 ? delivery.baseEarnings : 650.0;
    final bonus = delivery.marketplaceBonus > 0
        ? delivery.marketplaceBonus
        : 120.0;
    final fuel = delivery.fuelSurcharge > 0 ? delivery.fuelSurcharge : 85.0;
    final total = base + bonus + fuel;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            LC.success.withValues(alpha: 0.08),
            LC.success.withValues(alpha: 0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: LC.success.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '💰  Earnings for This Delivery',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: LC.text1,
            ),
          ),
          const SizedBox(height: 12),
          _EarRow(label: 'Base Pay', value: '₹${base.toStringAsFixed(0)}'),
          _EarRow(
            label: 'Fair Bonus',
            value: '+₹${bonus.toStringAsFixed(0)}',
            highlight: true,
          ),
          _EarRow(
            label: 'Fuel Surcharge',
            value: '+₹${fuel.toStringAsFixed(0)}',
          ),
          const Divider(height: 16, color: LC.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: LC.text1,
                ),
              ),
              Text(
                '₹${total.toStringAsFixed(0)}',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: LC.success,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EarRow extends StatelessWidget {
  final String label, value;
  final bool highlight;
  const _EarRow({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: LC.text2)),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: highlight ? FontWeight.w700 : FontWeight.w500,
              color: highlight ? LC.success : LC.text1,
            ),
          ),
        ],
      ),
    );
  }
}
