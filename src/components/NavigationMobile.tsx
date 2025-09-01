"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const NavigationMobile = ({
  categories,
  onNavigate,
  setIsDesktopSheetOpen = () => {},
}: any) => {
  const [openCategory, setOpenCategory] = useState(null);
  const router = useRouter();

  const handleNavigation = (path) => {
    router.push(path);
    onNavigate();
  };

  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  const renderCategoryItem = (category) => {
    const hasChildren =
      category.childCategory && category.childCategory.length > 0;

    return (
      <div
        key={category._id}
        className="w-full border-b border-red-700 last:border-b-0"
        style={{ zIndex: 9999 }}
      >
        <div className="flex items-center justify-between py-4">
          <Link
            href={`/categories/${category._id}`}
            className="text-blackPrimary font-medium text-sm hover:text-black flex-grow"
            onClick={(e) => {
              handleNavigation(`/categories/${category._id}`);
              setIsDesktopSheetOpen(false);

              if (hasChildren) {
                e.stopPropagation();
              }
            }}
          >
            {category.name.toUpperCase()}
          </Link>
          {hasChildren && (
            <ChevronDown
              className={`w-5 h-5 text-blackPrimary transition-transform duration-300 ease-in-out cursor-pointer ${
                openCategory === category._id ? "transform rotate-180" : ""
              }`}
              onClick={(e) => {
                
                e.stopPropagation();
                toggleCategory(category._id);
              }}
            />
          )}
        </div>
        {hasChildren && openCategory === category._id && (
          <div className="pl-4 pb-4 space-y-3">
            {category.childCategory.map((child) => (
              <Link
                key={child._id}
                href={`/categories/${child._id}`}
                className="block text-navbarBackground text-sm hover:text-black"
                onClick={() => handleNavigation(`/categories/${child._id}`)}
              >
                {child.name.toUpperCase()}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Filter out categories that have a parent
  const topLevelCategories = categories.filter(
    (category) => category.parentCategory.length === 0
  );

  return (
    <div
      className="w-full h-[calc(100vh-240px)] overflow-y-scroll"
      style={{
        WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
        overscrollBehavior: "contain", // Prevent scroll bouncing
      }}
    >
      <div className="w-full px-4 py-2">
        {topLevelCategories.map((category) => renderCategoryItem(category))}
      </div>
    </div>
  );
};

export default NavigationMobile;
