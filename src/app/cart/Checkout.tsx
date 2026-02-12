"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearOrderId } from "@/lib/features/order";
// import { setStitchingConfirmation } from "@/lib/features/auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FiMapPin,
  FiEdit2,
  FiPlus,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { getUserDetails } from "@/lib/features/auth";
import axios from "axios";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { emptyCart } from "@/lib/features/cart";
import PaymentSuccessCountdown from "@/components/PaymentSuccessCountdown";
import PaymentFailedScreen from "@/components/PaymentFailedScreen";

type PaymentState = 'idle' | 'processing' | 'verifying' | 'verified' | 'failed';

const CheckoutModal = ({ isOpen, onClose, orderDetails, deliveryFee }) => {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const { token, user } = useSelector((state: any) => state.auth);

  const handleChangeAddress = () => router.push("/profile");
  const handleAddAddress = () => router.push("/profile");

  const callGetUserDetails = async () => {
    setLoadingAddress(true);
    try {
      const { payload } = await dispatch(getUserDetails());
      console.log("User details payload:", payload); // Debug log

      if (payload?.success && payload?.user) {
        const address = payload.user.defaultAddress;
        console.log("Default address:", address); // Debug log

        if (address && address.name && address.address) {
          setShippingAddress(address);
        } else {
          console.warn("No valid default address found");
          setShippingAddress(null);
        }
      } else {
        console.error("Failed to get user details:", payload);
        setShippingAddress(null);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setShippingAddress(null);
      toast.error("Failed to load shipping address");
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened, fetching address..."); // Debug log
      callGetUserDetails();
      setPaymentState('idle');
      setErrorMessage("");
    }

    return () => {
      // Cleanup on unmount
      console.log("Modal closed/unmounting");
    };
  }, [isOpen]);

  const handleCountdownComplete = async () => {
    try {
      await dispatch(emptyCart());
      dispatch(clearOrderId());
      // dispatch(setStitchingConfirmation(false));
      router.push("/orders");
    } catch (error) {
      console.error("Error during post-payment cleanup:", error);
      router.push("/orders");
    }
  };

  const handleGoHome = () => {
    dispatch(clearOrderId());
    // dispatch(setStitchingConfirmation(false));
    setPaymentState('idle');
    setErrorMessage("");
    router.push("/");
  };

  const handleContactSupport = () => router.push("/contact");

  const initiatePayment = async () => {
    if (!token || !user || !user._id) {
      router.push("/login");
      return;
    }

    setPaymentState('processing');
    dispatch(clearOrderId());
    // dispatch(setStitchingConfirmation(false));

    try {
      // Verify order
      const response = await axios.post(
        "/api/order-verify",
        { amount: orderDetails.payablePrice, orderId: orderDetails._id },
        { headers: { "x-user-id": user._id, Authorization: `Bearer ${token}` } }
      );

      if (!response.data.success) {
        toast.error(response.data.msg || "Order verification failed");
        setPaymentState('idle');
        return;
      }

      // Create Razorpay order
      const razorRes = await axios.post("/api/payment-razorpay", {
        amount: orderDetails.payablePrice,
        orderId: orderDetails._id,
      });

      if (!razorRes.data.success || !razorRes.data.id) {
        toast.error("Failed to initialize payment");
        setPaymentState('idle');
        return;
      }

      // Get Razorpay key
      const keyRes = await fetch("/api/get-client-id");
      const keyData = await keyRes.json();
      if (!keyData.keyId) {
        toast.error("Failed to load payment configuration");
        setPaymentState('idle');
        return;
      }

      const options = {
        key: keyData.keyId,
        amount: razorRes.data.amount,
        currency: "INR",
        name: "Swaarasya",
        description: "Thank you for your purchase",
        order_id: razorRes.data.id,
        handler: async (response: any) => {
          setPaymentState('verifying');
          try {
            const verifyPayload: any = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderDetails._id,
            };

            const verify = await axios.post("/api/verify", verifyPayload);

            if (verify.data.success) {
              setPaymentState('verified');
            } else {
              dispatch(clearOrderId());
              // dispatch(setStitchingConfirmation(false));
              setPaymentState('failed');
              setErrorMessage(verify.data.msg || "Payment verification failed. Please contact support.");
              toast.error(verify.data.msg || "Payment verification failed");
            }
          } catch (err: any) {
            dispatch(clearOrderId());
            // dispatch(setStitchingConfirmation(false));
            setPaymentState('failed');
            const msg = err.response?.data?.msg || "Payment verification failed. Please contact support.";
            setErrorMessage(msg);
            toast.error(msg);
          }
        },
        prefill: {
          name: shippingAddress?.name || "",
          email: user?.email || "",
          contact: shippingAddress?.mobile || "",
        },
        theme: { color: "#E3242B" },
        modal: {
          ondismiss: () => {
            dispatch(clearOrderId());
            // dispatch(setStitchingConfirmation(false));
            setPaymentState('failed');
            setErrorMessage("Payment was cancelled");
            toast.error("Payment cancelled");
          },
        },
      };

      onClose(false);

      if (!(window as any).Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => new (window as any).Razorpay(options).open();
        script.onerror = () => {
          toast.error("Failed to load payment gateway");
          setPaymentState('idle');
        };
        document.body.appendChild(script);
      } else {
        new (window as any).Razorpay(options).open();
      }

    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Payment failed. Please try again.");
      setPaymentState('idle');
    }
  };

  // Show success/failure screens OUTSIDE of Dialog
  if (paymentState === 'verifying' || paymentState === 'verified') {
    return <PaymentSuccessCountdown onComplete={handleCountdownComplete} />;
  }

  if (paymentState === 'failed') {
    return (
      <PaymentFailedScreen
        onGoHome={handleGoHome}
        onContactSupport={handleContactSupport}
        errorMessage={errorMessage}
      />
    );
  }

  const isProcessing = paymentState === 'processing';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose(false)}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 flex flex-col overflow-hidden z-[9999]">
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 text-grey-800 border-b p-6 sticky top-30 z-10">
          <div className="text-xl font-bold flex justify-between mt-2 items-center">
            <h1 className="text-xl font-bold flex items-center">
              <FiShoppingBag className="mr-2" />
              Checkout Summary
            </h1>
            <IoClose
              size={32}
              onClick={() => !isProcessing && onClose()}
              className={isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiTruck className="mr-2" />
              Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{orderDetails.totalPrice}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Product Discounts:</span>
                <span>₹{orderDetails.totalPrice + deliveryFee - orderDetails.payablePrice}</span>
              </div>
              {orderDetails.off > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupons:</span>
                  <span>-₹{orderDetails.off}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>₹{orderDetails.payablePrice}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-grey-800">
              <FiMapPin className="mr-2" />
              Shipping Address
            </h3>
            <p className="text-red mb-2">Shipping to:</p>
            {loadingAddress ? (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                <p className="text-gray-600">Loading address...</p>
              </div>
            ) : shippingAddress ? (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="font-medium">{shippingAddress.name}</p>
                <p>{shippingAddress.address}</p>
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                <p>Mobile: {shippingAddress.mobile}</p>
                <p className="text-sm text-gray-500 mt-1">{shippingAddress.addressType}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleChangeAddress}
                  disabled={isProcessing}
                >
                  <FiEdit2 className="mr-2" /> Change Address
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                <p className="text-gray-600 mb-3">No shipping address found.</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAddress}
                    disabled={isProcessing}
                  >
                    <FiPlus className="mr-2" /> Add Address
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={callGetUserDetails}
                    disabled={isProcessing}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Button Area */}
        <div className="bg-gray-50 p-6">
          <Button
            disabled={!shippingAddress || isProcessing || loadingAddress}
            className="w-full bg-red-500 text-white"
            variant="blood"
            onClick={initiatePayment}
          >
            {isProcessing ? "Processing Payment..." : loadingAddress ? "Loading..." : "Pay Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;