"use client";

import React, { useEffect, useState } from "react";
// Removed useRouter and replaced with window.location for navigation
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Removed icon libraries and replaced with inline SVGs
import axios from "axios";
import toast from "react-hot-toast";

// Inline SVG components to remove external dependencies
const FiMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const FiEdit2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const FiPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const FiShoppingBag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);
const FiTruck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
);
const IoClose = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} className="cursor-pointer"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);


const CheckoutModal = ({ isOpen, onClose, orderDetails, deliveryFee }) => {
  // Removed useRouter
  // Removed Redux hooks and replaced with props/state where needed
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  // This assumes you pass the user and token from a parent component or context
  // This is a placeholder; you should replace it with your actual auth state management
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleChangeAddress = () => (window.location.href = "/profile");
  const handleAddAddress = () => (window.location.href = "/profile");

  // This effect simulates fetching user data and token on component mount
  useEffect(() => {
    // In a real app, you would get this from your auth context or a similar store
    const fetchAuthData = async () => {
        // Placeholder: Replace with your actual logic to get the logged-in user and token
        // For example, from localStorage or an auth context
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            // You would also fetch the user object associated with this token
            // For now, let's mock a user object for demonstration
            // const fetchedUser = await yourAuthService.getUser(storedToken);
            const mockUser = { _id: 'mockUserId', defaultAddress: { /* mock address */ } };
            setUser(mockUser);
            setShippingAddress(mockUser.defaultAddress);
        }
    };
    fetchAuthData();
  }, []);

  const initiatePayment = async () => {
    if (!token || !user || !user._id) {
      window.location.href = "/login";
      return;
    }
    setPaying(true);

    try {
      const response: any = await axios.post(
        // 👇 FIX 1: The API URL is corrected
        `/api/payment/create-sdk-order`,
        // 👇 FIX 2: The body now sends `userId` as the backend expects
        {
          amount: orderDetails.payablePrice,
          userId: user._id,
        },
        {
          headers: {
            "x-user-id": user._id,
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error(response.data.msg || "Payment initiation failed.");
      }
    } catch (error) {
      console.log(error);
      toast.error("Refresh and try again");
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
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 text-black border-b p-6 sticky top-0 z-10">
          <div className="text-xl font-bold flex justify-between items-center">
            <h1 className="flex items-center">
              <FiShoppingBag /> Checkout Summary
            </h1>
            <IoClose size={32} onClick={() => onClose()} />
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiTruck /> Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{orderDetails.totalPrice}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Product Discounts:</span>
                <span>
                  ₹{orderDetails.totalPrice + deliveryFee - orderDetails.payablePrice}
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

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiMapPin /> Shipping Address
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
                  <FiEdit2 /> Change Address
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                <p className="text-gray-600 mb-3">No shipping address found.</p>
                <Button variant="outline" size="sm" onClick={handleAddAddress}>
                  <FiPlus /> Add Address
                </Button>
              </div>
            )}
          </div>
        </div>

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