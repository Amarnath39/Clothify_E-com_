"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

import {
  decreaseCount,
  getCartItems,
  getCouponById,
  getVisibleCoupons,
  increaseCount,
  removeFromCart,
  setTotalAmount,
} from "@/lib/features/cart";
import {
  FaArrowRight,
  FaChevronDown,
  FaInfoCircle,
  FaMinus,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import CouponSelector from "./CuponSelector";
import CartSkeletonLoader from "./CartSekleton";
import NotFound from "@/components/NotFound";
import BloodRedButton from "@/components/BloodButton";
import useWindowSize from "@/hooks/useWindowSize";
import {
  clearOrderId,
  proceedToCheckoutApi,
  setOrderId,
} from "@/lib/features/order";
import { useRouter } from "next/navigation";
import CheckoutModal from "./Checkout";
import { getUserDetails } from "@/lib/features/auth";
import { processCartOffers } from "@/helpers/helpers";
import { setAddressState } from "@/lib/features/address";
import { RootState } from "@/lib/store";

const Cart = () => {
  const dispatch = useDispatch<any>();
  const cartItems = useSelector((state: any) => state.cart.items);
  const [cartProducts, setCartProducts] = useState([]);
  const [visibleCoupons, setVisibleCoupons] = useState<any[]>([]);
  const [appliedCoupons, setAppliedCoupons] = useState<any>([]);
  const { currentOrder } = useSelector((state: any) => state.order);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [createdOrderDetails, setCreatedOrderDetails] = useState({});
  const { totalAmount } = useSelector((state: any) => state.cart);
  const latestTotalRef = useRef(0);
  const { addressState } = useSelector((state: any) => state.address);
  const { width } = useWindowSize();
  const [isCheckoutModal, setIsCheckoutModal] = useState(false);
  const { token } = useSelector((state: any) => state.auth);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { orderId, orderDate }: any = useSelector(
    (state: RootState) => state.order
  );
  const [userDeliveryFee, setUserDeliveryFee] = useState(0);

  const callGetCartItems = async () => {
    try {
      setLoading(true);

      const { payload } = await dispatch(
        getCartItems({
          carts: cartItems.map((item: any) => item.id),
        })
      );

      if (payload.success) {
        setCartProducts(
          cartItems
            .map((cartItem: any) => {
              const product = payload.products.find(
                (p: any) => p._id === cartItem.id
              );

              if (!product) {
                console.error(
                  `Product not found for cart item: ${cartItem._id}`
                );
                return null;
              }

              const matchedSize = product.sizes.find(
                (size: any) => size._id === cartItem.size._id
              );

              return {
                _id: product._id,
                name: product?.name,
                img: product?.img,
                color: product?.color,
                actualPrice: product?.actualPrice,
                description: product.description,
                size: matchedSize
                  ? {
                      _id: matchedSize?._id,
                      size: matchedSize?.size,
                      stock: matchedSize?.stock,
                      offerPrice: matchedSize?.offerPrice,
                      deliveryPrice: matchedSize?.deliveryPrice,
                    }
                  : null,
                count: cartItem?.count || 1,
              };
            })
            .filter(Boolean) // Remove any null entries
        );
      } else {
        toast.error(payload.msg);
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const callGetVisibleCoupons = async () => {
    try {
      const { payload }: any = await dispatch(getVisibleCoupons());

      if (payload.success) {
        setVisibleCoupons(payload.coupons);
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const calculateDeliveryFee = (cartItems, cartProducts) => {
    const totalQuantity =
      cartItems?.reduce((sum, item) => sum + Number(item.count), 0) || 0;

    let deliveryFee = 0;

    if (userDeliveryFee === 0) {
      deliveryFee = 0;
    } else if (userDeliveryFee === 150) {
      deliveryFee =
        totalQuantity === 1 ? 150 : 150 + 75 * (totalQuantity - 1);
    } else {
      deliveryFee = userDeliveryFee * totalQuantity;
    }

    return deliveryFee;
  };

  const { subtotal, tax, finalTotal, promotions, deliveryFee } = useMemo(() => {
    const subtotal = cartItems?.reduce((sum, item: any) => {
      const product: any = cartProducts.find(
        (p: any) => p?._id === item?.id && p?.size?._id === item?.size?._id
      );
      return sum + (product?.actualPrice || 0) * item.count;
    }, 0);

    const offerPrice = cartItems?.reduce((sum, item) => {
      const product: any = cartProducts?.find(
        (p: any) => p._id === item?.id && p?.size?._id === item?.size?._id
      );
      return sum + (product?.size?.offerPrice || 0) * item?.count;
    }, 0);

    const totalQuantity = cartItems?.reduce(
      (sum, item) => sum + item?.count,
      0
    );

    const promotions = subtotal - offerPrice;

    const tax = 0;
    const deliveryFee = calculateDeliveryFee(cartItems, cartProducts);
    const finalTotal =
      subtotal + deliveryFee + tax - discountAmount - promotions;
    latestTotalRef.current = finalTotal;
    dispatch(setTotalAmount(finalTotal));

    return { subtotal, tax, finalTotal, promotions, deliveryFee };
  }, [cartItems, cartProducts, discountAmount, userDeliveryFee]);

  const calculateDiscountAmount = (coupon: any, totalOfferPrice: any) => {
    let discount = 0;
    if (coupon.type === "percentage") {
      const calculatedPercent = (totalOfferPrice * coupon.off) / 100;
      discount = Math.min(calculatedPercent, coupon.amount);
    } else if (coupon.type === "flat") {
      discount = Math.min(coupon.off, coupon.amount.toString());
    }

    return discount;
  };

  const callGetAllAddress = async () => {
    try {
      const { payload } = await dispatch(getUserDetails());

      if (payload.success) {
        // ✅ Get deliveryFee from root, not user
        const deliveryFeeFromApi = payload?.deliveryFee || 0;
        setUserDeliveryFee(deliveryFeeFromApi); // ✅ Set correctly

        if (payload?.user?.defaultAddress) {
          dispatch(setAddressState(payload?.user?.defaultAddress?.state));
        } else {
          dispatch(setAddressState(""));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    callGetAllAddress();
  }, []);

  const handleApplyCoupon = async (code) => {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const { payload }: any = await dispatch(
        getCouponById({ code: code, amount: finalTotal })
      );

      if (payload.success && payload.coupon.isValid) {
        const discountAmount = calculateDiscountAmount(
          payload.coupon,
          finalTotal
        );
        setAppliedCoupons([payload.coupon]);
        setDiscountAmount(discountAmount);
        toast.success("Coupon applied successfully!");
      } else {
        toast.error("Coupon is not valid for the current user");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply coupon.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupons([]);
    setDiscountAmount(0);
    toast.success("Coupon removed successfully!");
  };

  useEffect(() => {
    callGetCartItems();
    callGetVisibleCoupons();
  }, []);

  useEffect(() => {
    // Remove applied coupons when cart changes
    setAppliedCoupons([]);
    setDiscountAmount(0);

    // Recheck coupon validity if there was a previously applied coupon
    if (appliedCoupons.length > 0) {
      handleApplyCoupon(appliedCoupons[0].couponCode);
    }
  }, [cartItems]);

  const handleRemoveItem = (id, sizeId) => {
    dispatch(removeFromCart({ id, sizeId }));
    setCartProducts((prevProducts: any) =>
      prevProducts.filter((product) => {
        return !(product._id === id && product.size._id === sizeId);
      })
    );
  };
  const handleQuantityChange = (id, sizeId, action) => {
    const currentProduct: any = cartProducts.find(
      (product: any) => product._id === id && product.size._id == sizeId
    );

    const currentItem = cartItems.find(
      (item) => item.id === id && item.size._id == sizeId
    );
    if (action === "decrease") {
      if (currentItem && currentItem.count === 1) {
        handleRemoveItem(id, sizeId);
        return;
      }
    } else if (action === "increase") {
      // Check if increasing would exceed the stock
      if (currentItem.count >= currentProduct?.size?.stock) {
        toast.error(
          `Sorry, only ${currentProduct?.size?.stock} item(s) available in stock.`
        );
        return;
      }
    }

    dispatch(
      action === "increase"
        ? increaseCount({ id, sizeId })
        : decreaseCount({ id, sizeId })
    );

    setCartProducts((prevProducts: any) =>
      prevProducts.map((product) => {
        if (product._id === id) {
          const newQuantity =
            action === "increase"
              ? Math.min(product.quantity + 1, product.stock)
              : Math.max(product.quantity - 1, 0);
          return {
            ...product,
            quantity: newQuantity,
          };
        }
        return product;
      })
    );
  };

  const callProceedToCheckoutApi = async () => {
    setCheckoutLoading(true);
    const payloadApi = {
      productDetails: cartItems.map((item) => {
        return {
          product: item.id,
          count: item?.count,
          size: item?.size?._id,
        };
      }),
      couponCode: appliedCoupons[0]?.couponCode || null,
      orderId:
        orderDate &&
        new Date().getTime() - new Date(orderDate).getTime() <=
          24 * 60 * 60 * 1000
          ? orderId
          : null,
      shippingCost: deliveryFee, // ✅ send shipping/delivery price
    };

    try {
      const { payload }: any = await dispatch(proceedToCheckoutApi(payloadApi));
      if (payload.success) {
        setIsCheckoutModal(true);
        setCreatedOrderDetails(payload.orderDetails);

        dispatch(
          setOrderId({
            orderId: payload.orderDetails._id,
            orderDate: new Date().toISOString(),
          })
        );
      }
      setCheckoutLoading(false);
    } catch (error) {
      setCheckoutLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    const { payload } = await dispatch(getUserDetails());

    if (payload.success) {
      if (payload.user.address.length === 0) {
        toast("Please add a shipping address");
        router.push("/profile");
        return;
      }

      if (!payload.user.defaultAddress && payload.user.address.length > 0) {
        toast("Please mark one address as default for shipping");
        return;
      }

      callProceedToCheckoutApi();
    } else {
      toast.error("Something Went wrong");
    }
  };

  return (
    <div className="min-h-screen">
      <CheckoutModal
        isOpen={isCheckoutModal}
        onClose={setIsCheckoutModal}
        orderDetails={createdOrderDetails}
        deliveryFee={deliveryFee}
      />
      {loading ? (
        <CartSkeletonLoader />
      ) : cartProducts.length > 0 ? (
        // ✅ THIS LINE WAS CHANGED
        <div className="container mx-auto px-4 pt-40 pb-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* cart mobile and web view */}
            <div className="lg:w-7/12">
              {/* Cart Header - Only visible on desktop */}
              <div className="hidden md:grid md:grid-cols-[2fr,1fr,1fr,auto] gap-4 px-6 py-3 bg-gray-50 rounded-t-lg">
                <div className="text-sm font-medium text-gray-600">Product</div>
                <div className="text-sm font-medium text-gray-600">
                  Quantity
                </div>
                <div className="text-sm font-medium text-gray-600 text-right">
                  Price
                </div>
                <div className="w-8"></div> {/* Space for delete button */}
              </div>

              {/* Cart Items */}
              <div className="bg-white rounded-b-lg shadow-sm">
                {cartProducts?.map((item: any, index) => (
                  <div
                    key={item._id}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid md:grid-cols-[2fr,1fr,1fr,auto] gap-4 p-4 items-center">
                      {/* Product Info */}
                      <div className="flex gap-4 items-center">
                        <img
                          src={item?.img[0]}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-md"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/product-details/${
                              item._id
                            }/${item.name.split(" ").join("-")}`;
                          }}
                        />
                        <div>
                          <h3 className="font-medium line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Size:{" "}
                            {item?.size?.size === "Others"
                              ? "Default"
                              : item?.size?.size}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) =>
                            handleQuantityChange(
                              item._id,
                              item.size._id,
                              "decrease"
                            )
                          }
                          className="p-1 rounded-md hover:bg-gray-100"
                        >
                          <FaMinus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {cartItems?.find(
                            (cartItem) =>
                              cartItem.id === item._id &&
                              cartItem.size._id === item.size._id
                          )?.count || 0}
                        </span>
                        <button
                          onClick={(e) =>
                            handleQuantityChange(
                              item._id,
                              item.size._id,
                              "increase"
                            )
                          }
                          className="p-1 rounded-md hover:bg-gray-100"
                        >
                          <FaPlus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right font-medium">
                        ₹{(item.size.offerPrice * item.count).toFixed(2)}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) =>
                          handleRemoveItem(item._id, item.size._id)
                        }
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-5/12">
              <div className="sticky top-10 bg-gray-50 rounded-xl p-4">
                {/* Coupon Selector */}
                <div className="mt-2">
                  <CouponSelector
                    visibleCoupons={visibleCoupons}
                    appliedCoupons={appliedCoupons}
                    handleApplyCoupon={handleApplyCoupon}
                    handleRemoveCoupon={handleRemoveCoupon}
                    discountAmount={discountAmount}
                  />
                </div>
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order Summary
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    ({cartItems.length}
                    {cartItems.length > 1 ? "items" : "item"})
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-lg font-medium">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-lg font-medium">
                      ₹{deliveryFee?.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-green-600">
                    <span>Product Discounts</span>
                    <span className="font-medium">-₹{promotions}</span>
                  </div>

                  {/* Applied Coupons */}
                  {appliedCoupons.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <span className="text-green-700 font-medium block mb-2">
                        Applied Coupons
                      </span>
                      {appliedCoupons.map((coupon) => (
                        <div
                          key={coupon._id}
                          className="flex justify-between text-green-600 items-center"
                        >
                          <div className="flex items-center">
                            <span className="text-sm font-medium">
                              {coupon.couponCode}
                            </span>
                          </div>
                          <span className="font-medium">
                            -₹{discountAmount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Order Total</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{Math.max(Number(finalTotal?.toFixed(2)), 1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <div className="mt-6">
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full bg-black hover:bg-gray-900 text-white font-medium px-6 py-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {checkoutLoading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <span>Proceed to Checkout</span>
                        <FaArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-4">
                    By proceeding, you agree to our{" "}
                    <a href="#" className="underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <p className="text-lg text-gray-600 italic max-w-md">
            “Your cart is feeling lonely. Fill it with something!”
          </p>
          <Button
            onClick={() => router.push("/products?search=")}
            className="w-fit bg-black text-white hover:bg-gray-800"
          >
            Shop Now
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cart;
