// "use client";

// import React, { useEffect } from "react";
// import { usePathname } from "next/navigation";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import "./globals.css";

// const CustomLayout = ({ children }: { children: React.ReactNode }) => {
//   const pathname = usePathname();

//   useEffect(() => {
//     // Optional: Initialize AOS if you're using animations
//     // import("aos").then((Aos) => Aos.init());
//   }, []);

//   return (
//     <>
//       {/* Welcome Message Bar with Gradient Animation */}
// <div className="text-brown text-center text-sm fixed top-0 left-0 w-full z-50 gold-bar">
//   <p className="max-w-6xl mx-auto py-3 px-2">
//     Timeless Kerala Sarees for the Modern Woman
//   </p>

//   <style jsx>{`
//     .gold-bar {
//       background: linear-gradient(
//         90deg,
//         #eab564,
//         #eab590,
//         #eab565,
//         #eab580,
//         #eab664
//       );
//       background-size: 300% 300%;
//       animation: shimmer 8s linear infinite;
//       box-shadow: 0 0 15px rgba(234, 182, 100, 0.6);
//     }

//     @keyframes shimmer {
//       0% {
//         background-position: 0% 50%;
//       }
//       50% {
//         background-position: 100% 50%;
//       }
//       100% {
//         background-position: 0% 50%;
//       }
//     }

//     .gold-bar p {
//       font-weight: 600;
//       letter-spacing: 1px;
//       text-shadow: 0 0 5px rgba(234, 182, 100, 0.7),
//         0 0 12px rgba(235, 182, 101, 0.9);
//     }
//   `}</style>
// </div>





//       {/* Padding to push content below fixed bars */}
//       <div className="pt-[52px]">
//         {/* Fixed Navbar */}
//         <Navbar />

//         {/* Page Content */}
//         <div className="pb-[1px]">
//           {children}

//           {/* WhatsApp Button (hidden on /admin routes) */}
//           {!pathname.includes("/admin") && (
//             <div className="fixed z-50 w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] bottom-16 sm:bottom-6 right-4 rounded-full opacity-80 hover:scale-105 hover:opacity-100 transition-all ease-linear hover:shadow-lg">
//               <a
//                 href="https://wa.me/+917306372906?text=Hi!"
//                 target="_blank"
//                 rel="noopener noreferrer"

//               >
//                 <img
//                   className="w-full h-full rounded-full"
//                   src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png"
//                   alt="WhatsApp"
//                 />
//               </a>
//             </div>
//           )}
//         </div>

//         {/* Footer Section */}
//         <Footer />
//       </div>
//     </>
//   );
// };

// export default CustomLayout;

"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const CustomLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  // Exclude /login/admin from isAdminRoute so Navbar/Footer show up there
  // Also exclude /invoice routes to show only invoice without header/footer
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/adminLogin") || pathname.startsWith("/invoice");

  const isHomePage = pathname === "/";

  useEffect(() => {
    // Optional: Initialize AOS if you're using animations
    // import("aos").then((Aos) => Aos.init());
  }, []);

  return (
    <>
      {/* ✅ Show gold bar only if NOT an admin route */}
      {!isAdminRoute && (
        <div className="text-brown text-center text-sm fixed top-0 left-0 w-full z-50 gold-bar">
          {/* <p className="max-w-6xl mx-auto py-3 px-2">
            Timeless Kerala Sarees for the Modern Woman
          </p> */}

          <style jsx>{`
            .gold-bar {
              background: linear-gradient(
                90deg,
                #eab564,
                #eab590,
                #eab565,
                #eab580,
                #eab664
              );
              background-size: 300% 300%;
              animation: shimmer 8s linear infinite;
              box-shadow: 0 0 15px rgba(234, 182, 100, 0.6);
            }
 
            @keyframes shimmer {
              0% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
              100% {
                background-position: 0% 50%;
              }
            }
 
            .gold-bar p {
              font-weight: 600;
              letter-spacing: 1px;
              text-shadow: 0 0 5px rgba(234, 182, 100, 0.7),
                0 0 12px rgba(235, 182, 101, 0.9);
            }
          `}</style>
        </div>
      )}

      {/* Padding to push content below fixed bars (only if gold bar is shown) */}
      <div className={isAdminRoute ? "" : ""}>
        {/* ✅ Conditionally render Navbar */}
        {!isAdminRoute && <Navbar />}

        <div className={isAdminRoute ? "" : "pt-11 md:pt-11 pb-24 md:pb-0"}>
          {children}

          {/* WhatsApp Button (hidden on /admin routes) */}
          {!isAdminRoute && (
            <div className="fixed z-50 w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] bottom-16 sm:bottom-6 right-4 rounded-full opacity-80 hover:scale-105 hover:opacity-100 transition-all ease-linear hover:shadow-lg">
              <a
                href="https://wa.me/+916282667959?text=Hi!"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="w-full h-full rounded-full"
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png"
                  alt="WhatsApp"
                />
              </a>
            </div>
          )}
        </div>

        {/* Footer Section */}
        {!isAdminRoute && <Footer />}
      </div>
    </>
  );
};

export default CustomLayout;
