"use client";

import { getAllProducts } from "@/lib/features/catogary";
import React, { useCallback, useEffect, useState, memo } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import NotFound from "@/components/NotFound"; // Assuming exists
import { Heart, ShoppingBag, Star } from "lucide-react"; // Added Star
import { addToCart } from "@/lib/features/cart";
import { useSearchParams } from "next/navigation";
import { toggleItem } from "@/lib/features/wishlist";
import ProductSizeModal from "@/components/ProductSizeModal";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- ProductCardAlt Component (Moved Outside) ---
const ProductCardAlt = memo(({ product, index = 0, isWishlisted, onToggleWishlist, onQuickAdd }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  // Badge Logic
  const discount = product.off || (product.actualPrice ? Math.round((product.actualPrice - product.sizes[0].offerPrice) / product.actualPrice * 100) : 0);
  const isNew = product.latestProduct; // Updated from schema
  const isBestSeller = product.bestsellerProduct; // Updated from schema
  const isPreOrder = product.is_prebooking;
  const isFeatured = product.featureProduct;

  // Rating Logic (Use schema structure: rating: { star: number, ratedBy: number })
  const rating = product.rating?.star || 4.5;
  const reviews = product.rating?.ratedBy || 0;

  // Category Logic (Use populated categories array)
  const categoryName = product.categories?.[0]?.name || product.categories?.[0] || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <Link href={`/product-details/${product._id}/${product.name.split(" ").join("-")}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4 rounded-sm">
          {/* Main Image */}
          <motion.img
            src={product.img[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          {/* Secondary Image (appears on hover) */}
          <AnimatePresence>
            {isHovered && product.img[1] && (
              <motion.img
                src={product.img[1]}
                alt={`${product.name} alternate view`}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>

          {/* Gradient Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
            {isNew && (
              <span className="bg-[#b48a3c] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm">
                New Arrival
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm">
                {Math.round(discount)}% Off
              </span>
            )}
            {isBestSeller && (
              <span className="bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm">
                Bestseller
              </span>
            )}
            {isFeatured && (
              <span className="bg-emerald-700 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm">
                Featured
              </span>
            )}
            {isPreOrder && (
              <span className="bg-blue-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm">
                Pre-Order
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart
              size={16}
              className={`transition-colors ${isWishlisted ? 'text-red-600 fill-red-600' : 'text-gray-600'}`}
            />
          </motion.button>

          {/* Quick Actions (appear on hover) */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-4 left-4 right-4 flex gap-2 z-10"
              >
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onQuickAdd(e, product);
                  }}
                  className="flex-1 bg-white text-gray-900 py-3 px-4 text-xs font-bold uppercase tracking-wider hover:bg-[#b48a3c] hover:text-white transition-colors duration-300 shadow-lg flex items-center justify-center gap-2"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingBag size={14} />
                  Add to Cart
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product Info */}
        <div className="space-y-1 text-center md:text-left">
          {/* Category */}
          {categoryName && (
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-medium mb-1">
              {categoryName}
            </p>
          )}

          <h3 className="font-serif text-lg text-gray-900 group-hover:text-[#b48a3c] transition-colors duration-300 line-clamp-1">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
            <div className="flex text-[#b48a3c]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < Math.floor(rating) ? "fill-[#b48a3c]" : "text-gray-300 fill-gray-300"}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-1">({reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="font-medium text-lg text-gray-900">
              ₹{product.sizes[0].offerPrice.toLocaleString()}
            </span>
            {product.actualPrice && product.actualPrice > product.sizes[0].offerPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{product.actualPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

ProductCardAlt.displayName = "ProductCardAlt"; // For dev tools


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

  const handleWishlistToggle = useCallback((product: any) => {
    // Check if item is already in wishlist to show correct toast
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
  }, [dispatch, wishlistItems]); // Added wishlistItems dependency

  const openSizeModal = useCallback((e: any, product: any) => {
    setSelectedProduct(product);
    setIsSizeModalOpen(true);
  }, []);

  const SkeletonCard = ({ uniqueKey }) => (
    <div key={uniqueKey} className="flex flex-col">
      <div className="aspect-[3/4] bg-gray-200 animate-pulse mb-4 rounded-sm"></div>
      <div className="h-4 bg-gray-200 animate-pulse w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 animate-pulse w-1/4"></div>
    </div>
  );

  return (
    <section className="py-24 bg-white relative z-0">
      {/* Added relative z-0 to ensure it sits properly in stacking context if needed, though usually standard flow is fine */}
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
              {products.products.map((product, index) => {
                const isWishlisted = wishlistItems.some((item) => item.id === product._id);
                return (
                  <ProductCardAlt
                    key={product._id}
                    product={product}
                    index={index}
                    isWishlisted={isWishlisted}
                    onToggleWishlist={handleWishlistToggle}
                    onQuickAdd={openSizeModal} // Quick add opens modal
                  />
                );
              })}
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

      {/* Size Modal */}
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
    </section>
  );
};

export default MainProducts;