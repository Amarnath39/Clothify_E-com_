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

  return (
    <footer className="relative w-full bg-white pt-16 pb-8 footer-main mb-16 md:mb-0">
      <div className="mx-auto w-full max-w-7xl px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-6 col-span-1 md:col-span-2 lg:col-span-1">
            <div className="bg-white p-4 rounded-lg">
              <img
                src="/assets/static/logo/footerlogo.svg"
                alt="logo"
                className="h-56 w-56 object-contain mx-auto"
              />
              <p className="text-primaryRed text-sm mt-0 text-center">
                Subin P.
              </p>
            </div>
          </div>

          {LINKS.map(({ title, items }) => (
            <div key={title} className="space-y-4">
              <h2 className="text-lg tracking-wide text-blackPrimary border-b border-yellow pb-2">
                {title}
              </h2>
              <ul className="space-y-2">
                {items.map((link: any) => (
                  <li key={link.label}>
                    <Link href={link.link}>
                      <p className="text-secondaryRed hover:text-primaryRed transition-colors text-sm flex items-center tracking-wide">
                        <span className="mr-2">&#8227;</span> {link.label}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Accepted Cards Section moved here */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 space-y-4 mt-1">
            <h3 className="text-md tracking-wide text-blackPrimary border-b border-yellow pb-2">
              ACCEPTED CARDS
            </h3>
            <div className="flex space-x-4 mt-0">
              <img src="/assets/static/logo/mastero-removebg-preview.png" alt="Maestro" className="h-8 object-contain" />
              <img src="/assets/static/logo/visa.png" alt="Visa" className="h-8 object-contain" />
              <img src="/assets/static/logo/rupay-logo-icon.png" alt="RuPay" className="h-8 object-contain" />
              <img src="/assets/static/logo/card.png" alt="Mastercard" className="h-8 object-contain" />
            </div>
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-red text-white bg-primaryRed hover:text-white rounded-lg transition-colors duration-300 mt-6 sm:mt-12"
            >
              Subscribe Now
            </Button>
          </div>
        </div>

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
                  <h2 className="text-lg tracking-wide text-secondaryRed mb-4">
                    SUBSCRIBE
                  </h2>
                  <p className="text-black text-sm mb-4 tracking-wide">
                    Stay updated with our latest collections and exclusive
                    offers.
                  </p>
                </div>

                <form
                  onSubmit={submitEmail}
                  className="flex flex-col space-y-4"
                >
                  <Input
                    type="email"
                    className="bg-white/20 text-black placeholder:text-black border-black rounded-lg"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    className="bg-white text-secondaryRed hover:bg-secondaryRed hover:text-white border-black rounded-lg transition-colors duration-300"
                    disabled={loading}
                  >
                    {loading ? "Subscribing..." : "SUBSCRIBE NOW"}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-black text-xs">
                    By subscribing, you agree to our{" "}
                    <a href="/policy/terms-condition" className="underline hover:text-yellow-400">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="/policy/privacy-policy" className="underline hover:text-yellow-400">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 flex flex-col md:flex-row justify-between items-center border-t border-black pt-8">
          <p className="text-black text-sm mb-4 md:mb-0">
            &copy; {currentYear} Udayaada. All Rights Reserved.
          </p>
          <div className="flex space-x-4 md:mr-24">
            {/* <a
              target="_blank"
              href="https://www.instagram.com/roopsagar_shopping_mall/"
              className="text-red hover:text-yellow-400 transition-colors"
            >
              <FaInstagram size={22} />
            </a> */}
             {/* <a
          target="_blank"
          href="https://www.facebook.com/RoopsagarSM"
          rel="noopener noreferrer"
          className="text-red hover:text-yellow-400 transition-colors"
        >
          <FaFacebook size={22} />
        </a> */}
        {/* <a
          target="_blank"
          href="https://youtube.com/@roopsagarshoppingmallpvtltd?si=HOqY07IKT6zaD5v7"
          rel="noopener noreferrer"
          className="text-red hover:text-yellow-400 transition-colors"
        >
          <FaYoutube size={22} />
        </a> */}
            {/* <a
              href="#"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              <FaFacebook size={20} />
            </a>
            <a
              href="#"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              <FaTwitter size={20} />
            </a>
            <a
              href="#"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              <FaLinkedin size={20} />
            </a> */}
          </div>
          {/* <p className="text-black text-sm mt-4 md:mt-0">
            Designed By{" "}
            <Link
              href="https://www.webgeon.com/"
              target="_blank"
              className="text-red hover:underline"
            >
              Webgeon
            </Link>
          </p> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
