"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProductsById } from "@/lib/features/catogary";
import { Button } from "@/components/ui/button";
import {
  FaStar,
  FaArrowLeft,
  FaTshirt
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
import ZoomableImage from "@/components/ZoomableImage";
import ProductSizeModal from "@/components/ProductSizeModal"; // Import just in case, though we used buttons

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const wishlistItems = useSelector((state: any) => state.wishlist?.items || []);
  const cartItems = useSelector((state: any) => state.cart?.items || []);

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

  // const handleQuantityChange = (type: "inc" | "dec") => {
  //   if (type === "inc") setQuantity(q => q + 1);
  //   if (type === "dec") setQuantity(q => Math.max(1, q - 1));
  // };
  const handleQuantityChange = (type: "inc" | "dec") => {
    setQuantity((q) => {
      if (type === "inc") {
        // 🚫 block if quantity reached stock
        if (q >= selectedSize.stock) return q;
        return q + 1;
      }

      if (type === "dec") {
        return Math.max(1, q - 1);
      }

      return q;
    });
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
    <div className="container mx-auto px-4 md:px-6 py-6">
      <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-[#b48a3c] transition-colors" 
      onClick={() => router.back()}
      >
        <FaArrowLeft className="mr-2" /> Back
      </Button>
    

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Left: Gallery */}
        <div className="flex flex-col gap-4 lg:max-h-[calc(100vh-8rem)]">

          {/* Main Image */}
          {/* <div className="flex-1 bg-gray-50 aspect-[3/4] relative overflow-hidden group">
            <img
              src={productData.img[currentIndex]}
              alt={productData.name}
              className="w-full h-full object-contain mix-blend-multiply cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute top-4 right-4 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            > */}
          {/* <FaTshirt /> Placeholder for zoom icon */}
          {/* </button> */}

          {/* Zoom Modal Logic */}
          {/* {isModalOpen && (
              <ProductGalleryPage
                productData={productData}
                setIsModalOpen={setIsModalOpen}
                isModalOpen={isModalOpen}
              />
            )}
          </div> */}

          {/* Main Image */}
          <div className="flex-1 bg-gray-50 aspect-[3/4] relative overflow-hidden">
            <ZoomableImage
              src={productData.img[currentIndex]}
              alt={productData.name}
              className="w-full h-full"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute top-4 right-4 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FaTshirt /> {/* You can replace this with a fullscreen icon if you prefer */}
            </button>
          </div>

          {/* Thumbnails (bottom row) */}
          <div className="flex gap-2 overflow-x-auto py-1">

            {productData.img?.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-20 flex-shrink-0 border transition-all ${currentIndex === idx
                  ? "border-[#b48a3c]"
                  : "border-transparent hover:border-gray-200"
                  }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

        </div>
        {/* ------------------- */}


        {/* Right: Info */}
        <div className="flex flex-col lg:sticky lg:top-28 self-start">
          <div className="mb-8 border-b border-gray-100 pb-8">
            {productData.categories && productData.categories.length > 0 && (
              <span className="text-sm text-[#b48a3c] font-medium tracking-widest uppercase mb-2 block">
                {typeof productData.categories[0] === 'object' ? productData.categories[0].name : "Collection"}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              {productData.name}
            </h1>

            {/* Rating Placeholder (if data exists) */}
            {productData.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-[#b48a3c]">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < Math.floor(productData.rating.star || 4.5) ? "" : "text-gray-200"} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({productData.rating.ratedBy || 12} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-medium text-gray-900">
                ₹{selectedSize?.offerPrice?.toLocaleString() || productData.actualPrice?.toLocaleString()}
              </span>
              {productData.actualPrice && selectedSize?.offerPrice && productData.actualPrice > selectedSize.offerPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through font-light">
                    ₹{productData.actualPrice.toLocaleString()}
                  </span>
                  <span className="text-red-600 text-sm font-bold bg-red-50 px-2 py-1 rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
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
                className={`px-4 py-2 border mr-2 ${selectedSize?._id === size._id
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

      <ProductSizeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={productData}
        onAddToCart={handleAddToCart}
        setSelectedSize={setSelectedSize}
        selectedSize={selectedSize}
        isInCart={isInCart}
      />
    </div>
  );
};

const ProductDetailsSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <Skeleton className="h-[500px] w-full" />
  </div>
);

export default ProductDetails;
