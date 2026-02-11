"use client";

import React, { useState } from "react";
import {
  FiCheck,
  FiPackage,
  FiRefreshCw,
  FiThumbsDown,
  FiThumbsUp,
  FiTruck,
  FiX,
} from "react-icons/fi";
import Steps from "@/components/steps";
import useWindowSize from "@/hooks/useWindowSize";
import { EXCHANGE_PERIOD } from "@/constants/contsants";
import { ExchangeModal } from "../Exchnage";

export default function StatusPage() {
  // 🔹 Temporary dummy data (Replace with real order fetch later)
  const status: string = "Shipped";
  const trackingNumber = "123456789";
  const deliveryDate = new Date();
  const orderId = "1";
  const id = "1";
  const deliveryPartner = "Delhivery";

  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  const getMiddleStep = () => {
    switch (status) {
      case "Shipped":
        return { icon: FiTruck, label: "In Transit" };
      case "Cancelled":
        return { icon: FiX, label: "Cancelled" };
      case "Applied for exchange":
        return { icon: FiRefreshCw, label: "Exchange Requested" };
      case "Exchange Approved":
        return { icon: FiThumbsUp, label: "Exchange Approved" };
      case "Exchange Cancelled":
        return { icon: FiThumbsDown, label: "Exchange Cancelled" };
      default:
        return { icon: FiTruck, label: "Processing" };
    }
  };

  const steps = [
    { icon: FiPackage, label: "Order Placed" },
    getMiddleStep(),
    { icon: FiCheck, label: "Delivered" },
  ];

  const { width } = useWindowSize();

  let currentStep;
  switch (status) {
    case "Pending":
    case "Shipping":
      currentStep = 1;
      break;
    case "Shipped":
    case "Applied for exchange":
    case "Exchange Approved":
    case "Exchange Cancelled":
    case "Cancelled":
      currentStep = 2;
      break;
    case "Delivered":
      currentStep = 3;
      break;
    default:
      currentStep = 1;
  }

  const isDelivered = status === "Delivered";
  const daysSinceDelivery = isDelivered
    ? Math.floor(
        (new Date().getTime() - new Date(deliveryDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const canExchange = isDelivered && daysSinceDelivery <= EXCHANGE_PERIOD;

  return (
  <div className="min-h-[50vh] flex justify-center pt-24 px-6">
    <div className="w-full max-w-4xl space-y-8">

      <div className="flex items-center justify-between">
        {width > 500 && (
          <h3 className="text-xl font-semibold">Order Status</h3>
        )}
        {trackingNumber && (
          <div className="text-sm text-gray-500 flex items-center">
            <FiTruck className="mr-2" />
            TrackingId: {trackingNumber}{" "}
            {deliveryPartner && `| ${deliveryPartner}`}
          </div>
        )}
      </div>

      <Steps steps={steps} currentStep={currentStep} />

      <ExchangeModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        orderId={orderId}
        id={id}
        fetchOrderDetails={() => {}}
      />
    </div>
  </div>
  );
}
