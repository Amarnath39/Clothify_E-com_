// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import { usePathname, useRouter } from "next/navigation";
// import { useDispatch, useSelector } from "react-redux";
// import toast, { Toaster } from "react-hot-toast";
// import Aos from "aos";
// import "aos/dist/aos.css";
// import Footer from "@/components/Footer";
// import { getCartItems } from "@/lib/features/cart";
// import { showCustomToast } from "@/components/CustomToast";
// import { getUserDetails, logoutApi } from "@/lib/features/auth";
// import Navbar from "@/components/Navbar";

// const CustomeLayout = ({ children }) => {
//   const pathname = usePathname();
//   const token = useSelector((state: any) => state.auth.token);
//   const dispatch = useDispatch<any>();
//   const cartItems = useSelector((state: any) => state.cart.items);
//   const [lastAddedProduct, setLastAddedProduct] = useState<any>(null);
//   const prevCartLengthRef = useRef(cartItems.length);
//   const router = useRouter();
//   const callGetUser = async () => {
//     try {
//       const { payload } = await dispatch(getUserDetails());

//       if (payload.success) {
//       } else {
//         if (payload.msg == "Unauthorized") {
//           await dispatch(logoutApi());
//         } else {
//           toast.error(payload.msg);
//         }
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   useEffect(() => {
//     Aos.init({ once: true });
//     if (token) {
//       callGetUser();
//     }
//   }, []);

//   const checkOffers = (product: any, quantity: number) => {
//     if (product.offers && product.offers.length > 0) {
//       let eligibleProducts: any[] = [];

//       product.offers.forEach((offer: any) => {
//         const { purchaseQuantity, freeQuantity, products } = offer;
//         if (quantity >= purchaseQuantity) {
//           const freeProductsCount =
//             Math.floor(quantity / purchaseQuantity) * freeQuantity;
//           products.forEach((freeProduct: any) => {
//             eligibleProducts.push({
//               name: freeProduct.name,
//               count: freeProductsCount,
//             });
//           });
//         }
//       });

//       if (eligibleProducts.length > 0) {
//         const message = eligibleProducts
//           .map(
//             (product) =>
//               `${product.count} ${product.name}${product.count > 1 ? "s" : ""}`
//           )
//           .join(", ");

//         showCustomToast(`You're eligible for free product(s): ${message}!`);
//       }
//     }
//   };

//   const checkFreeProduct = (cartProducts: any[]) => {
//     cartProducts.forEach((product: any) => {
//       if (product.offers) {
//         product.offers.forEach((offer: any) => {
//           if (offer.products) {
//             offer.products.forEach((freeProduct: any) => {
//               const freeProductInCart = cartProducts.find(
//                 (item: any) => item._id === freeProduct._id
//               );

//               if (freeProductInCart) {
//                 showCustomToast(
//                   `Offer Applied, ${freeProductInCart.name} has been added to the cart!`
//                 );
//               }
//             });
//           }
//         });
//       }
//     });
//   };

//   const callGetCartItems = async () => {
//     try {
//       const { payload } = await dispatch(
//         getCartItems({
//           carts: cartItems.map((item: any) => item.id),
//         })
//       );

//       if (payload.success) {
//         if (cartItems.length > prevCartLengthRef.current) {
//           // A new product was added
//           const newProduct = cartItems[cartItems.length - 1];
//           const lastProduct = payload.products.find(
//             (product: any) => product._id === newProduct.id
//           );

//           if (lastProduct && lastProduct !== lastAddedProduct) {
//             setLastAddedProduct(lastProduct);
//             checkOffers(lastProduct, newProduct.count);
//           }

//           checkFreeProduct(payload.products);
//         }

//         // Update the previous cart length
//         prevCartLengthRef.current = cartItems.length;
//       } else {
//         toast.error(payload.msg);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error("An error occurred while fetching cart items");
//     }
//   };

//   useEffect(() => {
//     callGetCartItems();
//   }, [cartItems]);

//   return (
//     <>
//       {/* {promotion && !pathname.includes("/admin") && ( */}
//       <div className="bg-white text-blackPrimary text-center text-sm footer-main">
//         <p className="max-w-6xl mx-auto py-3 px-2 lg:block">
//          Welcome to Roopsagar In World of Fashion
//         </p>
//         {/* <marquee className="max-w-6xl mx-auto py-2 px-2  lg:hidden"></marquee> */}
//       </div>
//       {/* )} */}
//       <Navbar />
//       {children}
//       {!pathname.includes("/admin") && (
//         <div className="fixed z-50 w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] bottom-16 sm:bottom-6 right-4 rounded-full opacity-80 hover:scale-105 hover:opacity-100 transition-all ease-linear divide-purple-200 hover:shadow-lg">
//           <a href="https://wa.me/+918712636775" target="_blank">
//             <img
//               className="w-full h-full rounded-full"
//               src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png"
//               alt=""
//             />
//           </a>
//         </div>
//       )}

//       <Footer />
//       <Toaster />
//     </>
//   );
// };

// export default CustomeLayout;
"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css"; 

const CustomLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  useEffect(() => {
    // Optional: Initialize AOS if you're using animations
    // import("aos").then((Aos) => Aos.init());
  }, []);

  return (
    <>
      {/* Welcome Message Bar with Gradient Animation */}
      <div className="text-center text-sm fixed top-0 left-0 w-full z-[9999] bg-[#380e13]">
        <p className="max-w-6xl mx-auto py-3 px-2 text-[#FFD700]">
          ഉടയാട –കേരള സാരി സൗന്ദര്യത്തിന് പുതിയ അധ്യായം
        </p>
      </div>

      {/* Padding to push content below fixed bars */}
      <div className="pt-[52px]">
        {/* Fixed Navbar */}
        <Navbar />

        {/* Page Content */}
        <div className="pb-[1px]">
          {children}

          {/* WhatsApp Button (hidden on /admin routes) */}
          {!pathname.includes("/admin") && (
            <div className="fixed z-50 w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] bottom-16 sm:bottom-6 right-4 rounded-full opacity-80 hover:scale-105 hover:opacity-100 transition-all ease-linear hover:shadow-lg">
              <a
                href="https://wa.me/+917306372906?text=Hi!"
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
        <Footer />
      </div>
    </>
  );
};

export default CustomLayout;

