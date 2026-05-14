import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/app_theme.dart';
import '../../providers/earnings_provider.dart';

/// Earnings Screen — LC light + orange theme
class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});
  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EarningsProvider>().fetchTransactions();
    });
  }

  // Mock 7-day data for chart
  final List<double> _weekData = [1200, 3400, 2800, 4100, 3200, 1800, 2950];
  final List<String> _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LC.bg,
      body: SafeArea(
        child: Consumer<EarningsProvider>(
          builder: (_, provider, __) {
            return RefreshIndicator(
              color: LC.primary,
              onRefresh: () => provider.fetchTransactions(),
              child: CustomScrollView(
                slivers: [
                  // Header
                  SliverToBoxAdapter(
                    child: Container(
                      color: LC.surface,
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Earnings',
                            style: GoogleFonts.inter(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: LC.text1,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Hero total card
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: LC.orangeGrad,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: LC.primary.withOpacity(0.3),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Total Lifetime Earnings',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: Colors.white70,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '₹${provider.totalEarnings.toInt()}',
                                  style: GoogleFonts.inter(
                                    fontSize: 36,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    _HeroStat(
                                      label: 'Today',
                                      value:
                                          '₹${provider.todayEarnings.toInt()}',
                                    ),
                                    Container(
                                      width: 1,
                                      height: 28,
                                      color: Colors.white30,
                                      margin: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                      ),
                                    ),
                                    _HeroStat(
                                      label: 'This Week',
                                      value:
                                          '₹${provider.weeklyEarnings.toInt()}',
                                    ),
                                    Container(
                                      width: 1,
                                      height: 28,
                                      color: Colors.white30,
                                      margin: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                      ),
                                    ),
                                    const _HeroStat(
                                      label: 'Deliveries',
                                      value: '312',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // 7-day chart
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Last 7 Days',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: LC.text3,
                              letterSpacing: 0.4,
                            ),
                          ),
                          const SizedBox(height: 14),
                          _WeekChart(data: _weekData, labels: _days),
                        ],
                      ),
                    ),
                  ),

                  // Transactions header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
                      child: Text(
                        'Recent Transactions',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: LC.text1,
                        ),
                      ),
                    ),
                  ),

                  if (provider.isLoading)
                    const SliverFillRemaining(
                      child: Center(
                        child: CircularProgressIndicator(color: LC.primary),
                      ),
                    )
                  else if (provider.transactions.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.receipt_long_outlined,
                              size: 64,
                              color: LC.text3,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No transactions yet',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                color: LC.text2,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, i) => _TxItem(tx: provider.transactions[i]),
                          childCount: provider.transactions.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  final String label, value;
  const _HeroStat({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: GoogleFonts.inter(fontSize: 10, color: Colors.white60),
      ),
      Text(
        value,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w800,
          color: Colors.white,
        ),
      ),
    ],
  );
}

class _WeekChart extends StatelessWidget {
  final List<double> data;
  final List<String> labels;
  const _WeekChart({required this.data, required this.labels});

  @override
  Widget build(BuildContext context) {
    final max = data.reduce((a, b) => a > b ? a : b);
    final today = DateTime.now().weekday - 1; // 0=Mon
    return SizedBox(
      height: 120,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(7, (i) {
          final frac = data[i] / max;
          final isToday = i == today;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (isToday)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        '₹${data[i].toInt()}',
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: LC.primary,
                        ),
                      ),
                    ),
                  Flexible(
                    child: LayoutBuilder(
                      builder: (_, constraints) {
                        return Align(
                          alignment: Alignment.bottomCenter,
                          child: AnimatedContainer(
                            duration: Duration(milliseconds: 400 + i * 60),
                            width: double.infinity,
                            height: constraints.maxHeight * frac,
                            decoration: BoxDecoration(
                              color: isToday
                                  ? LC.primary
                                  : LC.primary.withOpacity(0.2),
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(6),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    labels[i],
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
                      color: isToday ? LC.primary : LC.text3,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _TxItem extends StatelessWidget {
  final dynamic tx;
  const _TxItem({required this.tx});

  bool get _pos => (tx.amount as num) >= 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: LC.border),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: (_pos ? LC.success : LC.error).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _pos ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
              color: _pos ? LC.success : LC.error,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.typeDisplayName,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: LC.text1,
                  ),
                ),
                Text(
                  DateFormat(
                    'dd MMM, hh:mm a',
                  ).format(tx.createdAt as DateTime),
                  style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                ),
              ],
            ),
          ),
          Text(
            '${_pos ? '+' : ''}₹${(tx.amount as num).abs().toInt()}',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: _pos ? LC.success : LC.error,
            ),
          ),
        ],
      ),
    );
  }
}
