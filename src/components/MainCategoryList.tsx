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
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={1500}
          loop={true}
          centeredSlides={true}
          // The `slidesPerView` is now fully controlled by the breakpoints below
          // for a mobile-first responsive approach.
          breakpoints={{
            // Mobile view (3-card UI): Shows 1 main card and parts of the next/prev
            320: {
              slidesPerView: 1.5,
              spaceBetween: 15,
            },
            // Tablet view
            768: {
              slidesPerView: 3.5,
              spaceBetween: 30,
            },
            // Desktop view (original 5-card UI)
            1024: {
              slidesPerView: 4.6,
              spaceBetween: 40,
            },
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
                // Card size is now controlled by base styles and the mobile media query
                className="relative w-[260px] md:w-[300px] h-[380px] md:h-[420px] cursor-pointer category-card rounded-2xl overflow-hidden shadow-xl transition-transform duration-700"
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
        }

        /* === 3D Perspective Styling for 5-Card Layout === */

        /* Base state for all cards (scaled down) */
        .category-card {
          transform: perspective(1200px) rotateY(0deg) scale(0.8);
          opacity: 0.7;
          transition: all 0.8s ease;
        }

        /* Active (Center) Card: larger and fully visible */
        .swiper-slide-active .category-card {
          transform: perspective(1200px) rotateY(0deg) scale(1.1);
          opacity: 1;
          z-index: 10;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
        }

        /* Inner Side Cards (Immediately next to center) */
        .swiper-slide-prev .category-card {
          transform: perspective(1200px) rotateY(15deg) translateX(40px)
            scale(0.85);
          opacity: 0.8;
          z-index: 4;
        }

        .swiper-slide-next .category-card {
          transform: perspective(1200px) rotateY(-15deg) translateX(-40px)
            scale(0.85);
          opacity: 0.8;
          z-index: 4;
        }
        
        /* NEW: Outer Side Cards (The second card from the center) */
        .swiper-slide-prev-prev .category-card {
            transform: perspective(1200px) rotateY(25deg) translateX(80px) scale(0.7);
            opacity: 0.6;
            z-index: 3;
        }

        .swiper-slide-next-next .category-card {
            transform: perspective(1200px) rotateY(-25deg) translateX(-80px) scale(0.7);
            opacity: 0.6;
            z-index: 3;
        }

        .swiper-slide-active .category-card:hover {
          transform: perspective(1200px) rotateY(0deg) scale(1.15);
        }

        /* Animated Underline for Title */
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

        /* MODIFIED: Mobile adjustments for the 3-card UI */
        @media (max-width: 768px) {
          /*
            Card width is reduced from the original '80vw' to '65vw'.
            This makes the central card slightly smaller, allowing the
            adjacent cards to be more visible and creating the 3-card effect.
            Height is also adjusted for better proportions on mobile.
          */
          .category-card {
            width: 65vw !important;
            max-width: 280px !important; 
            height: 360px !important;
          }

          /* On mobile, the active card's scale is slightly reduced for a cleaner look */
          .swiper-slide-active .category-card {
            transform: perspective(1200px) rotateY(0deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryList;