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
        const data = payload.itemDataList.map((item) => ({
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
  }, []);

  const handleSlide = (direction) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setContentOpacity(0);

    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        if (direction === "next") {
          return prevIndex === images?.length - 1 ? 0 : prevIndex + 1;
        } else {
          return prevIndex === 0 ? images.length - 1 : prevIndex - 1;
        }
      });
    }, 300);

    setTimeout(() => {
      setContentOpacity(1);
      setIsTransitioning(false);
    }, 600);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <div className="container mx-auto  py-6 sm:py-8 md:py-10 lg:py-12  sm:max-w-[90vw]">
      {/* <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-6 md:gap-8 rounded-xl overflow-hidden bg-[#485e11] max-h-[70vh] sm:max-h-[62vh]"> */}
  <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-6 md:gap-8 rounded-xl overflow-hidden bg-[#380e13] max-h-[70vh] sm:max-h-[62vh]">
 
        {/* Left Side: Text Content */}
        <div className="w-full md:w-1/2 space-y-4 sm:space-y-6 md:space-y-8 flex flex-col items-center sm:items-start text-white pl-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mt-1 md:mt-0">
            {images[currentIndex]?.title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-200 mx-1 md:mx-0">
            {images[currentIndex]?.description}
          </p>
          <Button
            className="bg-[#E9C533] text-white px-6 py-3 rounded-md text-sm sm:text-base md:text-lg hover:bg-amber-600 transition duration-300 transform hover:scale-105"
            onClick={() => router.push("/products")}
          >
            Shop all
          </Button>
        </div>

        {/* Right Side: Image */}
       <div className="w-full md:w-1/2 h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] flex justify-center items-center overflow-hidden">
  <img
    loading="lazy"
    src={hovered ? images[currentIndex]?.src2 : images[currentIndex]?.src1}
    alt={images[currentIndex]?.title || "Fashion Bag"}
    className="w-full h-full object-cover transition-transform duration-300"
    style={{ objectPosition: "center 0.5%" }} // moved further down
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
  />
</div>
      </div>
    </div>
  );
};

export default Featured;
