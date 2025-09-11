
import React, { useEffect, useState } from "react";

export default function PaymentStatusPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("orderId");

const [status, setStatus] = useState<"success" | "failed" | "pending" | null>(null);
   // "success" | "failed" | "pending" | null
  const [countdown, setCountdown] = useState(3); // Countdown for redirect

  // Fetch payment status from API
  useEffect(() => {
    if (!orderId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/payment/status/${orderId}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (res.ok && data?.status) {
          switch (data.status) {
            case "COMPLETED":
            case "SUCCESS":
              setStatus("success");
              break;
            case "FAILED":
              setStatus("failed");
              break;
            default:
              setStatus("pending");
          }
        } else {
          setStatus("failed");
        }
      } catch (err) {
        console.error("Error fetching payment status:", err);
        setStatus("failed");
      }
    };

    fetchStatus();
  }, [orderId]);

  // Auto-redirect when payment is successful
  useEffect(() => {
  if (status === "success") {
    let timer: NodeJS.Timeout;

    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }
}, [status, countdown]);


  // If orderId is missing
  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-100">
        <h1 className="text-2xl font-bold">❌ Invalid URL</h1>
        <p className="text-gray-500">No orderId found in query params.</p>
      </div>
    );
  }

  // Don't render anything until status is fetched
  if (status === null) {
    return null;
  }

  // Render UI based on payment status
  if (status === "success") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
        {/* Floating Dots Background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white/10 animate-float"
              style={{
                width: `${Math.random() * 6 + 4}px`,
                height: `${Math.random() * 6 + 4}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 5}s`,
              }}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="relative z-10 bg-white rounded-xl shadow-xl p-10 w-96 flex flex-col items-center text-center animate-fade-in space-y-5">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-green-100 animate-pop">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-green-700 animate-fade-in-delay">
            Payment Successful!
          </h2>
          <p className="text-gray-600 animate-fade-in-delay">
            Thank you for your purchase. Your transaction has been completed successfully.
          </p>

          <div className="text-sm text-gray-500 animate-fade-in-delay">
            Redirecting to home page in:
            <div className="text-3xl font-bold text-green-600 mt-1">
              {countdown}
            </div>
          </div>

          <button
            onClick={() => (window.location.href = "/")}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition-transform duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in-delay"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

if (status === "failed") {
  return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
      {/* Floating Dots Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              width: `${Math.random() * 6 + 4}px`,
              height: `${Math.random() * 6 + 4}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div className="relative z-10 bg-white rounded-xl shadow-xl p-10 w-96 flex flex-col items-center text-center animate-fade-in space-y-5">
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-100 animate-pop">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-red-700 animate-fade-in-delay">
          Payment Failed!
        </h2>
        <p className="text-gray-600 animate-fade-in-delay">
          Unfortunately, your transaction was not successful. Please try again.
        </p>

        <button
          onClick={() => (window.location.href = "/")}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition-transform duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in-delay"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}


  if (status === "pending") {
  return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
      {/* Floating Dots Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              width: `${Math.random() * 6 + 4}px`,
              height: `${Math.random() * 6 + 4}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div className="relative z-10 bg-white rounded-xl shadow-xl p-10 w-96 flex flex-col items-center text-center animate-fade-in space-y-5">
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-yellow-100 animate-pop">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-yellow-700 animate-fade-in-delay">
          Payment Pending...
        </h2>
        <p className="text-gray-600 animate-fade-in-delay">
          Your payment is still being processed. Please wait a moment or refresh later.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition-transform duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in-delay"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}


  return null;
}
