"use client";

import { getAllCategories } from "@/lib/features/catogary";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";

// Import Quicksand font
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

const CategoryList = () => {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const [categories, setCategories] = useState<any>([]);

  useEffect(() => {
    callGetAllCategories();
  }, []);

  const callGetAllCategories = async () => {
    try {
      // API connectivity and data fetching remains intact
      const { payload } = await dispatch(getAllCategories());

      if (payload.success) {
        const parentCategories = payload.categories.filter(
          (category) => category.parentCategory.length === 0
        );
        setCategories(parentCategories);
      } else {
        toast.error(payload.msg);
      }
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  return (
    <div
      className={`${quicksand.className} overflow-hidden container mx-auto relative pb-12`}
    >
      {/* Title with underline animation */}
      <h1 className="relative text-3xl mb-8 mt-12 text-center block mx-auto animated-underline">
        SHOP BY CATEGORY
      </h1>

      <div className="relative category-carousel perspective-effect">
        <Swiper
          modules={[Navigation, Autoplay]}
          // Navigation buttons are functionally present but visually hidden via CSS for the design
          navigation={{
            prevEl: ".swiper-button-prev",
            nextEl: ".swiper-button-next",
          }}
          // Autoplay settings remain intact
          autoplay={{
            delay: 3000,
            disableOnInteraction: true,
            pauseOnMouseEnter: true,
          }}
          loop={true}
          slidesPerView={1} // Set to 1 to ensure the main slide is centered
          spaceBetween={0}
          centeredSlides={true} // Crucial for the perspective effect
          breakpoints={{
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 3, spaceBetween: 20 },
          }}
          className="!py-0"
        >
          {categories.map((category: any) => (
            <SwiperSlide key={category._id} className="!h-auto flex justify-center">
              <div
                onClick={() => router.push(`/categories/${category._id}`)}
                // Routing logic remains intact
                className="flex cursor-pointer flex-col items-center transition-transform duration-300 transform-gpu hover:scale-[1.03]"
              >
                {/* Image container is now rectangular/square without rounded-full */}
                <div className="w-[200px] h-[300px] md:w-[350px] md:h-[500px] overflow-hidden border-0 mb-0 shadow-2xl transition-shadow duration-300 relative">
                  <img
                    src={category.img}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500"
                  />
                  {/* Text overlay from the screenshot */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-center">
                    <h3 className="font-bold text-xl md:text-2xl tracking-widest">
                      {category.name.toUpperCase()}
                    </h3>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        /* Swiper adjustments */
        .category-carousel .swiper {
          padding: 0 !important;
          /* Set up a perspective for the 3D effect */
          perspective: 1000px;
          overflow: visible !important; /* Allow slides to be visible outside bounds */
        }
        .category-carousel .swiper-wrapper {
          align-items: flex-start !important;
        }
        .category-carousel .swiper-slide {
          height: auto !important;
          display: flex;
          justify-content: center;
          /* Enable 3D transitions */
          transition: transform 0.5s ease-out;
          transform-style: preserve-3d;
        }

        /* 3D Perspective Effect */
        @media (min-width: 768px) {
          /* Current/Active Slide - No rotation, slightly scaled up */
          .category-carousel .swiper-slide-active {
            transform: scale(1.1) translateZ(50px);
            z-index: 10;
          }

          /* Next Slide - Rotated right (inward) and pushed back */
          .category-carousel .swiper-slide-next {
            transform: rotateY(-10deg) scale(0.9) translateX(-40px);
            z-index: 5;
            opacity: 0.8;
          }

          /* Previous Slide - Rotated left (inward) and pushed back */
          .category-carousel .swiper-slide-prev {
            transform: rotateY(10deg) scale(0.9) translateX(40px);
            z-index: 5;
            opacity: 0.8;
          }
          
          /* Slides further away (not next/prev) */
          .category-carousel .swiper-slide:not(.swiper-slide-active):not(.swiper-slide-next):not(.swiper-slide-prev) {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }

        /* Hide navigation buttons as they don't fit the angled design */
        .category-carousel .swiper-button-prev,
        .category-carousel .swiper-button-next {
          display: none;
        }

        /* Animated underline */
        .animated-underline::after {
          content: "";
          display: block;
          height: 4px;
          margin: 0.5rem auto 0;
          border-radius: 9999px;
          background: linear-gradient(to right, #eab564, #eab664);
          width: 0;
          animation: underlineGrow 0.8s ease-out forwards;
        }

        @keyframes underlineGrow {
          from {
            width: 0;
          }
          to {
            width: 6rem; /* same as Tailwind w-24 */
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryList;












