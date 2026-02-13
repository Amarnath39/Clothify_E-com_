"use client";
import { getAllProducts } from "@/lib/features/catogary";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import BloodRedButton from "@/components/BloodButton";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import NotFound from "@/components/NotFound";
import ProductFilters from "./ProductFilters";
import { FaFilter, FaHeart, FaRegHeart, FaShoppingBag } from "react-icons/fa";
import { addToCart, removeFromCart } from "@/lib/features/cart";
import { useRouter, useSearchParams } from "next/navigation";
import { toggleItem } from "@/lib/features/wishlist";
import AnimatedSearchInput from "@/components/AnimateSearchInput";
import ProductSizeModal from "@/components/ProductSizeModal";
import StandardProductCard from "@/components/StandardProductCard";


const Products = () => {
  const searchParams = useSearchParams();
  console.log(searchParams, "searchParams");
  const searchQuery = searchParams.get("search") || "";
  const bestSellerProduct = searchParams.get("bestsellerProduct") || "";
  const latestProduct = searchParams.get("latestProduct") || "";
  const featureProduct = searchParams.get("featureProduct") || "";

  console.log(bestSellerProduct, latestProduct, featureProduct, "query");
  const dispatch = useDispatch<any>();
  const [products, setProducts] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const cartItems = useSelector((state: any) => state.cart.items);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const router = useRouter();

  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const isInCart = cartItems?.some(
    (item) =>
      item.id === selectedProduct?._id && item.size._id == selectedSize?._id
  );

  const fetchProducts = useCallback(
    async (page: number, filters: any) => {
      const queryParams = new URLSearchParams({
        categoryId: "",
        page: page.toString(),
        limit: "12",
        search: searchQuery,
        sort: filters?.sort || "",
        material: JSON.stringify(filters.material || []),
        colors: JSON.stringify(filters.color || []),
        minPrice: filters?.price?.[0]?.toString() || "0",
        maxPrice: filters?.price?.[1]?.toString() || "100000",
        bestsellerProduct: bestSellerProduct,
        latestProduct: latestProduct,
        featureProduct: featureProduct,
      });
      setLoading(true);
      try {
        const { payload }: any = await dispatch(getAllProducts(queryParams.toString()));
        console.log(payload, "payload");
        if (payload.success) {
          setProducts(payload);
        } else {
          toast.error(payload.msg);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.msg);
      }
      setLoading(false);
    },
    [dispatch, searchQuery]
  );

  useEffect(() => {
    fetchProducts(currentPage, appliedFilters);
  }, [currentPage, appliedFilters, fetchProducts, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const onApplyFilters = (newFilters) => {
    setAppliedFilters(newFilters);
    setCurrentPage(1);
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hideFilterButton, setHideFilterButton] = useState(false);

  // ✅ ONLY FILTER LOGIC UPDATED (TypeScript-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const grid = document.getElementById("product-grid") as HTMLElement | null;
      if (!grid) return;

      const gridRect = grid.getBoundingClientRect();
      const offset = 20;

      if (gridRect.bottom <= -offset) {
        setHideFilterButton(true);
      } else {
        setHideFilterButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = (size) => {
    if (size?.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    console.log(cartItems, "cartItems");
    if (
      cartItems.some(
        (item) =>
          item.id === selectedProduct._id && item.size._id === selectedSize._id
      )
    ) {
      toast.success("Already in cart");
    } else {
      dispatch(addToCart({ id: selectedProduct._id, size: size }));
      toast.success("Added to cart");
    }
  };

  const handleWishlistToggle = (product, event: MouseEvent) => {
    event.stopPropagation();
    const isInWishlist = wishlistItems.some((item) => item.id === product._id);

    dispatch(
      toggleItem({
        id: product._id,
        name: product.name,
        colors: product.color,
        img: product.img,
        description: product.description,
        amount: product?.sizes[0]?.offerPrice,
      })
    );

    if (isInWishlist) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  };

  const handleRemoveItem = (id, sizeId, event) => {
    event.stopPropagation();
    console.log(id, sizeId, "action");
    dispatch(removeFromCart({ id, sizeId }));
  };

  return (
    <>
      <div
        key={searchQuery}
        className=" mx-auto sm:px-4 py-2 mt-32 sm:mt-36"
      >
        {!isFilterOpen && !hideFilterButton && (
          <button
            className="mobile-filter-btn md:hidden fixed top-[90px] right-4 z-30 bg-black p-4 rounded-full shadow-lg"
            onClick={() => setIsFilterOpen(true)}
          >
            <FaFilter size={24} color="white" />
          </button>
        )}
        <div className="flex flex-col md:flex-row gap-8 ">
          <ProductFilters
            onFilterChange={handleFilterChange}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onfilterApply={onApplyFilters}
          />

          <div key={searchQuery} className="flex-1 md:ml-8 px-2 py-2 mt-4 md:mt-0">
            <div className="flex flex-col md:flex-row gap-8 ">
              <div id="product-grid" className="min-w-[60vw] mx-auto">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <Card
                        key={index}
                        className="flex flex-col overflow-hidden"
                      >
                        <CardContent className="flex-grow p-0">
                          <div className="relative">
                            <Skeleton height={350} />
                            <div className="absolute top-2 right-2">
                              <Skeleton circle width={30} height={30} />
                            </div>
                          </div>
                          <div className="p-2 sm:p-3 md:p-4 flex flex-col py-2 sm:py-2 md:py-2">
                            <CardHeader className="p-0">
                              <Skeleton width="80%" height={24} />
                            </CardHeader>
                            <div className="flex justify-between items-center mt-1 sm:mt-2">
                              <div className="flex flex-col">
                                <Skeleton width={60} height={24} />
                                <Skeleton width={40} height={16} />
                              </div>
                              <Skeleton width={40} height={24} />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0 md:pt-0">
                          <Skeleton width="100%" height={36} />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : products.products?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {products.products.map((product: any) => (
                      <StandardProductCard
                        key={product._id}
                        product={product}
                      />
                    ))}
                  </div>
                ) : (
                  <NotFound height="80vh" text="Products" />
                )}
                {products.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={products.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {products && products.products && products.products.length > 0 && (
        <ProductSizeModal
          isOpen={isSizeModalOpen}
          onClose={() => setIsSizeModalOpen(false)}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          setSelectedSize={setSelectedSize}
          selectedSize={selectedSize}
          isInCart={isInCart}
        />
      )}
    </>
  );
};

export default Products;
