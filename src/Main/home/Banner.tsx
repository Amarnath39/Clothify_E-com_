"use client";

import React, { useState, useEffect, useRef } from "react";
import useIntersectionObserver from "@/hooks/useScrollAnimation";
import "../../hooks/style.css";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getAllBanner } from "@/lib/features/banner";
import { AppDispatch } from "@/lib/store";
import { useRouter } from "next/navigation";
import MainCategoryList from "@/components/MainCategoryList";

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

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      setActiveIndex(0);
      startTimer();
    }
  }, [banners]);

  useEffect(() => {
    if (banners.length > 0) {
      startTimer();
      if (banners[activeIndex].type === "video" && videoRef.current) {
        videoRef.current.play();
      }
    }
    return () => {
      cancelAnimationFrame(timerRef.current);
    };
  }, [activeIndex, banners]);

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

    timerRef.current = requestAnimationFrame(step);
  };

  const handlePrev = () => {
    if (banners.length === 0) return;
    setTransition(true);
    setTextTransition(true);
    cancelAnimationFrame(timerRef.current);
    setTimeout(() => {
      setActiveIndex((prevIndex) =>
        prevIndex === 0 ? banners.length - 1 : prevIndex - 1
      );
      setTextTransition(false);
      setTransition(false);
      startTimer();
    }, 500);
  };

  const handleNext = () => {
    if (banners.length === 0) return;
    setTransition(true);
    setTextTransition(true);
    cancelAnimationFrame(timerRef.current);
    setTimeout(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
      setTextTransition(false);
      setTransition(false);
      startTimer();
    }, 500);
  };

  const handleBannerClick = () => {
    const currentBanner = banners[activeIndex];
    if (currentBanner.url) {
      router.push(currentBanner.url);
    }
  };

  return (
    <>
      <div className="flex justify-center overflow-x-hidden">
        <MainCategoryList />
      </div>

      {/* Responsive Banner Container */}
      <div className="relative w-full h-[25vh] sm:h-[60vh] md:h-[85vh] overflow-hidden mt-4 sm:mt-6 md:mt-8 px-2 sm:px-4 md:px-8">
        {/* Banner Image/Video Layer */}
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
                  className="w-full h-full bg-cover bg-center rounded-[20px]"
                  style={{
                    backgroundImage: `url(${banner.src})`,
                    backgroundPosition: `top ${50 + scrollY * 0.05}%`,
                    transform: `scale(${transition ? 1.1 : 1})`,
                    transition:
                      "transform 6s ease-out, opacity 1s ease-in-out, background-position 0.5s ease-out",
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={banner.src}
                  className="w-full h-full object-cover rounded-[20px]"
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
          <h1 className="text-xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-4">
            {banners[activeIndex]?.title}
          </h1>
          <p
            className={`text-sm sm:text-base md:text-lg max-w-xl transition-all duration-500 ease-in-out ${
              textTransition
                ? "opacity-0 transform -translate-y-10"
                : "opacity-100 transform translate-y-0"
            }`}
          >
            {banners[activeIndex]?.description}
          </p>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 bg-white bg-opacity-70 p-2 rounded-full text-red hover:bg-opacity-90 transition-all z-40"
        >
          <FaArrowLeft size={18} />
        </button>
        <button
          onClick={handleNext}
          className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 bg-white bg-opacity-70 p-2 rounded-full text-red hover:bg-opacity-90 transition-all z-40"
        >
          <FaArrowRight size={18} />
        </button>
      </div>
    </>
  );
};

export default Banner;
