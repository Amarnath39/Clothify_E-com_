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
    <div className="overflow-hidden container mx-auto relative pb-12">
      {/* Title with underline animation */}
      <h2 className="relative text-3xl mb-8 mt-4 text-center block mx-auto animated-underline">
        SHOP BY CATEGORY
      </h2>

      <div className="relative category-carousel">
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            prevEl: ".swiper-button-prev",
            nextEl: ".swiper-button-next",
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: true,
            pauseOnMouseEnter: true,
          }}
          loop={true}
          slidesPerView={2}
          spaceBetween={10}
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 10 },
            480: { slidesPerView: 2, spaceBetween: 15 },
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
            1280: { slidesPerView: 5, spaceBetween: 20 },
          }}
          className="!py-0"
        >
          {categories.map((category: any) => (
            <SwiperSlide key={category._id} className="!h-auto flex justify-center">
              <div
                onClick={() => router.push(`/categories/${category._id}`)}
                className="flex cursor-pointer flex-col items-center transition-transform duration-300 hover:scale-105"
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-red-300 mb-2 shadow-lg hover:border-red-500 transition-colors duration-300">
                  <img
                    src={category.img}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <h3 className="text-center font-medium text-sm md:text-base">
                  {category.name.toUpperCase()}
                </h3>
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
        }
        .category-carousel .swiper-wrapper {
          align-items: flex-start !important;
        }
        .category-carousel .swiper-slide {
          height: auto !important;
          display: flex;
          justify-content: center;
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
