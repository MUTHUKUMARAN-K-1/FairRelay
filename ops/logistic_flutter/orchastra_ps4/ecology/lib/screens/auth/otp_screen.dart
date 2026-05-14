import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../driver/driver_dashboard_screen.dart';
import '../shipper/shipper_dashboard_screen.dart';

/// OTP Verification Screen — LC light + orange theme
class OtpScreen extends StatefulWidget {
  final String phoneNumber;
  const OtpScreen({super.key, required this.phoneNumber});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  Timer? _resendTimer;
  int _resendSeconds = 60;
  bool _canResend = false;
  String? _devOtp;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );
  }

  @override
  void dispose() {
    for (var c in _controllers) c.dispose();
    for (var n in _focusNodes) n.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  void _startResendTimer() {
    _resendSeconds = 60;
    _canResend = false;
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_resendSeconds > 0) {
          _resendSeconds--;
        } else {
          _canResend = true;
          timer.cancel();
        }
      });
    });
  }

  String get _otp => _controllers.map((c) => c.text).join();

  void _onOtpChanged(int index, String value) {
    if (value.length == 1 && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    if (_otp.length == 6) _verifyOTP();
  }

  void _onKeyPressed(int index, RawKeyEvent event) {
    if (event is RawKeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
  }

  Future<void> _verifyOTP() async {
    if (_otp.length != 6) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.verifyOTP(widget.phoneNumber, _otp);
    if (success && mounted) {
      final user = auth.currentUser;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (_) => user?.role == 'DRIVER'
              ? const DriverDashboardScreen()
              : const ShipperDashboardScreen(),
        ),
        (route) => false,
      );
    } else if (mounted && auth.error != null) {
      for (var c in _controllers) c.clear();
      _focusNodes[0].requestFocus();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            auth.error!,
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

  Future<void> _resendOTP() async {
    if (!_canResend) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.sendOTP(widget.phoneNumber);
    if (success && mounted) {
      _startResendTimer();
      final devCode = auth.devOtp;
      if (devCode != null) setState(() => _devOtp = devCode);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'OTP sent',
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: LC.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }
  }

  void _autofillOtp(String code) {
    for (int i = 0; i < 6; i++) {
      _controllers[i].text = code.length > i ? code[i] : '';
    }
    _verifyOTP();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LC.bg,
      appBar: AppBar(
        backgroundColor: LC.surface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          color: LC.text1,
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),

              Text(
                'Verification Code',
                style: GoogleFonts.inter(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: LC.text1,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'We sent a code to',
                style: GoogleFonts.inter(fontSize: 14, color: LC.text2),
              ),
              Text(
                widget.phoneNumber,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: LC.primary,
                ),
              ),

              const SizedBox(height: 40),

              // OTP input row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(
                  6,
                  (index) => _OtpField(
                    controller: _controllers[index],
                    focusNode: _focusNodes[index],
                    onChanged: (value) => _onOtpChanged(index, value),
                    onKey: (event) => _onKeyPressed(index, event),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Dev OTP banner
              if (_devOtp != null)
                GestureDetector(
                  onTap: () => _autofillOtp(_devOtp!),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.12),
                      border: Border.all(
                        color: Colors.amber.withValues(alpha: 0.4),
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Text(
                          '🔧 Dev Mode — tap to autofill',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: Colors.amber[700],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _devOtp!,
                          style: GoogleFonts.inter(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.amber[700],
                            letterSpacing: 8,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Resend
              Center(
                child: _canResend
                    ? TextButton(
                        onPressed: _resendOTP,
                        child: Text(
                          'Resend Code',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: LC.primary,
                          ),
                        ),
                      )
                    : Text(
                        'Resend code in ${_resendSeconds}s',
                        style: GoogleFonts.inter(fontSize: 13, color: LC.text3),
                      ),
              ),

              const Spacer(),

              // Verify button
              Consumer<AuthProvider>(
                builder: (context, auth, _) => SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: auth.isLoading || _otp.length != 6
                        ? null
                        : _verifyOTP,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: LC.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: LC.primary.withValues(
                        alpha: 0.35,
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
                            'Verify  →',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Dev bypass
              Center(
                child: TextButton.icon(
                  onPressed: () => _autofillOtp('000000'),
                  icon: const Icon(
                    Icons.developer_mode,
                    size: 15,
                    color: LC.text3,
                  ),
                  label: Text(
                    'Dev bypass (000000)',
                    style: GoogleFonts.inter(fontSize: 12, color: LC.text3),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _OtpField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final Function(RawKeyEvent) onKey;

  const _OtpField({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onKey,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46,
      height: 58,
      child: RawKeyboardListener(
        focusNode: FocusNode(),
        onKey: onKey,
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 1,
          style: GoogleFonts.inter(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: LC.text1,
          ),
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(
            counterText: '',
            contentPadding: EdgeInsets.zero,
            filled: true,
            fillColor: LC.surface,
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
              borderSide: const BorderSide(color: LC.primary, width: 2),
            ),
          ),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
