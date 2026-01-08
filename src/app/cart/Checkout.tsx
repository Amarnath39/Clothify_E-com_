"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
import AOS from "aos";
import "aos/dist/aos.css";
import axios from "axios";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { clearOrderId } from "@/lib/features/order";

const CheckoutModal = ({ isOpen, onClose, orderDetails, deliveryFee }) => {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const { token, user } = useSelector((state: any) => state.auth);

  const handleChangeAddress = () => router.push("/profile");
  const handleAddAddress = () => router.push("/profile");

  const callGetUserDetails = async () => {
    // This assumes getUserDetails correctly populates state.auth.user.defaultAddress
    const { payload } = await dispatch(getUserDetails());
    if (payload.success) {
      setShippingAddress(payload.user.defaultAddress);
    } else {
      setShippingAddress(null);
    }
  };

  useEffect(() => {
    // We run this when the modal is opened AND we have a user
    if (isOpen && user) {
        callGetUserDetails();
    }
    AOS.init();
  }, [isOpen, user]); // Re-run when the modal opens or user data changes

  // This effect will update the address if the user prop changes (e.g., after login)
  useEffect(() => {
    if (user && user.defaultAddress) {
      setShippingAddress(user.defaultAddress);
    } else {
      setShippingAddress(null);
    }
  }, [user]);

  const initiatePayment = async () => {
    if (!token || !user || !user._id) {
      router.push("/login");
      return;
    }
    setPaying(true);
    dispatch(clearOrderId());

    try {
      const response: any = await axios.post(
        // 👇 FIX 1: The API URL is corrected
        `/api/payment/initiate`,
        // 👇 FIX 2: The body now sends `userId` as the backend expects
        {
          amount: orderDetails.payablePrice,
          orderId: orderDetails._id,
        },
        {
          headers: {
            "x-user-id": user._id,
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      // This assumes your backend is now correctly sending 'url'
      if (response.data.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error(response.data.msg || "Payment initiation failed.");
      }
    } catch (error) {
      console.log(error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
          toast.error("Error: Payment API endpoint not found.");
      } else {
          toast.error("Refresh and try again");
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] p-0 flex flex-col overflow-hidden"
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 text-black border-b p-6 sticky top-0 z-10">
          <div className="text-xl font-bold flex justify-between items-center">
            <h1 className="flex items-center">
              <FiShoppingBag className="mr-2" /> Checkout Summary
            </h1>
            <IoClose size={32} onClick={() => onClose()} />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Order Details */}
          <div data-aos="fade-up" className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiTruck className="mr-2" /> Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{orderDetails.totalPrice}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Product Discounts:</span>
                <span>
                  -₹{orderDetails.totalPrice-(orderDetails.payablePrice + orderDetails.off)}
                </span>
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

          {/* Shipping Address */}
          <div data-aos="fade-up" data-aos-offset="0" data-aos-delay="200">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiMapPin className="mr-2" /> Shipping Address
            </h3>
            {shippingAddress ? (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="font-medium">{shippingAddress.name}</p>
                <p>{shippingAddress.address}</p>
                <p>{shippingAddress.city}</p>
                <p>
                  {shippingAddress.state}, {shippingAddress.country} {shippingAddress.zipCode}
                </p>
                <p>Mobile: {shippingAddress.mobile}</p>
                <p className="text-sm text-gray-500 mt-1">{shippingAddress.addressType}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleChangeAddress}>
                  <FiEdit2 className="mr-2" /> Change Address
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                <p className="text-gray-600 mb-3">No shipping address found.</p>
                <Button variant="outline" size="sm" onClick={handleAddAddress}>
                  <FiPlus className="mr-2" /> Add Address
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Pay Button */}
        <div className="bg-gray-50 p-6">
          <Button
            disabled={!shippingAddress || paying}
            className="w-full"
            onClick={initiatePayment}
          >
            {paying ? "Paying" : "Pay Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;