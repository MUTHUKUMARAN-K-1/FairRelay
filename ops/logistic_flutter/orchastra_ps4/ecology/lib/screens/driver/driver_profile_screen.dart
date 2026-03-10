import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../screens/auth/phone_login_screen.dart';
import 'badges_screen.dart';

/// Driver Profile Screen — rich profile with stats, vehicle, wellness, earnings
class DriverProfileScreen extends StatefulWidget {
  const DriverProfileScreen({super.key});

  @override
  State<DriverProfileScreen> createState() => _DriverProfileScreenState();
}

class _DriverProfileScreenState extends State<DriverProfileScreen> {
  // Demo stats
  final int _totalDeliveries = 312;
  final double _rating = 4.8;
  final double _weeklyEarnings = 8420;
  final double _co2Saved = 142.6; // kg
  final String _wellnessStatus = 'Fit'; // Fit / Moderate / Fatigued
  final String _vehicleType = 'DIESEL';
  final String _vehiclePlate = 'TN 09 BX 4720';
  final int _rankInFleet = 3;
  final int _totalDrivers = 48;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;

    return Scaffold(
      backgroundColor: LC.bg,
      body: CustomScrollView(
        slivers: [
          // ── Orange header ──────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: LC.primary,
            leading: IconButton(
              icon: const Icon(
                Icons.arrow_back_ios_rounded,
                color: Colors.white,
              ),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  // Decorative circles
                  Positioned(
                    right: -40,
                    top: -40,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.07),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 40,
                    top: 60,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.07),
                      ),
                    ),
                  ),
                  // Avatar + name
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color: LC.primary.withOpacity(0.4),
                                  blurRadius: 16,
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                user?.displayInitials ?? 'D',
                                style: GoogleFonts.inter(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                  color: LC.primary,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            user?.name ?? 'Driver',
                            style: GoogleFonts.inter(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '🚗  $_vehiclePlate',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: Colors.white.withOpacity(0.9),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              _WellnessBadge(status: _wellnessStatus),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Stats Row ─────────────────────────────────────────────
                  Row(
                    children: [
                      _ProfileStat(
                        icon: Icons.local_shipping_rounded,
                        value: '$_totalDeliveries',
                        label: 'Deliveries',
                        color: LC.primary,
                      ),
                      _ProfileStat(
                        icon: Icons.star_rounded,
                        value: _rating.toStringAsFixed(1),
                        label: 'Rating',
                        color: const Color(0xFFF9A825),
                      ),
                      _ProfileStat(
                        icon: Icons.currency_rupee_rounded,
                        value: '₹${_weeklyEarnings.toInt()}',
                        label: 'This Week',
                        color: LC.success,
                      ),
                      _ProfileStat(
                        icon: Icons.eco_rounded,
                        value: '${_co2Saved.toStringAsFixed(0)}kg',
                        label: 'CO₂ Saved',
                        color: const Color(0xFF2E7D32),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // ── Fleet Rank Card ────────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LC.orangeGrad,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                            child: Text(
                              '#$_rankInFleet',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Fleet Rank',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.white70,
                                ),
                              ),
                              Text(
                                'Top performer this week',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Out of $_totalDrivers drivers',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.emoji_events_rounded,
                          color: Colors.amber,
                          size: 36,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Vehicle Card ──────────────────────────────────────────
                  _SectionTitle('My Vehicle'),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: LC.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: LC.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: LC.surfaceAlt,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.local_shipping_rounded,
                            color: LC.primary,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _vehiclePlate,
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: LC.text1,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _vehicleType,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: LC.text2,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: LC.successLt,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Active',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: LC.success,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Menu Items ────────────────────────────────────────────
                  _SectionTitle('Account'),
                  const SizedBox(height: 12),
                  _MenuCard(
                    items: [
                      _MenuItem(
                        icon: Icons.person_outline_rounded,
                        label: 'Edit Profile',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.military_tech_rounded,
                        label: '🏅 Badges & Achievements',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const BadgesScreen(),
                          ),
                        ),
                      ),
                      _MenuItem(
                        icon: Icons.health_and_safety_outlined,
                        label: 'Wellness Check-in',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.bar_chart_rounded,
                        label: 'My Stats',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.description_outlined,
                        label: 'Documents',
                        onTap: () {},
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  _SectionTitle('More'),
                  const SizedBox(height: 12),
                  _MenuCard(
                    items: [
                      _MenuItem(
                        icon: Icons.help_outline_rounded,
                        label: 'Help & Support',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.privacy_tip_outlined,
                        label: 'Privacy Policy',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.info_outline_rounded,
                        label: 'App Version 1.0.0',
                        onTap: () {},
                        showArrow: false,
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Logout
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        await auth.logout();
                        if (context.mounted) {
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const PhoneLoginScreen(),
                            ),
                            (r) => false,
                          );
                        }
                      },
                      icon: const Icon(Icons.logout_rounded, size: 18),
                      label: const Text('Logout'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: LC.errorLt,
                        foregroundColor: LC.error,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
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

class _WellnessBadge extends StatelessWidget {
  final String status;
  const _WellnessBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String emoji;
    switch (status) {
      case 'Moderate':
        color = LC.warning;
        emoji = '😐';
        break;
      case 'Fatigued':
        color = LC.error;
        emoji = '😴';
        break;
      default:
        color = LC.success;
        emoji = '💪';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(
        '$emoji $status',
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class _ProfileStat extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _ProfileStat({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: LC.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: LC.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: LC.text1,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(fontSize: 9, color: LC.text3),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: LC.text3,
        letterSpacing: 0.5,
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final List<_MenuItem> items;
  const _MenuCard({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: LC.border),
      ),
      child: Column(
        children: items.asMap().entries.map((e) {
          final isLast = e.key == items.length - 1;
          return Column(
            children: [
              e.value,
              if (!isLast)
                const Divider(height: 1, indent: 60, color: LC.divider),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool showArrow;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.showArrow = true,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: LC.surfaceAlt,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: LC.primary),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(fontSize: 14, color: LC.text1),
              ),
            ),
            if (showArrow)
              const Icon(
                Icons.arrow_forward_ios_rounded,
                size: 14,
                color: LC.text3,
              ),
          ],
        ),
      ),
    );
  }
}
