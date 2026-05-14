import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/delivery_provider.dart';

/// Route Map Screen — live delivery map with stops, progress, and navigation
/// Set [miniMode] = true to render as an embedded map preview (no UI chrome).
class RouteMapScreen extends StatefulWidget {
  final bool miniMode;
  const RouteMapScreen({super.key, this.miniMode = false});

  @override
  State<RouteMapScreen> createState() => _RouteMapScreenState();
}

class _RouteMapScreenState extends State<RouteMapScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late AnimationController _slideCtrl;
  late Animation<double> _pulseAnim;
  late Animation<Offset> _slideAnim;

  int _activeStop = 0;
  bool _panelExpanded = false;

  // Mock delivery stops for demo
  final List<_Stop> _stops = const [
    _Stop(
      label: 'Pickup',
      address: 'Guindy Industrial Estate, Chennai',
      done: true,
    ),
    _Stop(
      label: 'Drop 1',
      address: 'T-Nagar Shopping Hub, Chennai',
      done: true,
    ),
    _Stop(label: 'Drop 2', address: 'Velachery Main Rd, Chennai', done: false),
    _Stop(
      label: 'Drop 3',
      address: 'OMR Tech Park, Sholinganallur',
      done: false,
    ),
    _Stop(
      label: 'Final Drop',
      address: 'Perungudi Warehouse, Chennai',
      done: false,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _activeStop = 2; // currently at stop index 2
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _slideCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _pulseAnim = Tween(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOutCubic));
    _slideCtrl.forward();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _slideCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final delivery = context.watch<DeliveryProvider>().activeDelivery;
    final completedStops = _stops.where((s) => s.done).length;
    final progress = completedStops / _stops.length;

    // Mini mode: just render the map canvas with no scaffold/panels
    if (widget.miniMode) {
      return _MapCanvas(
        activeStopIndex: _activeStop,
        stops: _stops,
        pulseAnim: _pulseAnim,
      );
    }

    return Scaffold(
      backgroundColor: LC.bg,
      body: Stack(
        children: [
          // ── Simulated Map Background ──────────────────────────────────
          _MapCanvas(
            activeStopIndex: _activeStop,
            stops: _stops,
            pulseAnim: _pulseAnim,
          ),

          // ── Top App Bar ───────────────────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _MapBtn(
                    icon: Icons.arrow_back_ios_rounded,
                    onTap: () => Navigator.pop(context),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: LC.surface,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 12,
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: LC.success,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Live Tracking',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: LC.text1,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  _MapBtn(
                    icon: Icons.my_location_rounded,
                    onTap: () {},
                    color: LC.primary,
                    iconColor: Colors.white,
                  ),
                ],
              ),
            ),
          ),

          // ── Bottom Sliding Panel ──────────────────────────────────────
          SlideTransition(
            position: _slideAnim,
            child: Align(
              alignment: Alignment.bottomCenter,
              child: _BottomPanel(
                stops: _stops,
                activeStop: _activeStop,
                progress: progress,
                completedStops: completedStops,
                panelExpanded: _panelExpanded,
                onTogglePanel: () =>
                    setState(() => _panelExpanded = !_panelExpanded),
                onMarkDone: () {
                  setState(() {
                    if (_activeStop < _stops.length - 1) {
                      _activeStop++;
                    }
                  });
                  HapticFeedback.mediumImpact();
                },
                delivery: delivery,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;
  final Color? iconColor;

  const _MapBtn({
    required this.icon,
    required this.onTap,
    this.color,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: color ?? LC.surface,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8),
          ],
        ),
        child: Icon(icon, color: iconColor ?? LC.text1, size: 20),
      ),
    );
  }
}

class _MapCanvas extends StatelessWidget {
  final int activeStopIndex;
  final List<_Stop> stops;
  final Animation<double> pulseAnim;

  const _MapCanvas({
    required this.activeStopIndex,
    required this.stops,
    required this.pulseAnim,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return SizedBox(
      width: size.width,
      height: size.height,
      child: CustomPaint(
        painter: _MapPainter(activeStopIndex, stops, pulseAnim),
      ),
    );
  }
}

class _MapPainter extends CustomPainter {
  final int activeStop;
  final List<_Stop> stops;
  final Animation<double> pulseAnim;

  _MapPainter(this.activeStop, this.stops, this.pulseAnim)
    : super(repaint: pulseAnim);

  @override
  void paint(Canvas canvas, Size size) {
    // Map background
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFFE8F4EA),
    );

    // Grid lines (street simulation)
    final gridPaint = Paint()
      ..color = Colors.white.withOpacity(0.8)
      ..strokeWidth = 1.5;
    for (double x = 0; x < size.width; x += 60) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += 60) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // City blocks
    final blockPaint = Paint()..color = const Color(0xFFD4EDD6);
    final rng = math.Random(42);
    for (int i = 0; i < 20; i++) {
      final rx = rng.nextDouble() * size.width;
      final ry = rng.nextDouble() * size.height * 0.7;
      final rw = 40 + rng.nextDouble() * 80;
      final rh = 30 + rng.nextDouble() * 60;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(rx, ry, rw, rh),
          const Radius.circular(4),
        ),
        blockPaint,
      );
    }

    // Road (orange)
    final roadPaint = Paint()
      ..color = const Color(0xFFFFA726).withOpacity(0.6)
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;

    final stopPositions = _getStopPositions(size);
    for (int i = 0; i < stopPositions.length - 1; i++) {
      final isDone = i < activeStop;
      roadPaint.color = isDone
          ? LC.primary.withOpacity(0.9)
          : const Color(0xFFBBBBBB).withOpacity(0.5);
      canvas.drawLine(stopPositions[i], stopPositions[i + 1], roadPaint);
    }

    // Stop pins
    for (int i = 0; i < stopPositions.length; i++) {
      final pos = stopPositions[i];
      final isDone = stops[i].done;
      final isActive = i == activeStop;

      if (isActive) {
        // Pulse ring
        final pulse = pulseAnim.value;
        canvas.drawCircle(
          pos,
          24 * pulse,
          Paint()..color = LC.primary.withOpacity((1.5 - pulse) * 0.3),
        );
      }

      canvas.drawCircle(
        pos,
        isActive ? 18 : 12,
        Paint()
          ..color = isDone
              ? LC.success
              : (isActive ? LC.primary : Colors.grey.shade400),
      );

      if (isDone) {
        // Check mark
        final checkPaint = Paint()
          ..color = Colors.white
          ..strokeWidth = 2
          ..strokeCap = StrokeCap.round;
        canvas.drawLine(
          Offset(pos.dx - 4, pos.dy),
          Offset(pos.dx - 1, pos.dy + 4),
          checkPaint,
        );
        canvas.drawLine(
          Offset(pos.dx - 1, pos.dy + 4),
          Offset(pos.dx + 5, pos.dy - 4),
          checkPaint,
        );
      }
    }
  }

  List<Offset> _getStopPositions(Size size) {
    final w = size.width;
    final h = size.height;
    return [
      Offset(w * 0.2, h * 0.55),
      Offset(w * 0.35, h * 0.38),
      Offset(w * 0.55, h * 0.30),
      Offset(w * 0.70, h * 0.42),
      Offset(w * 0.82, h * 0.58),
    ];
  }

  @override
  bool shouldRepaint(_MapPainter old) => true;
}

class _BottomPanel extends StatelessWidget {
  final List<_Stop> stops;
  final int activeStop;
  final double progress;
  final int completedStops;
  final bool panelExpanded;
  final VoidCallback onTogglePanel;
  final VoidCallback onMarkDone;
  final dynamic delivery;

  const _BottomPanel({
    required this.stops,
    required this.activeStop,
    required this.progress,
    required this.completedStops,
    required this.panelExpanded,
    required this.onTogglePanel,
    required this.onMarkDone,
    this.delivery,
  });

  @override
  Widget build(BuildContext context) {
    final currentStop = stops[activeStop];
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: LC.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 24,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle + header
          GestureDetector(
            onTap: onTogglePanel,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Column(
                children: [
                  Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: LC.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: LC.orangeGrad,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.navigation_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Next: ${currentStop.label}',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: LC.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              currentStop.address,
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: LC.text1,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        panelExpanded
                            ? Icons.keyboard_arrow_down
                            : Icons.keyboard_arrow_up,
                        color: LC.text3,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Progress bar
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '$completedStops / ${stops.length} stops completed',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: LC.text2,
                            ),
                          ),
                          Text(
                            '${(progress * 100).toInt()}%',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: LC.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 8,
                          backgroundColor: LC.border,
                          valueColor: const AlwaysStoppedAnimation(LC.primary),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Expanded: stop list
          if (panelExpanded) ...[
            const Divider(height: 1, color: LC.divider),
            SizedBox(
              height: 200,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                itemCount: stops.length,
                itemBuilder: (_, i) {
                  final s = stops[i];
                  final isActive = i == activeStop;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: s.done
                                ? LC.success
                                : (isActive ? LC.primary : LC.border),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            s.done
                                ? Icons.check_rounded
                                : (isActive
                                      ? Icons.radio_button_checked
                                      : Icons.circle_outlined),
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s.label,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isActive
                                      ? LC.primary
                                      : (s.done ? LC.text3 : LC.text1),
                                ),
                              ),
                              Text(
                                s.address,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: LC.text3,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        if (isActive)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: LC.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Now',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                color: LC.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],

          // Action buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.map_outlined, size: 18),
                    label: const Text('Navigate'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: LC.primary,
                      side: const BorderSide(color: LC.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onMarkDone,
                    icon: const Icon(Icons.check_circle_outline, size: 18),
                    label: const Text('Mark Done'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: LC.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Stop {
  final String label;
  final String address;
  final bool done;
  const _Stop({required this.label, required this.address, required this.done});
}
