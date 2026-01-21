"use client";

import { getAllProducts } from "@/lib/features/catogary";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import NotFound from "@/components/NotFound";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StandardProductCard from "@/components/StandardProductCard";

const MainProducts = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const dispatch = useDispatch<any>();
  const [products, setProducts] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(
    async (page: number) => {
      const queryParams = new URLSearchParams({
        categoryId: "",
        page: page.toString(),
        limit: "10",
        search: searchQuery,
        sort: "newlyArrived",
      });
      setLoading(true);
      try {
        const { payload }: any = await dispatch(getAllProducts(queryParams.toString()));
        if (payload.success) {
          setProducts(payload);
        } else {
          toast.error(payload.msg);
        }
      } catch (error: any) {
        toast.error(error?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [dispatch, searchQuery]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const SkeletonCard = ({ uniqueKey }) => (
    <div key={uniqueKey} className="flex flex-col">
      <div className="aspect-[3/4] bg-gray-200 animate-pulse mb-4 rounded-sm"></div>
      <div className="h-4 bg-gray-200 animate-pulse w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 animate-pulse w-1/4"></div>
    </div>
  );

  return (
    <section className="py-24 bg-white relative z-0">
      <div className="container mx-auto px-4 md:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-100 pb-6 gap-4">
          <div>
            <span className="font-serif text-[#b48a3c] text-sm tracking-[0.2em] mb-2 block uppercase">
              Featured
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-gray-900 leading-tight">
              Curated Collection
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden md:flex items-center text-xs uppercase tracking-widest text-gray-500 hover:text-[#b48a3c] transition-colors group"
          >
            View All Products
            <span className="block h-[1px] w-8 bg-gray-300 ml-3 group-hover:w-12 group-hover:bg-[#b48a3c] transition-all"></span>
          </Link>
        </div>

        {/* Content */}
        <div className="">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={`sk-${index}`} uniqueKey={`sk-${index}`} />
              ))}
            </div>
          ) : products.products?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
              {products.products.map((product, index) => (
                <StandardProductCard
                  key={product._id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <NotFound height="400px" text="No Featured Products Found" />
          )}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-12 text-center md:hidden">
          <Link
            href="/products"
            className="inline-block border border-gray-900 text-gray-900 px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors"
          >
            View All Products
          </Link>
        </div>

      </div>
    </section>
  );
};

export default MainProducts;