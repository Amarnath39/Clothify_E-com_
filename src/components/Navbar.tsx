"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BsBag, BsCartPlus } from "react-icons/bs";
import { RxHamburgerMenu } from "react-icons/rx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IoBagOutline, IoCloseOutline } from "react-icons/io5";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  FaShoppingCart,
  FaUser,
  FaSearch,
  FaBars,
  FaChevronDown,
  FaChevronRight,
  FaHeart,
  FaRegHeart,
  FaInstagram,
} from "react-icons/fa";
import AnimatedSearchInput from "./AnimateSearchInput";
import { RiArrowDropDownLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getAllCategories } from "@/lib/features/catogary";
import toast from "react-hot-toast";
import Navigation from "./Navigation";
import useWindowSize from "@/hooks/useWindowSize";
import UserMenu from "./UserMenu";
import NavigationMobile from "./NavigationMobile";
import { IoMdCloseCircleOutline, IoMdSearch } from "react-icons/io";
import { logoutApi } from "@/lib/features/auth";

const Navbar = () => {
  const dispatch = useDispatch<any>();
  const [categories, setCategoroies] = useState<any>([]);
  const router = useRouter();
  const cartItems = useSelector((state: any) => state.cart.items);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDesktopSheetOpen, setIsDesktopSheetOpen] = useState<any>(false);
  const [showSearch, setShowSearch] = useState<any>(false);
  const [showSearchMobile, setShowSearchMobile] = useState<any>(false);
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const token = useSelector((state: any) => state.auth.token);
  const [topPosition, setTopPosition] = useState("top-10");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<any>(false);
  useEffect(() => {
    callGetAllCategories();
  }, []);

  const callGetAllCategories = async () => {
    try {
      const { payload } = await dispatch(getAllCategories());

      if (payload.success) {
        setCategoroies(payload.categories);
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

  const handleNavigation = (path) => {
    router.push(path);
    closeSheet();
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

          // Add a small threshold for scroll direction detection
          const scrollDelta = currentScrollY - lastScrollY;
          const isScrollingUpward = scrollDelta < -5;

          if (isScrollingUpward) {
            setIsScrollingUp(true);
          } else if (scrollDelta > 5) {
            setIsScrollingUp(false);
          }

          // Adjust position logic with immediate updates
          if (currentScrollY <= 0) {
            setTopPosition("top-10");
          } else if (currentScrollY <= 10) {
            // Add intermediate position for smoother transition
            setTopPosition(isScrollingUpward ? "top-10" : "top-0");
          } else {
            setTopPosition("top-0");
          }

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
      className={`bg-[#380e13] border-b fixed w-full navbar-main transition-all duration-10 mt-1 ${topPosition}`}
      style={{
        zIndex: isDesktopSheetOpen ? 0 : 100,
        transform: "translate3d(0,0,0)",
        willChange: "transform",
      }}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 p-4 sm:p-5">
<div className="flex items-center justify-between h-20 md:h-12">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4 text-lg tracking-wide ">
            <Sheet
              open={isDesktopSheetOpen}
              onOpenChange={setIsDesktopSheetOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blackPrimary hover:text-yellow hover:bg-yellow/5 cursor-pointer"
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
                    <Button onClick={handleLogout}>Logout</Button>
                  </div>
                )}
                <div className="flex justify-end"></div>
                <SheetHeader className="">
                  <SheetTitle className="text-navbarBackground mt-12">
                    Our Categories
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4 ">
                  <div className="overflow-y-scroll">
                    <NavigationMobile
                      categories={categories}
                      onNavigate={closeSheet}
                      setIsDesktopSheetOpen={setIsDesktopSheetOpen}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {/* Logo */}
          <div className="flex-shrink-0 md:ml-24">
            <Link
              href="/"
              className="text-2xl font-bold  flex items-center gap-2"
            >
              <img
  className="w-48 sm:w-40 md:w-56 lg:w-64 object-contain"
  src="/assets/static/logo/Udayaada Final.png"
  alt="Logo"
/>

            </Link>
          </div>

          {isModalOpen && (
            <AnimatedSearchInput
              setIsModalOpen={setIsModalOpen}
              isModalOpen={isModalOpen}
            />
          )}

          {/* Icons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center gap-2 md:ml-6">
              <div onClick={() => setIsModalOpen((prev) => !prev)}>
                <IoMdSearch
                  color=""
                  size={30}
                  className="text-blackPrimary hover:text-yellow cursor-pointer"
                />
              </div>

              <div
                title="cart"
                onClick={() => router.push("/cart")}
                className="relative"
              >
                <IoBagOutline
                  size={28}
                  className="text-blackPrimary hover:text-yellow cursor-pointer font-semibold"
                />
                {/* </Button> */}
                {cartItems.length > 0 && (
                  <span className="absolute bottom-[-6px] right-[-4px] w-5 h-5 z-[100] rounded-full text-white items-center flex justify-center bg-primaryRed text-[10px]">
                    {cartItems.length}
                  </span>
                )}
              </div>

              <UserMenu setIsSheetOpen={setIsSheetOpen} />
            </div>
          </div>

          {/* Mobile menu button */}

          <div className="md:hidden flex items-center gap-1">
            <div onClick={() => setIsModalOpen((prev) => !prev)}>
              <IoMdSearch
                color=""
                size={24}
                
                className="text-blackPrimary hover:black cursor-pointer"
              />
            </div>
            <Link href="/wishlist">
              {wishlistItems.length === 0 ? (
                <FaRegHeart className="h-5 w-5 text-blackPrimary" />
              ) : (
                <FaHeart className="h-5 w-5 text-blackPrimary " />
              )}
            </Link>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blackPrimary hover:text-blackPrimary hover:bg-yellow/20 cursor-pointer"
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
                    <Button onClick={handleLogout}>Logout</Button>
                  </div>
                )}
                <div className="flex justify-end"></div>
                <SheetHeader className="">
                  <SheetTitle className="text-navbarBackground mt-12">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4 ">
                  <div className="overflow-y-scroll">
                    <NavigationMobile
                      categories={categories}
                      onNavigate={closeSheet}
                    />
                  </div>
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
