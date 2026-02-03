"use client";
import React, { useState, useEffect, useCallback } from "react";
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

const AnimatedSearchInput = ({ setIsModalOpen, isModalOpen }) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>([]);
  const [trendingItems, setTrendingItems] = useState<any>([]);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  useEffect(() => {
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

    fetchCategories();
  }, [dispatch]);

  const fetchSearchSuggestions = useCallback(
    async (value) => {
      if (!value.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsLoading(true);
        const { payload } = await dispatch(getSearchSuggestion(value) as any);
        if (payload.success) {
          setSearchResults(payload.suggestion);
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    fetchSearchSuggestions(value);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setInputValue("");
    setSearchResults([]);
  };

  return (
    <>
      {/* Search Trigger Button */}
      <div
        className="flex items-center space-x-2 cursor-pointer border rounded-lg p-2.5 hover:border-gray-400 transition-colors w-full max-w-lg py-2"
        onClick={() => setIsModalOpen(true)}
      >
        <FaSearch className="text-gray-500" />
        <span className="text-gray-500 text-sm">Search for products...</span>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-none z-50 flex items-start justify-center p-4">
          <div
            className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top duration-300"
            style={{ maxHeight: "calc(100vh - 2rem)" }}
          >
            {/* Search Header - Fixed */}
            <div className="sticky top-0 bg-white border-b z-10 py-3 px-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(`/products/?search=${inputValue}`);
                  closeModal();
                }}
                className="relative"
              >
                <Input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Search for products..."
                  className="w-full text-base border-0 focus:ring-0 py-4 pl-12 pr-12"
                  autoFocus
                />
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <IoCloseOutline size={24} color="black"/>
                </button>
              </form>
            </div>

            {/* Results Container - Scrollable */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 8rem)" }}
            >
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : inputValue.trim() ? (
                // Search Results
                searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((item) => (
                      <div
                        key={item.name}
                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
                        onClick={() => {
                          router.push(`/products/?search=${item.name}`);
                          closeModal();
                        }}
                      >
                        <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-gray-500 text-center">
                    No results found
                  </div>
                )
              ) : (
                // Trending Searches
                <div className="py-2">
                  <h3 className="px-4 py-2 text-sm font-medium text-gray-500">
                    Trending Searches
                  </h3>
                  {trendingItems.map((item) => (
                    <div
                      key={item._id}
                      className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
                      onClick={() => {
                        router.push(`/categories/${item._id}`);
                        closeModal();
                      }}
                    >
                      <IoMdTrendingUp className="text-blue-500 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnimatedSearchInput;
