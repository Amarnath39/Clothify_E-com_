import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { FaChevronRight } from "react-icons/fa";

const Navigation = ({ categories }) => {
  const [activeCategory, setActiveCategory] = useState<any>(null);

  const handleCategoryHover = useCallback((category) => {
    if (category.parentCategory.length === 0) {
      setActiveCategory(category);
    }
  }, []);

  const renderCategoryItem = (category, isChild = false) => {
    return (
      <NavigationMenuItem
        key={category._id}
        className="w-full list-none "
        onMouseEnter={() => handleCategoryHover(category)}
      >
        <Link href={`/categories/${category._id}`} passHref>
          <NavigationMenuLink className="flex items-center justify-between w-full p-1 rounded-md transition-all duration-200 text-black hover:text-navbarHover">
            <span className="text-black text-sm hover:text-navbarHover font-semibold">
              {category?.name?.toUpperCase()}
            </span>
            {!isChild &&
              category.childCategory &&
              category.childCategory.length > 0 && (
                <FaChevronRight className="w-4 h-4 hover:text-navbarHover" />
              )}
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    );
  };

  const renderCategoryColumn = (categories) => {
    return (
      <div className="w-[250px] space-y-1 ">
        {categories.map((category) => renderCategoryItem(category))}
      </div>
    );
  };

  const renderChildCategoryColumn = (childCategories) => {
    return (
      <div className="w-[250px] space-y-1 border-l border-red-600/30 pl-4 animate-fadeIn">
        {childCategories.map((category) => renderCategoryItem(category, true))}
      </div>
    );
  };

  // Filter out categories that have a parent
  const topLevelCategories = categories.filter(
    (category) => category.parentCategory.length === 0
  );

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-navbarText text-md   transition-all duration-300 rounded-md  py-2  hover:text-navbarHover px-0 bg-backgroundPrimary">
            CATEGORIES
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="p-4 bg-gradient-to-br  rounded-lg shadow-xl border border-black max-w-screen-lg max-h-[500px] overflow-auto ">
              <div className="flex space-x-4">
                {renderCategoryColumn(topLevelCategories)}
                {activeCategory &&
                  activeCategory.childCategory &&
                  activeCategory.childCategory.length > 0 &&
                  renderChildCategoryColumn(activeCategory.childCategory)}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default Navigation;
