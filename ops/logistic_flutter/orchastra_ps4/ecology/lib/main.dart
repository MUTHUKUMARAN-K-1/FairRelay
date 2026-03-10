import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'config/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/delivery_provider.dart';
import 'providers/absorption_provider.dart';
import 'providers/backhaul_provider.dart';
import 'providers/location_provider.dart';
import 'providers/earnings_provider.dart';
import 'providers/shipment_provider.dart';
import 'providers/demo_auto_play_provider.dart';
import 'screens/auth/phone_login_screen.dart';
import 'screens/driver/driver_dashboard_screen.dart';
import 'screens/shipper/shipper_dashboard_screen.dart';
import 'services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark, // light bg → dark icons
      systemNavigationBarColor: Color(0xFFF8F9FA),
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  await StorageService().init();
  runApp(const EcoLogiqApp());
}

class EcoLogiqApp extends StatelessWidget {
  const EcoLogiqApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => DeliveryProvider()),
        ChangeNotifierProvider(create: (_) => AbsorptionProvider()),
        ChangeNotifierProvider(create: (_) => BackhaulProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        ChangeNotifierProvider(create: (_) => EarningsProvider()),
        ChangeNotifierProvider(create: (_) => ShipmentProvider()),
        ChangeNotifierProvider(create: (_) => DemoAutoPlayProvider()),
      ],
      child: MaterialApp(
        title: 'FairRelay',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AuthWrapper(),
      ),
    );
  }
}

/// Handles auth routing — splash → login or dashboard
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        // ── Splash while initializing ───────────────────────────────────────
        if (!auth.isInitialized) {
          return Scaffold(
            backgroundColor: LC.bg,
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [LC.primary, Color(0xFFFF8C42)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: LC.primary.withValues(alpha: 0.35),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.local_shipping_rounded,
                      size: 44,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 22),
                  Text(
                    'FairRelay',
                    style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: LC.text1,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Smart Logistics Platform',
                    style: GoogleFonts.inter(fontSize: 14, color: LC.text3),
                  ),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: LC.primary,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        // ── Route based on role ─────────────────────────────────────────────
        if (auth.isLoggedIn) {
          if (auth.isDriver) return const DriverDashboardScreen();
          return const ShipperDashboardScreen();
        }

        return const PhoneLoginScreen();
      },
    );
  }
}
