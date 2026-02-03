// update banner and marque content
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      .catch(() => { });
  }, []);

  const repeatedText = `${marqueeText} - ${marqueeText} - ${marqueeText}`;

  if (!isVisible) return null;

  return (
  <div className="w-full bg-black text-white overflow-hidden py-2 text-center text-sm sm:text-base font-medium z-20 relative">
    <div className="flex w-fit animate-marquee">
      <span className="whitespace-nowrap px-4 tracking-wider">{repeatedText}</span>
    </div>
  </div>
);

};

const Banner: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<any>(null);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/banner');
        const data = await response.json();
        if (data.success && data.banners) {
          setBanners(data.banners);
        }
      } catch (error) {
        console.log("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // --- Auto Rotation ---
  useEffect(() => {
    if (banners.length > 0) {
      startTimer();
    }
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [banners, activeIndex]);

  const startTimer = () => {
    if (banners.length <= 1) return;

    if (timerRef.current) cancelAnimationFrame(timerRef.current);

    let start: number | null = null;
    const duration = 6000;

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
  };

  // --- Render Loading State ---
  if (loading) {
    return (
      <>
        <section className="relative h-[70vh] md:h-[80vh] w-full bg-gray-900 flex items-center justify-center">
          {/* Loading State */}
        </section>
        <MarqueeStrip />
      </>
    );
  }

  // --- Render Empty State ---
  if (banners.length === 0) {
    return (
      <>
        <section className="relative h-[calc(100vh-4rem)] w-full overflow-hidden ">
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-charcoal/30 to-transparent" />
          <div className="relative h-full container-custom flex items-center pt-0">
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
        <MarqueeStrip />
      </>
    );
  }

  const currentBanner = banners[activeIndex];
  return (
    <>
      <section className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden">
        {/* Background Image/Video */}
        <div className="absolute inset-0 h-full">
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
        <div className="relative h-full container-custom flex items-center">
          <div className="max-w-2xl text-white space-y-4 md:space-y-6 animate-fade-in pt-12 md:pt-16">
            <span className="inline-block px-3 py-1 bg-gold/20 backdrop-blur-sm border border-gold/30 text-gold-light text-xs tracking-[0.2em] uppercase">
              New Festive Collection
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-tight">
              {currentBanner.title}
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-gray-200 font-body leading-relaxed max-w-lg">
              {currentBanner.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 md:pt-4">
              <Link href={currentBanner.url || "/sarees"} className="px-4 py-2">
                <Button
                  size="lg"
                  variant="secondary"
                  className="!h-12 !rounded-none !bg-[#C9A24D] text-black hover:!bg-[#b48a3c]"
                >
                  Shop Sarees
                </Button>
              </Link>

              <Link href="/jewellery" className="px-4 py-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="!h-12 !rounded-none border-white text-white bg-transparent"
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
      <MarqueeStrip />
    </>
  );
};

export default Banner;
