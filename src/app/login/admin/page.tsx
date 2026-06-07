"use client";

import React, { useState, useRef } from "react";
import { FaLock, FaUser, FaShieldAlt } from "react-icons/fa";
import {
  Card,
  Button as ZapanButton,
  ZapanInput,
} from "@/theme/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDispatch } from "react-redux";
import { loginAdmin } from "@/lib/features/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const OtpInput = ({ value, onChange }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    if (newValue.length <= 1 && /^\d*$/.test(newValue)) {
      const newOtp = value.split("");
      newOtp[index] = newValue;
      onChange(newOtp.join(""));
      if (newValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between max-w-xs mx-auto gap-2">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          ref={(el) => { inputRefs.current[index] = el; }}
          className="w-12 h-14 text-center text-xl font-black bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#7C1D3E] focus:ring-4 focus:ring-[#7C1D3E]/10 transition-all text-gray-900"
        />
      ))}
    </div>
  );
};

const ForgotPasswordDialog = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  const handleSendOtp = async () => {
    try {
      const response = await fetch("/api/auth/admin/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("OTP sent successfully");
        setStep(2);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await fetch("/api/auth/admin/forgot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Password reset successfully");
        setIsOpen(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="text-xs font-bold text-gray-400 hover:text-[#7C1D3E] transition-colors">
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
        <div className="bg-[#7C1D3E] p-6 text-white text-center">
          <DialogTitle className="text-xl font-black uppercase tracking-wide">Reset Password</DialogTitle>
          <DialogDescription className="text-white/60 text-xs font-medium mt-1">
            {step === 1
              ? "Enter your email to receive a reset code."
              : "Enter the OTP and your new password."}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 ? (
            <ZapanInput
              id="email"
              label="Recovery Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
            />
          ) : (
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center mb-2">Verification Code</label>
              <OtpInput value={otp} onChange={setOtp} />
              <ZapanInput
                id="newPassword"
                type="password"
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e: any) => setNewPassword(e.target.value)}
              />
            </div>
          )}
          <DialogFooter className="mt-4">
            <ZapanButton
              className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-900/20"
              onClick={step === 1 ? handleSendOtp : handleVerifyOtp}
            >
              {step === 1 ? "Send OTP" : "Reset Password"}
            </ZapanButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: "", password: "", otp: "" });
  const [showOtp, setShowOtp] = useState(false);
  const dispatch = useDispatch<any>();
  const router = useRouter();

  const handleInputChange = (e: any) => {
    const { id, value } = e.target;
    setAuthData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const submitForm = async () => {
    try {
      setLoading(true);
      const { payload } = await dispatch(loginAdmin(authData));
      setLoading(false);

      if (payload && payload.success) {
        if (payload.requires2FA) {
          setShowOtp(true);
          toast.success("Please enter your 2FA code");
          return;
        }

        if (payload.user?.role === "Sales person") {
          router.push("/admin/products");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        toast.error(payload?.msg || "Login failed");
      }
    } catch (error) {
      setLoading(false);
      console.error("Login Error:", error);
      toast.error("An error occurred during login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7C1D3E]/5 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      <div className="w-full mt-16 max-w-[420px] relative z-10">
        <div className="text-center mb-5">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto shadow-2xl shadow-[#7C1D3E]/20 flex items-center justify-center mb-6">
            <img
              src="/assets/static/logo/logo cropped.png"
              alt="Zapan"
              className="w-20 h-20 object-contain"
            />
          </div>
          {/* <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">SubliZoom</h1> */}
          <p className="text-gray-400 font-medium text-sm">Administration Console</p>
        </div>

        <Card className="shadow-2xl shadow-gray-200/50 border-white/50 backdrop-blur-sm bg-white/80 p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#7C1D3E] via-pink-500 to-orange-400"></div>
          <div className="p-8 md:p-10">
            {!showOtp ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Secure Access</p>
                </div>

                <ZapanInput
                  id="email"
                  label="Email Address"
                  icon={FaUser}
                  placeholder="mail@example.com"
                  value={authData.email}
                  onChange={handleInputChange}
                />

                <div className="space-y-1">
                  <ZapanInput
                    id="password"
                    type="password"
                    label="Password"
                    icon={FaLock}
                    placeholder="••••••••"
                    value={authData.password}
                    onChange={handleInputChange}
                  />
                  <div className="flex justify-end pt-1">
                    <ForgotPasswordDialog />
                  </div>
                </div>

                <ZapanButton
                  onClick={submitForm}
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl shadow-gray-900/20 active:scale-[0.98]"
                >
                  {loading ? <span className="animate-pulse">Authenticating...</span> : "Access Dashboard"}
                </ZapanButton>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                    <FaShieldAlt size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Two-Factor Auth</h2>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Enter the 6-digit code from your authenticator app</p>
                </div>

                <OtpInput
                  value={authData.otp}
                  onChange={(val: string) => setAuthData(prev => ({ ...prev, otp: val }))}
                />

                <ZapanButton
                  onClick={submitForm}
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-[#7C1D3E] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#601630] transition-all shadow-xl shadow-[#7C1D3E]/20 active:scale-[0.98]"
                >
                  {loading ? "Verifying..." : "Verify Identity"}
                </ZapanButton>

                <button
                  onClick={() => setShowOtp(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 w-full text-center uppercase tracking-wider"
                >
                  Cancel Login
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
