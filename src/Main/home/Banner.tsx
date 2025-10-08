"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getAllBanner } from "@/lib/features/banner";
import { AppDispatch } from "@/lib/store";
import { useRouter } from "next/navigation";
import "../../hooks/style.css";

// --- Marquee Strip ---
const MarqueeStrip = () => {
  const marqueeText =
    "4L+ Happy Customers | Gifts For Her @ 50% OFF | Ships in 24 hours | ✨ New Arrivals Every Week | Free Shipping on All Orders Over $50";
  const repeatedText = `${marqueeText} - ${marqueeText} - ${marqueeText}`;

  return (
    <div className="w-full bg-black text-white overflow-hidden py-2 text-center text-sm sm:text-base font-medium">
      <div className="flex w-fit animate-marquee">
        <span className="whitespace-nowrap px-4 tracking-wider">{repeatedText}</span>
      </div>
    </div>
  );
};

// --- Banner Component ---
const Banner = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [banners, setBanners] = useState<any[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [transition, setTransition] = useState(false);
  const [textTransition, setTextTransition] = useState(false);
  const router = useRouter();

  // --- Effect for Scroll Position ---
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Effect for Fetching Banner Data ---
  useEffect(() => {
    const callGetAllBanner = async () => {
      try {
        const { payload }: any = await dispatch(getAllBanner());
        if (payload.success) {
          const bannerData = payload.banners.map((item) => ({
            id: item._id,
            src: item.img,
            type: item.type,
            title: item.title,
            alt: item.title,
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

  // --- Effect for Initial Banner and Timer Start ---
  useEffect(() => {
    if (banners.length > 0) {
      setActiveIndex(0);
      startTimer();
    }
  }, [banners]);

  // --- Effect for Auto-play and Cleanup ---
  useEffect(() => {
    if (banners.length > 0) {
      startTimer();
      if (banners[activeIndex]?.type === "video" && videoRef.current) {
        videoRef.current.play().catch((error) => console.log("Video autoplay failed:", error));
      }
    }
    return () => {
      cancelAnimationFrame(timerRef.current);
    };
  }, [activeIndex, banners]);

  // --- Timer Function ---
  const startTimer = () => {
    if (banners.length === 0) return;

    let start: any = null;
    const duration = 6000;

    const step = (timestamp: any) => {
      if (!start) start = timestamp;
      const progressTime = timestamp - start;
      const progressPercentage = (progressTime / duration) * 100;

      setProgress(Math.min(progressPercentage, 100));

      if (progressPercentage < 100) {
        timerRef.current = requestAnimationFrame(step);
      } else {
        handleNext();
      }
    };

    cancelAnimationFrame(timerRef.current); // Clear any existing timer
    timerRef.current = requestAnimationFrame(step);
  };

  // --- Navigation Handlers ---
  const navigate = (newIndex: number) => {
    if (banners.length === 0) return;
    setTransition(true);
    setTextTransition(true);
    cancelAnimationFrame(timerRef.current);

    setTimeout(() => {
      setActiveIndex(newIndex);
      setTextTransition(false);
      setTransition(false);
      // startTimer is called in the useEffect for activeIndex change
    }, 500);
  };

  const handleNext = () => {
    const newIndex = (activeIndex + 1) % banners.length;
    navigate(newIndex);
  };

  // --- Click Handler ---
  const handleBannerClick = () => {
    const currentBanner = banners[activeIndex];
    if (currentBanner?.url) {
      router.push(currentBanner.url);
    }
  };

  return (
    <>
      <div className="flex justify-center overflow-x-hidden mt-16 sm:mt-20 md:mt-24"></div>

      <div className="relative w-full h-[30vh] sm:h-[60vh] md:h-[85vh] overflow-hidden mt-0">
        <div className="absolute top-0 left-0 w-full h-full cursor-pointer" onClick={handleBannerClick}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out ${
                activeIndex === index ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {banner.type === "image" ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${banner.src})`,
                    backgroundPosition: `top ${50 + scrollY * 0.05}%`,
                    transform: `scale(${transition ? 1.1 : 1})`,
                    transition: "transform 6s ease-out, opacity 1s ease-in-out, background-position 0.5s ease-out",
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={banner.src}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )}
            </div>
          ))}
        </div>

        {/* Text Overlay */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-white z-30 px-4 text-center">
          <h1 className="text-lg sm:text-2xl md:text-5xl font-bold mb-2 sm:mb-4">
            {banners[activeIndex]?.title}
          </h1>
          <p
            className={`text-xs sm:text-sm md:text-lg max-w-lg sm:max-w-xl transition-all duration-500 ease-in-out ${
              textTransition ? "opacity-0 transform -translate-y-10" : "opacity-100 transform translate-y-0"
            }`}
          >
            {banners[activeIndex]?.description}
          </p>
        </div>

        {/* Bottom Center Thumbs */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-2 z-40">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => navigate(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                activeIndex === idx ? "bg-white" : "bg-white bg-opacity-50"
              }`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-50 z-40" style={{ width: `${progress}%` }}></div>
      </div>

      <MarqueeStrip />
    </>
  );
};

export default Banner;
