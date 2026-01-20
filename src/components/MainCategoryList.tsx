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
    <Link href={link} className="block w-full h-full">
      <motion.div
        className="group relative block aspect-[3/4] overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-500"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.6 }}
        whileHover={{ y: -8 }}
      >
        <motion.img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>

        <div className="absolute bottom-0 left-0 w-full p-8 text-center transform transition-transform duration-500 group-hover:-translate-y-2">
          <h3 className="text-2xl md:text-3xl font-serif font-medium text-white tracking-wide mb-3 drop-shadow-md">
            {name.toUpperCase()}
          </h3>
          <span className="inline-block px-5 py-2 border border-white/60 rounded-full text-white text-xs uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 backdrop-blur-sm">
            Explore Collection
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
          // Silently fail or log, don't toast excessively
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
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-20">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-serif text-[#b48a3c] text-sm tracking-[0.3em] mb-4 block uppercase">
            Discover
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mb-6">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl mx-auto">
            Explore our curated collections of handwoven sarees and handcrafted jewellery
          </p>
        </motion.div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {categories.map((cat: any, idx: number) => (
            <CategoryCard
              key={cat._id}
              name={cat.name}
              image={cat.img}
              link={`/categories/${cat._id}`}
              index={idx}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default CategoryList;
