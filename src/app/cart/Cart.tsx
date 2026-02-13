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
import { Checkbox } from "@/components/ui/checkbox";

import {
  decreaseCount,
  getCartItems,
  getCouponById,
  getVisibleCoupons,
  increaseCount,
  removeFromCart,
  setTotalAmount,
} from "@/lib/features/cart";
import { addItem } from "@/lib/features/wishlist";
import {
  FaArrowRight,
  FaChevronDown,
  FaInfoCircle,
  FaMinus,
  FaPlus,
  FaTrash,
  FaHeart,
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

// Define the interface for a product in the cart
interface CartProduct {
  _id: string;
  name: string;
  img: string[];
  color: string;
  actualPrice: number;
  description: string;
  size: {
    _id: string;
    size: string;
    stock: number;
    offerPrice: number;
    deliveryPrice?: number;
  } | null;
  count: number;
}

const Cart = () => {
  const dispatch = useDispatch<any>();
  const cartItems = useSelector((state: any) => state.cart.items);
  const wishlistItems = useSelector((state: any) => state.wishlist.items);
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [visibleCoupons, setVisibleCoupons] = useState<any[]>([]);
  const [appliedCoupons, setAppliedCoupons] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [createdOrderDetails, setCreatedOrderDetails] = useState({});
  const { totalAmount } = useSelector((state: any) => state.cart);
  const latestTotalRef = useRef(0);
  const { addressState } = useSelector((state: any) => state.address);
  const { width } = useWindowSize();
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCheckoutModal, setIsCheckoutModal] = useState(false);
  const { token } = useSelector((state: any) => state.auth);
  const [loading, setLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { orderId, orderDate }: any = useSelector(
    (state: RootState) => state.order
  );
  const [userDeliveryFee, setUserDeliveryFee] = useState(0);

  // Selection State
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const callGetCartItems = useCallback(async () => {
    if (cartItems.length === 0) {
      setCartProducts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { payload } = await dispatch(
        getCartItems({
          carts: cartItems.map((item: any) => item.id),
        })
      );

      if (payload.success) {
        const hydratedCartProducts = cartItems.map((cartItem: any) => {
          const product = payload.products.find(
            (p: any) => p._id === cartItem.id
          );
          if (!product) return null;
          const matchedSize = product.sizes.find(
            (size: any) => size._id === cartItem.size._id
          );
          return {
            _id: product._id,
            name: product.name,
            img: product.img,
            color: product.color,
            actualPrice: product.actualPrice,
            description: product.description,
            size: matchedSize ? matchedSize : null,
            count: cartItem.count,
          };
        }).filter(Boolean) as CartProduct[];
        setCartProducts(hydratedCartProducts);
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, cartItems]);


  const callGetVisibleCoupons = async () => {
    try {
      const { payload }: any = await dispatch(getVisibleCoupons());
      if (payload.success) {
        setVisibleCoupons(payload.coupons);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    callGetCartItems();
    callGetVisibleCoupons();
    callGetAllAddress();
  }, [callGetCartItems]);


  const { subtotal, tax, finalTotal, promotions, deliveryFee, offerPriceTotal } = useMemo(() => {
    const subtotal = cartProducts.reduce((sum, item) => {
      return sum + (item.actualPrice || 0) * item.count;
    }, 0);

    const offerPriceTotal = cartProducts.reduce((sum, item) => {
      return sum + (item.size?.offerPrice || 0) * item.count;
    }, 0);

    const promotions = subtotal - offerPriceTotal;
    const deliveryFee = 0; // Replace with your actual delivery fee logic
    const tax = 0;
    const finalTotal = offerPriceTotal + deliveryFee + tax - couponDiscount;

    dispatch(setTotalAmount(finalTotal));
    return { subtotal, tax, finalTotal, promotions, deliveryFee, offerPriceTotal };
  }, [cartProducts, couponDiscount, dispatch]);

  const callGetAllAddress = async () => {
    try {
      const { payload } = await dispatch(getUserDetails());
      if (payload.success) {
        setUserDeliveryFee(payload?.deliveryFee || 0);
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

  const calculateCouponDiscount = (coupon: any, cartTotal: number) => {
    let discount = 0;
    const discountValue = parseFloat(coupon.amount) || 0;
    const maxCap = parseFloat(coupon.maxDiscount) || null;

    if (coupon.type === "percentage") {
      discount = (cartTotal * discountValue) / 100;
      if (maxCap && maxCap > 0) {
        discount = Math.min(discount, maxCap);
      }
    } else if (coupon.type === "flat") {
      discount = discountValue;
    }

    discount = Math.min(discount, cartTotal);
    return Math.abs(discount);
  };

  const handleApplyCoupon = useCallback(async (code) => {
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const { payload }: any = await dispatch(
        getCouponById({
          code: code,
          totalPrice: offerPriceTotal
        })
      );

      if (payload.success && payload.coupon) {
        if (payload.coupon.isValid === false) {
          toast.error(payload.coupon.errorMsg || "Coupon is not valid");
          return;
        }

        const discount = calculateCouponDiscount(payload.coupon, offerPriceTotal);  // ✅ Calculate on ₹134
        setAppliedCoupons([payload.coupon]);
        setCouponDiscount(discount);
        toast.success("Coupon applied successfully!");
      } else {
        toast.error(payload.msg || "Coupon not found");
      }
    } catch (error) {
      console.error("Coupon error:", error);
      toast.error("Failed to apply coupon.");
    }
  }, [token, router, offerPriceTotal, dispatch]);  // ✅ Changed dependency

  const handleRemoveCoupon = () => {
    setAppliedCoupons([]);
    setCouponDiscount(0);
    toast.success("Coupon removed successfully!");
  };

  useEffect(() => {
    if (cartItems.length === 0 || offerPriceTotal <= 0) return;

    const previousCouponCode = appliedCoupons[0]?.couponCode;
    setAppliedCoupons([]);
    setCouponDiscount(0);

    if (previousCouponCode) {
      setTimeout(() => handleApplyCoupon(previousCouponCode), 100);
    }
  }, [cartItems, offerPriceTotal, handleApplyCoupon]);

  const handleRemoveItem = (id: string, sizeId: string) => {
    dispatch(removeFromCart({ id, sizeId }));
    setSelectedItems((prev) => prev.filter((item) => item !== `${id}-${sizeId}`));
  };

  const handleQuantityChange = (id: string, sizeId: string, action: 'increase' | 'decrease') => {
    const product = cartProducts.find(p => p._id === id && p.size?._id === sizeId);
    const item = cartItems.find((i: any) => i.id === id && i.size._id === sizeId);

    if (action === 'decrease' && item?.count <= 1) {
      handleRemoveItem(id, sizeId);
      return;
    }
    if (action === 'increase' && product && item?.count >= product.size!.stock) {
      toast.error(`Only ${product.size!.stock} items available`);
      return;
    }
    dispatch(action === 'increase' ? increaseCount({ id, sizeId }) : decreaseCount({ id, sizeId }));
  };

  // ✅ THIS IS THE CORRECTED FUNCTION
  const callProceedToCheckoutApi = async () => {
    setCheckoutLoading(true);
    const couponToSend = appliedCoupons[0]?.couponCode || null;

    const payloadApi = {
      productDetails: cartProducts.map((item) => {
        return {
          product: item._id,
          count: item.count,
          size: item.size?._id, // Sending the size ID
        };
      }),
      couponCode: couponToSend || null,
      orderId: orderId,
      shippingCost: deliveryFee,
    };

    try {
      const { payload }: any = await dispatch(proceedToCheckoutApi(payloadApi));
      if (payload.success) {
        setIsCheckoutModal(true);
        // Combine order details with guestToken if present
        setCreatedOrderDetails({
          ...payload.orderDetails,
          guestToken: payload.guestToken
        });
        dispatch(
          setOrderId({
            orderId: payload.orderDetails._id,
            orderDate: new Date().toISOString(),
          })
        );
      } else {
        toast.error(payload.msg || "Failed to create order.");
      }
    } catch (error) {
      toast.error("An error occurred during checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    // You might want to re-fetch user details here if needed, or rely on initial load
    callProceedToCheckoutApi();
  };

  // --- New Handlers for Selection and Move to Wishlist ---

  const handleToggleSelect = (id: string, sizeId: string) => {
    const key = `${id}-${sizeId}`;
    setSelectedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cartProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartProducts.map((item) => `${item._id}-${item.size?._id}`));
    }
  };

  const handleMoveToWishlist = (item: CartProduct) => {
    const isInWishlist = wishlistItems.some((w: any) => w.id === item._id);
    if (!isInWishlist) {
      dispatch(
        addItem({
          id: item._id,
          name: item.name,
          colors: item.color ? [item.color] : [], // Adjust based on your data structure
          img: item.img,
          description: item.description,
          amount: item.size?.offerPrice || 0,
        })
      );
      toast.success("Moved to wishlist");
    } else {
      toast.success("Already in wishlist, removed from cart");
    }
    handleRemoveItem(item._id, item.size!._id);
  };

  const handleBulkRemove = () => {
    selectedItems.forEach((key) => {
      const [id, sizeId] = key.split("-");
      dispatch(removeFromCart({ id, sizeId }));
    });
    setSelectedItems([]);
    toast.success("Selected items removed");
  };

  const handleBulkMoveToWishlist = () => {
    let movedCount = 0;
    selectedItems.forEach((key) => {
      const [id, sizeId] = key.split("-");
      const item = cartProducts.find((p) => p._id === id && p.size?._id === sizeId);
      if (item) {
        const isInWishlist = wishlistItems.some((w: any) => w.id === item._id);
        if (!isInWishlist) {
          dispatch(
            addItem({
              id: item._id,
              name: item.name,
              colors: item.color ? [item.color] : [],
              img: item.img,
              description: item.description,
              amount: item.size?.offerPrice || 0,
            })
          );
        }
        dispatch(removeFromCart({ id, sizeId }));
        movedCount++;
      }
    });
    setSelectedItems([]);
    toast.success(`${movedCount} items moved to wishlist`);
  };


  // Render logic...
  return (
    <div className="min-h-screen">
      <CheckoutModal
        isOpen={isCheckoutModal}
        onClose={() => setIsCheckoutModal(false)}
        orderDetails={createdOrderDetails}
        deliveryFee={deliveryFee}
      />
      {loading ? (
        <CartSkeletonLoader />
      ) : cartProducts.length > 0 ? (
        <div className="container mx-auto px-4 pt-40 pb-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          {/* Bulk Actions Bar */}
          {selectedItems.length > 0 && (
            <div className="bg-gray-100 p-4 rounded-lg mb-4 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
              <span className="font-medium">{selectedItems.length} items selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkMoveToWishlist} className="bg-white hover:bg-gray-200 text-black border-gray-300">
                  <FaHeart className="mr-2 h-4 w-4" /> Move to Wishlist
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkRemove} className="bg-red-600 hover:bg-red-700 text-white">
                  <FaTrash className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-7/12">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2 mb-2 px-4">
                <Checkbox
                  id="select-all"
                  checked={selectedItems.length === cartProducts.length && cartProducts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer">Select All</Label>
              </div>

              {/* Cart Items */}
              <div className="bg-white rounded-lg shadow-sm">
                {cartProducts.map((item) => (
                  <div key={`${item._id}-${item.size?._id}`} className="border-b last:border-b-0">
                    <div className="grid grid-cols-[auto,auto,1fr,auto] md:grid-cols-[auto,100px,1fr,auto,auto,auto] gap-4 p-4 items-center">
                      {/* Checkbox */}
                      <Checkbox
                        checked={selectedItems.includes(`${item._id}-${item.size?._id}`)}
                        onCheckedChange={() => handleToggleSelect(item._id, item.size!._id)}
                      />

                      <img src={item.img[0]} alt={item.name} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-md" />
                      <div className="flex-grow">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">Size: {item.size?.size}</p>
                        <div className="md:hidden flex items-baseline space-x-2">
                          <p className="font-semibold">₹{item.size?.offerPrice.toFixed(2)}</p>
                          {item.actualPrice && item.size && item.size.offerPrice < item.actualPrice && (
                            <p className="text-sm text-gray-500 line-through">₹{item.actualPrice.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      <div className="hidden md:flex items-center space-x-2">
                        <button onClick={() => handleQuantityChange(item._id, item.size!._id, "decrease")} className="p-1 rounded-md hover:bg-gray-100">
                          <FaMinus className="h-3 w-3" />
                        </button>
                        <span>{item.count}</span>
                        <button onClick={() => handleQuantityChange(item._id, item.size!._id, "increase")} className="p-1 rounded-md hover:bg-gray-100">
                          <FaPlus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="hidden md:flex flex-col items-end">
                        <span className="font-medium">₹{(item.size!.offerPrice * item.count).toFixed(2)}</span>
                        {item.actualPrice && item.size && item.size.offerPrice < item.actualPrice && (
                          <span className="text-sm text-gray-500 line-through">₹{(item.actualPrice * item.count).toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleRemoveItem(item._id, item.size!._id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove from Cart"
                        >
                          <FaTrash />
                        </button>
                        <button
                          onClick={() => handleMoveToWishlist(item)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Move to Wishlist"
                        >
                          <FaHeart />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-5/12">
              <div className="sticky top-28 bg-gray-50 rounded-xl p-6">
                <div className="mt-2">
                  <CouponSelector
                    visibleCoupons={visibleCoupons}
                    appliedCoupons={appliedCoupons}
                    handleApplyCoupon={handleApplyCoupon}
                    handleRemoveCoupon={handleRemoveCoupon}
                    discountAmount={couponDiscount}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{promotions.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>₹{deliveryFee.toFixed(2)}</span></div>
                  <Separator className="my-2" />
                  {appliedCoupons.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <span className="text-green-700 font-medium block mb-2">Applied Coupons</span>
                      {appliedCoupons.map((coupon) => (
                        <div key={coupon._id} className="flex justify-between text-green-600 items-center">
                          <span className="text-sm font-medium">{coupon.couponCode}</span>
                          <span className="font-medium">-₹{couponDiscount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{finalTotal.toFixed(2)}</span></div>
                </div>
                <div className="mt-6">
                  <button onClick={handleProceedToCheckout} disabled={checkoutLoading} className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400">
                    {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <p className="text-lg text-gray-600">Your cart is empty.</p>
          <Button onClick={() => router.push("/")}>Continue Shopping</Button>
        </div>
      )}
    </div>
  );
};

export default Cart;