import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/backhaul_provider.dart';
import '../../models/backhaul_model.dart';
import 'backhaul_detail_screen.dart';

/// Backhaul List Screen — LC light + orange theme
class BackhaulListScreen extends StatefulWidget {
  const BackhaulListScreen({super.key});
  @override
  State<BackhaulListScreen> createState() => _BackhaulListScreenState();
}

class _BackhaulListScreenState extends State<BackhaulListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BackhaulProvider>().fetchOpportunities();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LC.bg,
      appBar: AppBar(
        backgroundColor: LC.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: LC.text1),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Backhaul Opportunities',
          style: GoogleFonts.inter(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: LC.text1,
          ),
        ),
      ),
      body: Consumer<BackhaulProvider>(
        builder: (ctx, provider, _) {
          return RefreshIndicator(
            color: LC.primary,
            onRefresh: () => provider.fetchOpportunities(),
            child: CustomScrollView(
              slivers: [
                // Info banner
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF1B5E20),
                          const Color(0xFF2E7D32),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.eco_rounded,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Backhaul = Extra Earnings + Less CO₂',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                'Accept return loads to earn more on your way back.',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                if (provider.isLoading)
                  const SliverFillRemaining(
                    child: Center(
                      child: CircularProgressIndicator(color: LC.primary),
                    ),
                  )
                else if (provider.opportunities.isEmpty)
                  SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.replay_rounded,
                            size: 64,
                            color: LC.text3,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No backhaul opportunities',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: LC.text2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'New opportunities will appear as you complete deliveries.',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: LC.text3,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => GestureDetector(
                          onTap: () => Navigator.push(
                            ctx,
                            MaterialPageRoute(
                              builder: (_) => BackhaulDetailScreen(
                                backhaul: provider.opportunities[i],
                              ),
                            ),
                          ),
                          child: _BackhaulCard(
                            backhaul: provider.opportunities[i],
                            onAccept: () => provider.acceptBackhaul(
                              provider.opportunities[i].id,
                            ),
                            onReject: () => provider.rejectBackhaul(
                              provider.opportunities[i].id,
                            ),
                          ),
                        ),
                        childCount: provider.opportunities.length,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BackhaulCard extends StatelessWidget {
  final BackhaulPickup backhaul;
  final VoidCallback onAccept, onReject;
  const _BackhaulCard({
    required this.backhaul,
    required this.onAccept,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: LC.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Green top band
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: LC.successLt,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: LC.success.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    backhaul.statusDisplayName,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: LC.success,
                    ),
                  ),
                ),
                const Spacer(),
                const Icon(
                  Icons.eco_rounded,
                  size: 14,
                  color: Color(0xFF2E7D32),
                ),
                const SizedBox(width: 4),
                Text(
                  '${backhaul.carbonSavedKg.toStringAsFixed(1)} kg CO₂ saved',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2E7D32),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  backhaul.shipperName,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: LC.text1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  backhaul.shipperLocation,
                  style: GoogleFonts.inter(fontSize: 12, color: LC.text3),
                ),

                const SizedBox(height: 14),
                Row(
                  children: [
                    _InfoChip(
                      icon: Icons.inventory_2_outlined,
                      label: '${backhaul.packageCount} pkgs',
                    ),
                    const SizedBox(width: 8),
                    _InfoChip(
                      icon: Icons.scale_outlined,
                      label: '${backhaul.totalWeight.toStringAsFixed(0)} kg',
                    ),
                    const SizedBox(width: 8),
                    _InfoChip(
                      icon: Icons.straighten_outlined,
                      label: '${backhaul.distanceKm.toStringAsFixed(1)} km',
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: LC.success.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '+₹${(backhaul.distanceKm * 12).toInt()}',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: LC.success,
                        ),
                      ),
                    ),
                  ],
                ),

                if (backhaul.canAccept) ...[
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: onReject,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: LC.error),
                            foregroundColor: LC.error,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            'Decline',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: onAccept,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: LC.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            'Accept Backhaul',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
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

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
    decoration: BoxDecoration(
      color: LC.surfaceAlt,
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: LC.text3),
        const SizedBox(width: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: LC.text2)),
      ],
    ),
  );
}
