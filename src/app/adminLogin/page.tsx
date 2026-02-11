"use client";

import React, { useState } from "react";
import { FiLock, FiMail, FiShield, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ZapanInput } from "@/theme/components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useDispatch } from "react-redux";
import { loginAdmin } from "@/lib/features/auth";
import { useRouter } from "next/navigation";

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: "", password: "", otp: "" });
  const [showOtp, setShowOtp] = useState(false);
  const dispatch = useDispatch<any>();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        } else {
          router.push('/admin/dashboard')
        }
      } else {
        // Handle login failure
      }
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8F9FA] relative overflow-hidden">
      <style jsx global>{`
        .navbar-main, .footer-main { display: none !important; }
      `}</style>

      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7C1D3E]/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E91E7B]/5 rounded-full blur-[120px]"></div>

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(124,29,62,0.12)] border-gray-100 rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="h-2 bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B]"></div>

        <CardHeader className="pt-12 pb-8 px-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7C1D3E] to-[#E91E7B] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-brand/20">
            <FiShield size={32} />
          </div>
          <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">
            Console Login
          </CardTitle>
          <CardDescription className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-[0.15em]">
            {showOtp ? "Dual-Factor Verification" : "Secure Authentication"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-10">
          {!showOtp ? (
            <>
              <ZapanInput
                id="email"
                label="Identifier / Email"
                placeholder="admin@zapan.com"
                value={authData.email}
                onChange={handleInputChange}
                className="bg-white/50"
              />
              <ZapanInput
                id="password"
                type="password"
                label="Passcode"
                placeholder="••••••••"
                value={authData.password}
                onChange={handleInputChange}
                className="bg-white/50"
              />
            </>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50">
                  <FiCheckCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Identity Verified</p>
                  <p className="text-xs font-bold text-emerald-800 mt-1">Please enter your 2FA token.</p>
                </div>
              </div>

              <ZapanInput
                id="otp"
                type="text"
                maxLength={6}
                label="Verification Token"
                placeholder="0 0 0 0 0 0"
                value={authData.otp}
                onChange={handleInputChange}
                className="text-center text-2xl tracking-[0.5em] font-black"
                autoFocus
              />

              <button
                onClick={() => setShowOtp(false)}
                className="w-full text-[10px] font-black text-[#7C1D3E] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
              >
                Back to Authentication
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-10 pb-12 pt-4">
          <Button
            onClick={submitForm}
            className="w-full h-14 bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {showOtp ? "Unlock Access" : "Proceed"}
                <FiArrowRight size={18} />
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="absolute bottom-8 text-center w-full px-6">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
          Powered by Webgeon Intelligence System
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
