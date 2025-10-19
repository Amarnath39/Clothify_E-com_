"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getAllProducts } from "@/lib/features/catogary";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";
import useCountry from "@/lib/useCountry";
import { Country } from "@/lib/CountryProvider";

/**
 * Local fallback implementation of getPriceWithCurrency to avoid missing module error.
 * Formats a numeric price with a simple currency symbol based on selectedCountry.
 */
const getPriceWithCurrency = (
  selectedCountry: Country | string | undefined,
  price: number | string | undefined
) => {
  if (price === undefined || price === null || price === "") return "";
  const amount = Number(price);
  if (isNaN(amount)) return String(price);
  const countryCode =
    typeof selectedCountry === "string"
      ? selectedCountry
      : (selectedCountry && (selectedCountry as any).code) || "IND";
  const symbolMap: Record<string, string> = {
    IND: "₹",
    USA: "$",
    US: "$",
    UK: "£",
    EUR: "€",
  };
  const symbol = symbolMap[countryCode] || "₹";
  return `${symbol}${amount.toFixed(2)}`;
};

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

// -------------------- ProductCard --------------------
const ProductCard = ({
  product,
  type,
  selectedCountry,
}: {
  product: any;
  type: string;
  selectedCountry: Country;
}) => {
  const router = useRouter();
  const baseRoute =
    type === "bestsellerProduct"
      ? "/products?bestsellerProduct=true"
      : type === "latestProduct"
      ? "/products?latestProduct=true"
      : "/products?featureProduct=true";

  return (
    <div
      onClick={() => router.push(baseRoute)}
      className="cursor-pointer group w-[14rem] sm:w-[14rem] mx-1"
    >
      <div className="h-[19rem] sm:h-[24rem] rounded-2xl relative overflow-hidden shadow hover:shadow-lg transition-all duration-300">
        <img
          loading="lazy"
          src={product?.img?.[0]}
          alt={product?.name}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 text-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          {product?.name}
        </h3>

        {product?.sizes?.[0] && (
          <div>
            <span className="text-green-600 font-bold">
              {getPriceWithCurrency(
                selectedCountry,
                product.sizes[0].offerPrice
              )}
            </span>
            {product.actualPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">
                {getPriceWithCurrency(selectedCountry, product.actualPrice)}
              </span>
            )}
          </div>
        )}

        {product?.sizes?.length > 1 && (
          <div className="mt-1 flex flex-col gap-1 text-sm">
            {product.sizes.map((size: any) => (
              <span key={size._id || `size-${Math.random()}`}>
                {size.size} | Stock: {size.stock} |{" "}
                {getPriceWithCurrency(selectedCountry, size.offerPrice)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------- BestSelling --------------------
const BestSelling = () => {
  const [bestProduct, setBestProduct] = useState<any>(null);
  const [latestProduct, setLatestProduct] = useState<any>(null);
  const [featureProduct, setFeatureProduct] = useState<any>(null);
  const { selectedCountry } = useCountry();
  const dispatch = useDispatch<any>();

  useEffect(() => {
    const fetchProducts = async (
      filterKey: string,
      setter: React.Dispatch<React.SetStateAction<any>>
    ) => {
      const queryParams = new URLSearchParams({
        [filterKey]: "true",
        sort: "newlyArrived",
        limit: "30",
      });

      try {
        const { payload } = await dispatch(getAllProducts(queryParams.toString()));
        if (payload && payload.success && payload.products && payload.products.length > 0) {
          // Pick the *first product* of each category separately
          setter(payload.products[0]);
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
    <div className={quicksand.className}>
      {/* Section 1 - Best Seller & Latest */}
      <div className="bg-white pb-12 overflow-hidden">
        <h1 className="mt-10 sm:mt-16 mb-8 text-2xl sm:text-4xl font-semibold text-gray-800 text-center animated-underline">
          The Clothing Corner
        </h1>

        <div className="flex justify-center flex-wrap gap-10 md:mx-auto my-12">
          {bestProduct && (
            <ProductCard
              product={bestProduct}
              type="bestsellerProduct"
              selectedCountry={selectedCountry || "IND"}
            />
          )}
          {/* {latestProduct && (
            <ProductCard
              product={latestProduct}
              type="latestProduct"
              selectedCountry={selectedCountry || "IND"}
            />
          )} */}
        </div>
      </div>

      {/* Section 2 - Featured */}
      <div className="pb-12 overflow-hidden">
        <h1 className="mt-10 sm:mt-16 mb-8 text-2xl sm:text-4xl font-semibold text-gray-800 text-center animated-underline">
          The Jewel Box
        </h1>

        <div className="flex justify-center flex-wrap gap-10 md:mx-auto my-12">
          {featureProduct && (
            <ProductCard
              product={featureProduct}
              type="featureProduct"
              selectedCountry={selectedCountry || "IND"}
            />
          )}
        </div>
      </div>

      {/* Global underline animation */}
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
  );
};

export default BestSelling;