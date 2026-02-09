"use client";

import { getImageTextData } from "@/lib/features/misc";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Optional if we stick to Link styled as button

const Featured = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<any>([]);
  const router = useRouter();
  const dispatch = useDispatch<any>();

  // --- Fetch Data ---
  useEffect(() => {
    const callGetImageTextApi = async () => {
      try {
        const { payload } = await dispatch(getImageTextData());
        if (payload.success) {
          const data = payload.itemDataList.map((item: any) => ({
            id: item._id,
            src: item.img[0], // Use first image
            src2: item.img[1] || item.img[0], // Fallback to src1 if src2 missing
            title: item.title,
            description: item.description,
            url: item.url,
          }));
          setImages(data);
        } else {
          // toast.error(payload.msg); // Suppress error on init if empty for cleaner UI
          console.error(payload.msg);
        }
      } catch (error) {
        console.log(error);
      }
    };
    callGetImageTextApi();
  }, [dispatch]);

  // --- Navigation Handlers ---
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (images.length === 0) return null; // Don't render empty section

  const currentItem = images[currentIndex];

  return (
    <section className="py-24 container mx-auto px-4 md:px-8 border-t border-[#b48a3c]/20">
      <AnimatePresence mode="wait">
        <div key={currentItem.id} className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative group cursor-pointer" // Added group class for hover
            onClick={() => router.push(currentItem.url || "/about")}
          >
            <div className="overflow-hidden rounded-lg shadow-2xl h-[400px] md:h-[600px] relative">
              {/* Primary Image */}
              <motion.img
                key={`img1-${currentItem.src}`}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1 }}
                src={currentItem.src}
                alt={currentItem.title}
                className={`w-full h-full object-cover transition-opacity duration-700 ${currentItem.src !== currentItem.src2 ? "group-hover:opacity-0" : ""}`}
              />

              {/* Secondary Image (Absolute Overlay) */}
              {currentItem.src !== currentItem.src2 && (
                <img
                  src={currentItem.src2}
                  alt={currentItem.title + " view 2"}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-100"
                />
              )}
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="p-3 bg-white/90 hover:bg-[#b48a3c] hover:text-white transition-colors rounded-full shadow-lg"
                  aria-label="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="p-3 bg-white/90 hover:bg-[#b48a3c] hover:text-white transition-colors rounded-full shadow-lg"
                  aria-label="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </motion.div>

          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="md:pl-12"
          >
            <span className="font-serif text-[#b48a3c] text-sm tracking-widest mb-4 block uppercase">
              The Craft
            </span>

            <motion.h2
              key={currentItem.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl text-gray-900 mb-8 leading-tight"
            >
              {currentItem.title}
            </motion.h2>

            <motion.p
              key={currentItem.description}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-600 text-lg font-light mb-10 leading-relaxed"
            >
              {currentItem.description}
            </motion.p>

            <Link
              href="/products"
              className="inline-flex items-center text-[#b48a3c] uppercase tracking-widest text-sm font-medium hover:opacity-70 transition-opacity"
            >
              Explore Collection <ArrowRight size={16} className="ml-2" />
            </Link>

            {/* Slide Indicators */}
            <div className="flex gap-2 mt-12">
              {images.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1 transition-all duration-300 ${idx === currentIndex ? 'w-12 bg-[#b48a3c]' : 'w-4 bg-gray-300'}`}
                />
              ))}
            </div>

          </motion.div>

        </div>
      </AnimatePresence>
    </section>
  );
};

export default Featured;