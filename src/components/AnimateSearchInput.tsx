"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { FaSearch } from "react-icons/fa";
import { IoMdTrendingUp } from "react-icons/io";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { getSearchSuggestion } from "@/lib/features/misc/action";
import { useRouter } from "next/navigation";
import { getAllCategories } from "@/lib/features/catogary";
import { shuffleArray } from "@/helpers/helpers";
import { IoCloseOutline } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion";

const AnimatedSearchInput = ({ setIsModalOpen, isModalOpen, showTrigger = true }) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>([]);
  const [trendingItems, setTrendingItems] = useState<any>([]);
  const [isFocused, setIsFocused] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCategories = async () => {
    try {
      const { payload } = await dispatch(getAllCategories() as any);
      if (payload.success) {
        setTrendingItems(shuffleArray(payload.categories).slice(0, 4));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [dispatch]);

  const fetchSearchSuggestions = useCallback(
    async (value) => {
      if (!value.trim()) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { payload } = await dispatch(getSearchSuggestion(value) as any);
        if (payload?.success) {
          setSearchResults(payload?.suggestion || []);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSearchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (name: string) => {
    router.push(`/products/?search=${encodeURIComponent(name)}`);
    closeModal();
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocused(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.98 },
  };

  const filteredSuggestions = (inputValue.trim()
    ? (searchResults || []).filter((x: any) => (x?.type ?? "product") === "product")
    : trendingItems
  ).map((item: any) => {
    const text = item?.name ?? "";
    const type = inputValue.trim() ? "product" : "trending";
    return {
      id: `${type}-${text}`,
      text,
      type,
      raw: item,
    };
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setInputValue("");
    setSearchResults([]);
  };

  return (
    <>
      {/* Search Trigger Button */}
      {showTrigger && (
        <div
          className="flex items-center space-x-2 cursor-pointer border rounded-lg p-2.5 hover:border-gray-400 transition-colors w-full max-w-lg py-2"
          onClick={() => setIsModalOpen(true)}
        >
          <FaSearch className="text-gray-500" />
          <span className="text-gray-500 text-sm">Search for products...</span>
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
          <div
            className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-visible animate-in slide-in-from-top duration-300"
            style={{ maxHeight: "calc(100vh - 2rem)" }}
          >
            {/* Search Header - Fixed */}
            <div className="sticky top-0 bg-white z-50 py-3 px-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(`/products/?search=${encodeURIComponent(inputValue)}`);
                  closeModal();
                }}
                className="relative"
              >
                <Input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Search for products..."
                  className="w-full bg-transparent border-0 shadow-none focus-visible:ring-0 text-stone-800 placeholder-stone-400 text-lg font-medium pl-10 pr-4 py-6 h-auto"
                  autoFocus
                />
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <IoCloseOutline size={24} color="black" />
                </button>
              </form>
            </div>

            {/* Results Container - Scrollable */}
            <div className="overflow-y-auto relative z-0 p-4" style={{ maxHeight: "calc(100vh - 8rem)" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={inputValue.trim() ? "suggestions" : "trending"}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white rounded-3xl overflow-hidden p-2"
                >
                  <div className="px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    {inputValue.trim() ? "Suggestions" : "Recent & Trending"}
                  </div>

                  <ul className="space-y-1">
                    {isLoading ? (
                      <li className="px-4 py-6 text-center text-stone-400">Loading...</li>
                    ) : inputValue.trim() ? (
                      filteredSuggestions.map((item: any) => (
                        <motion.li
                          key={item.id}
                          layout
                          whileHover={{
                            scale: 1.02,
                            backgroundColor: "rgba(0,0,0,0.03)",
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{ scale: 0.98 }}
                          className="group flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer text-stone-700"
                          onClick={() => {
                            if (item.text) handleSuggestionClick(item.text);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-stone-100 text-stone-500">
                              <FaSearch className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{item.text}</span>
                          </div>
                          <span className="text-stone-400 text-sm">→</span>
                        </motion.li>
                      ))
                    ) : (
                      trendingItems.map((item: any) => (
                        <motion.li
                          key={item._id}
                          layout
                          whileHover={{
                            scale: 1.02,
                            backgroundColor: "rgba(0,0,0,0.03)",
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{ scale: 0.98 }}
                          className="group flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer text-stone-700"
                          onClick={() => {
                            router.push(`/categories/${item._id}`);
                            closeModal();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-50 text-blue-500">
                              <IoMdTrendingUp className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-stone-400 text-sm">→</span>
                        </motion.li>
                      ))
                    )}

                    {!isLoading && inputValue.trim() && filteredSuggestions.length === 0 && (
                      <li className="px-4 py-8 text-center text-stone-400">No results found</li>
                    )}

                    {!isLoading && !inputValue.trim() && (!trendingItems || trendingItems.length === 0) && (
                      <li className="px-4 py-8 text-center text-stone-400">No trending items</li>
                    )}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnimatedSearchInput;
