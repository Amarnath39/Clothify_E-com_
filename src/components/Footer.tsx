
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import { X } from "lucide-react";

const currentYear = new Date().getFullYear();

const Footer = () => {
  const [categories, setCategories] = useState<any>([]);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/category`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      if (data.msg === "Success") {
        // Get the latest 6 categories
        const latestCategories = data.categories.slice(-6).reverse();
        setCategories(latestCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const LINKS = [
    {
      title: "QUICK LINKS",
      items: categories.map((category: any) => ({
        label: category.name.toUpperCase(),
        link: `/categories/${category._id}`,
      })),
    },
    {
      title: "INFORMATION",
      items: [
        {
          label: "ABOUT US",
          link: "/about",
        },
        {
          label: "CONTACT US",
          link: "/contact",
        },
        {
          label: "RETURN & REFUND POLICY",
          link: "/policy/return-policy",
        },
        {
          label: "PRIVACY POLICY",
          link: "/policy/privacy-policy",
        },
        {
          label: "TERMS & CONDITION",
          link: "/policy/terms-condition",
        },
        {
          label: "SHIPPING POLICY",
          link: "/policy/shipping-policy",
          showCardImage: true, // Add this property
        },
      ],
    },
  ];

  const submitEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/subscribe`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.success) {
      setEmail("");
      toast.success("Thank you for subscribing!");
      setIsOpen(false);
    } else {
      toast.error(data?.msg);
    }
    setLoading(false);
  };

//   return (
//     <footer className="relative w-full bg-white pt-8 pb-8 footer-main mb-16 md:mb-0">
//       <div className="mx-auto w-full max-w-7xl px-8">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//           <div className="space-y-6 col-span-1 md:col-span-2 lg:col-span-1 mb-8">
//   <div className="bg-white p-4 rounded-lg text-center">
//     <div className="h-32 w-32 sm:h-56 sm:w-56 mx-auto mt-5 rounded-3xl  flex items-center justify-center overflow-hidden">
//       <img
//         // src="/assets/static/logo/Final Footer.svg"
//         src="/assets/static/logo/SIS-LOGO.png"
//         alt="logo"
//         className="h-26 w-26 sm:h-62 sm:w-60 object-contain"
//       />
//     </div>
    
//   </div>
// </div>


//           {LINKS.map(({ title, items }) => (
//             <div key={title} className="ml-5 space-y-4">
//               <h2 className="text-lg tracking-wide text-blackPrimary border-b border-yellow pb-2">
//                 {title}
//               </h2>
//               <ul className="space-y-2">
//                 {items.map((link: any) => (
//                   <li key={link.label}>
//                     <Link href={link.link}>
//                       <p className="text-secondaryRed hover:text-primaryRed transition-colors text-sm flex items-center tracking-wide">
//                         <span className="mr-2">&#8227;</span> {link.label}
//                       </p>
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}

//           {/* Accepted Cards Section moved here */}
//           <div className="col-span-1 md:col-span-2 lg:col-span-1 space-y-4 mt-1">
//             <h3 className="text-md tracking-wide text-blackPrimary border-b border-yellow pb-2">
//               ACCEPTED PAYMENT METHODS
//             </h3>
//             <div className="flex space-x-4 mt-0">
//               <img src="/assets/static/logo/mastero-removebg-preview.png" alt="Maestro" className="h-8 object-contain" />
//               <img src="/assets/static/logo/visa.png" alt="Visa" className="h-8 object-contain" />
//               <img src="/assets/static/logo/rupay-logo-icon.png" alt="RuPay" className="h-8 object-contain" />
//               <img src="/assets/static/logo/card.png" alt="Mastercard" className="h-8 object-contain" />
//               <img src="/assets/static/logo/upii.jpg" alt="UPI" className="h-7 object-contain" />
//             </div>
//             <Button
//               onClick={() => setIsOpen(true)}
//               className=" text-white bg-black hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-300 mt-6 sm:mt-12"
//             >
//               Subscribe Now
//             </Button>
//           </div>
//         </div>

//         {isOpen && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//             <div className="relative bg-white p-6 rounded-lg max-w-[400px] w-[90%] animate-in fade-in duration-200">
//               <button
//                 onClick={() => setIsOpen(false)}
//                 className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
//               >
//                 <X className="w-5 h-5" />
//               </button>

//               <div className="space-y-6">
//                 <div className="text-center">
//                   <h2 className="text-lg tracking-wide text-black mb-4">
//                     SUBSCRIBE
//                   </h2>
//                   <p className="text-black text-sm mb-4 tracking-wide">
//                     Stay updated with our latest collections and exclusive
//                     offers.
//                   </p>
//                 </div>

//                 <form
//                   onSubmit={submitEmail}
//                   className="flex flex-col space-y-4"
//                 >
//                   <Input
//                     type="email"
//                     className="bg-white/20 text-black placeholder:text-black border-black rounded-lg"
//                     placeholder="Your email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                   />
//                   <Button
//                     type="submit"
//                     className="bg-black text-white hover:bg-gray-800 hover:text-white border-black rounded-lg transition-colors duration-300"
//                     disabled={loading}
//                   >
//                     {loading ? "Subscribing..." : "SUBSCRIBE NOW"}
//                   </Button>
//                 </form>

//                 <div className="text-center">
//                   <p className="text-black text-xs">
//                     By subscribing, you agree to our{" "}
//                     <a href="/policy/terms-condition" className="underline hover:text-yellow-400">
//                       Terms
//                     </a>{" "}
//                     and{" "}
//                     <a href="/policy/privacy-policy" className="underline hover:text-yellow-400">
//                       Privacy Policy
//                     </a>
//                     .
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="mt-0 flex flex-col md:flex-row justify-between items-center border-t border-black pt-8">
//           <p className="text-black text-sm mb-4 md:mb-0">
//             &copy; {currentYear} S.I.S. All Rights Reserved.
//           </p>
        
          
//   <div className="flex flex-col items-center">
//   <Link
//     href="https://trackcourier.io/"
//     target="_blank"
//     className="text-black hover:underline text-md"
//   >
//     Track Your Order
//   </Link>
// </div>
          
//           <p className="text-black text-sm mt-4 md:mt-0 mr-10">
//             Crafted with ❤️ {" "}
//             <Link
//               href="https://www.webgeon.com/"
//               target="_blank"
//               className="text-red hover:underline"
//             >
//               by Webgeon
//             </Link>
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
return (
  <footer className="relative w-full bg-white pt-8 pb-8 footer-main mb-16 md:mb-0">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
      {/* Footer Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="bg-white p-2 sm:p-4 rounded-lg">
            <div className="h-28 w-28 sm:h-48 sm:w-48 mx-auto sm:mx-0 rounded-3xl flex items-center justify-center overflow-hidden">
              <img
                src="/assets/static/logo/SIS-LOGO.png"
                alt="logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Links */}
        {LINKS.map(({ title, items }) => (
          <div key={title} className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h2 className="text-base sm:text-lg tracking-wide text-blackPrimary border-b border-yellow pb-1 sm:pb-2">
              {title}
            </h2>
            <ul className="space-y-1 sm:space-y-2">
              {items.map((link: any) => (
                <li key={link.label}>
                  <Link href={link.link}>
                    <p className="text-secondaryRed hover:text-primaryRed transition-colors text-sm tracking-wide">
                      <span className="mr-1">&#8227;</span> {link.label}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Payment & Subscribe */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-md tracking-wide text-blackPrimary border-b border-yellow pb-1 sm:pb-2">
            ACCEPTED PAYMENT METHODS
          </h3>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4">
            <img src="/assets/static/logo/mastero-removebg-preview.png" alt="Maestro" className="h-6 sm:h-8 object-contain" />
            <img src="/assets/static/logo/visa.png" alt="Visa" className="h-6 sm:h-8 object-contain" />
            <img src="/assets/static/logo/rupay-logo-icon.png" alt="RuPay" className="h-6 sm:h-8 object-contain" />
            <img src="/assets/static/logo/card.png" alt="Mastercard" className="h-6 sm:h-8 object-contain" />
            <img src="/assets/static/logo/upii.jpg" alt="UPI" className="h-6 sm:h-7 object-contain" />
          </div>

          <Button
            onClick={() => setIsOpen(true)}
            className="text-white bg-black hover:bg-gray-700 rounded-lg transition-colors duration-300 mt-4 sm:mt-6 w-full sm:w-auto"
          >
            Subscribe Now
          </Button>
        </div>
      </div>

      {/* Subscription Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-lg max-w-[400px] w-[90%] animate-in fade-in duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-black mb-2">
                  SUBSCRIBE
                </h2>
                <p className="text-black text-sm mb-4 tracking-wide">
                  Stay updated with our latest collections and exclusive offers.
                </p>
              </div>

              <form onSubmit={submitEmail} className="flex flex-col space-y-3">
                <Input
                  type="email"
                  className="bg-white border border-black text-black placeholder:text-gray-700 rounded-lg"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  className="bg-black text-white hover:bg-gray-800 rounded-lg transition-colors duration-300"
                  disabled={loading}
                >
                  {loading ? "Subscribing..." : "SUBSCRIBE NOW"}
                </Button>
              </form>

              <p className="text-black text-xs text-center">
                By subscribing, you agree to our{" "}
                <a href="/policy/terms-condition" className="underline hover:text-yellow-600">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/policy/privacy-policy" className="underline hover:text-yellow-600">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Bottom */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center border-t border-black pt-6 space-y-4 sm:space-y-0">
        <p className="text-black text-sm text-center sm:text-left">
          &copy; {currentYear} S.I.S. All Rights Reserved.
        </p>

        <Link
          href="https://trackcourier.io/"
          target="_blank"
          className="text-black hover:underline text-sm"
        >
          Track Your Order
        </Link>

        <p className="text-black text-sm text-center sm:text-right">
          Crafted with ❤️{" "}
          <Link
            href="https://www.webgeon.com/"
            target="_blank"
            className="text-red-600 hover:underline"
          >
            by Webgeon
          </Link>
        </p>
      </div>
    </div>
  </footer>
)};

export default Footer;
