import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/app_theme.dart';

// ── Mock data ─────────────────────────────────────────────────────────────────
class _Truck {
  final String id, driverName, initials, cargo;
  final Color color;
  double progress; // 0.0 → 1.0 along route
  _Truck({
    required this.id,
    required this.driverName,
    required this.initials,
    required this.cargo,
    required this.color,
    this.progress = 0,
  });
}

class _Event {
  final String time, message, emoji;
  const _Event(this.time, this.message, this.emoji);
}

class DispatcherCommandCenter extends StatefulWidget {
  const DispatcherCommandCenter({super.key});
  @override
  State<DispatcherCommandCenter> createState() =>
      _DispatcherCommandCenterState();
}

class _DispatcherCommandCenterState extends State<DispatcherCommandCenter>
    with TickerProviderStateMixin {
  late Timer _tickTimer;
  late Timer _eventTimer;
  late AnimationController _pulseCtrl;

  double _currentGini = 0.242;
  final double _targetGini = 0.172;
  int _tickCount = 0;
  final List<_Event> _events = [];
  int _activeDeliveries = 0;
  int _completedDeliveries = 0;
  _Truck? _selectedTruck;
  bool _showPopup = false;

  final List<_Truck> _trucks = [
    _Truck(
      id: 'T1',
      driverName: 'Arjun Kumar',
      initials: 'AK',
      cargo: 'Electronics 2.5T',
      color: const Color(0xFF2979FF),
      progress: 0.0,
    ),
    _Truck(
      id: 'T2',
      driverName: 'Ravi Pillai',
      initials: 'RP',
      cargo: 'Textiles 1.8T',
      color: const Color(0xFFFF6D00),
      progress: 0.0,
    ),
    _Truck(
      id: 'T3',
      driverName: 'Deepak Singh',
      initials: 'DS',
      cargo: 'Pharma 0.9T',
      color: const Color(0xFF00BCD4),
      progress: 0.0,
    ),
    _Truck(
      id: 'T4',
      driverName: 'Kartik Patel',
      initials: 'KP',
      cargo: 'Auto Parts 3.2T',
      color: const Color(0xFF4CAF50),
      progress: 0.0,
    ),
  ];

  static const _eventMessages = [
    _Event('now', '🤖 AI assigned T1 — lowest Gini: 0.042', '⚖️'),
    _Event('now', '🚛 T2 picked up Textiles 1.8T at Mumbai Hub', '📦'),
    _Event('now', '✅ T3 delivered Pharma — Gini rebalanced', '⚖️'),
    _Event('now', '⚡ T4 matched backhaul Pune → Nashik', '🔗'),
    _Event('now', '🌿 Fleet CO₂ saved: 18.4 kg this hour', '🌿'),
    _Event('now', '🏆 Arjun Kumar: new Gini record 0.041!', '🏆'),
    _Event('now', '📊 Gini index dropped: 0.242 → 0.191', '📊'),
    _Event('now', '🔔 T3 arriving in 4 min — notify client', '🔔'),
  ];

  @override
  void initState() {
    super.initState();

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    // Add initial events
    _events.addAll(_eventMessages.take(2));
    _activeDeliveries = 4;

    // Truck movement + events every second
    _tickTimer = Timer.periodic(const Duration(milliseconds: 1000), (_) {
      if (!mounted) return;
      setState(() {
        _tickCount++;
        // Move trucks along route
        for (final t in _trucks) {
          t.progress = (t.progress + 0.007 + Random().nextDouble() * 0.008)
              .clamp(0.0, 1.0);
          if (t.progress >= 1.0) {
            t.progress = 0.0;
            _completedDeliveries++;
            _activeDeliveries = max(0, _activeDeliveries - 1) + 1;
          }
        }
        // Update Gini gradually
        if (_currentGini > _targetGini) {
          _currentGini = (_currentGini - 0.003).clamp(_targetGini, 0.3);
        }
      });
    });

    // Add new events periodically
    int eventIdx = 2;
    _eventTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (!mounted) return;
      if (eventIdx < _eventMessages.length) {
        setState(() {
          _events.insert(0, _eventMessages[eventIdx % _eventMessages.length]);
          if (_events.length > 8) _events.removeLast();
          eventIdx++;
        });
      }
    });
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _tickTimer.cancel();
    _eventTimer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E1A),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: Row(
                    children: [
                      // Left: Route Map
                      Expanded(flex: 3, child: _buildMapPanel()),
                      // Right: side panel — responsive width
                      SizedBox(
                        width: (MediaQuery.of(context).size.width * 0.28).clamp(
                          260.0,
                          360.0,
                        ),
                        child: _buildSidePanel(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (_showPopup && _selectedTruck != null) _buildTruckPopup(),
          ],
        ),
      ),
    );
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  Widget _buildHeader() {
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_rounded,
              color: Colors.white,
              size: 18,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 4),
          AnimatedBuilder(
            animation: _pulseCtrl,
            builder: (_, _) => Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Color.lerp(
                  LC.success,
                  Colors.green[300],
                  _pulseCtrl.value,
                ),
                boxShadow: [
                  BoxShadow(
                    color: LC.success.withValues(alpha: 0.6 * _pulseCtrl.value),
                    blurRadius: 6,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'FairDispatch Command Center',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const Spacer(),
          _HeaderChip(label: '$_activeDeliveries Active', color: LC.primary),
          const SizedBox(width: 8),
          _HeaderChip(label: '$_completedDeliveries Done', color: LC.success),
          const SizedBox(width: 8),
          _HeaderChip(
            label: 'Gini ${_currentGini.toStringAsFixed(3)}',
            color: _currentGini < 0.2 ? LC.success : LC.warning,
          ),
        ],
      ),
    );
  }

  // ── Map Panel ──────────────────────────────────────────────────────────────
  Widget _buildMapPanel() {
    return RepaintBoundary(
      child: Container(
        color: const Color(0xFF0D1117),
        child: Stack(
          children: [
            // Painter fills the stack
            Positioned.fill(
              child: CustomPaint(
                painter: _RoutePainter(trucks: _trucks, tick: _tickCount),
              ),
            ),
            // Transparent gesture layer on top
            Positioned.fill(
              child: GestureDetector(
                onTapDown: (details) => _onMapTap(details.localPosition),
                behavior: HitTestBehavior.translucent,
                child: const SizedBox.expand(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _onMapTap(Offset tap) {
    // Find if any truck avatar was tapped
    for (final t in _trucks) {
      final pos = _RoutePainter.truckPosition(t);
      if ((tap - pos).distance < 24) {
        setState(() {
          _selectedTruck = t;
          _showPopup = true;
        });
        return;
      }
    }
    setState(() => _showPopup = false);
  }

  // ── Side Panel ─────────────────────────────────────────────────────────────
  Widget _buildSidePanel() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border(
          left: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Column(
        children: [
          // Gini Meter
          _buildGiniMeter(),
          const Divider(color: Color(0xFF1F2937), height: 1),
          // Live Feed
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(
              children: [
                const Text('⚡', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 8),
                Text(
                  'Live Allocation Feed',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              itemCount: _events.length,
              itemBuilder: (_, i) => _EventCard(event: _events[i]),
            ),
          ),
          // Driver list
          const Divider(color: Color(0xFF1F2937), height: 1),
          _buildDriverList(),
        ],
      ),
    );
  }

  Widget _buildGiniMeter() {
    final pct = 1 - (_currentGini / 0.3);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Fleet Gini Index',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: LC.success.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: LC.success.withValues(alpha: 0.3)),
                ),
                child: Text(
                  '↓ Improving',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: LC.success,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 90,
            child: CustomPaint(
              painter: _GiniArcPainter(value: pct, gini: _currentGini),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _currentGini.toStringAsFixed(3),
                      style: GoogleFonts.inter(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: _currentGini < 0.2 ? LC.success : LC.warning,
                      ),
                    ),
                    Text(
                      _currentGini < 0.2 ? 'FAIR' : 'IMPROVING',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white54,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Perfect',
                style: GoogleFonts.inter(fontSize: 10, color: Colors.white38),
              ),
              Text(
                'Target: ${_targetGini.toStringAsFixed(3)}',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: LC.success,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                'High',
                style: GoogleFonts.inter(fontSize: 10, color: Colors.white38),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDriverList() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Active Trucks',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Colors.white60,
            ),
          ),
          const SizedBox(height: 8),
          ..._trucks.map(
            (t) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: _TruckRow(truck: t),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTruckPopup() {
    final t = _selectedTruck!;
    return Positioned(
      bottom: 80,
      left: 20,
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: 260,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1F2937),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: t.color.withValues(alpha: 0.5)),
            boxShadow: [
              BoxShadow(
                color: t.color.withValues(alpha: 0.25),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: t.color.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        t.initials,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: t.color,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.driverName,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          t.cargo,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: Colors.white54,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => _showPopup = false),
                    child: const Icon(
                      Icons.close_rounded,
                      color: Colors.white38,
                      size: 18,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _PopupRow(
                label: 'Progress',
                value: '${(t.progress * 100).toInt()}%',
              ),
              _PopupRow(label: 'Route', value: 'Mumbai → Pune'),
              _PopupRow(
                label: 'ETA',
                value: '${max(1, ((1 - t.progress) * 42).toInt())} min',
              ),
              _PopupRow(
                label: 'Fairness Debt',
                value: '₹${(1200 - t.progress * 800).toInt()}',
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: t.color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: t.color.withValues(alpha: 0.3)),
                ),
                child: Center(
                  child: Text(
                    '🤖 AI-assigned · Optimal Gini match',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: t.color,
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
}

class _PopupRow extends StatelessWidget {
  final String label, value;
  const _PopupRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 11, color: Colors.white38),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Route Map Painter ─────────────────────────────────────────────────────────
class _RoutePainter extends CustomPainter {
  final List<_Truck> trucks;
  final int tick;
  _RoutePainter({required this.trucks, required this.tick});

  // 4 routes defined as list of relative points (Offset in 0..1 space)
  static const _routes = [
    [
      Offset(0.08, 0.2),
      Offset(0.35, 0.15),
      Offset(0.62, 0.3),
      Offset(0.88, 0.25),
    ],
    [Offset(0.1, 0.55), Offset(0.3, 0.45), Offset(0.6, 0.6), Offset(0.85, 0.5)],
    [
      Offset(0.05, 0.78),
      Offset(0.28, 0.7),
      Offset(0.55, 0.82),
      Offset(0.9, 0.75),
    ],
    [
      Offset(0.12, 0.35),
      Offset(0.4, 0.58),
      Offset(0.65, 0.42),
      Offset(0.87, 0.65),
    ],
  ];

  static const _cities = [
    ('Mumbai', Offset(0.07, 0.19)),
    ('Nashik', Offset(0.09, 0.54)),
    ('Kolhapur', Offset(0.04, 0.77)),
    ('Solapur', Offset(0.11, 0.34)),
    ('Pune', Offset(0.87, 0.24)),
    ('Hyderabad', Offset(0.84, 0.49)),
    ('Bangalore', Offset(0.89, 0.74)),
    ('Chennai', Offset(0.86, 0.64)),
  ];

  static Offset _lerp(List<Offset> pts, double t, Size size) {
    if (pts.isEmpty) return Offset.zero;
    final segments = pts.length - 1;
    final seg = (t * segments).floor().clamp(0, segments - 1);
    final localT = (t * segments - seg).clamp(0.0, 1.0);
    final a = pts[seg];
    final b = pts[seg + 1];
    return Offset(
      (a.dx + (b.dx - a.dx) * localT) * size.width,
      (a.dy + (b.dy - a.dy) * localT) * size.height,
    );
  }

  static Offset truckPosition(_Truck t) {
    // This is called externally, use a fixed size estimate
    const size = Size(600, 400);
    final route = _routes[int.parse(t.id.substring(1)) - 1];
    return _lerp(route, t.progress, size);
  }

  @override
  void paint(Canvas canvas, Size size) {
    // Grid lines
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.03)
      ..strokeWidth = 1;
    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }

    // Draw routes
    for (int i = 0; i < _routes.length; i++) {
      final route = _routes[i];
      final truck = trucks[i];
      final path = Path();
      final start = Offset(route[0].dx * size.width, route[0].dy * size.height);
      path.moveTo(start.dx, start.dy);
      for (int j = 1; j < route.length; j++) {
        path.lineTo(route[j].dx * size.width, route[j].dy * size.height);
      }
      // Dashed route background
      canvas.drawPath(
        path,
        Paint()
          ..color = truck.color.withValues(alpha: 0.15)
          ..strokeWidth = 2
          ..style = PaintingStyle.stroke,
      );
      // Completed part of route
      final progressPts = route
          .take((truck.progress * route.length).ceil() + 1)
          .toList();
      if (progressPts.length >= 2) {
        final progPath = Path();
        progPath.moveTo(
          progressPts[0].dx * size.width,
          progressPts[0].dy * size.height,
        );
        for (int j = 1; j < progressPts.length; j++) {
          progPath.lineTo(
            progressPts[j].dx * size.width,
            progressPts[j].dy * size.height,
          );
        }
        canvas.drawPath(
          progPath,
          Paint()
            ..color = truck.color.withValues(alpha: 0.6)
            ..strokeWidth = 2
            ..style = PaintingStyle.stroke,
        );
      }

      // Truck icon (circle with initials position)
      final pos = _lerp(route, truck.progress, size);
      // Glow
      canvas.drawCircle(
        pos,
        16,
        Paint()..color = truck.color.withValues(alpha: 0.2),
      );
      canvas.drawCircle(pos, 10, Paint()..color = truck.color);
    }

    // City dots
    for (final (name, rel) in _cities) {
      final pos = Offset(rel.dx * size.width, rel.dy * size.height);
      canvas.drawCircle(
        pos,
        5,
        Paint()..color = Colors.white.withValues(alpha: 0.6),
      );
      canvas.drawCircle(pos, 3, Paint()..color = const Color(0xFF0D1117));
      final tp = TextPainter(
        text: TextSpan(
          text: name,
          style: const TextStyle(color: Colors.white54, fontSize: 9),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, pos + const Offset(8, -6));
    }
  }

  @override
  bool shouldRepaint(_RoutePainter old) => old.tick != tick;
}

// ── Gini Arc Painter ──────────────────────────────────────────────────────────
class _GiniArcPainter extends CustomPainter {
  final double value; // 0..1 = fair..unfair
  final double gini;
  _GiniArcPainter({required this.value, required this.gini});

  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height * 0.85);
    final r = size.width * 0.42;
    // Background arc
    canvas.drawArc(
      Rect.fromCircle(center: c, radius: r),
      pi,
      pi,
      false,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.08)
        ..strokeWidth = 10
        ..style = PaintingStyle.stroke,
    );
    // Value arc
    final color = gini < 0.2
        ? LC.success
        : gini < 0.25
        ? LC.warning
        : LC.error;
    canvas.drawArc(
      Rect.fromCircle(center: c, radius: r),
      pi,
      pi * value,
      false,
      Paint()
        ..color = color
        ..strokeWidth = 10
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_GiniArcPainter o) => o.value != value;
}

// ── Event Card ────────────────────────────────────────────────────────────────
class _EventCard extends StatelessWidget {
  final _Event event;
  const _EventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2937),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            Text(event.emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                event.message,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: Colors.white70,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Truck Row ─────────────────────────────────────────────────────────────────
class _TruckRow extends StatelessWidget {
  final _Truck truck;
  const _TruckRow({required this.truck});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: truck.color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              truck.initials,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: truck.color,
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                truck.driverName,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white70,
                ),
              ),
              ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(
                  value: truck.progress,
                  minHeight: 3,
                  backgroundColor: Colors.white.withValues(alpha: 0.08),
                  valueColor: AlwaysStoppedAnimation(truck.color),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '${(truck.progress * 100).toInt()}%',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Colors.white38,
          ),
        ),
      ],
    );
  }
}

// ── Header Chip ───────────────────────────────────────────────────────────────
class _HeaderChip extends StatelessWidget {
  final String label;
  final Color color;
  const _HeaderChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}
