"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { emptyCart } from "@/lib/features/cart";

const CheckoutModal = ({ isOpen, onClose, orderDetails, deliveryFee }) => {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const { token, user, adminToken } = useSelector((state: any) => state.auth);
  const handleChangeAddress = () => {
    router.push("/profile");
  };

  const handleAddAddress = () => {
    router.push("/profile");
  };

  const callGetUserDetails = async () => {
    const { payload } = await dispatch(getUserDetails());

    if (payload.success) {
      setShippingAddress(payload.user.defaultAddress);
    } else {
      setShippingAddress(null);
    }
  };

  useEffect(() => {
    callGetUserDetails();
  }, []);

  const initiatePayment = async () => {
    if (!token || !user || !user._id) {
      router.push("/login");
      return;
    }
    setPaying(true);
    dispatch(clearOrderId());
    try {
      const response: any = await axios.post(`/api/payment/initiate`, {
        amount: orderDetails.payablePrice,
        orderId: orderDetails._id,
      });

      if (response.data.success) {
        window.location.href = response.data.url;
      } else {
        toast.error(response.data.msg);
      }
      setPaying(false);
    } catch (error) {
      console.log(error);
      setPaying(false);
      toast.error("refresh and try again");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] p-0 flex flex-col overflow-hidden"
        style={{ zIndex: 9999 }}
      >
        {/* Fixed Header */}
        {/* <DialogHeader className="bg-gradient-to-r from-gray-100 to-gray-50 text-black border-b p-6 sticky top-30 z-10">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <FiShoppingBag className="mr-2" />
            Checkout Summary
          </DialogTitle>
        </DialogHeader> */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 text-black border-b p-6 sticky top-30 z-10 ">
          <div className="text-xl font-bold flex justify-between mt-4 items-center">
            <h1 className="text-xl font-bold flex items-center ">
              <FiShoppingBag className="mr-2 " />
              Checkout Summary
            </h1>
            <IoClose size={32} onClick={() => onClose()} />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div
            data-aos="fade-up"
            className="bg-white rounded-lg shadow-md p-4 mb-6"
          >
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
                <span>
                  ₹
                  {orderDetails.totalPrice +
                    deliveryFee +
                    -orderDetails.payablePrice}
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

          <div data-aos="fade-up" data-aos-offset="0" data-aos-delay="200">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-black">
              <FiMapPin className="mr-2" />
              Shipping Address
            </h3>
            <p className="text-red">Shipping to:</p>
            {shippingAddress ? (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm ">
                <p className="font-medium">{shippingAddress.name}</p>
                <p>{shippingAddress.address}</p>
                <p>{shippingAddress.city}</p>
                <p>
                  {shippingAddress.state}, {shippingAddress.country}
                  {shippingAddress.zipCode}
                </p>
                <p>Mobile: {shippingAddress.mobile}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {shippingAddress.addressType}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleChangeAddress}
                >
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

        {/* Fixed Button Area */}
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
