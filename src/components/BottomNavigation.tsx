"use client";

import { useState } from "react";
import { Home, ShoppingCart, Package, User, Phone } from "lucide-react";
import Link from "next/link";
import useWindowSize from "@/hooks/useWindowSize";
import { useSelector } from "react-redux";

const BottomNavbar = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { width } = useWindowSize();
  const isMobile = width < 768; // Show only on small screens (sm)
  const cartItems = useSelector((state: any) => state.cart.items);
  if (!isMobile) return null;
  return (
    <div
      className="fixed bottom-0 left-0 w-full bg-secondaryRed shadow-md border-t border-white flex justify-around items-center py-3 sm:py-4 footer-main"
      style={{ zIndex: 100 }}
    >
      <Link
        href="/"
        onClick={() => setActiveTab("home")}
        className="flex flex-col items-center"
      >
        <Home
          className={`w-6 h-6 ${
            activeTab === "home" ? "text-navbarText scale-110" : "text-white"
          } transition-all`}
        />
        <span
          className={`text-xs ${
            activeTab === "home"
              ? "text-navbarText font-semibold"
              : "text-white"
          }`}
        >
          Home
        </span>
      </Link>

      <Link
        href="/cart"
        onClick={() => setActiveTab("cart")}
        className="flex flex-col items-center relative"
      >
        <ShoppingCart
          className={`w-6 h-6 ${
            activeTab === "cart" ? "text-navbarText scale-110" : "text-white"
          } transition-all`}
        />
        <div className="absolute -top-1 left-1">
          {cartItems.length > 0 && (
            <span className="absolute left-0 w-4 h-4 z-[100] rounded-full top-0 text-black items-center flex justify-center bg-white">
              {cartItems.length}
            </span>
          )}
        </div>
        <span
          className={`text-xs ${
            activeTab === "cart"
              ? "text-navbarText font-semibold"
              : "text-white"
          }`}
        >
          Cart
        </span>
      </Link>

      <Link
        href="/orders"
        onClick={() => setActiveTab("orders")}
        className="flex flex-col items-center"
      >
        <Package
          className={`w-6 h-6 ${
            activeTab === "orders"
              ? "text-navbarText scale-110"
              : "text-white"
          } transition-all`}
        />
        <span
          className={`text-xs ${
            activeTab === "orders"
              ? "text-navbarText font-semibold"
              : "text-white"
          }`}
        >
          Orders
        </span>
      </Link>

      <Link
        href="/contact"
        onClick={() => setActiveTab("contact")}
        className="flex flex-col items-center"
      >
        <Phone
          className={`w-6 h-6 ${
            activeTab === "contact"
              ? "text-navbarText scale-110"
              : "text-white"
          } transition-all`}
        />
        <span
          className={`text-xs ${
            activeTab === "contact"
              ? "text-navbarText font-semibold"
              : "text-white"
          }`}
        >
          Contact
        </span>
      </Link>
      <Link
        href="/profile"
        onClick={() => setActiveTab("profile")}
        className="flex flex-col items-center"
      >
        <User
          className={`w-6 h-6 ${
            activeTab === "profile"
              ? "text-navbarText scale-110"
              : "text-white"
          } transition-all`}
        />
        <span
          className={`text-xs ${
            activeTab === "profile"
              ? "text-navbarText font-semibold"
              : "text-white"
          }`}
        >
          Profile
        </span>
      </Link>
    </div>
  );
};

export default BottomNavbar;
