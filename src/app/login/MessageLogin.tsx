// pages/index.js
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { smsLogin } from "@/lib/features/auth/actions";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export default function OTPVerification() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();
  const API_KEY = "c5837917-42b5-11f0-a562-0200cd936042"; // Replace with your actual API key
  const dispatch = useDispatch<any>();
  // Send OTP
  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/send-otp", {
        phoneNumber,
        apiKey: API_KEY,
        var1Value: "Fancy Vastra",
      });

      console.log(response.data, "res:::");
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
        apiKey: API_KEY,
      });

      console.log(response.data, "verify res:::");

      if (
        response.data.Status === "Success" &&
        response.data.Details === "OTP Matched"
      ) {
        toast.success("OTP verified successfully!");
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

  // Handle OTP input change
  const handleOtpChange = (index, inputValue) => {
    // Only handle single digit input (paste is handled separately)
    const lastChar = inputValue.slice(-1);

    if (/^\d$/.test(lastChar) || lastChar === "") {
      const newOtp = [...otp];
      newOtp[index] = lastChar;
      setOtp(newOtp);

      // Auto-focus next input
      if (lastChar && index < otp.length - 1) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      }
    }
  };

  // Handle backspace in OTP input
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(24);
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

  // Resend OTP
  const resendOTP = () => {
    if (resendTimer > 0) return;
    sendOTP();
  };

  // Handle going back to step 1 and clear OTP
  const goBackToStep1 = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]); // Clear OTP inputs
  };

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, otp.length);
  }, [otp.length]);

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center sm:p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          {/* Lock Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-primary rounded-2xl p-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H8m8-7V7a4 4 0 00-8 0v4m0 0V7a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z"
                />
              </svg>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Enter your credentials to continue</p>
          </div>

          {/* Phone/Email Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button className="flex-1 flex items-center justify-center py-3 px-4 rounded-md bg-white shadow-sm text-gray-700">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Phone
            </button>
            {/* <button className="flex-1 flex items-center justify-center py-3 px-4 text-gray-500" onClick={()=>toast("Comming Soon")}>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email
            </button> */}
          </div>

          {/* Country Code */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Country Code
            </label>
            <div className="relative">
              <div className="flex items-center px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                <span className="mr-2">🇮🇳</span>
                <span>India (+91)</span>
                <svg
                  className="w-5 h-5 ml-auto text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Send OTP Button */}
          <button
            onClick={sendOTP}
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <>Sending OTP...</> : <>Send OTP</>}
          </button>

          {/* Powered by */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">Powered by</p>
            <p className="text-gray-900 font-semibold">Webgeon Results</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => setStep(1)}
          className="mb-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Shield Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-primary rounded-2xl p-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        {/* Verify OTP Text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h1>
          <p className="text-gray-600 mb-1">Enter the 6-digit code sent to</p>
          <p className="text-gray-900 font-semibold">+91 {phoneNumber}</p>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center space-x-1 sm:space-x-2 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={(e) => {
                e.preventDefault();
                const pastedData = e.clipboardData
                  .getData("text")
                  .replace(/\D/g, "");
                const newOtp = [...otp];

                for (
                  let i = 0;
                  i < pastedData.length && index + i < otp.length;
                  i++
                ) {
                  newOtp[index + i] = pastedData[i];
                }

                setOtp(newOtp);

                const nextIndex = Math.min(
                  index + pastedData.length,
                  otp.length - 1
                );
                setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
              }}
              onFocus={() =>
                setTimeout(() => inputRefs.current[index]?.select(), 0)
              }
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 hover:border-gray-400"
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={verifyOTP}
          disabled={loading}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-6"
        >
          {loading ? <>Verifying...</> : <>Verify & Continue</>}
        </button>

        {/* Resend Code */}
        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-gray-500">Resend code in {resendTimer}s</p>
          ) : (
            <button
              onClick={resendOTP}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Resend code
            </button>
          )}
        </div>

        {/* Powered by */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">Powered by</p>
          <p className="text-gray-900 font-semibold">Webgeon Results</p>
        </div>
      </div>
    </div>
  );
}
