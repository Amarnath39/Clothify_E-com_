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
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaHeart className="mx-auto mb-4 text-gray-400" size={64} />
          <h2 className="text-2xl font-semibold mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-600 mb-4">
            Start adding some items to your wishlist!
          </p>
          <Button className="bg-black text-white hover:bg-gray-700 hover:text-white" onClick={() => router.push("/products")} variant="outline">
            Explore Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen mx-auto p-4 py-8 mt-32 sm:mt-40 md:mt-48">
      <h1 className="text-3xl font-bold mb-8 text-center">My Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {wishListItems.map((item, index) => (
          <Card
            key={item.id}
            className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
          >
            <CardHeader className="p-0">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item?.img[0] || "/placeholder.jpg"}
                  alt={item.name}
                  className="transition-transform duration-300 object-cover hover:scale-110"
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 flex flex-col flex-1">
              <CardTitle className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 line-clamp-1 md:line-clamp-2">
                {item.name}
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 line-clamp-2 md:line-clamp-3">
                {item?.description}
              </p>
              <p className="font-bold text-sm sm:text-base md:text-lg text-primary mt-auto">
                ₹{item?.amount?.toFixed(2)}
              </p>
              {/* <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                {item.colors.map((color) => (
                  <span
                    key={color}
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div> */}
            </CardContent>
            <CardFooter className="mt-auto flex justify-between items-center p-2 sm:p-3 md:p-4 bg-gray-50">
              <Button
                onClick={() => handleDetails(item)}
                variant="outline"
                size="sm"
                className="flex items-center text-xs sm:text-sm"
              >
                <FaEye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                <span className="hidden md:block"> View </span>
              </Button>
              <Button
                onClick={() => handleRemoveFromWishlist(item.id)}
                variant="destructive"
                size="sm"
                className="flex items-center text-xs sm:text-sm bg-black"
              >
                <FaTrash className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden md:block"> Remove </span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WishList;
