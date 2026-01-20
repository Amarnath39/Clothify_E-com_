"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Redux State
  const categories = useSelector((state: any) => state.auth.categories || []); // Ensure fallback
  // Note: Sometimes categories are in state.category.categories or similar, checking original file...
  // Original file: const [categories, setCategories] = useState<any>([]);
  // Original file fetched manually. I will keep the fetch logic but also try to read from where they are stored if possible.
  // Actually, original code did: setCategories(payload.categories). I will replicate that local state for simplicity and safety.

  const cartItems = useSelector((state: any) => state.cart.items);
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const token = useSelector((state: any) => state.auth.token);
  const user = useSelector((state: any) => state.auth.user);

  // Local State
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      const children = localCategories.filter((c: any) => c.parentCategory.includes(root._id));

      const subItems: SubCategory[] = children.map((child: any) => ({
        name: child.name,
        image: child.img, // Assuming 'img' property exists from original file
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
      ...dynamicItems,
      // { name: "About", path: "/about" } // Optional, can add if 'About' page exists
    ];
  }, [localCategories]);

  // Search Handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Assuming a search page exists or query params logic
      // Since original didn't have a specific route shown (it used a modal), let's route to a search page
      // router.push(`/search?q=${searchQuery}`);
      // Or just toast for now if no search page implemented
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? "bg-white/95 backdrop-blur-lg shadow-lg py-3 border-b border-gray-100"
          : "bg-gradient-to-b from-white/90 to-transparent backdrop-blur-sm py-6"
        }`}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#eab564] via-[#b48a3c] to-[#eab564] opacity-80"></div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-gray-800 hover:text-[#b48a3c] transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/" className="relative z-50 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <img
                src="/assets/static/logo/saw.svg"
                alt="Logo"
                className="h-12 md:h-16 w-auto object-contain"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10">
            {navItems.map((item) => (
              <div
                key={item.name}
                className="relative group h-full py-2" // Added py-2 to give hit area
                onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.name)}
              >
                <Link
                  href={item.path}
                  className={`relative py-2 text-sm uppercase tracking-[0.15em] font-medium transition-all duration-300 ${pathname === item.path
                      ? "text-[#b48a3c]"
                      : "text-gray-700 hover:text-[#b48a3c]"
                    }`}
                >
                  {item.name}
                  {pathname === item.path && (
                    <motion.div
                      layoutId="activeUnderline"
                      className="absolute left-0 right-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#eab564] to-[#b48a3c]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              </div>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-4 md:space-x-6">

            {/* Search */}
            <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-48' : 'w-8'}`}>
              <motion.button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-gray-700 hover:text-[#b48a3c] transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Search size={22} />
              </motion.button>
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.form
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "100%" }}
                    exit={{ opacity: 0, width: 0 }}
                    onSubmit={handleSearch}
                    className="ml-2 flex-1"
                  >
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-transparent border-b border-gray-300 focus:border-[#b48a3c] outline-none text-sm w-full py-1 text-gray-800"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link href="/wishlist" className="text-gray-700 hover:text-[#b48a3c] transition-colors relative">
                {wishlistItems.length === 0 ? <Heart size={22} /> : <Heart size={22} fill="#b48a3c" className="text-[#b48a3c]" />}
              </Link>
            </motion.div>

            {/* Cart */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link href="/cart" className="text-gray-700 hover:text-[#b48a3c] transition-colors relative">
                <ShoppingBag size={22} />
                {cartItems.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-[#b48a3c] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md"
                  >
                    {cartItems.length}
                  </motion.span>
                )}
              </Link>
            </motion.div>

            {/* User */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative group/user">
              <Link href={token ? "/profile" : "/login"} className="text-gray-700 hover:text-[#b48a3c] transition-colors">
                <User size={22} />
              </Link>
              {/* Optional user dropdown could go here */}
            </motion.div>

          </div>
        </div>
      </div>

      {/* Mega Menu Dropdown */}
      <AnimatePresence>
        {activeDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-lg border-t border-gray-100 shadow-xl py-10 z-40"
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div className="container mx-auto px-8">
              {/* Note: If subcategories are empty, this might look empty. Handled safely. */}
              {(() => {
                const activeItem = navItems.find((i) => i.name === activeDropdown);
                if (!activeItem?.subCategories?.length) {
                  return <div className="text-center text-gray-500 italic">No subcategories available.</div>;
                }
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {activeItem.subCategories.map((sub, idx) => (
                      <motion.div
                        key={sub.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link href={sub.link} className="group block">
                          <div className="overflow-hidden mb-3 aspect-[3/4] bg-gray-100 relative rounded-lg">
                            <img
                              src={sub.image || "/assets/static/placeholder.png"}
                              alt={sub.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/300x400?text=No+Image";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <h4 className="font-serif text-base text-gray-900 group-hover:text-[#b48a3c] transition-colors mb-1">
                            {sub.name}
                          </h4>
                          <span className="text-xs text-gray-500 uppercase tracking-wider group-hover:text-black transition-colors">
                            Explore →
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="p-6 flex justify-between items-center border-b border-gray-100">
                <h2 className="font-serif text-xl font-bold text-[#b48a3c] tracking-widest">MENU</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-[#b48a3c]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info / Logout for Mobile */}
                {token ? (
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-900">Hello, User</span>
                    <button onClick={handleLogout} className="text-xs text-red-500 font-medium hover:underline">Logout</button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block pb-4 border-b border-gray-100 text-sm font-medium text-[#b48a3c]">Login / Register</Link>
                )}


                {navItems.map((item) => (
                  <div key={item.name}>
                    <Link
                      href={item.path}
                      className="block text-lg font-medium text-gray-900 mb-2 hover:text-[#b48a3c] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                    {item.subCategories && item.subCategories.length > 0 && (
                      <div className="pl-4 space-y-3 mt-2 border-l-2 border-gray-100 ml-1">
                        {item.subCategories.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.link}
                            className="block text-sm text-gray-600 hover:text-[#b48a3c] transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
