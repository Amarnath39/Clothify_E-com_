"use client";

import Link from "next/link";
import useWindowSize from "@/hooks/useWindowSize";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Package, Phone, User } from "lucide-react";

const BottomNavbar = () => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const cartItems = useSelector((state: any) => state.cart.items);
  const pathname = usePathname();

  // Hide bottom navbar on admin and invoice routes
  const shouldHide = pathname.startsWith("/admin") || pathname.startsWith("/adminLogin") || pathname.startsWith("/invoice");

  if (!isMobile || shouldHide) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/cart", icon: ShoppingCart, label: "Cart", badge: cartItems.length },
    { href: "/orders", icon: Package, label: "Orders" },
    { href: "/contact", icon: Phone, label: "Contact" },
    { href: "/profile", icon: User, label: "Account" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 w-full shadow-lg"
      style={{
        zIndex: 100,
        backgroundColor: "#800020",
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full group"
            >
              {/* Icon container */}
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-200 ${active
                      ? "text-[#C9A24D] scale-110"
                      : "text-white/80 group-active:scale-95"
                    }`}
                  strokeWidth={active ? 2.5 : 1.5}
                />

                {/* Cart badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#C9A24D] text-[#800020] text-[10px] font-bold px-1 shadow-sm">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-0.5 text-[10px] font-medium tracking-wide transition-colors duration-200 ${active
                    ? "text-[#C9A24D]"
                    : "text-white/70"
                  }`}
              >
                {item.label}
              </span>

            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
