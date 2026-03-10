import { useState, useEffect } from "react";
import { Phone, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { sendOTP, verifyOTP } from "../services/apiClient";
import { useToast } from "../context/ToastContext";

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, setLoading } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const validatePhone = (value: string) => {
    const phoneRegex = /^\+91\d{10}$/;
    return phoneRegex.test(value);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await sendOTP(phone, "DISPATCHER");

      if (response.success) {
        setOtpSent(true);
        setOtpTimer(60);
        setStep("otp");
        showToast("Success", "OTP sent to your phone", "success");
      } else {
        showToast("Error", response.message || "Failed to send OTP", "error");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      setPhoneError(message);
      showToast("Error", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (otp.length !== 6) {
      setOtpError("Please enter a 6-digit OTP");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await verifyOTP(phone, otp, "DISPATCHER");

      if (response.success && response.data) {
        const { token, user } = response.data;
        login(token, user);
        showToast("Success", "Login successful!", "success");
        setLoading(false);
        navigate("/dashboard");
      } else {
        showToast("Error", response.message || "Invalid OTP", "error");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to verify OTP. Please try again.";
      setOtpError(message);
      showToast("Error", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-dark via-eco-secondary to-eco-dark flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-eco-brand-orange/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-eco-success/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">EcoLogiq</h1>
          <p className="text-eco-text-secondary">Dispatcher Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-eco-card border border-eco-card-border rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          {step === "phone" ? (
            <>
              <h2 className="text-xl font-bold text-white mb-2">
                Welcome, Dispatcher
              </h2>
              <p className="text-eco-text-secondary mb-6 text-sm">
                Enter your phone number to continue
              </p>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-eco-brand-orange" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError("");
                      }}
                      placeholder="+91XXXXXXXXXX"
                      className={`w-full pl-10 pr-4 py-3 bg-eco-secondary/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-eco-brand-orange transition ${
                        phoneError
                          ? "border-eco-error"
                          : "border-eco-card-border"
                      }`}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-eco-error text-xs mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {phoneError}
                    </p>
                  )}
                  <p className="text-eco-text-secondary text-xs mt-2">
                    Format: +91 followed by 10 digits
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-eco-brand-orange hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Verify OTP</h2>
              <p className="text-eco-text-secondary mb-6 text-sm">
                Enter the 6-digit code sent to {phone}
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OTP Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-eco-brand-orange" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setOtp(value);
                        setOtpError("");
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className={`w-full pl-10 pr-4 py-3 bg-eco-secondary/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-eco-brand-orange transition text-center text-lg tracking-widest ${
                        otpError ? "border-eco-error" : "border-eco-card-border"
                      }`}
                    />
                  </div>
                  {otpError && (
                    <p className="text-eco-error text-xs mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {otpError}
                    </p>
                  )}
                  {otpTimer > 0 ? (
                    <p className="text-eco-text-secondary text-xs mt-2">
                      Resend OTP in {otpTimer}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setOtp("");
                        setOtpSent(false);
                      }}
                      className="text-eco-brand-orange text-xs hover:underline mt-2"
                    >
                      Change phone number or resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-eco-brand-orange hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Verifying..." : "Verify & Login"}
                </button>
              </form>
            </>
          )}

          {/* Info */}
          <div className="mt-6 p-3 bg-eco-success/10 border border-eco-success/20 rounded-lg flex items-start">
            <CheckCircle className="w-4 h-4 text-eco-success mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-300">
              This is a secure login. We'll never share your data.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-eco-text-secondary text-xs mt-6">
          Dispatcher Portal v1.0
        </p>
      </div>
    </div>
  );
}
