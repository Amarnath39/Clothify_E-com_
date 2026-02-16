"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSearchInput from "@/components/AnimateSearchInput";

// Redux Actions
import { getAllCategories } from "@/lib/features/catogary";
import { logoutApi } from "@/lib/features/auth";
import toast from "react-hot-toast";

// Types
interface SubCategory {
  name: string;
  image: string;
  link: string;
}

interface NavItem {
  id?: string;
  name: string;
  path: string;
  hasDropdown?: boolean;
  subCategories?: SubCategory[];
}

const Navbar = () => {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const pathname = usePathname();

  const springTransition = {
    type: "spring",
    stiffness: 400,
    damping: 30,
  } as const;

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: { duration: 0.2 },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: springTransition,
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: { duration: 0.15 },
    },
  } as const;

  // Redux State
  const categories = useSelector((state: any) => state.auth.categories || []);
  const cartItems = useSelector((state: any) => state.cart?.items || []);
  const wishlistItems = useSelector((state: any) => state.wishlist?.items || []);
  const token = useSelector((state: any) => state.auth.token);
  const user = useSelector((state: any) => state.auth.user);

  // Local State
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);


  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { payload } = await dispatch(getAllCategories());
        if (payload?.success) {
          setLocalCategories(payload.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCats();
  }, [dispatch]);

  // Scroll Handler
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Close user menu on route change
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);


  // Logout Handler
  const handleLogout = async () => {
    const { payload }: any = await dispatch(logoutApi());
    if (payload?.success) {
      toast.success("Logout Success");
      router.push("/");
    } else {
      toast.error(payload?.msg || "Logout failed");
    }
  };

  // Construct Dynamic Navigation
  const navItems: NavItem[] = useMemo(() => {
    // 1. Filter Roots (no parent)
    const roots = localCategories.filter((c: any) => c.parentCategory.length === 0);

    // 2. Map to NavItem structure
    const dynamicItems = roots.map((root: any) => {
      // Find children
      const children = localCategories.filter((c: any) => {
        let parentIds: string[] = [];

        if (Array.isArray(c.parentCategory)) {
          parentIds = c.parentCategory.map((p: any) =>
            typeof p === 'object' && p !== null ? p._id : p
          );
        } else if (c.parentCategory) {
          // Single item (string or object)
          const p = c.parentCategory;
          parentIds = [typeof p === 'object' && p !== null ? p._id : p];
        }

        return parentIds.includes(root._id);
      });

      const subItems: SubCategory[] = children.map((child: any) => ({
        name: child.name,
        image: child.img,
        link: `/categories/${child._id}`
      }));

      return {
        id: root._id,
        name: root.name,
        path: `/categories/${root._id}`,
        hasDropdown: subItems.length > 0,
        subCategories: subItems
      };
    });

    // 3. Prepend static items
    return [
      { name: "Home", path: "/" },
      //{ name: "Collections", path: "/categories" },
      { name: "AboutUs", path: "/about" },

      ...dynamicItems,
    ];
  }, [localCategories]);

  // Search Handler
  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     console.log("Searching for:", searchQuery);
  //   }
  // };
  // Update the import at the top of the file

  // Inside the Navbar component, update the handleSearch function:
  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     // Encode the search query and redirect to the products page
  //     const encodedQuery = encodeURIComponent(searchQuery.trim());
  //     router.push(`/products?search=${encodedQuery}`);
  //     setIsSearchOpen(false);
  //     setSearchQuery("");
  //   }
  // };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Capsule Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-gray-100 px-6 h-16 flex items-center justify-between relative z-50">

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-800 hover:text-[#b48a3c] transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <img
                src="/assets/static/logo/saw.svg"
                alt="Swaarasya"
                className="h-10 w-auto object-contain"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.path || activeDropdown === item.name;
              return (
                <div
                  key={item.name}
                  className="relative group h-full py-4"
                  onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.name)}
                >
                  <Link
                    href={item.path}
                    className={`text-sm uppercase tracking-[0.1em] font-medium transition-colors ${isActive
                      ? "text-[#b48a3c]"
                      : "text-gray-700 hover:text-[#b48a3c]"
                      }`}
                  >
                    {item.name}
                  </Link>
                  {isActive && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1 h-1 rounded-full bg-[#b48a3c]"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">

            {/* Search Toggle */}
            {/* <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-40 md:w-64' : 'w-auto'}`}>
              {!isSearchOpen && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-700 hover:text-[#b48a3c] transition-colors hidden md:block"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}

              <AnimatePresence>
                {isSearchOpen && (
                  <motion.form
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "100%" }}
                    exit={{ opacity: 0, width: 0 }}
                    onSubmit={handleSearch}
                    className="flex items-center"
                  >
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-transparent border-b border-gray-300 focus:border-[#b48a3c] outline-none text-sm w-full py-1 text-gray-800 mr-2"
                      autoFocus
                      onBlur={() => !searchQuery && setIsSearchOpen(false)}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="text-[#b48a3c]">
                      <Search className="h-4 w-4" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div> */}

            {/* Search (icon only) */}
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="text-gray-700 hover:text-[#b48a3c] transition-colors"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>



            {/* Wishlist */}
            <Link href="/wishlist" className="text-gray-700 hover:text-[#b48a3c] transition-colors ">
              {wishlistItems.length === 0 ? <Heart className="h-5 w-5" /> : <Heart className="h-5 w-5 fill-[#b48a3c] text-[#b48a3c]" />}
            </Link>

            {/* User */}
            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  if (!token) {
                    router.push("/login");
                    return;
                  }
                  setIsUserMenuOpen((prev) => !prev);
                }}
                className="text-gray-700 hover:text-[#b48a3c] transition-colors"
              >
                <User className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && token && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#b48a3c]"
                    >
                      Profile
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#b48a3c]"
                    >
                      Orders
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Cart */}
            {/*<Link
              href="/cart"
              className="text-gray-700 hover:text-[#b48a3c] transition-colors relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#b48a3c] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium shadow-sm">
                  {cartItems.length}
                </span>
              )}
            </Link>*/}
            {/* Cart – Desktop only */}
<Link
  href="/cart"
  className="hidden md:block text-gray-700 hover:text-[#b48a3c] transition-colors relative"
>
  <ShoppingBag className="h-5 w-5" />
  {cartItems.length > 0 && (
    <span className="absolute -top-2 -right-2 bg-[#b48a3c] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium shadow-sm">
      {cartItems.length}
    </span>
  )}
</Link>


          </div>
        </div>

        <AnimatedSearchInput
          isModalOpen={isSearchModalOpen}
          setIsModalOpen={setIsSearchModalOpen}
          showTrigger={false}
        />

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-20 left-4 right-4 bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-40 p-8"
              onMouseEnter={() => setActiveDropdown(activeDropdown)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {(() => {
                const activeItem = navItems.find((i) => i.name === activeDropdown);
                if (!activeItem?.subCategories?.length) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <span className="font-serif italic text-lg">Explore our collection</span>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {activeItem.subCategories.map((sub, idx) => (
                      <motion.div
                        key={sub.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link href={sub.link} className="group block text-center" onClick={() => setActiveDropdown(null)}>
                          <div className="overflow-hidden mb-3 aspect-[3/4] bg-gray-50 relative rounded-xl shadow-sm mx-auto">
                            <img
                              src={sub.image || "/assets/static/placeholder.png"}
                              alt={sub.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                          </div>
                          <h4 className="font-serif text-sm font-medium text-gray-900 group-hover:text-[#b48a3c] transition-colors mb-1">
                            {sub.name}
                          </h4>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-[#b48a3c] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            Shop Now
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Overlay - Full Screen */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col md:hidden"
          >
            {/* Header in Mobile Menu */}
            <div className="p-4 flex justify-between items-center border-b border-gray-50">
              <img
                src="/assets/static/logo/saw.svg"
                alt="Swaarasya"
                className="h-8 w-auto"
              />
              <button onClick={() => setIsMobileMenuOpen(false)} className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-6 w-6 text-gray-800" />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-8 flex flex-col gap-4 sm:gap-5 items-center text-center max-h-[calc(100vh-80px)]">
              {navItems.map((item) => (
                <motion.div
                  key={item.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-full"
                >
                  <Link
                    href={item.path}
                    className="text-2xl font-serif text-gray-900 hover:text-[#b48a3c] transition-colors block"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {/* Optional Subcategories in Mobile - Simple List */}
                  {item.hasDropdown && (
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      {item.subCategories?.slice(0, 4).map(sub => (
                        <Link
                          key={sub.name}
                          href={sub.link}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-xs uppercase tracking-widest text-gray-500 border border-gray-200 px-3 py-1 rounded-full hover:border-[#b48a3c] hover:text-[#b48a3c] transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}

                </motion.div>
              ))}

              <div className="w-16 h-[1px] bg-gray-200 my-4"></div>

              {/* Account / Action Links Mobile */}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                {token ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 text-gray-800 text-sm font-medium hover:text-[#b48a3c]"
                    >
                      <User size={18} /> My Account
                    </Link>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full border border-red-500 text-red-600 py-3 rounded-full text-sm font-semibold uppercase tracking-widest hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full bg-black text-white py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#b48a3c] transition-colors"
                  >
                    Login / Sign Up
                  </Link>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
};

export default Navbar;