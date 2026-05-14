import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/app_theme.dart';

/// Notifications Screen — real-time alerts, assignments, wellness, system
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _filter = 'All';
  final List<String> _filters = [
    'All',
    'Deliveries',
    'Earnings',
    'Safety',
    'System',
  ];

  final List<_Notif> _notifs = [
    _Notif(
      type: NotifType.delivery,
      title: 'New Shipment Assigned',
      body: 'Chennai → Coimbatore · 450 kg · ₹1,240 est. earn',
      time: '2m ago',
      read: false,
    ),
    _Notif(
      type: NotifType.earning,
      title: 'Payment Credited',
      body: '₹3,420 for 4 deliveries credited to your account.',
      time: '1h ago',
      read: false,
    ),
    _Notif(
      type: NotifType.safety,
      title: '⚠️ Night Safety Alert',
      body: 'Route via NH-32 after 10 PM has 2 flagged zones. Drive safe.',
      time: '3h ago',
      read: false,
    ),
    _Notif(
      type: NotifType.fairness,
      title: '📊 Fairness Report Ready',
      body: 'Your Gini score this week: 0.08 — Excellent! Fleet avg: 0.24',
      time: '5h ago',
      read: true,
    ),
    _Notif(
      type: NotifType.delivery,
      title: 'Delivery Completed',
      body: 'Delivery #DR-0042 to Velachery marked complete. +₹680',
      time: '6h ago',
      read: true,
    ),
    _Notif(
      type: NotifType.system,
      title: 'Backhaul Opportunity Nearby',
      body: 'Join the Synergy Hub — 3 drivers sharing a return load nearby.',
      time: '8h ago',
      read: true,
    ),
    _Notif(
      type: NotifType.safety,
      title: '🏥 Wellness Check-in Due',
      body: 'You haven\'t done today\'s wellness check. Stay fit, stay safe.',
      time: '9h ago',
      read: true,
    ),
    _Notif(
      type: NotifType.earning,
      title: '🎯 Weekly Target Achieved!',
      body: 'You\'ve hit ₹8,000 this week. Bonus ₹500 on the way!',
      time: '1d ago',
      read: true,
    ),
    _Notif(
      type: NotifType.system,
      title: 'App Updated',
      body: 'FairRelay 1.0.1 is available. New: live route tracking.',
      time: '2d ago',
      read: true,
    ),
  ];

  List<_Notif> get _filtered {
    if (_filter == 'All') return _notifs;
    return _notifs.where((n) {
      switch (_filter) {
        case 'Deliveries':
          return n.type == NotifType.delivery;
        case 'Earnings':
          return n.type == NotifType.earning;
        case 'Safety':
          return n.type == NotifType.safety;
        case 'System':
          return n.type == NotifType.system || n.type == NotifType.fairness;
        default:
          return true;
      }
    }).toList();
  }

  int get _unread => _notifs.where((n) => !n.read).length;

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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Notifications',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: LC.text1,
              ),
            ),
            if (_unread > 0)
              Text(
                '$_unread unread',
                style: GoogleFonts.inter(fontSize: 11, color: LC.primary),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => setState(() {
              for (final n in _notifs) n.read = true;
            }),
            child: Text(
              'Clear all',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: LC.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            height: 52,
            color: LC.surface,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _filters.length,
              itemBuilder: (_, i) {
                final f = _filters[i];
                final sel = f == _filter;
                return GestureDetector(
                  onTap: () => setState(() => _filter = f),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: sel ? LC.primary : LC.bg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: sel ? LC.primary : LC.border),
                    ),
                    child: Text(
                      f,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: sel ? Colors.white : LC.text2,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1, color: LC.divider),

          // Notification list
          Expanded(
            child: _filtered.isEmpty
                ? _EmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _filtered.length,
                    itemBuilder: (_, i) => _NotifTile(
                      notif: _filtered[i],
                      onTap: () => setState(() => _filtered[i].read = true),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

enum NotifType { delivery, earning, safety, fairness, system }

class _Notif {
  final NotifType type;
  final String title, body, time;
  bool read;
  _Notif({
    required this.type,
    required this.title,
    required this.body,
    required this.time,
    required this.read,
  });
}

class _NotifTile extends StatelessWidget {
  final _Notif notif;
  final VoidCallback onTap;
  const _NotifTile({required this.notif, required this.onTap});

  Color get _iconBg {
    switch (notif.type) {
      case NotifType.delivery:
        return LC.primary.withOpacity(0.1);
      case NotifType.earning:
        return LC.successLt;
      case NotifType.safety:
        return LC.errorLt;
      case NotifType.fairness:
        return LC.infoLt;
      case NotifType.system:
        return LC.surfaceAlt;
    }
  }

  Color get _iconColor {
    switch (notif.type) {
      case NotifType.delivery:
        return LC.primary;
      case NotifType.earning:
        return LC.success;
      case NotifType.safety:
        return LC.error;
      case NotifType.fairness:
        return LC.info;
      case NotifType.system:
        return LC.text2;
    }
  }

  IconData get _icon {
    switch (notif.type) {
      case NotifType.delivery:
        return Icons.local_shipping_rounded;
      case NotifType.earning:
        return Icons.account_balance_wallet_rounded;
      case NotifType.safety:
        return Icons.shield_rounded;
      case NotifType.fairness:
        return Icons.bar_chart_rounded;
      case NotifType.system:
        return Icons.notifications_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        color: notif.read ? LC.bg : LC.primary.withOpacity(0.03),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_icon, color: _iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notif.title,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: notif.read
                                ? FontWeight.w500
                                : FontWeight.w700,
                            color: LC.text1,
                          ),
                        ),
                      ),
                      Text(
                        notif.time,
                        style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notif.body,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: LC.text2,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            if (!notif.read)
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 8),
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: LC.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.notifications_none_rounded,
            size: 64,
            color: LC.text3,
          ),
          const SizedBox(height: 12),
          Text(
            'All caught up!',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: LC.text2,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'No notifications in this category.',
            style: GoogleFonts.inter(fontSize: 13, color: LC.text3),
          ),
        ],
      ),
    );
  }
}
