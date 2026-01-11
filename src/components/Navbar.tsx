"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { IoBagOutline } from "react-icons/io5";
import {
  FaBars,
  FaHeart,
  FaRegHeart,
} from "react-icons/fa";
import AnimatedSearchInput from "./AnimateSearchInput";
import { IoMdSearch } from "react-icons/io";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getAllCategories } from "@/lib/features/catogary";
import toast from "react-hot-toast";
import NavigationMobile from "./NavigationMobile";
import useWindowSize from "@/hooks/useWindowSize";
import { logoutApi } from "@/lib/features/auth";
import { LucideUserRound } from "lucide-react";

const Navbar = () => {
  const dispatch = useDispatch<any>();
  const [categories, setCategories] = useState<any>([]);
  const router = useRouter();
  const pathname = usePathname();
  const cartItems = useSelector((state: any) => state.cart.items);
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const token = useSelector((state: any) => state.auth.token);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<any>(false);

  useEffect(() => {
    callGetAllCategories();
  }, []);

  const callGetAllCategories = async () => {
    try {
      const { payload } = await dispatch(getAllCategories());
      if (payload.success) {
        setCategories(payload.categories);
      } else {
        toast.error(payload.msg);
      }
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const { width } = useWindowSize();

  const closeSheet = () => {
    setIsSheetOpen(false);
  };

  const handleLogout = async () => {
    const { payload }: any = await dispatch(logoutApi());
    if (payload.success) {
      toast.success("Logout Success");
      router.push("/");
    } else {
      toast.error(payload.msg);
    }
  };


  return (
    <nav
      // 🚀 CHANGE: Updated from 'pt-4' to 'pt-6' for increased top spacing
      className={`bg-[#ffffff] fixed w-full navbar-main transition-all duration-300 top-0 pt-5`}
      style={{
        zIndex: 100,
        transform: "translate3d(0,0,0)",
        willChange: "transform",
      }}
    >
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8">
        {/* Main header section for logo and icons */}
        <div className="flex items-center justify-between h-28 md:h-32">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <img
                src="/assets/static/logo/SIS-LOGO.png"
                alt="Logo"
                className="h-20 md:h-[100px] lg:h-[104px] w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Search Bar - Centered */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="w-full max-w-md">
              <div
                onClick={() => setIsModalOpen((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full cursor-pointer hover:border-gray-400 transition-colors"
              >
                <IoMdSearch size={24} style={{ color: "#020101" }} />
                <span className="text-gray-500 text-sm">Search...</span>
              </div>
            </div>
          </div>

          {isModalOpen && (
            <AnimatedSearchInput
              setIsModalOpen={setIsModalOpen}
              isModalOpen={isModalOpen}
            />
          )}

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/wishlist">
              {wishlistItems.length === 0 ? (
                <FaRegHeart size={28} style={{ color: "#020101" }} />
              ) : (
                <FaHeart size={28} style={{ color: "#020101" }} />
              )}
            </Link>

            <div
              title="cart"
              onClick={() => router.push("/cart")}
              className="relative cursor-pointer"
            >
              <IoBagOutline size={28} style={{ color: "#020101" }} />
              {cartItems.length > 0 && (
                <span className="absolute bottom-[-6px] right-[-4px] w-5 h-5 z-[100] rounded-full text-white flex items-center justify-center bg-primaryRed text-[10px]">
                  {cartItems.length}
                </span>
              )}
            </div>

            {/* ✅ NEW: My Orders Link */}
            <Link href="/orders" title="My Orders">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#020101"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <polyline points="9 11 9 17" />
                <polyline points="12 14 9 17 6 14" />
              </svg>
            </Link>

            <Link href={token ? "/profile" : "/login"}>
              <LucideUserRound size={30} style={{ color: "#020101" }} />
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-transparent cursor-pointer"
              style={{ color: "#020101" }}
              onClick={() => setIsSheetOpen(true)}
            >
              <FaBars size={28} />
            </Button>
          </div>

          {/* Mobile Icons */}
          <div className="md:hidden flex items-center gap-1">
            <div onClick={() => setIsModalOpen((prev) => !prev)}>
              <IoMdSearch size={24} className="cursor-pointer" style={{ color: "#020101" }} />
            </div>

            <Link href="/wishlist">
              {wishlistItems.length === 0 ? (
                <FaRegHeart className="h-5 w-5" style={{ color: "#020101" }} />
              ) : (
                <FaHeart className="h-5 w-5" style={{ color: "#020101" }} />
              )}
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-transparent cursor-pointer"
              style={{ color: "#020101" }}
              onClick={() => setIsSheetOpen(true)}
            >
              <FaBars className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent
            side="right"
            className="w-[300px] sm:w-[400px] bg-white text-black"
            style={{ zIndex: 9999 }}
          >
            {token && (
              <div>
                <Button onClick={handleLogout} style={{ color: "#255255255", backgroundColor: "black" }}>
                  Logout
                </Button>
              </div>
            )}
            <SheetHeader>
              <SheetTitle className="text-navbarBackground mt-12">Menu</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4 overflow-y-scroll">
              <NavigationMobile categories={categories} onNavigate={closeSheet} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Category Navigation Bar - Below search */}
      </div> {/* This closes the max-w-7xl div from above */}

      {/* Category Navigation Bar - Below search (full width line) */}
      <div className="hidden md:block border-t border-gray-200">
        <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8 flex items-center justify-center gap-x-8 py-3">
          {categories
            .filter((c: any) => c.parentCategory.length === 0)
            .map((category: any) => {
              const isActive = pathname.includes(category._id);
              return (
                <Link
                  key={category._id}
                  href={`/categories/${category._id}`}
                  className={`text-sm tracking-wide uppercase transition-all duration-200 relative
                  ${isActive
                      ? "text-black font-bold border-b-2 border-black pb-1"
                      : "text-gray-600 font-medium hover:text-black hover:font-semibold"
                    }`}
                >
                  {category.name}
                </Link>
              );
            })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
