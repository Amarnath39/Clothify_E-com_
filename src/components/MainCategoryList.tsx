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
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

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
      const { payload } = await dispatch(getAllCategories());
      if (payload.success) {
        // Filter for top-level categories
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
      className={`${quicksand.className} container mx-auto relative pb-24 pt-10`}
      style={{ overflow: "visible" }}
    >
      {/* ===== TITLE ===== */}
      <h1 className="relative text-3xl mb-32 text-center block mx-auto animated-underline font-semibold tracking-wide">
        SHOP BY CATEGORY
      </h1>

      {/* ===== CAROUSEL ===== */}
      <div className="relative category-carousel overflow-visible flex justify-center pt-4">
        <Swiper
          modules={[Navigation, Autoplay]}
          autoplay={{
            delay: 1000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={2000}
          loop={true}
          centeredSlides={true}
          slidesPerView={2.6} // desktop view
          spaceBetween={60}
          breakpoints={{
            // Mobile view is set to 1.01 to ensure the active card is fully centered without peeking too much.
            480: { slidesPerView: 1.01, spaceBetween: 10 }, 
            768: { slidesPerView: 2.1, spaceBetween: 40 }, // tablet view
            1024: { slidesPerView: 2.6, spaceBetween: 60 },
            1280: { slidesPerView: 2.8, spaceBetween: 80 },
          }}
          className="!py-8 overflow-visible"
        >
          {categories.map((category: any) => (
            <SwiperSlide
              key={category._id}
              className="!h-auto flex justify-center overflow-visible"
            >
              <div
                onClick={() => router.push(`/categories/${category._id}`)}
                // Desktop width/height defined here: w-[320px] md:w-[380px] h-[500px] md:h-[540px]
                className="relative w-[320px] md:w-[380px] h-[500px] md:h-[540px] cursor-pointer category-card rounded-2xl overflow-hidden shadow-xl transition-transform duration-700"
              >
                {/* Image */}
                <img
                  src={category.img}
                  alt={category.name}
                  className="w-full h-full object-cover rounded-2xl"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-2xl"></div>

                {/* Category Name */}
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <h3 className="text-white text-lg md:text-2xl font-semibold tracking-wide drop-shadow-lg">
                    {category.name.toUpperCase()}
                  </h3>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ===== GLOBAL STYLES (Swiper, Card Effects, and Mobile Adjustments) ===== */}
      <style jsx global>{`
        .category-carousel .swiper {
          padding: 0 !important;
          overflow: visible !important;
        }

        .category-carousel .swiper-wrapper {
          align-items: center !important;
          overflow: visible !important;
        }

        .category-carousel .swiper-slide {
          height: auto !important;
          display: flex;
          justify-content: center;
          overflow: visible !important;
          transition: transform 0.6s ease;
        }

        /* === 3D Tilt with center highlight (Desktop/Default) === */
        .category-card {
          transform: perspective(1200px) rotateY(0deg) scale(0.85);
          opacity: 0.8;
          transition: all 0.8s ease;
        }

        .swiper-slide-active .category-card {
          /* Default/Desktop Zoom */
          transform: perspective(1200px) rotateY(0deg) scale(1.15);
          opacity: 1;
          z-index: 10;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
        }

        .swiper-slide-prev .category-card {
          transform: perspective(1200px) rotateY(12deg) translateX(50px)
            scale(0.85);
          opacity: 0.85;
          z-index: 4;
        }

        .swiper-slide-next .category-card {
          transform: perspective(1200px) rotateY(-12deg) translateX(-50px)
            scale(0.85);
          opacity: 0.85;
          z-index: 4;
        }

        .swiper-slide-active .category-card:hover {
          transform: perspective(1200px) rotateY(0deg) scale(1.2);
        }

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
            width: 6rem;
          }
        }

        /* Mobile adjustments (for screens up to 768px wide) */
        @media (max-width: 768px) {
          /* Dimensions: Very wide and short */
          .category-card {
            width: 98vw !important;
            max-width: 480px !important; 
            height: 200px !important;
          }
          
          /* Active Card: SIGNIFICANTLY INCREASED SCALE (Zoom) for mobile only */
          .swiper-slide-active .category-card {
            transform: perspective(1000px) rotateY(0deg) scale(2.0); /* Increased scale to 1.2 */
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }
          
          /* Side Cards: Keep small relative to the central one */
          .swiper-slide-prev .category-card,
          .swiper-slide-next .category-card {
            transform: perspective(1000px) rotateY(0deg) translateX(0px) scale(0.8); /* Reduced scale of side cards */
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryList;