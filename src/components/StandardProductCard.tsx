"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Eye, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
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
    rating?: {
        star: number;
        ratedBy: number;
    };
    latestProduct?: boolean;
    bestsellerProduct?: boolean;
    featureProduct?: boolean;
    is_prebooking?: boolean;
    categories?: Array<{ name: string; _id: string }> | string[];
    material?: string; // Added to match user's design usage
}

interface StandardProductCardProps {
    product: Product;
    index?: number;
}

const StandardProductCard = ({ product, index = 0 }: StandardProductCardProps) => {
    const dispatch = useDispatch();
    const [isHovered, setIsHovered] = useState(false);

    // Redux Selectors
    const wishlistItems = useSelector((state: any) => state.wishlist.items);
    const cartItems = useSelector((state: any) => state.cart.items);

    // Derived Data
    const isWishlisted = wishlistItems.some((item: any) => item.id === product._id);

    // Logic to determine price and offer
    const mainSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;
    const currentPrice = mainSize ? mainSize.offerPrice : (product.offerPrice || product.actualPrice);
    const actualPrice = product.actualPrice;

    // Cart Logic
    const isInCart = cartItems.some(
        (item: any) => item.id === product._id && (!mainSize || item.size?._id === mainSize._id)
    );

    const discount = actualPrice && currentPrice
        ? Math.round(((actualPrice - currentPrice) / actualPrice) * 100)
        : 0;

    const isNew = product.latestProduct;
    const isBestSeller = product.bestsellerProduct;
    const isFeatured = product.featureProduct;

    const ratingStar = product.rating?.star || 4.5;
    const ratingCount = product.rating?.ratedBy || 0;

    // Handle category name
    const categoryName = Array.isArray(product.categories) && product.categories.length > 0
        ? (typeof product.categories[0] === 'string' ? product.categories[0] : product.categories[0].name)
        : "Collection";

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dispatch(
            toggleItem({
                id: product._id,
                name: product.name,
                img: product.img,
                amount: currentPrice,
                description: "", // Added to match type if needed, verify `toggleItem` type
                colors: [],
            })
        );
        toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
    };

    const handleCartToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (mainSize) {
            if (isInCart) {
                dispatch(removeFromCart({ id: product._id, sizeId: mainSize._id }));
                toast.success("Removed from cart");
            } else {
                if (mainSize.stock <= 0 && !product.is_prebooking) {
                    toast.error("Out of stock");
                    return;
                }
                dispatch(addToCart({ id: product._id, size: mainSize }));
                toast.success("Added to cart");
            }
        } else {
            // Fallback if no sizes defined (shouldn't happen for this product type but good for safety)
            toast.error("Please select options in details page");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative w-full h-full"
        >
            <Link href={`/product-details/${product._id}/${product.name.replace(/\s+/g, "-")}`} className="block h-full">
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                    {/* Main Image */}
                    <motion.img
                        src={product.img[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        animate={{ scale: isHovered ? 1.08 : 1 }}
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
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10 font-sans">
                        {isFeatured && (
                            <motion.span
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-emerald-700 text-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest shadow-md"
                            >
                                Featured
                            </motion.span>
                        )}
                        {isNew && (
                            <motion.span
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-[#b48a3c] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-md"
                            >
                                New Arrival
                            </motion.span>
                        )}
                        {discount > 0 && (
                            <motion.span
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-red-600 text-white px-3 py-1.5 text-xs font-extra-bold uppercase tracking-wide shadow-lg"
                            >
                                {discount}% Off
                            </motion.span>
                        )}
                        {isBestSeller && (
                            <motion.span
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-black text-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] shadow-md"
                            >
                                Bestseller
                            </motion.span>
                        )}
                    </div>

                    {/* Wishlist Button */}
                    <motion.button
                        onClick={handleWishlistToggle}
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{ backgroundColor: isWishlisted ? '#dc2626' : 'rgba(255,255,255,0.95)' }}
                    >
                        <Heart size={18} className={`transition-colors ${isWishlisted ? 'text-white fill-white' : 'text-gray-600'}`} />
                    </motion.button>

                    {/* Quick Actions (appear on hover) */}
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="absolute bottom-4 left-4 right-4 flex gap-2 z-10"
                            >
                                <motion.button
                                    onClick={handleCartToggle}
                                    className={`flex-1 py-3 px-4 text-sm font-medium uppercase tracking-wider transition-colors duration-300 shadow-xl flex items-center justify-center gap-2 ${isInCart
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : "bg-white text-black hover:bg-black hover:text-white"
                                        }`}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isInCart ? <Trash2 size={16} /> : <ShoppingBag size={16} />}
                                    {isInCart ? "Remove" : "Add to Cart"}
                                </motion.button>
                                {/* Removed Eye icon as standard link is covering the card, causing nesting issues if Eye was also a link */}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                    {/* Category */}
                    <motion.p
                        className="text-xs uppercase tracking-[0.15em] text-[#b48a3c] font-medium"
                        animate={{ opacity: isHovered ? 0.7 : 1 }}
                    >
                        {categoryName}
                    </motion.p>

                    {/* Name */}
                    <h3 className="font-serif text-lg leading-tight text-gray-900 line-clamp-2 min-h-[3rem] group-hover:text-[#b48a3c] transition-colors duration-300">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <svg
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < Math.floor(ratingStar) ? 'text-[#b48a3c] fill-[#b48a3c]' : 'text-gray-200 fill-gray-200'}`}
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">({ratingCount})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 pt-1">
                        <span className="font-mono text-xl font-semibold text-gray-900">
                            ₹{currentPrice?.toLocaleString()}
                        </span>
                        {actualPrice && currentPrice && actualPrice > currentPrice && (
                            <span className="font-mono text-sm text-gray-400 line-through">
                                ₹{actualPrice.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Material Tag (Optional if data exists) */}
                    {product.material && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                            transition={{ duration: 0.3 }}
                            className="pt-2"
                        >
                            <span className="inline-block text-xs text-gray-500 border border-gray-200 px-3 py-1 rounded-full">
                                {Array.isArray(product.material) ? product.material[0] : product.material}
                            </span>
                        </motion.div>
                    )}
                </div>
            </Link>
        </motion.div>
    );
};

export default StandardProductCard;
