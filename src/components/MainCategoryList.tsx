"use client";

import { getAllCategories } from "@/lib/features/catogary";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { motion } from "framer-motion";

// --- Components ---

interface CategoryCardProps {
  name: string;
  image: string;
  link: string;
  index?: number;
}

export function CategoryCard({
  name,
  image,
  link,
  index = 0
}: CategoryCardProps) {
  return (
    <Link href={link} className="group relative flex flex-col items-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="w-full"
      >
        {/* Circular Image Container with Background */}
        <div className="relative w-full aspect-square mb-6 bg-gradient-to-br from-[#800020]/90 to-[#800020] rounded-3xl overflow-hidden p-4 md:p-6 shadow-lg group-hover:shadow-2xl transition-all duration-500">
          <div className="w-full h-full rounded-full overflow-hidden border-4 md:border-8 border-white/90 shadow-inner transform transition-transform duration-700 group-hover:scale-105">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Category Info */}
        <div className="text-center space-y-2">
          <h3 className="text-lg md:text-xl font-serif font-medium text-gray-900 group-hover:text-[#800020] transition-colors uppercase tracking-wide">
            {name}
          </h3>
          <span className="inline-block text-xs text-gray-500 uppercase tracking-widest border-b border-transparent group-hover:border-[#800020] transition-all">
            View Collection
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

// --- Main Component ---

const CategoryList = () => {
  const dispatch = useDispatch<any>();
  const [categories, setCategories] = useState<any>([]);

  useEffect(() => {
    const callGetAllCategories = async () => {
      try {
        const { payload } = await dispatch(getAllCategories());
        if (payload?.success) {
          const parentCategories = payload.categories.filter(
            (category: any) => category.parentCategory.length === 0
          );
          setCategories(parentCategories);
        } else {
          console.error(payload.msg);
        }
      } catch (error: any) {
        toast.error(error?.message);
      }
    };
    callGetAllCategories();
  }, [dispatch]);

  if (categories.length === 0) return null;

  return (
    <section className="py-20 md:py-24 bg-[#FAFAFA]">
      <div className="container mx-auto px-4 md:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
            Shop by Categories
          </h2>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto font-light">
            Discover our curated collection of handcrafted wonders
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {categories.slice(0, 4).map((cat: any, idx: number) => (
            <CategoryCard
              key={cat._id}
              name={cat.name}
              image={cat.img}
              link={`/categories/${cat._id}`}
              index={idx}
            />
          ))}
        </div>

        {/* If more than 4 categories, maybe a view all button or just list all rows? 
            Snippet implied specific grid, sticking to 4 or wrapping nicely. 
            If many categories, grid-cols-2 md:grid-cols-4 works great for wrapping too.
         */}
        {categories.length > 4 && (
          <div className="mt-12 text-center">
            <Link href="/products" className="inline-block border-b border-gray-900 pb-1 text-sm uppercase tracking-widest hover:text-[#b48a3c] hover:border-[#b48a3c] transition-colors">
              View All Categories
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryList;
