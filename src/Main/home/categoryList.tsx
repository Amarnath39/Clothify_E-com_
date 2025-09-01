"use client";

import { getAllCategories } from "@/lib/features/catogary";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Quicksand, Playfair_Display } from "next/font/google";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { motion } from "framer-motion";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600"] });

const CategoryList = () => {
  const dispatch = useDispatch<any>();
  const [categoriesData, setCategoriesData] = useState<any[]>([]);

  useEffect(() => {
    const callGetAllCategory = async () => {
      try {
        const { payload } = await dispatch(getAllCategories());
        if (payload.success === true) {
          const sortedCategories = payload.categories
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 8);
          setCategoriesData(sortedCategories);
        } else {
          toast.error(payload.msg);
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    };

    callGetAllCategory();
  }, []);

  const responsive = {
    superLargeDesktop: { breakpoint: { max: 4000, min: 1900 }, items: 4 },
    desktop: { breakpoint: { max: 1900, min: 1500 }, items: 4 },
    miniDesktop: { breakpoint: { max: 1500, min: 1300 }, items: 4 },
    tablet: { breakpoint: { max: 1300, min: 1000 }, items: 3 },
    miniTablet: { breakpoint: { max: 1000, min: 700 }, items: 3 },
    mobile: { breakpoint: { max: 700, min: 0 }, items: 2 },
    miniMobile: { breakpoint: { max: 540, min: 0 }, items: 2 },
  };

    return (
      <div className="flex flex-col lg:min-h-[80vh] ">
        <h1
          className={`${quicksand.className} mt-8 sm:mt-20 mb-3 lg:mb-8 text-xl sm:text-4xl font-semibold text-gray-800 text-center`}
        >
          OUR CATEGORIES
        </h1>

        {/* Desktop View */}
        <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8 justify-center mx-12">
          {categoriesData.map((category) => (
            <Link
              key={category._id}
              href={`/categories/${category._id}`}
              className="group relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <div className=" inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h1 className="bg-navbarBackground text-navbarText text-lg font-bold uppercase tracking-wide px-4 py-2 ">
                {category.name}
              </h1>
              <div className="w-[22rem] xl:w-full h-[27rem] overflow-hidden bg-black flex items-center justify-center">
  <img
    src={category.img}
    alt={category.name}
    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
  />
</div>

            </Link>
          ))}
        </div>

        {/* Mobile View (Carousel) */}
        <div className="lg:hidden flex justify-center mx-2 lg:mx-12 mt-8">
          <Carousel
            responsive={responsive}
            arrows={true}
            autoPlay={true}
            autoPlaySpeed={1500}
            infinite={true}
            className="z-10 w-full max-w-6xl"
          >
            {categoriesData?.map((category) => (
              <Link key={category._id} href={`/categories/${category._id}`}>
                <div className="mx-2 relative group overflow-hidden">
                  <div className="flex justify-center items-center h-60 sm:h-72 md:h-88 lg:h-[25rem] bg-black">
  <img
    className="object-contain h-full w-full transition-transform duration-700 group-hover:scale-105"
    src={category?.img}
    alt={category?.name}
  />
</div>

                  <h2 className="text-center mt-2 font-bold text-navbarText">
                    {category?.name.toUpperCase() ?? "Product Title"}
                  </h2>
                </div>
              </Link>
            ))}
          </Carousel>
        </div>
      </div>
    );
  };

  export default CategoryList;
