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
import { ChevronLeft, ChevronRight } from "lucide-react";

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
        // Only fetching parent categories
        const parentCategories = payload.categories.filter(
          (category) => category.parentCategory.length === 0
        );
        setCategories(parentCategories);
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      toast.error(error?.message);
    }
  };

  return (
    <div className="overflow-hidden container lg:mx-56  relative pb-12 max-h-[20vh] mt-32 md:mt-44 ">
      <div className="relative px-2 category-carousel flex justify-center mx-auto">
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
          breakpoints={{
            320: { slidesPerView: 3, spaceBetween: 10 },
            480: { slidesPerView: 4, spaceBetween: 10 },
            768: { slidesPerView: 5, spaceBetween: 5 },
            1024: { slidesPerView: 5, spaceBetween: 5 },
          }}
          className="relative"
        >
          {categories.map((category) => (
            <SwiperSlide key={category._id}>
              <div
                onClick={() => router.push(`/categories/${category._id}`)}
                className="flex cursor-pointer flex-col items-center transform transition-transform duration-300 hover:scale-105"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-yellow shadow-md hover:border-yellowwish-10 transition-colors duration-300   ">

                  <img
                    src={category.img}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110 "
                  />
                </div>
                <h3 className="text-center font-medium text-xs mt-2">
                  {category.name.toUpperCase()}
                </h3>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <button className="swiper-button-prev absolute !w-8 !h-8 left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-primary-100 rounded-full p-2 shadow-md transition-all duration-300 hover:scale-110">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <button className="swiper-button-next absolute !w-8 !h-8 right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-primary-100  rounded-full p-2 shadow-md transition-all duration-300 hover:scale-110">
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      <style jsx global>{`
        .category-carousel .swiper-button-prev::after,
        .category-carousel .swiper-button-next::after {
          display: none;
        }

        .category-carousel .swiper-button-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .category-carousel .swiper {
          padding: 10px;
        }

        @media (max-width: 640px) {
          .category-carousel .swiper-button-prev,
          .category-carousel .swiper-button-next {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryList;
  
