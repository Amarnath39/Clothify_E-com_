"use client";

import { Button } from "@/components/ui/button";
import { getImageTextData } from "@/lib/features/misc";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useDispatch } from "react-redux";

const Featured = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentOpacity, setContentOpacity] = useState(1);
  const [images, setImages] = useState<any>([]);
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const [hovered, setHovered] = useState(false);

  const callGetImageTextApi = async () => {
    try {
      const { payload } = await dispatch(getImageTextData());

      if (payload.success) {
        const data = payload.itemDataList.map((item: any) => ({
          id: item._id,
          src1: item.img[0],
          src2: item.img[1],
          title: item.title,
          alt: item.title,
          description: item.description,
          url: item.url,
        }));
        setImages(data);
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    callGetImageTextApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSlide = (direction: "next" | "prev") => {
    if (isTransitioning || images.length === 0) return;
    setIsTransitioning(true);
    setContentOpacity(0);

    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        if (direction === "next") {
          return prevIndex === images.length - 1 ? 0 : prevIndex + 1;
        } else {
          return prevIndex === 0 ? images.length - 1 : prevIndex - 1;
        }
      });
    }, 300); // Wait for fade-out to complete before changing content

    setTimeout(() => {
      setContentOpacity(1);
      setIsTransitioning(false);
    }, 600); // Wait for content change and then fade-in
  };

  // This effect was not present but helps in creating an auto-slide feature.
  // You can uncomment it if you want the slider to advance automatically.
  // useEffect(() => {
  //   const slideInterval = setInterval(() => {
  //     handleSlide("next");
  //   }, 5000); // Change slide every 5 seconds
  //
  //   return () => clearInterval(slideInterval);
  // }, [isTransitioning, images.length]);


  return (
    <div className="container mx-auto py-6 sm:py-8 md:py-10 lg:py-12 sm:max-w-[90vw]">
      <div className="relative">
        {/* Main container with layout logic */}
        <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-6 md:gap-8 rounded-xl overflow-hidden bg-[#ffffff] max-h-[70vh] sm:max-h-[62vh]">
          
          {/* Left Side (Desktop) / Top Side (Mobile): Image */}
          <div className="w-full md:w-1/2 h-[250px] sm:h-[300px] md:h-auto md:max-h-[62vh] flex justify-center items-center overflow-hidden">
            <img
              loading="lazy"
              src={hovered ? images[currentIndex]?.src2 : images[currentIndex]?.src1}
              alt={images[currentIndex]?.alt || "Featured Product"}
              className="w-full h-full object-cover"
              style={{ 
                opacity: contentOpacity, 
                transition: "opacity 300ms ease-in-out" 
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            />
          </div>

          {/* Right Side (Desktop) / Bottom Side (Mobile): Text Content */}
          <div className="w-full md:w-1/2 p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 flex flex-col items-center text-center md:items-start md:text-left text-black">
            <div 
              style={{ 
                opacity: contentOpacity, 
                transition: "opacity 300ms ease-in-out" 
              }}
              className="flex flex-col items-center md:items-start w-full space-y-4 sm:space-y-6 md:space-y-8"
            >
              <h2 className="text-xl sm:text-3xl md:text-4xl font-bold">
                {images[currentIndex]?.title || "Timeless Collection"}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-black">
                {images[currentIndex]?.description || "Discover our exclusive collection of handcrafted items, designed with passion and precision."}
              </p>
              <Button
                className="bg-[#000000] text-white px-6 py-3 rounded-md text-sm sm:text-base md:text-lg hover:bg-amber-600 transition duration-300 transform hover:scale-105"
                onClick={() => router.push("/products")}
              >
                Shop all
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => handleSlide("prev")}
              disabled={isTransitioning}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-3 rounded-full z-10 transition duration-200 disabled:opacity-50"
              aria-label="Previous Slide"
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={() => handleSlide("next")}
              disabled={isTransitioning}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-3 rounded-full z-10 transition duration-200 disabled:opacity-50"
              aria-label="Next Slide"
            >
              <FaArrowRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Featured;