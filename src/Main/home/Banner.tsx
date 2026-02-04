// update banner and marque content
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { getAllBanner } from "@/lib/features/banner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import "../../hooks/style.css";
import { getAllCategories } from "@/lib/features/catogary";


const Banner: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const timerRef = useRef<any>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);


  // --- Fetch Data ---
  useEffect(() => {
    const callGetAllBanner = async () => {
      try {
        const { payload }: any = await dispatch(getAllBanner() as any);
        if (payload?.success) {
          // Map data to match expected structure
          const bannerData = payload.banners.map((item: any) => ({
            id: item._id,
            // Ensure any backslashes in DB are converted to forward slashes for valid URLs
            img: item.img ? item.img.replace(/\\/g, '/') : "",
            type: item.type,
            title: item.title,
            description: item.description,
            url: item.url,
          }));
          setBanners(bannerData);
        }
      } catch (error) {
        console.log(error);
      }
    };
    callGetAllBanner();
  }, [dispatch]);

  //--- Fetch Categories ---
  useEffect(() => {
    const fetchCategories = async () => {
      const { payload }: any = await dispatch(getAllCategories() as any);
      if (payload?.success) {
        setCategories(payload.categories);
      }
    };
    fetchCategories();
  }, [dispatch]);


  // --- Auto Rotation ---
  useEffect(() => {
    if (banners.length > 0) {
      startTimer();
    }
    return () => cancelAnimationFrame(timerRef.current);
  }, [banners, activeIndex]);

  const startTimer = () => {
    if (banners.length <= 1) return; // Don't rotate if only 1 banner

    // Clear existing
    if (timerRef.current) cancelAnimationFrame(timerRef.current);

    let start: number | null = null;
    const duration = 6000; // 6 seconds per slide

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;

      if (progress < duration) {
        timerRef.current = requestAnimationFrame(step);
      } else {
        handleNext();
      }
    };
    timerRef.current = requestAnimationFrame(step);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % banners.length);
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  }
  // --- Render ---
  if (banners.length === 0) {
    return (
      <section className="relative w-full h-[60vh] bg-[#FAF7F2] flex items-center justify-center">
        {/* Loading State or Skeleton could go here */}
      </section>
    );
  }
  // --- Render Empty State ---
  if (banners.length === 0) {
    return (
      <section className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-charcoal/30 to-transparent" />
        <div className="relative h-full container-custom flex items-center">
          <div className="max-w-2xl text-white space-y-4 md:space-y-6">
            <span className="inline-block px-3 py-1 bg-gold/20 backdrop-blur-sm border border-gold/30 text-gold-light text-xs tracking-[0.2em] uppercase">
              Welcome
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-tight">
              No banner available
            </h1>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[activeIndex];
  const sareeCategory = categories.find(
  (c) => c.name.toLowerCase() === "saree"
);

const jewelleryCategory = categories.find(
  (c) => c.name.toLowerCase() === "jewellery"
);

  return (
    <section className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        {currentBanner.type === "video" ? (
          <video
            src={currentBanner.img}
            className="w-full h-full object-cover object-center"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={currentBanner.img}
            alt={currentBanner.title}
            className="w-full h-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-charcoal/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container-custom flex items-center pt-16 md:pt-20">
        <div className="max-w-2xl ml-10 text-white space-y-4 md:space-y-6 animate-fade-in">
          <span className="inline-block px-3 py-1 bg-gold/20 backdrop-blur-sm border border-gold/30 text-gold-light text-xs tracking-[0.2em] uppercase">
            New Festive Collection
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-tight">
            {currentBanner.title}
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-200 font-body leading-relaxed max-w-lg">
            {currentBanner.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
  <Link
    href={sareeCategory ? `/categories/${sareeCategory._id}` : "#"}
    className="px-0 py-2"
  >
    <Button
      size="lg"
      variant="secondary"
      className="!h-12 !rounded-none !bg-[#C9A24D] text-black hover:!bg-[#b48a3c]"
    >
      Shop Sarees
    </Button>
  </Link>

  <Link
    href={jewelleryCategory ? `/categories/${jewelleryCategory._id}` : "#"}
    className="px-0 py-2"
  >
    <Button
      size="lg"
      variant="secondary"
      className="!h-12 !rounded-none text-white bg-black hover:bg-white hover:text-black transition-all duration-300"
    >
      View Jewellery
    </Button>
  </Link>
</div>

        </div>
      </div>

      {/* Navigation Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 lg:bottom-12 left-8 lg:left-12 flex space-x-3 z-30">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`transition-all duration-300 rounded-full ${activeIndex === idx
                ? "w-8 h-2 bg-gold"
                : "w-2 h-2 bg-gray-400 hover:bg-gold/70"
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Banner;
