import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ProductSizeModal = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  setSelectedSize,
  selectedSize,
  isInCart,
}) => {
  const [currentPrice, setCurrentPrice] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(product?.img[0]);

  useEffect(() => {
    if (product?.sizes && product?.sizes?.length > 0) {
      setSelectedSize(product?.sizes[0]);
      setCurrentPrice(product?.sizes[0]?.offerPrice);
    }
  }, [product]);

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setCurrentPrice(size.offerPrice);
  };

  const handleAddToCart = () => {
    if (selectedSize) {
      onAddToCart(selectedSize);
      onClose();
    }
  };

  if (!product || product.sizes?.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {
        <DialogContent
          style={{ zIndex: 9999, maxHeight: "80vh", overflowY: "auto" }}
          className="sm:max-w-[90vw] md:max-w-[700px] bg-white p-0 overflow-hidden "
        >
          <DialogHeader className="p-2 md:px-6 pb-0">
            <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900">
              Product Details
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-2 top-2 md:right-4 md:top-4 rounded-full p-2  hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-red text-secondaryRed hover:text-red"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
            <div className="sm:space-y-2 flex md:flex-col gap-2 md:gap-0 justify-center items-center">
              <img
                src={selectedImage || product?.img[0]}
                alt={product?.name}
                className="w-48 h-52 max-h-44 sm:w-full sm:h-full sm:max-h-80 object-cover object-top rounded-lg shadow-md"
                // className="w-full h-full max-h-80 object-cover object-top rounded-lg shadow-md"
              />
              <div className="flex flex-col gap-1 justify-center md:flex-row items-center sm:space-x-2 overflow-x-auto">
                {product?.img?.slice(1, 5)?.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product?.name} view ${index + 2}`}
                    className="w-16 h-16 object-cover rounded-md cursor-pointer hover:ring-2 flex-shrink-0"
                    onClick={() => setSelectedImage(image)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2 sm:space-y-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {product?.name}
                </h2>
                {/* <p className="text-sm text-gray-500">{product?.description}</p> */}
              </div>
              <div className="flex items-center space-x-2">
                {currentPrice && (
                  <span className="text-xl md:text-2xl font-bold text-black">
                    ₹{currentPrice?.toFixed(2)}
                  </span>
                )}
                {/* {product?.discountedPrice && (
                  <span className="text-base md:text-lg text-gray-500 line-through">
                    ₹{product?.discountedPrice?.toFixed(2)}
                  </span>
                )} */}
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 md:h-5 md:w-5 ${
                      i < Math.floor(product?.rating?.star)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs md:text-sm text-gray-600">
                  ({product?.rating?.ratedBy} reviews)
                </span>
              </div>
              <p className="hidden sm:block text-sm md:text-base text-gray-600">
                {product?.description}
              </p>
              <div
                className={`space-y-2 ${
                  product?.sizes[0]?.size == "Others" ? "hidden" : ""
                }`}
              >
                <h3 className="font-semibold text-gray-900">Select Size:</h3>
                <div className="flex flex-wrap gap-2">
                  {product?.sizes?.map((size) => (
                    <Button
                      key={size.id}
                      onClick={() => handleSizeChange(size)}
                      // disabled={size.stock <= 0}
                      variant={selectedSize === size ? "default" : "outline"}
                      className={`px-3 py-1 md:px-4 md:py-2 text-sm md:text-base  bg-black${
                        size.stock <= 0 ? "opacity-50" : ""
                      }`}
                    >
                      <span className="font-semibold">{size.size}</span>
                      {size.stock <= 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          No stock
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={!selectedSize || isInCart || selectedSize.stock <= 0}
                className="w-full text-white bg-black hover:bg-gray-800"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {isInCart
                  ? "Already in cart"
                  : selectedSize?.stock <= 0
                  ? "Out of Stock"
                  : "Add to Cart"}
              </Button>
            </div>
          </div>
        </DialogContent>
      }
    </Dialog>
  );
};

export default ProductSizeModal;
