"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
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

function AdminLayout({ children }) {
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(true);
  const dispatch = useDispatch<any>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
      href: "/admin/hero-banner",
      title: "Hero Banner",
      icon: <FaImage size={24} className="text-white" />,
      roles: ["SuperAdmin", "Admin"],
    },
    {
      href: "/admin/coupan",
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
    // {
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
      {!showSidebar && (
        <div className="absolute top-4 left-[200px] cursor-pointer">
          <FaHamburger onClick={() => setShowSidebar(true)} size={24} />
        </div>
      )}
      {showSidebar && (
        <aside className="w-64 bg-secondaryRed text-white fixed left-0 h-screen overflow-y-scroll">
          <div
            onClick={() => setShowSidebar(false)}
            className="p-4 flex justify-between cursor-pointer"
          >
            <h2 className="text-2xl font-semibold">Admin Panel</h2>
            <FaHamburger size={24} />
          </div>
          <nav className="mt-4">
            {filteredAdminCards.map((card, index) => (
              <Link
                key={index}
                href={card.href}
                className={`flex items-center px-4 py-3 text-sm ${
                  pathname === card.href
                    ? "bg-black text-white"
                    : "text-gray-300 hover:bg-black"
                }`}
              >
                <span className="mr-3">{card.icon}</span>
                {card.title}
              </Link>
            ))}
          </nav>
        </aside>
      )}

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />
      <main
        className={`flex-1 transition-all ease-in-out duration-300 p-8 ${
          showSidebar ? "pl-[300px]" : "pl-8"
        }`}
      >
        <div className="flex justify-end items-center gap-6">
          <h2 className="text-xl ">
            Welcome{" "}
            <span className="font-bold cursor-pointer">{user.name}</span>
          </h2>
          <Button onClick={() => setShowLogoutModal(true)}>Logout</Button>
        </div>
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
