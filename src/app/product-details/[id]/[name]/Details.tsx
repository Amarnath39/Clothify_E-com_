"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProductsById } from "@/lib/features/catogary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FaHeart,
  FaShoppingCart,
  FaStar,
  FaTruck,
  FaCheckCircle,
  FaTshirt,
  FaArrowLeft,
} from "react-icons/fa";
import { Minus, Plus, ShoppingBag, Heart } from "lucide-react";

import { toggleItem } from "@/lib/features/wishlist";
import { addToCart, removeFromCart } from "@/lib/features/cart";
import { addRecentlyViewed } from "@/lib/features/recentlyViewed"; // Added import
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Using UI lib component if available, or keep radix

import ProductGalleryPage from "../../FullScreenCrousel";
import CountDownTimer from "@/components/CountDownTimer";
import UniversalShare from "@/components/UniversalShare";
import RecentlyViewed from "@/components/RecentlyViewed";    // New Component
import YouMayAlsoLike from "@/components/YouMayAlsoLike";    // New Component
import { Skeleton } from "@/components/ui/skeleton";
import ZoomableImage from "@/components/ZoomableImage";
import ProductSizeModal from "@/components/ProductSizeModal"; // Import just in case, though we used buttons


// Re-implementing ProductDetails with new UI logic
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
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Selectors
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const cartItems = useSelector((state: any) => state.cart.items);

  const isWishlist = productData && wishlistItems.some((item) => item.id === productData._id);
  const isInCart = productData && cartItems.some(
    (item) => item.id === productData._id && item.size._id == selectedSize?._id
  );

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { payload }: any = await dispatch(getProductsById(params?.id));

        if (payload?.success) {
          setProductData(payload?.product);
          setSelectedSize(payload?.product?.sizes?.[0] || null);

          // Add to Recently Viewed
          dispatch(addRecentlyViewed(payload.product));
        } else {
          setProductData(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params?.id, dispatch]);


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

  // Proceeding with toggle logic

  const handleAddToCart = () => {
    if (!selectedSize) return;

    if (selectedSize.stock <= 0 && !isPreBooking) {
      toast.error("Out of stock");
      return;
    }

    if (isInCart) {
      // Toggle Remove
      dispatch(removeFromCart({ id: productData._id, sizeId: selectedSize._id }));
      toast.success("Removed from cart");
    } else {
      // Add
      dispatch(addToCart({ id: productData._id, size: selectedSize, quantity }));
      toast.success("Added to cart");
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  const toggleWishlistHandler = () => {
    if (!productData) return;
    dispatch(
      toggleItem({
        id: productData._id,
        name: productData.name,
        description: productData.description,
        amount: selectedSize?.offerPrice || productData.actualPrice,
        colors: productData.colors || [],
        img: productData.img,
      })
    );
    toast.success(isWishlist ? "Removed from wishlist" : "Added to wishlist");
  };


  if (loading) return <ProductDetailsSkeleton />;

  if (!productData) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif text-gray-900">Product Not Found</h2>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const isPreBooking = productData?.is_prebooking;
  const isPreBookingEnded = isPreBooking && productData?.prebooking_end_at && new Date(productData.prebooking_end_at) < new Date();
  const isOutOfStock = selectedSize ? (selectedSize.stock === 0 && !isPreBooking) : true;
  const discount = productData.actualPrice && selectedSize?.offerPrice
    ? Math.round(((productData.actualPrice - selectedSize.offerPrice) / productData.actualPrice) * 100)
    : 0;


  return (
    <div className="container mx-auto px-4 md:px-6 py-6">
      <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-[#b48a3c] transition-colors" onClick={() => router.back()}>
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

            {/* Prebooking Timer */}
            {isPreBooking && productData.prebooking_end_at && !isPreBookingEnded && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="font-semibold text-blue-900 mb-2 text-sm uppercase tracking-wide">Pre-Booking Ends In:</p>
                <CountDownTimer targetDate={productData.prebooking_end_at} />
              </div>
            )}

            {/* Size Selector */}
            {productData.sizes && productData.sizes.length > 0 && (
              <div className="mb-6">
                <span className="font-medium text-gray-900 mb-3 block">Size</span>
                <div className="flex flex-wrap gap-2">
                  {productData.sizes.map((size: any) => (
                    <button
                      key={size._id}
                      onClick={() => setSelectedSize(size)}
                      disabled={size.stock === 0 && !isPreBooking}
                      className={`px-4 py-2 border text-sm font-medium transition-all
                                            ${selectedSize?._id === size._id
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-800"
                        }
                                            ${size.stock === 0 && !isPreBooking ? "opacity-40 cursor-not-allowed decoration-slice" : ""}
                                        `}
                    >
                      {size.size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-6 mb-8">
            {/* Quantity */}
            <div className="flex items-center gap-6">
              <span className="font-medium text-gray-900">Quantity</span>
              <div className="flex items-center border border-gray-200">
                <button onClick={() => handleQuantityChange("dec")} className="p-3 hover:bg-gray-50 text-gray-600 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-medium">
                  {quantity}
                </span>
                <button onClick={() => handleQuantityChange("inc")} className="p-3 hover:bg-gray-50 text-gray-600 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 border border-gray-200"
                onClick={toggleWishlistHandler}
              >
                <Heart className={isWishlist ? "fill-red-600 text-red-600" : "text-gray-400"} />
              </Button>
              <UniversalShare product={productData} currentPrice={selectedSize?.offerPrice} />
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isPreBookingEnded}
                size="lg"
                className="w-full h-14 bg-[#7b1e3a] text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-center"

              >
                {isInCart ? "Remove from Cart" : (isPreBooking ? "Pre-Book Now" : "Add to Cart")}
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={isOutOfStock || isPreBookingEnded}
                variant="outline"
                size="lg"
                className="w-full h-14 border border-[#7b1e3a] text-[#7b1e3a] uppercase tracking-wider font-semibold flex items-center justify-center hover:bg-[#7b1e3a] hover:text-white transition-colors duration-300"

              >
                Buy Now
              </Button>
            </div>


          </div>

          {/* Details Section */}
          <div className="pt-6 border-t border-gray-100 space-y-6 text-sm">

            {/* Row 1: Description + Material */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Description */}
              <div>
                <span className="block text-gray-500 mb-1">Description</span>
                <p className="font-medium text-gray-900 leading-relaxed">
                  {productData.description}
                </p>
              </div>

              {/* Material */}
              {productData.material && (
                <div>
                  <span className="block text-gray-500 mb-1">Material</span>
                  <span className="font-medium text-gray-900">
                    {Array.isArray(productData.material)
                      ? productData.material.join(", ")
                      : productData.material}
                  </span>
                </div>
              )}
            </div>

            {/* Row 2: Shipping (spans both columns) */}
            <div className="sm:col-span-2 space-y-3 text-gray-600">
              <span className="block text-gray-500">Shipping</span>
              <p className="font-medium text-gray-900">
                Free shipping on all orders above ₹5000. Standard delivery
                takes 5–7 business days. Express delivery available at checkout.
              </p>

              {productData.returnRules && productData.returnRules.length > 0 && (
                <div>
                  <span className="block text-gray-900 font-medium mb-2">
                    Return Policy
                  </span>
                  <ul className="list-disc list-inside space-y-1">
                    {productData.returnRules.map((rule: any, i: number) => (
                      <li key={i}>{rule.rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>


          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 mb-8 pt-6 border-t border-gray-100">
            <div className="flex flex-col items-center text-center gap-2">
              <FaTruck className="text-[#b48a3c] text-xl" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <FaCheckCircle className="text-[#b48a3c] text-xl" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">Authentic</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <FaTshirt className="text-[#b48a3c] text-xl" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">Premium Quality</span>
            </div>
          </div>


        </div>
      </div>

      {/* Recommendations */}
      <div className="w-full overflow-x-hidden space-y-12">
        <RecentlyViewed />
        <YouMayAlsoLike currentProductId={productData._id} currentCategory={productData.categories?.[0]?._id} />
      </div>
    </div>
  );
};


const ProductDetailsSkeleton = () => (
  <div className="container mx-auto px-4 py-8 mt-16">
    <div className="grid md:grid-cols-2 gap-8">
      <Skeleton className="h-[500px] w-full rounded-lg bg-gray-100" />
      <div>
        <Skeleton className="h-8 w-3/4 mb-4 bg-gray-100" />
        <Skeleton className="h-4 w-1/2 mb-4 bg-gray-100" />
        <Skeleton className="h-16 w-full mb-6 bg-gray-100" />
        <div className="flex space-x-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-16 h-20 bg-gray-100" />
          ))}
        </div>
        <Skeleton className="h-40 w-full bg-gray-100" />
      </div>
    </div>
  </div>
);

export default ProductDetails;
