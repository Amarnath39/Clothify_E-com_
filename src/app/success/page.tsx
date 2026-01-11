"use client";

import { clearOrderId, successOrder } from "@/lib/features/order";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheck, FaExclamation, FaTimes } from "react-icons/fa";
import { emptyCart } from "@/lib/features/cart";

const SuccessOrder = () => {
  const { currentOrder } = useSelector((state: any) => state.order);
  const dispatch = useDispatch<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId") || "";

  useEffect(() => {
    const callGetSuccessApi = async () => {
      try {
        const { payload } = await dispatch(
          successOrder({
            id: currentOrder._id,
            transactionId,
          })
        );

        // console.log(payload, "from payment");

        if (
          payload.success &&
          payload.order.paymentStatus === "PAYMENT_SUCCESS"
        ) {
          setIsSuccess(true);
          dispatch(clearOrderId());
          dispatch(emptyCart());
        } else {
          setIsSuccess(false);
          dispatch(emptyCart());
        }
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        setIsSuccess(false);
      }
    };

    callGetSuccessApi();
  }, [dispatch, currentOrder._id, transactionId]);

  const handleViewOrders = () => {
    router.push("/orders");
  };

  const handleContactCustomerCare = () => {
    // Create message with order ID for customer support
    const message = `Hello, I'm facing an issue with my order (Order ID: ${currentOrder.orderId}). My payment was not confirmed. Please assist.`;

    // Open WhatsApp with the specific phone number and pre-filled message
    window.open(
      `https://wa.me/+918840227665?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {isLoading ? (
        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-md flex items-center justify-center flex-col">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-gray-500 font-medium mt-4">
            Verifying Payment... <br />
            <span className="text-sm text-gray-400">
              Please do not refresh or close this page.
            </span>
          </p>
        </div>
      ) : isSuccess ? (
        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-md text-center">
          <div className="flex items-center justify-center">
            <div className="bg-green-500 rounded-full p-6 inline-block">
              <FaCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-6">
            ✅ Payment Successful
          </h2>
          <p className="text-gray-500 mt-4">
            Your order has been successfully placed.
          </p>
          <p className="text-green-600 font-medium mt-2">
            💳 Payment confirmed via PhonePe.
          </p>
          <p className="text-gray-600 mt-1">
            🚚 Shipment is being prepared.
          </p>

          {/* ✅ NEW: Tracking Details Section */}
          {currentOrder.dtdc?.referenceNumber && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-gray-700 font-semibold mb-2">Shipping Details:</p>
              <p className="text-sm text-gray-600">
                <strong>Courier Partner:</strong> DTDC
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tracking Number:</strong> {currentOrder.dtdc.referenceNumber}
              </p>
              <a
                href="https://www.dtdc.in/tracking.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline inline-block mt-2 hover:text-blue-700"
              >
                Track Your Shipment →
              </a>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg"
              onClick={handleViewOrders}
            >
              View Orders
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Your order details have been emailed to you. If you have any
              questions, please contact our customer service team.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-md text-center">
          <div className="flex justify-center">
            <div className="bg-yellow rounded-full p-5 inline-block">
              <FaExclamation className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-6">
            Order Not Confirmed
          </h2>
          <p className="text-gray-500 mt-2">
            ⏳ Payment is under verification.
          </p>
          <p className="text-gray-600 mt-1 font-medium">
            Please do not refresh the page.
          </p>
          <p className="text-gray-500 mt-4">
            If the issue persists, please contact our customer care team for
            assistance.
          </p>
          <div className="mt-6">
            <button
              className="bg-yellow hover:bg-red text-white font-bold py-3 px-6 rounded-lg"
              onClick={handleContactCustomerCare}
            >
              Contact Customer Care
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessOrder;
