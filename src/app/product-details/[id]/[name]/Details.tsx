"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProductsById } from "@/lib/features/catogary";
import { Button } from "@/components/ui/button";
import {
  FaStar,
  FaArrowLeft,
} from "react-icons/fa";
import { Minus, Plus, Heart } from "lucide-react";

import { toggleItem } from "@/lib/features/wishlist";
import { addToCart, removeFromCart } from "@/lib/features/cart";
import { addRecentlyViewed } from "@/lib/features/recentlyViewed";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import UniversalShare from "@/components/UniversalShare";
import RecentlyViewed from "@/components/RecentlyViewed";
import YouMayAlsoLike from "@/components/YouMayAlsoLike";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetails = ({
  params,
}: {
  params: { id: string; name: string };
}) => {
  const dispatch = useDispatch<any>();
  const router = useRouter();

  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentIndex] = useState(0);

  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const cartItems = useSelector((state: any) => state.cart.items);

  const isWishlist =
    productData && wishlistItems.some((i: any) => i.id === productData._id);

  const isInCart =
    productData &&
    cartItems.some(
      (item: any) =>
        item.id === productData._id &&
        item.size?._id === selectedSize?._id
    );

  const isPreBooking = productData?.is_prebooking;

  /* ---------------- FETCH PRODUCT ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { payload }: any = await dispatch(getProductsById(params.id));

      if (payload?.success) {
        setProductData(payload.product);
        setSelectedSize(payload.product?.sizes?.[0] || null);
        dispatch(addRecentlyViewed(payload.product));
      }

      setLoading(false);
    };

    fetchData();
  }, [params.id, dispatch]);

  const handleQuantityChange = (type: "inc" | "dec") => {
    setQuantity((q) => (type === "inc" ? q + 1 : Math.max(1, q - 1)));
  };

  /* ---------------- ADD TO CART (TOGGLE) ---------------- */
  const handleAddToCart = () => {
    if (!selectedSize) return;

    if (selectedSize.stock <= 0 && !isPreBooking) {
      toast.error("Out of stock");
      return;
    }

    if (isInCart) {
      dispatch(
        removeFromCart({
          id: productData._id,
          sizeId: selectedSize._id,
        })
      );
      toast.success("Removed from cart");
    } else {
      dispatch(
        addToCart({
          id: productData._id,
          size: selectedSize,
          quantity,
        })
      );
      toast.success("Added to cart");
    }
  };

  /* ---------------- BUY NOW ---------------- */
  const handleBuyNow = () => {
    if (!selectedSize) return;

    if (!isInCart) {
      dispatch(
        addToCart({
          id: productData._id,
          size: selectedSize,
          quantity,
        })
      );
    }

    router.push("/cart");
  };

  const toggleWishlistHandler = () => {
    if (!productData) return;

    dispatch(
      toggleItem({
        id: productData._id,
        name: productData.name,
        description: productData.description || "",
        amount: selectedSize?.offerPrice ?? productData.actualPrice,
        img: productData.img,
        colors: productData.colors ?? [],
      })
    );

    toast.success(
      isWishlist ? "Removed from wishlist" : "Added to wishlist"
    );
  };

  if (loading) return <ProductDetailsSkeleton />;

  if (!productData)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif">Product Not Found</h2>
      </div>
    );

  const discount =
    productData.actualPrice && selectedSize?.offerPrice
      ? Math.round(
          ((productData.actualPrice - selectedSize.offerPrice) /
            productData.actualPrice) *
            100
        )
      : 0;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 pt-10">
      <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.back()}>
        <FaArrowLeft className="mr-2" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* LEFT IMAGE */}
        <div className="bg-gray-50 flex items-center justify-center h-[60vh]">
          <img
            src={productData.img[currentIndex]}
            alt={productData.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* RIGHT */}
        <div>
          <span className="text-sm tracking-widest text-[#b48a3c] uppercase">
            Saree
          </span>

          <h1 className="text-3xl font-serif font-bold mb-2">
            {productData.name}
          </h1>

          {/* ⭐ STAR RATING */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-[#c9a14a]">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={
                    i < Math.floor(productData?.rating?.star || 4)
                      ? "text-[#c9a14a]"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({productData?.rating?.ratedBy || 65} reviews)
            </span>
          </div>

          {/* PRICE */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-medium">
              ₹{selectedSize?.offerPrice || productData.actualPrice}
            </span>
            {discount > 0 && (
              <span className="text-red-600 font-bold">{discount}% OFF</span>
            )}
          </div>

          {/* SIZE */}
          <div className="mb-6">
            <span className="block mb-2 font-medium">Size</span>
            {productData.sizes.map((size: any) => (
              <button
                key={size._id}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 border mr-2 ${
                  selectedSize?._id === size._id
                    ? "bg-black text-white"
                    : ""
                }`}
              >
                {size.size}
              </button>
            ))}
          </div>

          {/* QUANTITY + ICONS */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border px-3 py-2">
              <button onClick={() => handleQuantityChange("dec")}>
                <Minus size={16} />
              </button>
              <span className="px-4">{quantity}</span>
              <button onClick={() => handleQuantityChange("inc")}>
                <Plus size={16} />
              </button>
            </div>

            <Button variant="ghost" size="icon" onClick={toggleWishlistHandler}>
              <Heart
                className={isWishlist ? "fill-red-600 text-red-600" : ""}
              />
            </Button>

            <UniversalShare
              product={productData}
              currentPrice={selectedSize?.offerPrice}
            />
          </div>

          {/* ACTIONS */}
          <div className="space-y-4">
            <Button
              onClick={handleAddToCart}
              className="w-full bg-[#7b1e3a] text-white h-12"
            >
              {isInCart ? "REMOVE FROM CART" : "ADD TO CART"}
            </Button>

            <Button
              onClick={handleBuyNow}
              variant="outline"
              className="w-full h-12 border-[#7b1e3a] text-[#7b1e3a]"
            >
              BUY NOW
            </Button>
          </div>
        </div>
      </div>

      <RecentlyViewed />
      <YouMayAlsoLike currentProductId={productData._id} />
    </div>
  );
};

const ProductDetailsSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <Skeleton className="h-[500px] w-full" />
  </div>
);

export default ProductDetails;
