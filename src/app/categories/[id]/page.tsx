"use client";
import { getAllProducts } from "@/lib/features/catogary";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import BloodRedButton from "@/components/BloodButton";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import NotFound from "@/components/NotFound";
import ProductFilters from "../ProductFilters";
import { FaFilter, FaHeart, FaRegHeart, FaShoppingBag } from "react-icons/fa";
import { addToCart, removeFromCart } from "@/lib/features/cart";
import { useRouter } from "next/navigation";
import { toggleItem } from "@/lib/features/wishlist";
import AnimatedSearchInput from "@/components/AnimateSearchInput";
import { Quicksand } from "next/font/google";
import ProductSizeModal from "@/components/ProductSizeModal";
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

const CatgeoryProducts = ({ params }) => {
  const { id } = params;
  const dispatch = useDispatch<any>();
  const [products, setProducts] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const cartItems = useSelector((state: any) => state.cart.items);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [filters, setFilters] = useState<any>({});
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const router = useRouter();

  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<any>(null);

  const fetchProducts = useCallback(
    async (page: number, filters: any) => {
      const queryParams = new URLSearchParams({
        categoryId: id,
        page: page.toString(),
        limit: "12",
        search: "",
        sort: filters?.sort || "newlyArrived",
        colors: JSON.stringify(filters.color || []),
        percentageOff: filters?.discount?.value?.toString() || "",
        material: JSON.stringify(filters.material || []),
        minPrice: filters?.price?.[0]?.toString() || "0",
        maxPrice: filters?.price?.[1]?.toString() || "100000",
      });
      setLoading(true);
      try {
        const { payload }: any = await dispatch(getAllProducts(queryParams.toString()));
        if (payload.success) {
          setProducts(payload);
        } else {
          toast.error(payload.msg);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.msg);
      }
      setLoading(false);
    },
    [dispatch]
  );

  const isInCart = cartItems?.some(
    (item) =>
      item.id === selectedProduct?._id && item.size._id == selectedSize?._id
  );

  useEffect(() => {
    fetchProducts(currentPage, appliedFilters);
  }, [currentPage, appliedFilters, fetchProducts]);

  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const onApplyFilters = (newFilters) => {
    setAppliedFilters(newFilters);
    setCurrentPage(1);
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleAddToCart = (size) => {
    if (size?.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    console.log(cartItems, "cartItems");
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

  const handleWishlistToggle = (product, event: MouseEvent) => {
    event.stopPropagation();
    console.log(product, "product");
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

    if (isInWishlist) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  };

  const handleRemoveItem = (id, sizeId, event) => {
    event.stopPropagation();
    console.log(id, sizeId, "action");
    dispatch(removeFromCart({ id, sizeId }));
    // setCartProducts((prevProducts: any) =>
    //   prevProducts.filter((product) => {
    //     return !(product._id === id && product.size._id === sizeId);
    //   })
    // );
  };

  // console.log(products, "products::");

  return (
    <>
      <div className="relative mx-auto px-4 py-8 mt-32 sm:mt-36 min-h-screen">
        {!isFilterOpen && (
          <button
            className="md:hidden absolute top-[140px] right-4 z-50 bg-black text-black p-4 rounded-full shadow-lg"
            onClick={() => setIsFilterOpen(true)}
          >
            <FaFilter size={24} color="white"/>
          </button>
        )}
        <div className="flex flex-col md:flex-row gap-8">
          <ProductFilters
            onFilterChange={handleFilterChange}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onfilterApply={onApplyFilters}
          />

          <div className="md:w-10/12">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="flex flex-col overflow-hidden">
                    <CardContent className="flex-grow p-0">
                      <div className="relative">
                        <Skeleton height={350} />
                        <div className="absolute top-2 right-2">
                          <Skeleton circle width={30} height={30} />
                        </div>
                      </div>
                      <div className="p-2 sm:p-3 md:p-4 flex flex-col py-2 sm:py-2 md:py-2">
                        <CardHeader className="p-0">
                          <Skeleton width="80%" height={24} />
                        </CardHeader>
                        <div className="flex justify-between items-center mt-1 sm:mt-2">
                          <div className="flex flex-col">
                            <Skeleton width={60} height={24} />
                            <Skeleton width={40} height={16} />
                          </div>
                          <Skeleton width={40} height={24} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0 md:pt-0">
                      <Skeleton width="100%" height={36} />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : products.products?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {products.products.map((product: any) => (
                  <div
                    style={{ border: "none" }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/product-details/${
                        product._id
                      }/${product.name.split(" ").join("-")}`;
                    }}
                    key={product._id}
                    className="flex flex-col overflow-hidden group cursor-pointer relative rounded-2xl bg-white border-none"
                  >
                    <CardContent className="flex-grow p-0">
                      <div className="relative overflow-hidden rounded-2xl">
                        <img
                          src={product.img[0]}
                          alt={product.name}
                          className="object-cover object-center w-full h-[260px] sm:h-[400px] transition-opacity duration-300 ease-in-out hover:scale-105"
                        />
                        {product.img[1] && (
                          <img
                            src={product.img[1]}
                            alt={product.name}
                            className="absolute top-0 left-0 object-cover w-full h-[260px] sm:h-[400px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                          />
                        )}
                        {product?.off > 0 && (
                          <span className="absolute top-3 left-3 text-xs font-medium bg-primaryRed text-white p-[5px] rounded-lg">
                            {Math.round(product?.off)}% OFF
                          </span>
                        )}
                        <button
                          onClick={(e: any) => handleWishlistToggle(product, e)}
                          className="absolute top-3 right-3  bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm"
                        >
                          {wishlistItems.some(
                            (item) => item.id === product._id
                          ) ? (
                            <FaHeart size={20} className="text-red-600"/>
                          ) : (
                            <FaRegHeart size={20} className="text-black" />
                          )}
                        </button>
                        {/* Shopping Bag Icon - Hidden on mobile, shows on hover for larger screens */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSizeModalOpen(true);
                            setSelectedProduct(product);
                          }}
                          className="absolute bottom-3 right-3 text-white bg-black backdrop-blur-sm rounded-full p-3 shadow-sm 
                                                transition-all duration-300 ease-in-out
                                                md:opacity-0 md:translate-y-full md:group-hover:opacity-100 md:group-hover:translate-y-0"
                        >
                          <FaShoppingBag size={20}  />
                        </button>
                      </div>
                      <div className="p-4 flex flex-col space-y-1 sm:space-y-2">
                        <CardTitle className="text-lg sm:text-xl font-medium text-gray-900">
                          {product.name}
                        </CardTitle>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-lg sm:text-xl font-semibold text-gray-900">
                            ₹{product.sizes[0].offerPrice.toFixed(2)}
                          </span>
                          {product.actualPrice && product.sizes[0].offerPrice < product.actualPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              ₹{product.actualPrice.toFixed(2)}
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
                ))}
              </div>
            ) : (
              <NotFound height="80vh" text="Products" />
            )}
            {products.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={products.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
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
    </>
  );
};

export default CatgeoryProducts;
