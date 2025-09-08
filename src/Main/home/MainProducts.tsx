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

import { FaFilter, FaHeart, FaRegHeart, FaShoppingBag } from "react-icons/fa";
import { addToCart, removeFromCart } from "@/lib/features/cart";
import { useRouter, useSearchParams } from "next/navigation";
import { toggleItem } from "@/lib/features/wishlist";
import AnimatedSearchInput from "@/components/AnimateSearchInput";
import ProductSizeModal from "@/components/ProductSizeModal";

const MainProducts = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const dispatch = useDispatch<any>();
  const [products, setProducts] = useState<any>({});

  const cartItems = useSelector((state: any) => state.cart.items);
  const [loading, setLoading] = useState(true);
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
    async (page: number) => {
      const queryParams = new URLSearchParams({
        categoryId: "",
        page: page.toString(),
        limit: "8",
        search: searchQuery,
        sort: "newlyArrived",
      });
      setLoading(true);
      try {
        const { payload }: any = await dispatch(getAllProducts(queryParams));
        console.log(payload, "payload");
        if (payload.success) {
          setProducts(payload);
        } else {
          toast.error(payload.msg);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.msg);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, searchQuery]
  );

  useEffect(() => {
    fetchProducts(1);
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
       <h1 className="relative text-3xl tracking-wider py-2 pt-6 text-center mx-auto animated-underline">
    Check our selection
  </h1>
      <div key={searchQuery} className="mx-auto px-4 py-2 mt-10">
        <div className="flex flex-col md:flex-row gap-8 ">
          <div className="min-w-[90vw] mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="flex flex-col overflow-hidden">
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
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4">
                {products.products.map((product: any) => (
                  <div
                    style={{ border: "none" }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/product-details/${
                        product._id
                      }/${product.name.split(" ").join("-")}`;
                    }}
                    key={product._id}
                    className="flex flex-col overflow-hidden group cursor-pointer relative rounded-2xl bg-white border-none"
                  >
                    <CardContent className="flex-grow p-0">
                      <div className="relative overflow-hidden rounded-2xl">
                        <img
                          src={product.img[0]}
                          alt={product.name}
                        className="object-cover object-center w-full h-[300px] sm:h-[400px] transition-transform duration-300 ease-in-out hover:scale-[1.02] sm:hover:scale-105"

                        />
                        {product.img[1] && (
                          <img
                            src={product.img[1]}
                            alt={product.name}
                            className="absolute top-0 left-0 object-cover w-full h-[400px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                          />
                        )}
                        <button
                          onClick={(e: any) => handleWishlistToggle(product, e)}
                          className="absolute top-3 right-3 text-red-600 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm"
                        >
                          {wishlistItems.some((item) => item.id === product._id) ? (
                            <FaHeart size={20} />
                          ) : (
                            <FaRegHeart size={20} />
                          )}
                        </button>
                        {/* Shopping Bag Icon - Hidden on mobile, shows on hover for larger screens */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSizeModalOpen(true);
                            setSelectedProduct(product);
                          }}
                          className="absolute bottom-3 right-3 text-white bg-black/80 backdrop-blur-sm rounded-full p-3 shadow-sm 
                                    transition-all duration-300 ease-in-out
                                    md:opacity-0 md:translate-y-full md:group-hover:opacity-100 md:group-hover:translate-y-0"
                        >
                          <FaShoppingBag size={20} />
                        </button>
                      </div>
                      <div className="p-4 flex flex-col space-y-2">
  <CardTitle className="text-base font-medium text-gray-900 h-[3.6em] line-clamp-2">
                          {product.name}
                        </CardTitle>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-xl font-semibold text-gray-900">
                            ₹{product.sizes[0].offerPrice.toFixed(2)}
                          </span>
                          {product.actualPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{product.actualPrice}
                            </span>
                          )}
                          {product?.off > 0 && (
                            <span className="text-sm font-medium text-red-600">
                              {Math.round(product?.off)}% OFF
                            </span>
                          )}
                        </div>
                        {product.sizes.length > 1 && (
                          <span className="text-sm text-gray-600">
                            +{product?.sizes?.length - 1} More sizes available
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </div>
                ))}
              </div>
            ) : (
              <NotFound height="80vh" text="Products" />
            )}
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

export default MainProducts;
