"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface PaymentSuccessCountdownProps {
  onComplete?: () => void;
}

const PaymentSuccessCountdown: React.FC<PaymentSuccessCountdownProps> = ({
  onComplete,
}) => {
  const [count, setCount] = useState(5);

  // Keep the latest onComplete callback without triggering re-runs
  const onCompleteRef = React.useRef<(() => void) | undefined>(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (count <= 0) {
      // Countdown finished → call the latest callback
      onCompleteRef.current?.();
      return;
    }

    const timer = setTimeout(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count]); // Only re-run when count changes

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] bg-green-300/15 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, white 1px, transparent 1px),
                linear-gradient(to bottom, white 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white rounded-full animate-float-particle"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white/80 rounded-full animate-float-particle animation-delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-white/60 rounded-full animate-float-particle animation-delay-2000"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-white rounded-full animate-float-particle animation-delay-3000"></div>
        <div className="absolute bottom-1/4 right-1/2 w-3 h-3 bg-white/70 rounded-full animate-float-particle animation-delay-4000"></div>

        {/* Diagonal Lines */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-0 left-0 w-1 h-full bg-white transform -rotate-45 origin-top-left animate-slide-diagonal"></div>
          <div className="absolute top-0 right-0 w-1 h-full bg-white transform rotate-45 origin-top-right animate-slide-diagonal animation-delay-2000"></div>
        </div>
      </div>

      <div className="text-center px-6 relative z-10">
        {/* Success Icon */}
        <div className="mb-8 inline-block animate-bounce">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <div className="w-32 h-32 rounded-full bg-white opacity-20"></div>
            </div>
            <div className="relative bg-white rounded-full p-6 shadow-2xl">
              <CheckCircle className="w-20 h-20 text-green-500" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
          Payment Successful!
        </h1>

        <p className="text-xl text-white/90 mb-8 animate-fade-in-delay">
          Thank you for your purchase
        </p>

        {/* Countdown Circle */}
        <div className="inline-block relative">
          <div className="absolute inset-0 animate-spin-slow">
            <div className="w-28 h-28 rounded-full border-4 border-white/30 border-t-white"></div>
          </div>

          <div className="relative w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/40">
            <span className="text-6xl font-bold text-white animate-scale">
              {count}
            </span>
          </div>
        </div>

        <p className="mt-6 text-lg text-white/80 animate-pulse">
          Redirecting to your orders...
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-delay {
          0%, 20% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes slide-diagonal {
          0% { transform: translateY(-100%) rotate(-45deg); }
          100% { transform: translateY(100vh) rotate(-45deg); }
        }

        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-fade-in-delay { animation: fade-in-delay 0.8s ease-out; }
        .animate-scale { animation: scale-pulse 1s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 2s linear infinite; }
        .animate-blob { animation: blob 7s ease-in-out infinite; }
        .animate-float-particle { animation: float-particle 8s ease-in infinite; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default PaymentSuccessCountdown;