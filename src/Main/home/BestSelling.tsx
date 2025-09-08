"use client";

import React, { useEffect, useRef, useState } from "react";

import "swiper/css/pagination";
import "swiper/css";
import "swiper/css/navigation";
import "./swiper.css";

import Aos from "aos";
import { useDispatch, useSelector } from "react-redux";
import { getAllProducts } from "@/lib/features/catogary";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

const ProductCard = ({ product, type }) => {
  const router = useRouter();

  return (
    <div
      onClick={() => {
        const baseRoute =
          type === "bestsellerProduct"
            ? "/products?bestsellerProduct=true"
            : type === "latestProduct"
            ? "/products?latestProduct=true"
            : "/products?featureProduct=true";

        router.push(`${baseRoute}`);
      }}
    >
      <div className="w-[19rem] h-[14rem] sm:w-[24rem] sm:h-[19rem] rounded-lg relative cursor-pointer mx-1">
        <img
          loading="lazy"
          src={product?.img?.[0]} // Show first image only
          alt={product?.name}
          className="w-full h-full object-cover object-top transition-opacity duration-300 rounded-3xl"
        />

        {/* Type Label Based on `type` Prop */}
        <div className="absolute bottom-10 left-10 flex justify-between items-center gap-20 bg-white hover:bg-gray-100 px-4 py-3 rounded-xl font-medium">
          <h1 className="text-xl sm:text-2xl text-[#04322f] hover:text-red-400 cursor-pointer">
            {type === "bestsellerProduct"
              ? "Best Seller"
              : type === "latestProduct"
              ? "Latest"
              : "Featured"}
          </h1>
          <img
            src="https://cdn.prod.website-files.com/645a69e5ff9a553155774bec/645cc13f45e0640130bc7ae1_right-arrow-medium.svg"
            alt=""
            className="h-6 w-8 hover:text-red-400"
          />
        </div>
      </div>
    </div>
  );
};

// main
const BestSelling = () => {
  const [bestProduct, setBestProduct] = useState(null);
  const [latestProduct, setLatestProduct] = useState(null);
  const [featureProduct, setFeatureProduct] = useState(null);
  const dispatch = useDispatch<any>();
  const router = useRouter();
  useEffect(() => {
    const fetchProducts = async (filterKey, setter) => {
      const queryParams = new URLSearchParams({
        [filterKey]: "true",
        sort: "newlyArrived",
        limit: "30",
      });

      try {
        const { payload } = await dispatch(getAllProducts(queryParams));

        if (payload.success && payload.products.length > 0) {
          setter(payload.products[0]); // Pick only the FIRST product
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts("bestsellerProduct", setBestProduct);
    fetchProducts("latestProduct", setLatestProduct);
    fetchProducts("featureProduct", setFeatureProduct);
  }, [dispatch]);

  return (
    <div className="bg-white pb-6 overflow-hidden">
     <div className="bg-white pb-6 overflow-hidden">
  {/* Heading with underline */}
  <h1 className="relative text-xl sm:text-3xl font-medium text-center mx-auto mb-8 animated-underline">
    Our Collection
  </h1>

  <div className="flex justify-between items-center gap-8 my-10 mx-4 sm:mx-24">
    <div
      className="flex items-center sm:gap-2 cursor-pointer group ml-auto"
      onClick={() => router.push("/products")}
    >
      <span className="text-base sm:text-lg">VIEW MORE</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="36"
        height="24"
        viewBox="0 0 26 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transform transition-transform duration-300 group-hover:translate-x-2"
      >
        <path d="M4 12h16" />
        <path d="M14 5l7 7-7 7" />
      </svg>
    </div>
  </div>

  <div className="flex justify-center flex-wrap gap-10 md:mx-auto my-12">
    {bestProduct && (
      <ProductCard product={bestProduct} type="bestsellerProduct" />
    )}
    {latestProduct && (
      <ProductCard product={latestProduct} type="latestProduct" />
    )}
    {featureProduct && (
      <ProductCard product={featureProduct} type="featureProduct" />
    )}
  </div>

  {/* Global underline styles */}
  <style jsx global>{`
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
  `}</style>
</div>
    </div>
  );
};

export default BestSelling;
