"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RxHamburgerMenu } from "react-icons/rx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IoBagOutline } from "react-icons/io5";
import {
  FaBars,
  FaHeart,
  FaRegHeart,
} from "react-icons/fa";
import AnimatedSearchInput from "./AnimateSearchInput";
import { IoMdSearch } from "react-icons/io";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getAllCategories } from "@/lib/features/catogary";
import toast from "react-hot-toast";
import NavigationMobile from "./NavigationMobile";
import UserMenu from "./UserMenu";
import useWindowSize from "@/hooks/useWindowSize";
import { logoutApi } from "@/lib/features/auth";

const Navbar = () => {
  const dispatch = useDispatch<any>();
  const [categories, setCategories] = useState<any>([]);
  const router = useRouter();
  const cartItems = useSelector((state: any) => state.cart.items);
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const token = useSelector((state: any) => state.auth.token);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDesktopSheetOpen, setIsDesktopSheetOpen] = useState<any>(false);
  const [isModalOpen, setIsModalOpen] = useState<any>(false);
  const [topPosition, setTopPosition] = useState("top-10");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

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
    } catch (error) {
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

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollY;
          const isScrollingUpward = scrollDelta < -5;

          if (isScrollingUpward) setIsScrollingUp(true);
          else if (scrollDelta > 5) setIsScrollingUp(false);

          setTopPosition(
            currentScrollY <= 0 ? "top-10" : currentScrollY <= 10 ? (isScrollingUpward ? "top-10" : "top-0") : "top-0"
          );

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isScrollingUp]);

  return (
    <nav
      className={`bg-[#ffffff] fixed w-full navbar-main transition-all duration-10 mt-1 ${topPosition}`}
      style={{
        zIndex: isDesktopSheetOpen ? 0 : 100,
        transform: "translate3d(0,0,0)",
        willChange: "transform",
      }}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 p-4 sm:p-5">
<div className="flex items-center justify-between h-14 md:h-16">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4 text-lg tracking-wide">
            <Sheet
              open={isDesktopSheetOpen}
              onOpenChange={setIsDesktopSheetOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent cursor-pointer"
                  style={{ color: "#020101" }}
                >
                  <RxHamburgerMenu size={30} />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-[300px] sm:w-[400px] bg-white text-black"
                style={{ zIndex: 9999 }}
              >
                {token && (
                  <div>
                    <Button onClick={handleLogout} style={{ color: "#020101" }}>
                      Logout
                    </Button>
                  </div>
                )}
                <SheetHeader>
                  <SheetTitle className="text-navbarBackground mt-12">
                    Our Categories
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4 overflow-y-scroll">
                  <NavigationMobile
                    categories={categories}
                    onNavigate={closeSheet}
                    setIsDesktopSheetOpen={setIsDesktopSheetOpen}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          {/* <div className="flex-shrink-0 md:ml-24">
            <Link href="/" className="text-2xl font-bold flex items-center gap-2">
              <img
                className="w-48 sm:w-40 md:w-56 lg:w-64 object-contain"
                // src="/assets/static/logo/Udayaada Final.png"
                src="/assets/static/logo/new.jpeg"
                alt="Logo"
              />
            </Link>
          </div> */}
            <div className="flex-shrink-0 md:ml-24 flex items-center">
    <Link href="/" className="flex items-center">
      <img
  src="/assets/static/logo/SIS-LOGO.png"
  alt="Logo"
  className="h-20 md:h-[100px] lg:h-[104px] w-auto object-contain"
/>

    </Link>
  </div>


          {isModalOpen && (
            <AnimatedSearchInput
              setIsModalOpen={setIsModalOpen}
              isModalOpen={isModalOpen}
            />
          )}

          {/* Desktop Icons */}
          <div className="hidden md:flex ml-4 items-center gap-2 md:ml-6">
            <div onClick={() => setIsModalOpen((prev) => !prev)}>
              <IoMdSearch size={30} className="cursor-pointer" style={{ color: "#020101" }} />
            </div>

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

            <UserMenu setIsSheetOpen={setIsSheetOpen}  />
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

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent cursor-pointer"
                  style={{ color: "#020101" }}
                >
                  <FaBars className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] bg-white text-black"
                style={{ zIndex: 9999 }}
              >
                {token && (
                  <div>
                    <Button onClick={handleLogout} style={{ color: "#020101" }}>
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
