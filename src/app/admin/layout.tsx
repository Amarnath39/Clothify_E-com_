"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo, lazy, Suspense } from "react";
import { BsGraphUpArrow } from "react-icons/bs";
import {
  FaShoppingCart,
  FaList,
  FaPlus,
  FaImage,
  FaTag,
  FaCog,
  FaSalesforce,
  FaHamburger,
  FaInstagram,
  FaBoxOpen,
  FaCashRegister,
  FaReceipt,
} from "react-icons/fa";
import { SiSublimetext } from "react-icons/si";
import { FcRules } from "react-icons/fc";
import { LuUsers } from "react-icons/lu";
import { RiAdminLine } from "react-icons/ri";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useDispatch, useSelector } from "react-redux";
import { logoutApi } from "@/lib/features/auth";
import { Button } from "@/components/ui/button";
import { MdVideoLibrary } from "react-icons/md";
import NotificationDropdown from "@/components/admin/NotificationDropdown";

// ✅ Lazy load POS Modal for performance
const POSModal = lazy(() => import("@/components/admin/POSModal"));

function AdminLayout({ children }) {
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(true);
  const dispatch = useDispatch<any>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPOSModal, setShowPOSModal] = useState(false); // ✅ POS Modal state
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);

  const handleLogout = async () => {
    try {
      const { payload } = await dispatch(logoutApi());
      if (payload.success) {
        router.push("/login/admin");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const allAdminCards = [
    {
      href: "/admin/dashboard",
      title: "Dashboards",
      icon: <BsGraphUpArrow size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    {
      href: "/admin/get-orders",
      title: "All Orders",
      icon: <FaShoppingCart size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin", "Sales person"],
    },
    // ✅ NEW: POS System (feature-flagged, modal-based)
    ...(process.env.NEXT_PUBLIC_ENABLE_POS === "true"
      ? [
        {
          href: "#",
          title: "POS",
          icon: <FaCashRegister size={24} className="text-white" />,
          roles: ["SuperAdmin", "Admin", "Sales person"],
          onClick: () => setShowPOSModal(true), // ✅ Open modal instead of navigation
        },
        {
          href: "/admin/pos-orders",
          title: "POS Orders",
          icon: <FaReceipt size={24} className="text-white" />,
          roles: ["SuperAdmin", "Admin", "Sales person"],
        },
      ]
      : []),
    // ✅ NEW: Offline Order Creation (feature-flagged)
    ...(process.env.NEXT_PUBLIC_ENABLE_ADMIN_OFFLINE_ORDERS === "true"
      ? [
        {
          href: "/admin/offline-order",
          title: "Create Offline Order",
          icon: <FaPlus size={24} className="text-white" />,
          roles: ["SuperAdmin", "Admin"],
        },
      ]
      : []),
    {
      href: "/admin/customers",
      title: "All Customers",
      icon: <LuUsers size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    {
      href: "/admin/roles",
      title: "Make Admin",
      icon: <RiAdminLine size={24} className="text-white" />,
      roles: ["SuperAdmin"],
    },
    {
      href: "/admin/categories",
      title: "Categories",
      icon: <FaList size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    {
      href: "/admin/addProduct",
      title: "Add Product",
      icon: <FaPlus size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin", "Sales person"],
    },
    {
      href: "/admin/products",
      title: "All Products",
      icon: <FaList size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin", "Sales person"],
    },
    {
      href: "/admin/inventory",
      title: "Inventory",
      icon: <FaBoxOpen size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin", "Sales person"],
    },
    {
      href: "/admin/hero-banner",
      title: "Hero Banner",
      icon: <FaImage size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    {
      href: "/admin/coupon",
      title: "Coupons",
      icon: <FaTag size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    // {
    //   href: "/admin/before-after",
    //   title: "Before-After",
    //   icon: <FaTag size={24} className="text-white" />,
    //   roles: ["SuperAdmin", "Admin"],
    // },
    {
      href: "/admin/rules",
      title: "Product Rules",
      icon: <FcRules size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    {
      href: "/admin/imageText",
      title: "Image Text",
      icon: <SiSublimetext size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    {
      href: "/admin/videomanagement",
      title: "Add Video",
      icon: <MdVideoLibrary size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    {
      href: "/admin/marquee",
      title: "Marquee Text",
      icon: <SiSublimetext size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },    // {
    //   href: "/admin/resizable",
    //   title: "Resizable",
    //   icon: <FaImage size={24} className="text-white" />,
    //   roles: ["SuperAdmin", "Admin"],
    // },
    {
      href: "/admin/instagram",
      title: "Instagram",
      icon: <FaInstagram size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
  ];

  const filteredAdminCards = useMemo(() => {
    return allAdminCards.filter((card) => card.roles.includes(user.role));
  }, [user.role]);

  return (
    <div className="flex h-screen ">
      <style jsx global>{`
        .navbar-main,
        .footer-main {
          display: none;
        }
        ,
        .header-main {
          display: none;
        }
      `}</style>
      {/* Mobile Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Hamburger Menu (Mobile Only - when closed) */}
      {!showSidebar && (
        <div className="fixed top-4 left-4 z-50 md:hidden cursor-pointer bg-white p-2 rounded-md shadow-md text-black">
          <FaHamburger onClick={() => setShowSidebar(true)} size={24} />
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gray-900 text-white w-64 overflow-y-auto transition-transform duration-300 z-50
          ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block`}
      >
        <div
          className="p-4 flex justify-between items-center cursor-pointer border-b border-gray-800"
        >
          <h2 className="text-2xl font-semibold">Admin Panel</h2>
          <FaHamburger
            size={24}
            className="md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        </div>

        <nav className="mt-4 pb-20">
          {filteredAdminCards.map((card, index) => {
            // ✅ Handle modal-based items (like POS)
            if (card.onClick) {
              return (
                <button
                  key={index}
                  onClick={() => {
                    card.onClick?.();
                    if (window.innerWidth < 768) setShowSidebar(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-l-4 hover:border-gray-400`}
                >
                  <span className="mr-3">{card.icon}</span>
                  {card.title}
                </button>
              );
            }

            // ✅ Normal link items
            return (
              <Link
                key={index}
                href={card.href}
                className={`flex items-center px-4 py-3 text-sm transition-all duration-200
                    ${pathname === card.href
                    ? "bg-gray-800 text-white border-l-4 border-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white hover:border-l-4 hover:border-gray-400"
                  } visited:text-gray-300 focus:bg-gray-800 active:bg-gray-800
                  `}
                onClick={() => {
                  // Auto-close sidebar on mobile when link clicked
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
              >
                <span className="mr-3">{card.icon}</span>
                {card.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 text-base text-white border-t border-gray-800 text-center">
          Powered by <br />
          <Link
            href="https://www.webgeon.com/"
            target="_blank"
            className="mt-2 block text-blue-400 hover:text-blue-300 font-medium"
          >
            Webgeon Results
          </Link>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />

      {/* ✅ POS Modal (Lazy Loaded) */}
      {showPOSModal && (
        <Suspense fallback={<div>Loading POS...</div>}>
          <POSModal isOpen={showPOSModal} onClose={() => setShowPOSModal(false)} />
        </Suspense>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-gray-50">
        {/* Top Header */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-30 flex justify-between items-center">
          {/* Left: Spacer for hamburger */}
          <div className="w-8 md:hidden"></div>

          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/assets/static/logo/fyncartlogo.png"
              alt="Logo"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </div>



          {/* Right: Welcome + Logout */}
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationDropdown />
            <h2 className="text-sm md:text-xl hidden md:block">
              Welcome <span className="font-bold">{user.name}</span>
            </h2>
            <Button onClick={() => setShowLogoutModal(true)} size="sm" className="bg-black text-white hover:bg-gray-800 text-xs md:text-sm">
              Logout
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
