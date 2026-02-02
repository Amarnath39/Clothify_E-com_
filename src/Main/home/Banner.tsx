"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getAllBanner } from "@/lib/features/banner";
import { AppDispatch } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import "../../hooks/style.css";

// --- Marquee Strip ---
const MarqueeStrip = () => {
  const [marqueeText, setMarqueeText] = useState("Free Shipping all over India | Ships in 24 hours | ✨ New Arrivals Every Week");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetch('/api/scrolltext')
      .then(res => res.json())
      .then(data => {
        setMarqueeText(data.text);
        setIsVisible(data.isVisible);
      })
      .catch(() => {});
  }, []);

  const repeatedText = `${marqueeText} - ${marqueeText} - ${marqueeText}`;

  if (!isVisible) return null;

  return (
    <div className="w-full bg-black text-white overflow-hidden py-2 text-center text-sm sm:text-base font-medium z-20 relative mt-20 md:mt-2">
      <div className="flex w-fit animate-marquee">
        <span className="whitespace-nowrap px-4 tracking-wider">{repeatedText}</span>
      </div>
    </div>
  );
};

const Banner = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const timerRef = useRef<any>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // --- Fetch Data ---
  useEffect(() => {
    const callGetAllBanner = async () => {
      try {
        const { payload }: any = await dispatch(getAllBanner() as any);
        if (payload?.success) {
          // Map data to match expected structure
          const bannerData = payload.banners.map((item: any) => ({
            id: item._id,
            src: item.img,
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
      <>
        <MarqueeStrip />
        <section className="relative w-full h-[60vh] bg-[#FAF7F2] flex items-center justify-center">
          {/* Loading State or Skeleton could go here */}
        </section>
      </>
    );
  }

  const currentBanner = banners[activeIndex];

  return (
    <>
      <MarqueeStrip />
      <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-[#FAF7F2] pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-8 h-full relative z-10">
          <AnimatePresence mode="wait">
            <div key={currentBanner.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center h-full">

              {/* Text Content - Left Side */}
              <motion.div
                className="lg:col-span-5 relative z-10 order-2 lg:order-1"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.6 }}
              >
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="block font-serif text-[#b48a3c] text-sm tracking-[0.2em] mb-4 lg:mb-6 uppercase"
                >
                  Heritage Collection
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] text-gray-900 mb-6 lg:mb-8"
                >
                  {currentBanner.title?.split(" ").map((word: string, i: number) => {
                    // Simple logic to italicize/color every 2nd word or just render as is. 
                    // For now, let's just render the title naturally but big.
                    // If title contains "Stories", valid.
                    return <span key={i}>{word} </span>
                  })}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-gray-600 text-base md:text-lg max-w-md mb-8 lg:mb-10 font-light leading-relaxed"
                >
                  {currentBanner.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <Link
                    href={currentBanner.url || "/sarees"}
                    className="group flex items-center gap-3 text-[#b48a3c] font-medium tracking-widest uppercase text-sm hover:opacity-80 transition-opacity"
                  >
                    Explore Collection
                    <span className="w-8 h-[1px] bg-[#b48a3c] group-hover:w-12 transition-all duration-300"></span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Image/Video Content - Right Side */}
              <motion.div
                className="lg:col-span-7 relative h-[50vh] lg:h-[75vh] w-full order-1 lg:order-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8 }}
              >
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-[#C9A24D]/10 -translate-x-4 translate-y-4 z-0 rounded-tl-[100px] rounded-br-[100px]"></div>

                  <div className="relative z-10 w-full h-full overflow-hidden rounded-tl-[100px] rounded-br-[100px] shadow-2xl">
                    {currentBanner.type === "video" ? (
                      <video
                        src={currentBanner.src}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={currentBanner.src}
                        alt={currentBanner.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Floating Caption Decoration */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="absolute bottom-8 -left-8 z-20 bg-white p-6 shadow-xl max-w-xs hidden lg:block rounded-r-lg border-l-4 border-[#b48a3c]"
                  >
                    <p className="font-serif text-xl text-[#b48a3c] italic mb-2">
                      "Elegance is the only beauty that never fades."
                    </p>
                  </motion.div>

                </div>
              </motion.div>

            </div>
          </AnimatePresence>

          {/* Navigation Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-8 lg:bottom-12 left-8 lg:left-12 flex space-x-3 z-30">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`transition-all duration-300 rounded-full ${activeIndex === idx
                      ? "w-8 h-2 bg-[#b48a3c]"
                      : "w-2 h-2 bg-gray-300 hover:bg-[#b48a3c]/50"
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Banner;
