"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaHeart, FaTrash, FaEye } from "react-icons/fa";
import { removeItem } from "@/lib/features/wishlist";
import { useRouter } from "next/navigation";
import Image from "next/image";

const WishList = () => {
  const wishListItems = useSelector((state: any) => state.wishlist.items);
  const dispatch = useDispatch();
  const router = useRouter();

  console.log(wishListItems, "wishlist");
  const handleRemoveFromWishlist = (id) => {
    dispatch(removeItem(id));
  };

  const handleDetails = (item) => {
    window.location.href = `/product-details/${item.id}/${item.name
      .split(" ")
      .join("-")}`;
  };

  if (wishListItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-roboto">
        <div className="max-w-md w-full text-center space-y-6 animate-fadeIn">
          <div className="relative mx-auto w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center border border-slate-100">
            <FaHeart className="text-slate-200" size={40} />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand rounded-full flex items-center justify-center border-4 border-slate-50">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 font-quicksand tracking-tight">
              Wishlist is Empty
            </h2>
            <p className="text-slate-500">
              Your favorite items are waiting to be discovered. Mark them with a heart and they'll appear here.
            </p>
          </div>
          <Button
            className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
            onClick={() => router.push("/products")}
          >
            Browse Products
            <FaEye className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-16 px-4 sm:px-6 lg:px-8 font-roboto">
      <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-quicksand">
            My Wishlist
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            A curated selection of the pieces you love most.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {wishListItems.map((item: any) => (
            <Card
              key={item.id}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-brand/20 flex flex-col h-full"
            >
              <CardHeader className="p-0 relative aspect-[4/5] overflow-hidden">
                <img
                  src={item?.img[0] || "/placeholder.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                <button
                  onClick={() => handleRemoveFromWishlist(item.id)}
                  className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm text-slate-400 hover:text-red-500 rounded-xl shadow-sm transition-all hover:scale-110"
                  title="Remove from wishlist"
                >
                  <FaTrash size={14} />
                </button>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-2 flex-1">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-brand transition-colors line-clamp-1 font-quicksand">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item?.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Price</span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{item?.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 sm:p-5 pt-0 mt-auto">
                <Button
                  onClick={() => handleDetails(item)}
                  variant="outline"
                  className="w-full h-11 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <FaEye className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-slate-600" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishList;
