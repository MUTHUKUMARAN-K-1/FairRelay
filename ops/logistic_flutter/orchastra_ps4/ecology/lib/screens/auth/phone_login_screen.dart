import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../driver/driver_dashboard_screen.dart';
import '../shipper/shipper_dashboard_screen.dart';
import 'otp_screen.dart';

/// Phone Login Screen — LC light + orange theme
class PhoneLoginScreen extends StatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  State<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends State<PhoneLoginScreen>
    with SingleTickerProviderStateMixin {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..forward();
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  String _formatPhoneNumber(String phone) {
    final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.length == 10) return '+91$digits';
    if (digits.startsWith('91') && digits.length == 12) return '+$digits';
    return '+91$digits';
  }

  Future<void> _sendOTP() async {
    if (!_formKey.currentState!.validate()) return;
    final authProvider = context.read<AuthProvider>();
    final phone = _formatPhoneNumber(_phoneController.text.trim());
    final success = await authProvider.sendOTP(phone);
    if (success && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => OtpScreen(phoneNumber: phone)),
      );
    } else if (mounted && authProvider.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            authProvider.error!,
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: LC.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LC.bg,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 48),

                  // ── Brand header ────────────────────────────────────────
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 88,
                          height: 88,
                          decoration: BoxDecoration(
                            gradient: LC.orangeGrad,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: LC.primary.withValues(alpha: 0.35),
                                blurRadius: 24,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.local_shipping_rounded,
                            size: 44,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'FairRelay',
                          style: GoogleFonts.inter(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            color: LC.text1,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'AI-Powered Fair Logistics',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: LC.text2,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 48),

                  // ── Phone input card ─────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: LC.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: LC.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 20,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Enter phone number',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: LC.text1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "We'll send you a one-time verification code",
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: LC.text2,
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          maxLength: 10,
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            letterSpacing: 2,
                            fontWeight: FontWeight.w600,
                            color: LC.text1,
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          decoration: InputDecoration(
                            counterText: '',
                            filled: true,
                            fillColor: LC.bg,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: LC.border),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: LC.border),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(
                                color: LC.primary,
                                width: 2,
                              ),
                            ),
                            prefixIcon: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text(
                                    '🇮🇳',
                                    style: TextStyle(fontSize: 20),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '+91',
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: LC.text1,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    width: 1,
                                    height: 22,
                                    color: LC.border,
                                  ),
                                ],
                              ),
                            ),
                            hintText: '9876543210',
                            hintStyle: GoogleFonts.inter(
                              color: LC.text3,
                              letterSpacing: 0,
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.length != 10) {
                              return 'Enter a valid 10-digit number';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── Role selection ───────────────────────────────────────
                  Text(
                    'I am a',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: LC.text2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) => Row(
                      children: [
                        _RoleCard(
                          label: 'Driver',
                          icon: Icons.drive_eta_rounded,
                          emoji: '🚛',
                          isSelected: auth.selectedRole == 'DRIVER',
                          onTap: () => auth.setSelectedRole('DRIVER'),
                        ),
                        const SizedBox(width: 12),
                        _RoleCard(
                          label: 'Shipper',
                          icon: Icons.inventory_2_rounded,
                          emoji: '📦',
                          isSelected: auth.selectedRole == 'SHIPPER',
                          onTap: () => auth.setSelectedRole('SHIPPER'),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Send OTP button ──────────────────────────────────────
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) => SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: auth.isLoading ? null : _sendOTP,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: LC.primary,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: LC.primary.withValues(
                            alpha: 0.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: auth.isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                'Send OTP  →',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Demo bypass ──────────────────────────────────────────
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) => SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          auth.bypassLogin();
                          // Pop everything and navigate to the right dashboard
                          final isDriver = auth.selectedRole == 'DRIVER';
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(
                              builder: (_) => isDriver
                                  ? const DriverDashboardScreen()
                                  : const ShipperDashboardScreen(),
                            ),
                            (route) => false,
                          );
                        },
                        icon: const Text('🧪', style: TextStyle(fontSize: 15)),
                        label: Text(
                          'Demo Mode — Skip OTP',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: LC.text2,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: LC.text2,
                          side: BorderSide(color: LC.border),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Feature pills ────────────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _FeaturePill('⚖️ Fair Pay'),
                      const SizedBox(width: 8),
                      _FeaturePill('🌱 Eco Routing'),
                      const SizedBox(width: 8),
                      _FeaturePill('🤝 Synergy'),
                    ],
                  ),

                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'By continuing you agree to our Terms of Service',
                      style: GoogleFonts.inter(fontSize: 11, color: LC.text3),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String label, emoji;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;
  const _RoleCard({
    required this.label,
    required this.emoji,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: isSelected ? LC.primary.withValues(alpha: 0.08) : LC.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? LC.primary : LC.border,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(height: 8),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? LC.primary : LC.text2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Widget _FeaturePill(String label) => Container(
  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
  decoration: BoxDecoration(
    color: LC.surfaceAlt,
    borderRadius: BorderRadius.circular(20),
    border: Border.all(color: LC.border),
  ),
  child: Text(label, style: GoogleFonts.inter(fontSize: 11, color: LC.text2)),
);
