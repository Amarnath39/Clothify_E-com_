"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleItem } from "@/lib/features/wishlist";
import { addToCart, removeFromCart } from "@/lib/features/cart";
import toast from "react-hot-toast";

interface Size {
  _id: string;
  size: string;
  offerPrice: number;
  stock: number;
}

interface Product {
  _id: string;
  name: string;
  img: string[];
  actualPrice: number;
  offerPrice?: number;
  sizes?: Size[];
  latestProduct?: boolean;
  bestsellerProduct?: boolean;
  categories?: Array<{ name: string; _id: string }> | string[];
  rating?: {
    star: number;
    ratedBy: number;
  };
}

interface Props {
  product: Product;
}


/* ---------- interfaces unchanged ---------- */

const StandardProductCard = ({ product }: Props) => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const cartItems = useSelector((state: any) => state.cart.items); // ✅ added

  const isWishlisted = wishlistItems.some(
    (item: any) => item.id === product._id
  );

  const mainSize =
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;

  const currentPrice = mainSize
    ? mainSize.offerPrice
    : product.offerPrice || product.actualPrice;

  const actualPrice = product.actualPrice;

  const discount =
    actualPrice && currentPrice && actualPrice > currentPrice
      ? Math.round(((actualPrice - currentPrice) / actualPrice) * 100)
      : 0;

  const ratingStar = product.rating?.star ?? 4.5;
  const ratingCount = product.rating?.ratedBy ?? 0;

  const category =
    Array.isArray(product.categories) && product.categories.length > 0
      ? typeof product.categories[0] === "string"
        ? product.categories[0]
        : product.categories[0].name
      : "Collection";

  /* ---------- CART CHECK (from original card) ---------- */
  const isInCart = cartItems.some(
    (item: any) =>
      item.id === product._id &&
      (!mainSize || item.size?._id === mainSize._id)
  );

  const handleWishlist = (e: MouseEvent | any) => {
    e.preventDefault();
    dispatch(
        toggleItem({
            id: product._id,
            name: product.name,
            img: product.img,
            amount: currentPrice,
            description: "",
            colors: [],
        })
        );

    toast.success(
      isWishlisted ? "Removed from wishlist" : "Added to wishlist"
    );
  };

  /* ---------- ADD / REMOVE CART TOGGLE ---------- */
  const handleCartToggle = (e: MouseEvent | any) => {
    e.preventDefault();

    if (!mainSize) {
      toast.error("Select options");
      return;
    }

    if (isInCart) {
      dispatch(removeFromCart({ id: product._id, sizeId: mainSize._id }));
      toast.success("Removed from cart");
      return;
    }

    if (mainSize.stock <= 0) {
      toast.error("Out of stock");
      return;
    }

    dispatch(addToCart({ id: product._id, size: mainSize }));
    toast.success("Added to cart");
  };

  return (
    <div className="group/card relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Link
          href={`/product-details/${product._id}/${product.name.replace(
            /\s+/g,
            "-"
          )}`}
        >
          <img
            src={product.img[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
          />
          {product.img[1] && (
            <img
              src={product.img[1]}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />
          )}
        </Link>

        {/* Badges (unchanged) */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
          {product.latestProduct && (
            <span className="bg-white/90 text-[#7b1e3a] text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              New
            </span>
          )}

          {discount > 0 && (
            <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
              {discount}% OFF
            </span>
          )}

          {product.bestsellerProduct && (
            <span className="bg-[#c9a14a] text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Best Seller
            </span>
          )}
        </div>

        {/* Wishlist (desktop only) */}
        <button
          onClick={handleWishlist}
          className="hidden md:flex absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full
          opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all"
        >
          <Heart
            className={`w-5 h-5 ${
              isWishlisted ? "fill-red-600 text-red-600" : "text-gray-600"
            }`}
          />
        </button>

        {/* Quick Add / Remove (desktop only) */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover/card:translate-y-0 transition-transform">
          <button
            onClick={handleCartToggle}
            className={`w-full rounded-full py-2 shadow-lg transition-colors
              ${
                isInCart
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-black text-white hover:bg-gray-900"
              }`}
          >
            {isInCart ? "Remove from Cart" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Info section unchanged */}
      <div className="p-3 md:p-4 space-y-1">
        <p className="text-xs uppercase tracking-wider text-gray-500">
          {category}
        </p>

        <h3 className="text-sm md:text-lg font-serif text-gray-900 line-clamp-2 group-hover:text-[#7b1e3a] transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-3.5 h-3.5 ${
                i < Math.floor(ratingStar)
                  ? "text-[#c9a14a] fill-[#c9a14a]"
                  : "text-gray-200 fill-gray-200"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
          <span className="text-xs text-gray-500 ml-1">
            ({ratingCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-base md:text-lg font-serif text-[#c9a14a]">
            ₹{currentPrice.toLocaleString()}
          </span>

          {actualPrice > currentPrice && (
            <span className="text-sm text-gray-400 line-through">
              ₹{actualPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandardProductCard;
