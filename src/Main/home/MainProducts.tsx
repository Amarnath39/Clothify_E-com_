"use client";

import { getAllProducts } from "@/lib/features/catogary";
import React, { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import NotFound from "@/components/NotFound";

import { FaHeart, FaRegHeart, FaShoppingBag, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { addToCart, removeFromCart } from "@/lib/features/cart";
import { useSearchParams } from "next/navigation";
import { toggleItem } from "@/lib/features/wishlist";
import ProductSizeModal from "@/components/ProductSizeModal";
import { Quicksand } from "next/font/google";

// Import Quicksand font
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

const MainProducts = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const dispatch = useDispatch<any>();
  const [products, setProducts] = useState<any>({});

  const cartItems = useSelector((state: any) => state.cart.items);
  const [loading, setLoading] = useState(true);
  const wishlistItems = useSelector((state: any) => state.wishlist.items);

  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // State for pausing animations when user interacts
  const [isPausedTop, setIsPausedTop] = useState(false);
  const [isPausedBottom, setIsPausedBottom] = useState(false);
  
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const pauseTimerTopRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerBottomRef = useRef<NodeJS.Timeout | null>(null);

  const isInCart = cartItems?.some(
    (item) =>
      item.id === selectedProduct?._id && item.size._id == selectedSize?._id
  );

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

  const handleAddToCart = (size) => {
    if (size?.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
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

  const handleWishlistToggle = (product: any, event: MouseEvent) => {
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

    toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  // Scroll function with auto-resume
  const scrollRow = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right', isTop: boolean) => {
    if (!ref.current) return;
    
    const scrollAmount = 400; // Pixels to scroll
    const currentScroll = ref.current.scrollLeft;
    const targetScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    ref.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });

    // Pause animation
    if (isTop) {
      setIsPausedTop(true);
      if (pauseTimerTopRef.current) clearTimeout(pauseTimerTopRef.current);
      pauseTimerTopRef.current = setTimeout(() => {
        setIsPausedTop(false);
      }, 2000); // Resume after 2 seconds
    } else {
      setIsPausedBottom(true);
      if (pauseTimerBottomRef.current) clearTimeout(pauseTimerBottomRef.current);
      pauseTimerBottomRef.current = setTimeout(() => {
        setIsPausedBottom(false);
      }, 2000); // Resume after 2 seconds
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pauseTimerTopRef.current) clearTimeout(pauseTimerTopRef.current);
      if (pauseTimerBottomRef.current) clearTimeout(pauseTimerBottomRef.current);
    };
  }, []);

  const ProductCard = ({ product, uniqueKey }) => (
    <div
      key={uniqueKey}
      style={{ border: "none" }}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `/product-details/${product._id}/${product.name
          .split(" ")
          .join("-")}`;
      }}
      className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[20vw] mx-3 flex flex-col overflow-hidden group cursor-pointer relative rounded-2xl bg-white border-none"
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
              className="absolute top-0 left-0 object-cover w-full h-[300px] sm:h-[400px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSizeModalOpen(true);
              setSelectedProduct(product);
            }}
            className="absolute bottom-3 right-3 text-white bg-black/80 backdrop-blur-sm rounded-full p-3 shadow-sm transition-all duration-300 ease-in-out md:opacity-0 md:translate-y-full md:group-hover:opacity-100 md:group-hover:translate-y-0"
          >
            <FaShoppingBag size={20} />
          </button>
        </div>
        <div className="p-4 flex flex-col space-y-2">
          <CardTitle className="text-base font-medium text-gray-900 line-clamp-2">
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
  );
  
  const SkeletonCard = ({ uniqueKey }) => (
    <div key={uniqueKey} className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[20vw] mx-3">
        <Card className="flex flex-col overflow-hidden h-full">
            <CardContent className="flex-grow p-0">
                <Skeleton height={400} />
            </CardContent>
            <div className="p-4">
                <Skeleton width="80%" height={24} />
                <Skeleton width="60%" height={20} className="mt-2" />
            </div>
        </Card>
    </div>
  );

  return (
    <div className={quicksand.className}>
      <style jsx>{`
        .marquee-container {
          overflow-x: auto;
          overflow-y: hidden;
          position: relative;
          width: 100%;
          padding: 20px 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .marquee-container::-webkit-scrollbar {
          display: none;
        }
        .marquee-content {
          display: flex;
          flex-wrap: nowrap;
          width: max-content;
        }
        
        /* Animation pauses on hover and when paused */
        .marquee-container:hover .marquee-content,
        .marquee-container.paused .marquee-content {
          animation-play-state: paused;
        }
        
        .scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        @keyframes scroll-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .scroll-right {
          animation: scroll-right 40s linear infinite;
        }
        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .nav-button:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          transform: translateY(-50%) scale(1.1);
        }
        
        .nav-button:active {
          transform: translateY(-50%) scale(0.95);
        }
        
        .nav-button-left {
          left: 20px;
        }
        
        .nav-button-right {
          right: 20px;
        }

        .carousel-wrapper {
          position: relative;
        }

        @media (max-width: 768px) {
          .nav-button {
            width: 40px;
            height: 40px;
          }
          .nav-button-left {
            left: 10px;
          }
          .nav-button-right {
            right: 10px;
          }
        }
      `}</style>

      <h1 className="relative text-3xl mt-12 tracking-wider py-2 pt-6 text-center mx-auto animated-underline">
        CHECK OUR SELECTION
      </h1>

      <div key={searchQuery} className="py-2 mt-10">
        {loading ? (
          <div>
            <div className="marquee-container">
                <div className="marquee-content">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <SkeletonCard key={`sk-top-${index}`} uniqueKey={`sk-top-${index}`} />
                    ))}
                </div>
            </div>
            <div className="marquee-container">
                <div className="marquee-content">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <SkeletonCard key={`sk-bottom-${index}`} uniqueKey={`sk-bottom-${index}`} />
                    ))}
                </div>
            </div>
          </div>
        ) : products.products?.length > 0 ? (
          <div>
            {/* TOP ROW: SCROLLING RIGHT WITH NAVIGATION */}
            <div className="carousel-wrapper">
              <button 
                className="nav-button nav-button-left"
                onClick={() => scrollRow(topRowRef, 'left', true)}
                aria-label="Scroll left"
              >
                <FaChevronLeft size={20} className="text-gray-800" />
              </button>
              
              <div 
                ref={topRowRef}
                className={`marquee-container ${isPausedTop ? 'paused' : ''}`}
              >
                <div className="marquee-content scroll-right">
                  {[...products.products, ...products.products].map(
                    (product, index) => (
                      <ProductCard
                        product={product}
                        uniqueKey={`top-${product._id}-${index}`}
                        key={`top-${product._id}-${index}`}
                      />
                    )
                  )}
                </div>
              </div>

              <button 
                className="nav-button nav-button-right"
                onClick={() => scrollRow(topRowRef, 'right', true)}
                aria-label="Scroll right"
              >
                <FaChevronRight size={20} className="text-gray-800" />
              </button>
            </div>

            {/* BOTTOM ROW: SCROLLING LEFT WITH NAVIGATION */}
            <div className="carousel-wrapper">
              <button 
                className="nav-button nav-button-left"
                onClick={() => scrollRow(bottomRowRef, 'left', false)}
                aria-label="Scroll left"
              >
                <FaChevronLeft size={20} className="text-gray-800" />
              </button>
              
              <div 
                ref={bottomRowRef}
                className={`marquee-container ${isPausedBottom ? 'paused' : ''}`}
              >
                <div className="marquee-content scroll-left">
                  {[...products.products, ...products.products].map(
                    (product, index) => (
                      <ProductCard
                        product={product}
                        uniqueKey={`bottom-${product._id}-${index}`}
                        key={`bottom-${product._id}-${index}`}
                      />
                    )
                  )}
                </div>
              </div>

              <button 
                className="nav-button nav-button-right"
                onClick={() => scrollRow(bottomRowRef, 'right', false)}
                aria-label="Scroll right"
              >
                <FaChevronRight size={20} className="text-gray-800" />
              </button>
            </div>
          </div>
        ) : (
          <NotFound height="60vh" text="Products" />
        )}
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
    </div>
  );
};

export default MainProducts;