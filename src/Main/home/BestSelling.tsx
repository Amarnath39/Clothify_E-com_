"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { useAppDispatch } from "@/lib/hooks";
import { getAllProducts } from "@/lib/features/catogary";

const PRODUCT_CATEGORIES = [
  { type: "bestsellerProduct", title: "Best Sellers" },
  { type: "latestProduct", title: "New Arrivals" },
  { type: "featureProduct", title: "Featured" },
];

const FeaturedCollections = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [products, setProducts] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const requests = PRODUCT_CATEGORIES.map((category) => {
          const queryParams = new URLSearchParams({
            [category.type]: "true",
            sort: "newlyArrived",
            limit: "1",
          });

          return dispatch(getAllProducts(queryParams.toString()) as any);
        });

        const responses = await Promise.all(requests);

        const mappedProducts = responses.reduce((acc, res, index) => {
          if (res.payload?.success && res.payload.products.length > 0) {
            acc[PRODUCT_CATEGORIES[index].type] =
              res.payload.products[0];
          }
          return acc;
        }, {} as Record<string, any>);

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to fetch collections", error);
      }
    };

    fetchCollections();
  }, [dispatch]);

  return (
    <section className="py-20 bg-white">
      {/* ✅ Proper width container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ✅ Proper heading alignment */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-1">
              Curated Collections
            </h2>
            <p className="text-gray-500 italic">
              Handpicked for the connoisseur in you
            </p>
          </div>

          <button
            onClick={() => router.push("/collections")}
            className="group flex items-center text-burgundy font-medium hover:text-burgundy-dark transition-colors"
          >
            View All
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* ✅ Grid inside margins */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRODUCT_CATEGORIES.map((category) => {
            const product = products[category.type];

            return (
              <div
                key={category.type}
                onClick={() =>
                  router.push(`/products?${category.type}=true`)
                }
                className="group relative h-[500px] overflow-hidden rounded-2xl cursor-pointer"
              >
                <img
                  src={
                    product?.img?.[0] ||
                    "https://placehold.co/800x1200/e2e8f0/e2e8f0"
                  }
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <h3 className="text-2xl font-serif text-white mb-2">
                    {category.title}
                  </h3>
                  <span className="inline-block text-gold text-sm uppercase tracking-widest border-b border-gold pb-1 group-hover:text-white group-hover:border-white transition-colors">
                    Explore Collection
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FeaturedCollections;
