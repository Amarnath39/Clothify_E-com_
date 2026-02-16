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
  FaCartPlus,
} from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
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
  if (cartProducts.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-roboto">
        <div className="max-w-md w-full text-center space-y-6 animate-fadeIn">
          <div className="relative mx-auto w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center border border-slate-100">
            <FaCartPlus className="text-slate-200" size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 font-quicksand tracking-tight">Your Cart is Empty</h2>
            <p className="text-slate-500">Looks like you haven't added anything to your cart yet. Let's find something special for you.</p>
          </div>
          <Button
            className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all sm:w-auto px-10"
            onClick={() => router.push("/")}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-16 px-4 sm:px-6 lg:px-8 font-roboto">
      <CheckoutModal
        isOpen={isCheckoutModal}
        onClose={() => setIsCheckoutModal(false)}
        orderDetails={createdOrderDetails}
        deliveryFee={deliveryFee}
      />

      <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-quicksand">Shopping Cart</h1>
          <p className="text-slate-500 mt-1">Review your items and proceed to checkout.</p>
        </div>

        {loading ? (
          <CartSkeletonLoader />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              {/* Bulk Actions & Select All */}
              <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={selectedItems.length === cartProducts.length && cartProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="rounded-md border-slate-300 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                  />
                  <Label htmlFor="select-all" className="text-sm font-bold text-slate-700 cursor-pointer uppercase tracking-widest">
                    Select All ({cartProducts.length})
                  </Label>
                </div>

                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                    <Button variant="ghost" size="sm" onClick={handleBulkMoveToWishlist} className="text-slate-500 hover:text-brand hover:bg-brand/5 font-bold flex gap-2 rounded-lg h-9 px-3">
                      <FaHeart className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Move to Wishlist</span>
                    </Button>
                    <div className="w-px h-4 bg-slate-200" />
                    <Button variant="ghost" size="sm" onClick={handleBulkRemove} className="text-slate-500 hover:text-red-500 hover:bg-red-50 font-bold flex gap-2 rounded-lg h-9 px-3">
                      <FaTrash className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete Selected</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {cartProducts.map((item) => (
                  <Card key={`${item._id}-${item.size?._id}`} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 p-4 sm:p-6">
                      <Checkbox
                        checked={selectedItems.includes(`${item._id}-${item.size?._id}`)}
                        onCheckedChange={() => handleToggleSelect(item._id, item.size!._id)}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                      />

                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        <img src={item.img[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-brand transition-colors font-quicksand leading-tight text-lg">
                            {item.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-100">
                              Size: {item.size?.size}
                            </span>
                            {item.color && (
                              <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-100">
                                Col: {item.color}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-1 mt-2 hidden sm:block">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:min-w-[120px]">
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">
                              ₹{(item.size!.offerPrice * item.count).toLocaleString('en-IN')}
                            </div>
                            {item.actualPrice && item.size && item.size.offerPrice < item.actualPrice && (
                              <div className="text-xs text-slate-400 line-through">
                                ₹{(item.actualPrice * item.count).toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                            <button onClick={() => handleQuantityChange(item._id, item.size!._id, "decrease")} className="p-1.5 rounded-md hover:bg-white hover:text-brand hover:shadow-sm transition-all text-slate-400">
                              <FaMinus size={10} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-slate-700">{item.count}</span>
                            <button onClick={() => handleQuantityChange(item._id, item.size!._id, "increase")} className="p-1.5 rounded-md hover:bg-white hover:text-brand hover:shadow-sm transition-all text-slate-400">
                              <FaPlus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" onClick={() => handleMoveToWishlist(item)} className="h-9 w-9 text-slate-300 hover:text-brand hover:bg-brand/5 rounded-xl">
                          <FaHeart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item._id, item.size!._id)} className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                          <FaTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
              <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <CouponSelector
                      visibleCoupons={visibleCoupons}
                      appliedCoupons={appliedCoupons}
                      handleApplyCoupon={handleApplyCoupon}
                      handleRemoveCoupon={handleRemoveCoupon}
                      discountAmount={couponDiscount}
                    />
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 font-quicksand">Order Summary</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal ({cartProducts.length} items)</span>
                        <span className="text-slate-900 font-medium">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Savings</span>
                        <span className="text-emerald-600 font-bold">-₹{promotions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Delivery</span>
                        <span className="text-slate-900 font-medium">{deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee.toFixed(2)}`}</span>
                      </div>

                      {appliedCoupons.length > 0 && (
                        <div className="flex justify-between text-sm p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckIcon className="w-4 h-4" />
                            <span className="font-bold uppercase tracking-widest text-[10px]">Coupon Applied</span>
                          </div>
                          <span className="text-emerald-700 font-bold">-₹{couponDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <Separator className="my-4 bg-slate-100" />

                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-0.5">Total Amount</span>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-[10px] text-right text-slate-400 font-medium pb-1">Incl. of all taxes</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleProceedToCheckout}
                    disabled={checkoutLoading}
                    className="w-full h-12 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
                  >
                    {checkoutLoading ? <FiLoader className="animate-spin" /> : (
                      <>
                        Checkout Now
                        <FaArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <FaInfoCircle className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Secure SSL Encrypted Checkout</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;