"use client";
// Main imports
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";

import { useAppDispatch } from "@/lib/hooks";
import { getAllProducts } from "@/lib/features/catogary";

// Style imports
import "swiper/css/pagination";
import "swiper/css";
import "swiper/css/navigation";
import "./swiper.css";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

const PRODUCT_CATEGORIES = [
  { type: "bestsellerProduct", title: "Best Sellers" },
  { type: "latestProduct", title: "New Arrivals" },
  { type: "featureProduct", title: "Featured" },
];

const BestSelling = () => {
  const [products, setProducts] = useState<any>({}); 
  

  const [hoveredType, setHoveredType] = useState<string | null>(null);
  

  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const productPromises = PRODUCT_CATEGORIES.map((category) => {
          const queryParams = new URLSearchParams({
            [category.type]: "true",
            sort: "newlyArrived",
            limit: "1",
          });
          return dispatch(getAllProducts(queryParams.toString()) as any);
        });

        const results = await Promise.all(productPromises);

        const fetchedProducts = results.reduce((acc, result, index) => {
          if (result.payload?.success && result.payload.products.length > 0) {
            const categoryType = PRODUCT_CATEGORIES[index].type;
            acc[categoryType] = result.payload.products[0];
          }
          return acc;
        }, {});

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchAllProducts();
  }, [dispatch]);

  return (
    <div className={`${quicksand.className} antialiased bg-white py-12 sm:py-16`}>
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-8">
        Our Collections
      </h1>

      <div className="w-full h-[85vh] sm:h-[75vh] min-h-[600px] sm:min-h-[500px] max-h-[900px] sm:max-h-[800px] flex flex-col sm:flex-row p-2 gap-2">
        {PRODUCT_CATEGORIES.map((category) => {
          const product = products[category.type];
          const isHovered = hoveredType === category.type;
          const isAnyHovered = hoveredType !== null;

          const flexValue = isAnyHovered
            ? isHovered
              ? "flex-[5]"
              : "flex-[1]"
            : "flex-1";

          return (
            <div
              key={category.type}
              className={`relative rounded-2xl overflow-hidden cursor-pointer w-full transition-all duration-700 ease-in-out ${flexValue}`}
              style={{
                backgroundImage: `url(${
                  product?.img?.[0] || "https://placehold.co/800x1200/e2e8f0/e2e8f0"
                })`,
                backgroundSize: "auto 100%",
                backgroundPosition: "center",
              }}
              onMouseEnter={() => setHoveredType(category.type)} // This line will now work correctly
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => router.push(`/products?${category.type}=true`)}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-500"></div>

              <div className="relative w-full h-full flex flex-col justify-end items-start p-6 sm:p-10 text-white">
                <div
                  className="w-full transform transition-transform duration-500 ease-out"
                  style={{ opacity: isHovered ? 1 : 0.95 }}
                >
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight sm:mb-4">
                    {category.title}
                  </h2>
                  <button className="bg-transparent border-2 border-white text-white font-bold py-2 px-6 rounded-lg hover:bg-white hover:text-black transition-all duration-300 hidden sm:block">
                    EXPLORE
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BestSelling;