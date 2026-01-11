// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';

// export default function PaymentStatusPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const orderId = searchParams.get('orderId');

//   const [status, setStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
//   const [countdown, setCountdown] = useState(3);

//   // Fetch payment status from API
//   useEffect(() => {
//   if (!orderId) return;

//   const fetchStatus = async () => {
//     try {
//       // ✅ Get userId from localStorage (or wherever you store user info)
//       const storedUser = localStorage.getItem("user");
//       const user = storedUser ? JSON.parse(storedUser) : null;

//       const res = await fetch(`/api/payment/status/${orderId}`, {
//         method: "GET",
//         cache: "no-store",
//         headers: {
//           "x-user-id": user?._id || "", // ✅ send user._id in header
//         },
//       });

//       const data = await res.json();

//       if (res.ok && data?.status) {
//         switch (data.status) {
//           case "COMPLETED":
//           case "SUCCESS":
//             setStatus("success");
//             break;
//           case "FAILED":
//             setStatus("failed");
//             break;
//           default:
//             setStatus("pending");
//         }
//       } else {
//         setStatus("failed");
//       }
//     } catch (err) {
//       console.error("Error fetching payment status:", err);
//       setStatus("failed");
//     }
//   };

//   fetchStatus();
// }, [orderId]);


//   // Auto-redirect when payment is successful
//   useEffect(() => {
//     if (status === 'success') {
//       const timer = setTimeout(() => {
//         setCountdown((prev) => prev - 1);
//       }, 1000);

//       if (countdown === 0) {
//         router.push('/orders');
//       }

//       return () => clearTimeout(timer);
//     }
//   }, [status, countdown, router]);

//   // No orderId found in URL
//   if (!orderId) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-100">
//         <h1 className="text-2xl font-bold">❌ Invalid URL</h1>
//         <p className="text-gray-500">No orderId found in query params.</p>
//       </div>
//     );
//   }

//   // Don't render until status is fetched
//   if (status === null) return null;

//   const renderFloatingDots = () => (
//     <div className="absolute inset-0 pointer-events-none">
//       {[...Array(30)].map((_, i) => (
//         <span
//           key={i}
//           className="absolute rounded-full bg-white/10 animate-float"
//           style={{
//             width: `${Math.random() * 6 + 4}px`,
//             height: `${Math.random() * 6 + 4}px`,
//             top: `${Math.random() * 100}%`,
//             left: `${Math.random() * 100}%`,
//             animationDelay: `${Math.random() * 5}s`,
//             animationDuration: `${Math.random() * 10 + 5}s`,
//           }}
//         />
//       ))}
//     </div>
//   );

//   const renderCard = (
//     iconColor: string,
//     bgColor: string,
//     iconPath: string,
//     title: string,
//     message: string,
//     buttonText: string,
//     onClick: () => void,
//     extraContent?: React.ReactNode
//   ) => (
//     <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
//       {renderFloatingDots()}
//       <div className="relative z-10 bg-white rounded-xl shadow-xl p-10 w-96 flex flex-col items-center text-center animate-fade-in space-y-5">
//         <div className={`w-20 h-20 flex items-center justify-center rounded-full ${bgColor} animate-pop`}>
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             className={`h-12 w-12 ${iconColor}`}
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//             strokeWidth={2}
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
//           </svg>
//         </div>

//         <h2 className={`text-2xl font-bold ${iconColor} animate-fade-in-delay`}>
//           {title}
//         </h2>
//         <p className="text-gray-600 animate-fade-in-delay">{message}</p>

//         {extraContent}

//         <button
//           onClick={onClick}
//           className={`bg-${iconColor.replace('text-', '')} hover:bg-${iconColor
//             .replace('text-', '')
//             .replace('-600', '-700')} text-white font-semibold px-6 py-2 rounded-lg shadow transition-transform duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in-delay`}
//         >
//           {buttonText}
//         </button>
//       </div>
//     </div>
//   );

//   if (status === 'success') {
//     return renderCard(
//       'text-green-600',
//       'bg-green-100',
//       'M5 13l4 4L19 7',
//       'Payment Successful!',
//       'Thank you for your purchase. Your transaction has been completed successfully.',
//       'Go to Home Page',
//       () => router.push('/'),
//       <div className="text-sm text-gray-500 animate-fade-in-delay">
//         Redirecting to home page in:
//         <div className="text-3xl font-bold text-green-600 mt-1">{countdown}</div>
//       </div>
//     );
//   }

//   if (status === 'failed') {
//     return renderCard(
//       'text-red-600',
//       'bg-red-100',
//       'M6 18L18 6M6 6l12 12',
//       'Payment Failed!',
//       'Unfortunately, your transaction was not successful. Please try again.',
//       'Return to Home',
//       () => router.push('/')
//     );
//   }

//   if (status === 'pending') {
//     return renderCard(
//       'text-yellow-600',
//       'bg-yellow-100',
//       'M12 8v4m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z',
//       'Payment Pending...',
//       'Your payment is still being processed. Please wait a moment or refresh later.',
//       'Refresh',
//       () => router.refresh()
//     );
//   }

//   return null;
// }


'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/hooks';
import { emptyCart } from '@/lib/features/cart';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const orderId = searchParams.get('orderId');

  const [status, setStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [orderData, setOrderData] = useState<any>(null);

  // Fetch payment status from API
  useEffect(() => {
    if (!orderId) return;

    const fetchStatus = async () => {
      try {
        // ✅ Get userId from localStorage (or wherever you store user info)
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;

        const res = await fetch(`/api/payment/status/${orderId}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "x-user-id": user?._id || "", // ✅ send user._id in header
          },
        });


        const data = await res.json();

        if (res.ok && data?.success) {
          setOrderData(data.order); // Store order data for tracking display

          // Check paymentStatus field for verification
          if (data.paymentStatus === "PAYMENT_SUCCESS" || data.order?.paymentStatus === "PAYMENT_SUCCESS") {
            setStatus("success");
          } else if (data.paymentStatus === "PAYMENT_ERROR" || data.order?.paymentStatus === "PAYMENT_ERROR") {
            setStatus("failed");
          } else {
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
    if (status === 'success') {
      dispatch(emptyCart());
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      if (countdown === 0) {
        router.push('/orders');
      }

      return () => clearTimeout(timer);
    }
  }, [status, countdown, router, dispatch]);

  // No orderId found in URL
  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-100">
        <h1 className="text-2xl font-bold">❌ Invalid URL</h1>
        <p className="text-gray-500">No orderId found in query params.</p>
      </div>
    );
  }


  // Don't render until status is fetched
  if (status === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
        {/* Floating dots for background effect */}
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

        {/* Card */}
        <div className="relative z-10 bg-white rounded-xl shadow-xl p-10 w-96 flex flex-col items-center text-center animate-fade-in space-y-5">
          {/* Spinner inside circle */}
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-green-100 animate-pop">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <h2 className="text-2xl font-bold text-green-600 animate-fade-in-delay">
            Checking Payment Status
          </h2>
          <p className="text-gray-600 animate-fade-in-delay">
            Please wait while we confirm your transaction...
          </p>
        </div>
      </div>
    );
  }


  const renderFloatingDots = () => (
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
  );

  const renderCard = (
    iconColor: string,
    bgColor: string,
    iconPath: string,
    title: string,
    message: string,
    buttonText: string,
    onClick: () => void,
    extraContent?: React.ReactNode
  ) => (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
      {renderFloatingDots()}
      <div className="relative z-10 bg-white rounded-xl shadow-xl p-10 w-96 flex flex-col items-center text-center animate-fade-in space-y-5">
        <div className={`w-20 h-20 flex items-center justify-center rounded-full ${bgColor} animate-pop`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-12 w-12 ${iconColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>

        <h2 className={`text-2xl font-bold ${iconColor} animate-fade-in-delay`}>
          {title}
        </h2>
        <p className="text-gray-600 animate-fade-in-delay">{message}</p>

        {extraContent}

        <button
          onClick={onClick}
          className={`bg-${iconColor.replace('text-', '')} hover:bg-${iconColor
            .replace('text-', '')
            .replace('-600', '-700')} text-black font-semibold px-6 py-2 rounded-lg shadow transition-transform duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in-delay`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );

  if (status === 'success') {
    return renderCard(
      'text-green-600',
      'bg-green-100',
      'M5 13l4 4L19 7',
      'Payment Successful!',
      '✅ Your order has been successfully placed. 💳 Payment confirmed via PhonePe. 🚚 Shipment is being prepared.',
      'Go to Home Page',
      () => router.push('/'),
      <div className="text-sm text-gray-500 animate-fade-in-delay">
        Redirecting to home page in:
        <div className="text-3xl font-bold text-green-600 mt-1">{countdown}</div>
      </div>
    );
  }

  if (status === 'failed') {
    return renderCard(
      'text-red-600',
      'bg-red-100',
      'M6 18L18 6M6 6l12 12',
      'Payment Failed!',
      'Unfortunately, your transaction was not successful. Please try again.',
      'Return to Home',
      () => router.push('/')
    );
  }

  if (status === 'pending') {
    return renderCard(
      'text-yellow-600',
      'bg-yellow-100',
      'M12 8v4m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z',
      'Payment Pending...',
      '⏳ Payment is under verification. Please do not refresh the page.',
      'Refresh',
      () => router.refresh()
    );
  }

  return null;
}


