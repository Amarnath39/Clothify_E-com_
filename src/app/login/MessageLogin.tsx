"use client"; // Required for components using hooks in Next.js App Router

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// --- CORE FIX ---
// 1. Import your custom hook
import { useAppDispatch } from "@/lib/redux/hooks"; // <-- ADJUST PATH IF NEEDED
// 2. Import your async thunk action
import { smsLogin } from "@/lib/redux/features/auth/actions"; // <-- ADJUST PATH IF NEEDED

export default function OTPVerification() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();
  const API_KEY = "c5837917-42b5-11f0-a562-0200cd936042"; // Note: Be careful exposing API keys on the client-side

  // --- CORE FIX ---
  // 3. Use the correctly typed hook
  const dispatch = useAppDispatch();

  // Send OTP
  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      // This should ideally be an API route on your own server to hide the API_KEY
      const response = await axios.post("/api/send-otp", { phoneNumber });

      if (response.data.Status === "Success") {
        setSessionId(response.data.Details);
        setStep(2);
        startResendTimer();
        toast.success("OTP sent successfully!");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Error sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/verify-otp", {
        phoneNumber,
        otpCode,
      });

      if (
        response.data.Status === "Success" &&
        response.data.Details === "OTP Matched"
      ) {
        toast.success("OTP verified successfully!");
        // This dispatch will now work without causing a build error
        await dispatch(smsLogin({ phone: phoneNumber }));
        router.push("/");
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Error verifying OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, inputValue: string) => {
    const lastChar = inputValue.slice(-1);
    if (/^\d$/.test(lastChar) || lastChar === "") {
      const newOtp = [...otp];
      newOtp[index] = lastChar;
      setOtp(newOtp);
      if (lastChar && index < otp.length - 1) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        if (i < newOtp.length) {
            newOtp[i] = pastedData[i];
        }
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, otp.length - 1);
      setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
  };

  // Resend timer
  const startResendTimer = () => {
    setResendTimer(30);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOTP = () => {
    if (resendTimer > 0) return;
    sendOTP();
  };

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 1: Phone input
  if (step === 1) {
    return (
      <div className="min-h-[130vh] bg-gray-50 flex items-center justify-center sm:p-4 pt-24">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Enter your credentials to continue</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Mobile Number
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-transparent">
               <span className="px-4 text-gray-500">+91</span>
               <input
                 type="tel"
                 placeholder="Enter your mobile number"
                 value={phoneNumber}
                 onChange={(e) =>
                   setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                 }
                 className="w-full py-3 pr-4 border-l border-gray-300 outline-none"
               />
            </div>
          </div>

          <button
            onClick={sendOTP}
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: OTP Verification
  return (
    <div className="min-h-[130vh] bg-gray-50 flex items-center justify-center p-4 pt-24">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h1>
          <p className="text-gray-600 mb-1">Enter the 6-digit code sent to</p>
          <p className="text-gray-900 font-semibold">+91 {phoneNumber}</p>
        </div>

        <div className="flex justify-center space-x-2 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-400 outline-none"
            />
          ))}
        </div>

        <button
          onClick={verifyOTP}
          disabled={loading}
          className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>

        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-gray-500">Resend code in {resendTimer}s</p>
          ) : (
            <button
              onClick={resendOTP}
              className="text-black hover:text-gray-800 font-medium"
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}