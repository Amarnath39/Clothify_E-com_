// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { getProductsById } from "@/lib/features/catogary";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselNext,
//   CarouselPrevious,
//   type CarouselApi,
// } from "@/components/ui/carousel";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import {
//   FaHeart,
//   FaShoppingCart,
//   FaStar,
//   FaTruck,
//   FaUndo,
//   FaExpand,
//   FaTrash,
//   FaCheckCircle,
//   FaTshirt,
//   FaWhatsapp,
// } from "react-icons/fa";
// import { Swiper, SwiperSlide } from "swiper/react";
// import { FreeMode, Navigation, Thumbs } from "swiper/modules";
// import type { Swiper as SwiperType } from "swiper";
// import "swiper/css";
// import "swiper/css/free-mode";
// import "swiper/css/navigation";
// import "swiper/css/thumbs";
// import useWindowSize from "@/hooks/useWindowSize";
// import BloodRedButton from "@/components/BloodButton";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@radix-ui/react-tooltip";

// import { toggleItem } from "@/lib/features/wishlist";
// import toast from "react-hot-toast";
// import { addToCart, removeFromCart } from "@/lib/features/cart";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Quicksand } from "next/font/google";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
// import ProductGalleryPage from "../../FullScreenCrousel";
// const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

// const ProductDetails = ({
//   params,
// }: {
//   params: { id: string; name: string };
// }) => {
//   const dispatch = useDispatch<any>();
//   const [productData, setProductData] = useState<any>({});
//   const [loading, setLoading] = useState(true);
//   const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);

//   const [showZoom, setShowZoom] = useState(false);
//   const mainImageRef = useRef<HTMLDivElement>(null);
//   const [swiperReady, setSwiperReady] = useState(false);
//   const [activeIndex, setActiveIndex] = useState(0);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const { width } = useWindowSize();
//   const wishlistItems = useSelector((state: any) => state.wishlist.items);
//   const isWishlist = wishlistItems.some((item) => item.id === productData?._id);
//   const cartItems = useSelector((state: any) => state.cart.items);
//   const [selectedSize, setSelectedSize] = useState<any>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const router = useRouter();
//   const isInCart = cartItems.some(
//     (item) => item.id === productData?._id && item.size._id == selectedSize?._id
//   );
//   const [activeTab, setActiveTab] = useState("description");

//   const callGetAllProductsById = async () => {
//     try {
//       setLoading(true);
//       const { payload }: any = await dispatch(getProductsById(params?.id));

//       if (payload?.success) {
//         setProductData(payload?.product);

//         setSelectedSize(payload?.product?.sizes[0]);
//       } else {
//         setProductData(null);
//       }
//     } catch (error) {
//       console.error("Error fetching product data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     callGetAllProductsById();
//   }, [params?.id]);

//   const [api, setApi] = useState<CarouselApi>();

//   useEffect(() => {
//     if (!api) {
//       return;
//     }

//     api.on("select", () => {
//       setCurrentIndex(api.selectedScrollSnap());
//     });
//   }, [api]);

//   const handleThumbnailClick = (index) => {
//     setCurrentIndex(index);
//   };

//   useEffect(() => {
//     if (mainSwiper) {
//       setSwiperReady(true);
//       mainSwiper.on("slideChange", () => {
//         setActiveIndex(mainSwiper.activeIndex);
//       });
//     }
//   }, [mainSwiper]);

//   const toggleWishlist = () => {
//     dispatch(
//       toggleItem({
//         id: productData._id,
//         name: productData.name,
//         description: productData.description,
//         amount: productData.sizes[0].offerPrice,
//         colors: ["red"],
//         img: productData.img,
//       })
//     );

//     if (isWishlist) {
//       toast.success(`${productData.name} Removed from wishlist`);
//     } else {
//       toast.success(`${productData.name} Added to wishlist`);
//     }
//   };

//   const handleAddtoCart = (size) => {
//     if (isInCart) {
//       dispatch(removeFromCart({ id: productData._id, sizeId: size._id }));
//       toast.success(`${productData.name} remove from cart`);
//     } else {
//       dispatch(addToCart({ id: productData._id, size: size }));
//       toast.success(`${productData.name} added to cart`);
//     }
//   };

//   const handleBuyNow = () => {
//     if (!isInCart) {
//       dispatch(addToCart({ id: productData._id, size: selectedSize }));
//       toast.success(`${productData.name} added to cart`);
//     }
//     router.push('/cart');
//   };

//   const handleWhatsAppShare = () => {
//     const message = `Check out this product: ${productData.name}\nPrice: ₹${selectedSize ? selectedSize.offerPrice : productData.actualPrice}\n${window.location.href}`;
//     const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
//     window.open(whatsappUrl, '_blank');
//   };

//   if (loading) {
//     return <ProductDetailsSkeleton />;
//   }
//   const hasAdditionalDetails =
//     productData?.additionalFields &&
//     Object?.keys(productData?.additionalFields).length > 0;

//   console.log(hasAdditionalDetails);
//   if (!productData) {
//     return (
//       <div className="container mx-auto px-4 py-6 mt-8 sm:py-12 sm:mt-16 min-h-[50vh]">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">
//             Product Not Found
//           </h2>
//           <p className="text-gray-600">
//             The product you are looking for does not exist or has been removed.
//           </p>
//           <Button className="mt-6" onClick={() => window.history.back()}>
//             Go Back
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   const hasContent = (data) => {
//     if (Array.isArray(data)) return data.length > 0;
//     if (typeof data === "object") return Object.keys(data).length > 0;
//     return !!data;
//   };

//   return (
//     <div className="container mx-auto px-4 py-6 sm:py-12 mt-20 sm:mt-24 min-h-[90vh] ">
//       <div className="grid lg:grid-cols-2 gap-12 items-start">
//         <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
//           {/* Thumbnail Navigation */}
//           <div className="hidden sm:flex flex-col space-y-2">
//             {productData?.img?.map((image, index) => (
//               <button
//                 key={index}
//                 onClick={() => {
//                   handleThumbnailClick(index);
//                   setIsModalOpen(true);
//                 }}
//                 className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
//                   currentIndex === index
//                     ? "border-indigo-500"
//                     : "border-gray-300"
//                 }`}
//               >
//                 <img
//                   src={image}
//                   alt={`Thumbnail ${index + 1}`}
//                   className="w-full h-full object-cover"
//                 />
//               </button>
//             ))}
//           </div>

//           {/* Main Image */}
//           <div className="w-full max-w-lg">
//             {productData?.img && productData.img.length > 0 && (
//               <img
//                 src={productData.img[currentIndex]}
//                 alt={productData?.name}
//                 className="w-full h-[400px] sm:h-[650px] rounded-lg shadow-lg transition-all duration-300 cursor-pointer"
//                 onClick={() => setIsModalOpen(true)}
//               />
//             )}
//           </div>

//           {/* for small device thumbnail */}
//           <div className="sm:hidden flex justify-center mt-4 space-x-2 overflow-x-auto">
//             {productData?.img?.map((image, index) => (
//               <button
//                 key={index}
//                 onClick={() => handleThumbnailClick(index)}
//                 className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
//                   currentIndex === index
//                     ? "border-indigo-500"
//                     : "border-gray-300"
//                 }`}
//               >
//                 <img
//                   src={image}
//                   alt={`Thumbnail ${index + 1}`}
//                   className="w-full h-full object-cover"
//                 />
//               </button>
//             ))}
//           </div>
//           {isModalOpen && (
//             <ProductGalleryPage
//               productData={productData}
//               setIsModalOpen={setIsModalOpen}
//               isModalOpen={isModalOpen}
//             />
//           )}
//         </div>

//         {/* Product Details */}
//         <div className="space-y-4">
//           <h1 className="text-2xl sm:text-4xl font-medium capitalize tracking-wide text-primaryRed">
//             {productData?.name}
//           </h1>
//           {/* <div className="flex items-center space-x-2">
//             <div className="flex">
//               {[...Array(productData?.rating?.star)].map((_, i) => (
//                 <FaStar key={i} className="w-5 h-5 text-yellow-400" />
//               ))}
//             </div>
//             <span className="text-gray-600">
//               ({productData?.rating?.ratedBy} reviews)
//             </span>
//           </div> */}
//           <div className="text-2xl font-semibold">
//             ₹{selectedSize ? selectedSize.offerPrice : productData.actualPrice}
//             <span className="ml-2 text-lg text-gray-500 line-through">
//               ₹{productData.actualPrice}
//             </span>
//           </div>

//           {/* Tabs with Border Bottom Effect */}
//           <Tabs defaultValue="description" onValueChange={setActiveTab}>
//             <TabsList className="flex border-b border-gray-300">
//               <TabsTrigger
//                 value="description"
//                 className={`pb-2 transition-all px-2 border-b-2 ${
//                   activeTab === "description"
//                     ? "border-indigo-500"
//                     : "border-transparent"
//                 }`}
//               >
//                 Description
//               </TabsTrigger>
//               <TabsTrigger
//                 value="material"
//                 className={`pb-2 transition-all px-2 border-b-2 ${
//                   activeTab === "material"
//                     ? "border-indigo-500"
//                     : "border-transparent"
//                 }`}
//               >
//                 Material & Dimensions
//               </TabsTrigger>
//               <TabsTrigger
//                 value="return"
//                 className={`pb-2 transition-all px-3 border-b-2 ${
//                   activeTab === "return"
//                     ? "border-indigo-500"
//                     : "border-transparent"
//                 }`}
//               >
//                 Return Rules
//               </TabsTrigger>
//               <TabsTrigger
//                 value="additional"
//                 className={`pb-2 transition-all px-3 border-b-2 ${
//                   activeTab === "additional"
//                     ? "border-indigo-500"
//                     : "border-transparent"
//                 }`}
//               >
//                 Other Infornation
//               </TabsTrigger>
//             </TabsList>
//             <TabsContent value="description" className="pt-4">
//               {productData?.description}
//             </TabsContent>
//             <TabsContent value="material" className="pt-4">
//               {productData?.material}
//             </TabsContent>
//             <TabsContent value="return" className="pt-4">
//               {productData?.returnRules?.map((rule, index) => (
//                 <li key={index}>{rule.rule}</li>
//               ))}
//             </TabsContent>
//             <TabsContent value="additional" className="pt-4">
//               {hasAdditionalDetails && (
//                 <div className="">
//                   <ul className=" list-disc list-inside space-y-2 text-gray-600">
//                     {Object?.entries(productData.additionalFields).map(
//                       ([key, value], index) => (
//                         <li key={index}>
//                           <strong>{key}: </strong>
//                           {String(value)}
//                         </li>
//                       )
//                     )}
//                   </ul>
//                 </div>
//               )}
//             </TabsContent>
//           </Tabs>

//           <div>
//             <h3 className="text-base sm:text-lg font-semibold mb-2">Colors:</h3>
//             <div className="flex gap-1 items-center">
//               <div
//                 className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-red cursor-pointer hover:scale-110 transition duration-300"
//                 style={{ backgroundColor: productData?.color }}
//               ></div>
//               <div className="flex space-x-2">
//                 {productData?.colors?.map((color: any) => (
//                   <Link
//                     href={`/product-details/${color.varientId}/${params.name}`}
//                     key={color.varientId}
//                     className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300 cursor-pointer hover:scale-110 transition duration-300"
//                     style={{ backgroundColor: color.color }}
//                   ></Link>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* sizes */}

//           {productData.sizes && productData.sizes.length > 0 && (
//             <div
//               className={`${
//                 productData.sizes[0].type == "Others" ? "hidden" : ""
//               }`}
//             >
//               <h4 className="text-sm font-medium text-theme-secondary mb-2">
//                 Size:
//               </h4>
//               <div className="flex flex-wrap gap-2 size-div">
//                 {productData.sizes.map((size) => (
//                   <Button
//                     title={
//                       size.stock === 0
//                         ? "No Stock Left "
//                         : `Size - ${size.size}`
//                     }
//                     key={size.id}
//                     variant={
//                       selectedSize && selectedSize._id === size._id
//                         ? "default"
//                         : "outline"
//                     }
//                     className={`px-3 py-1 ${
//                       size.stock === 0 ? "opacity-50 " : ""
//                     }`}
//                     onClick={() => setSelectedSize(size)}
//                     disabled={size.stock === 0}
//                   >
//                     {size.size}
//                   </Button>
//                 ))}
//               </div>
//             </div>
//           )}

//           <div className="space-y-3">
//             <div className="flex space-x-4">
//               <Button
//                 onClick={() => handleAddtoCart(selectedSize)}
//                 className="py-6 text-lg w-full flex items-center justify-center"
//               >
//                 {isInCart ? (
//                   <span className="flex items-center">
//                     <FaTrash className="mr-2" /> Remove from cart
//                   </span>
//                 ) : (
//                   <span className="flex items-center">
//                     <FaShoppingCart className="mr-2" /> Add to Cart
//                   </span>
//                 )}
//               </Button>
//               <Button
//                 variant="outline"
//                 className="w-12 h-12 flex items-center justify-center"
//                 onClick={toggleWishlist}
//               >
//                 <FaHeart
//                   className={`${isWishlist ? "text-red-500" : "text-gray-400"}`}
//                 />
//               </Button>
//             </div>
//             <div className="flex space-x-4">
//               <Button
//                 onClick={handleBuyNow}
//                 className="py-6 text-lg w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700"
//               >
//                 Buy Now
//               </Button>
//               <Button
//                 variant="outline"
//                 className="w-12 h-12 flex items-center justify-center bg-green-50 hover:bg-green-100"
//                 onClick={handleWhatsAppShare}
//               >
//                 <FaWhatsapp className="text-green-600" />
//               </Button>
//             </div>
//           </div>

//           <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
//             <div className="flex items-center">
//               <FaTruck className="mr-2" /> Fast Delivery
//             </div>
//             <div className="flex items-center">
//               <FaCheckCircle className="mr-2" /> Quality Approved
//             </div>
//             <div className="flex items-center">
//               <FaTshirt className="mr-2" /> Premium Materials
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ProductDetailsSkeleton = () => (
//   <div className="container mx-auto px-4 py-8 mt-16">
//     <div className="grid md:grid-cols-2 gap-8">
//       <Skeleton className="h-[300px] sm:h-[500px] w-full rounded-lg" />
//       <div>
//         <Skeleton className="h-6 sm:h-8 w-3/4 mb-4" />
//         <Skeleton className="h-4 w-1/2 mb-4" />
//         <Skeleton className="h-16 sm:h-20 w-full mb-6" />
//         <Skeleton className="h-6 sm:h-8 w-1/4 mb-4" />
//         <div className="flex space-x-2 mb-6">
//           {[...Array(4)].map((_, i) => (
//             <Skeleton key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
//           ))}
//         </div>
//         <div className="flex space-x-4 mb-6">
//           <Skeleton className="h-10 sm:h-12 w-3/4" />
//           <Skeleton className="h-10 sm:h-12 w-12" />
//         </div>
//         <Skeleton className="h-32 sm:h-40 w-full" />
//       </div>
//     </div>
//   </div>
// );

// export default ProductDetails;
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProductsById } from "@/lib/features/catogary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FaHeart,
  FaShoppingCart,
  FaStar,
  FaTruck,
  FaUndo,
  FaExpand,
  FaTrash,
  FaCheckCircle,
  FaTshirt,
  FaWhatsapp,
} from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import useWindowSize from "@/hooks/useWindowSize";
import BloodRedButton from "@/components/BloodButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

import { toggleItem } from "@/lib/features/wishlist";
import toast from "react-hot-toast";
import { addToCart, removeFromCart } from "@/lib/features/cart";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import ProductGalleryPage from "../../FullScreenCrousel";
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

const ProductDetails = ({
  params,
}: {
  params: { id: string; name: string };
}) => {
  const dispatch = useDispatch<any>();
  const [productData, setProductData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);

  const [showZoom, setShowZoom] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const [swiperReady, setSwiperReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowSize();
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const isWishlist = wishlistItems.some((item) => item.id === productData?._id);
  const cartItems = useSelector((state: any) => state.cart.items);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const isInCart = cartItems.some(
    (item) => item.id === productData?._id && item.size._id == selectedSize?._id
  );
  const [activeTab, setActiveTab] = useState("description");

  const callGetAllProductsById = async () => {
    try {
      setLoading(true);
      const { payload }: any = await dispatch(getProductsById(params?.id));

      if (payload?.success) {
        setProductData(payload?.product);

        setSelectedSize(payload?.product?.sizes[0]);
      } else {
        setProductData(null);
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    callGetAllProductsById();
  }, [params?.id]);

  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (mainSwiper) {
      setSwiperReady(true);
      mainSwiper.on("slideChange", () => {
        setActiveIndex(mainSwiper.activeIndex);
      });
    }
  }, [mainSwiper]);

  const toggleWishlist = () => {
    dispatch(
      toggleItem({
        id: productData._id,
        name: productData.name,
        description: productData.description,
        amount: productData.sizes[0].offerPrice,
        colors: ["red"],
        img: productData.img,
      })
    );

    if (isWishlist) {
      toast.success(`${productData.name} Removed from wishlist`);
    } else {
      toast.success(`${productData.name} Added to wishlist`);
    }
  };

  const handleAddtoCart = (size) => {
    if (isInCart) {
      dispatch(removeFromCart({ id: productData._id, sizeId: size._id }));
      toast.success(`${productData.name} remove from cart`);
    } else {
      dispatch(addToCart({ id: productData._id, size: size }));
      toast.success(`${productData.name} added to cart`);
    }
  };

  const handleBuyNow = () => {
    if (!isInCart) {
      dispatch(addToCart({ id: productData._id, size: selectedSize }));
      toast.success(`${productData.name} added to cart`);
    }
    router.push('/cart');
  };

  const handleWhatsAppShare = () => {
    const message = `Check out this product: ${productData.name}\nPrice: ₹${selectedSize ? selectedSize.offerPrice : productData.actualPrice}\n${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <ProductDetailsSkeleton />;
  }
  const hasAdditionalDetails =
    productData?.additionalFields &&
    Object?.keys(productData?.additionalFields).length > 0;

  console.log(hasAdditionalDetails);
  if (!productData) {
    return (
      <div className="container mx-auto px-4 py-6 mt-8 sm:py-12 sm:mt-16 min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-600">
            The product you are looking for does not exist or has been removed.
          </p>
          <Button className="mt-6" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const hasContent = (data) => {
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === "object") return Object.keys(data).length > 0;
    return !!data;
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-12 mt-20 sm:mt-24 min-h-[90vh] ">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          {/* Thumbnail Navigation */}
          <div className="hidden sm:flex flex-col space-y-2">
            {productData?.img?.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  handleThumbnailClick(index);
                  setIsModalOpen(true);
                }}
                className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                  currentIndex === index
                    ? "border-indigo-500"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="object-contain max-w-full max-h-full"
                />
              </button>
            ))}
          </div>

          {/* Main Image */}
          <div className="w-full max-w-lg">
            {productData?.img && productData.img.length > 0 && (
             <img
                src={productData.img[currentIndex]}
                alt={productData?.name}
                className="max-w-full max-h-[650px] rounded-lg shadow-lg transition-all duration-300 cursor-pointer object-contain mx-auto"
              />
            )}
          </div>

          {/* for small device thumbnail */}
          <div className="sm:hidden flex justify-center mt-4 space-x-2 overflow-x-auto">
            {productData?.img?.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  currentIndex === index
                    ? "border-indigo-500"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          {isModalOpen && (
            <ProductGalleryPage
              productData={productData}
              setIsModalOpen={setIsModalOpen}
              isModalOpen={isModalOpen}
            />
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-4xl font-medium capitalize tracking-wide text-primaryRed">
            {productData?.name}
          </h1>
          {/* <div className="flex items-center space-x-2">
            <div className="flex">
              {[...Array(productData?.rating?.star)].map((_, i) => (
                <FaStar key={i} className="w-5 h-5 text-yellow-400" />
              ))}
            </div>
            <span className="text-gray-600">
              ({productData?.rating?.ratedBy} reviews)
            </span>
          </div> */}
          <div className="text-2xl font-semibold">
            ₹{selectedSize ? selectedSize.offerPrice : productData.actualPrice}
            <span className="ml-2 text-lg text-gray-500 line-through">
              ₹{productData.actualPrice}
            </span>
          </div>

          {/* Tabs with Border Bottom Effect */}
          <Tabs defaultValue="description" onValueChange={setActiveTab}>
            <TabsList className="flex border-b border-gray-300">
              <TabsTrigger
                value="description"
                className={`pb-2 transition-all px-2 border-b-2 ${
                  activeTab === "description"
                    ? "border-indigo-500"
                    : "border-transparent"
                }`}
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="material"
                className={`pb-2 transition-all px-2 border-b-2 ${
                  activeTab === "material"
                    ? "border-indigo-500"
                    : "border-transparent"
                }`}
              >
                Material & Dimensions
              </TabsTrigger>
              <TabsTrigger
                value="return"
                className={`pb-2 transition-all px-3 border-b-2 ${
                  activeTab === "return"
                    ? "border-indigo-500"
                    : "border-transparent"
                }`}
              >
                Return Rules
              </TabsTrigger>
              <TabsTrigger
                value="additional"
                className={`pb-2 transition-all px-3 border-b-2 ${
                  activeTab === "additional"
                    ? "border-indigo-500"
                    : "border-transparent"
                }`}
              >
                Other Infornation
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-4">
              {productData?.description}
            </TabsContent>
            <TabsContent value="material" className="pt-4">
              {productData?.material}
            </TabsContent>
            <TabsContent value="return" className="pt-4">
              {productData?.returnRules?.map((rule, index) => (
                <li key={index}>{rule.rule}</li>
              ))}
            </TabsContent>
            <TabsContent value="additional" className="pt-4">
              {hasAdditionalDetails && (
                <div className="">
                  <ul className=" list-disc list-inside space-y-2 text-gray-600">
                    {Object?.entries(productData.additionalFields).map(
                      ([key, value], index) => (
                        <li key={index}>
                          <strong>{key}: </strong>
                          {String(value)}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Colors:</h3>
            <div className="flex gap-1 items-center">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-red cursor-pointer hover:scale-110 transition duration-300"
                style={{ backgroundColor: productData?.color }}
              ></div>
              <div className="flex space-x-2">
                {productData?.colors?.map((color: any) => (
                  <Link
                    href={`/product-details/${color.varientId}/${params.name}`}
                    key={color.varientId}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300 cursor-pointer hover:scale-110 transition duration-300"
                    style={{ backgroundColor: color.color }}
                  ></Link>
                ))}
              </div>
            </div>
          </div>

          {/* sizes */}

          {productData.sizes && productData.sizes.length > 0 && (
            <div
              className={`${
                productData.sizes[0].type == "Others" ? "hidden" : ""
              }`}
            >
              <h4 className="text-sm font-medium text-theme-secondary mb-2">
                Size:
              </h4>
              <div className="flex flex-wrap gap-2 size-div">
                {productData.sizes.map((size) => (
                  <Button
                    title={
                      size.stock === 0
                        ? "No Stock Left "
                        : `Size - ${size.size}`
                    }
                    key={size.id}
                    variant={
                      selectedSize && selectedSize._id === size._id
                        ? "default"
                        : "outline"
                    }
                    className={`px-3 py-1 ${
                      size.stock === 0 ? "opacity-50 " : ""
                    }`}
                    onClick={() => setSelectedSize(size)}
                    disabled={size.stock === 0}
                  >
                    {size.size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex space-x-4">
              <Button
                onClick={() => handleAddtoCart(selectedSize)}
                className="py-6 text-lg w-full flex items-center justify-center"
              >
                {isInCart ? (
                  <span className="flex items-center">
                    <FaTrash className="mr-2" /> Remove from cart
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FaShoppingCart className="mr-2" /> Add to Cart
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-12 h-12 flex items-center justify-center"
                onClick={toggleWishlist}
              >
                <FaHeart
                  className={`${isWishlist ? "text-red-500" : "text-gray-400"}`}
                />
              </Button>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleBuyNow}
                className="py-6 text-lg w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700"
              >
                Buy Now
              </Button>
              <Button
                variant="outline"
                className="w-12 h-12 flex items-center justify-center bg-green-50 hover:bg-green-100"
                onClick={handleWhatsAppShare}
              >
                <FaWhatsapp className="text-green-600" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
            <div className="flex items-center">
              <FaTruck className="mr-2" /> Fast Delivery
            </div>
            <div className="flex items-center">
              <FaCheckCircle className="mr-2" /> Quality Approved
            </div>
            <div className="flex items-center">
              <FaTshirt className="mr-2" /> Premium Materials
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductDetailsSkeleton = () => (
  <div className="container mx-auto px-4 py-8 mt-16">
    <div className="grid md:grid-cols-2 gap-8">
      <Skeleton className="h-[300px] sm:h-[500px] w-full rounded-lg" />
      <div>
        <Skeleton className="h-6 sm:h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-16 sm:h-20 w-full mb-6" />
        <Skeleton className="h-6 sm:h-8 w-1/4 mb-4" />
        <div className="flex space-x-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
          ))}
        </div>
        <div className="flex space-x-4 mb-6">
          <Skeleton className="h-10 sm:h-12 w-3/4" />
          <Skeleton className="h-10 sm:h-12 w-12" />
        </div>
        <Skeleton className="h-32 sm:h-40 w-full" />
      </div>
    </div>
  </div>
);

export default ProductDetails;

