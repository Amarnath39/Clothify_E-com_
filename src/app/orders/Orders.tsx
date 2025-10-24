"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FiChevronRight, FiRefreshCw, FiUser } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { getOrdersData } from "@/lib/features/order";
import { formatDate } from "@/helpers/helpers";
import NotFound from "@/components/NotFound";
import { useRouter } from "next/navigation";
import OrderDetails from "./OrderDetails";

const OrderCard = ({ order }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-blue-300" };
      case "SHIPPED":
        return { label: "Shipped", className: "bg-purple-100 text-purple-800 border-purple-300" };
      case "DELIVERED":
        return { label: "Delivered", className: "bg-green-100 text-green-800 border-green-300" };
      case "CANCELLED":
        return { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-300" };
      default:
        return { label: status || "Pending", className: "bg-gray-100 text-gray-800 border-gray-300" };
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="w-full sm:w-auto">
              <CardTitle className="text-lg sm:text-xl break-words">
                Order #{order.orderId}
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-500">
                Placed on: {formatDate(order.date)}
              </p>
              {/* ✅ CORRECTED: Use order.currentStatus */}
              <p className="text-xs sm:text-sm text-gray-500 mt-1 flex flex-wrap gap-1 items-center">
                Order Status:
                <Badge
                  variant="outline"
                  className={`font-medium ${getStatusInfo(order.currentStatus).className}`}
                >
                  {getStatusInfo(order.currentStatus).label}
                </Badge>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="font-semibold text-sm sm:text-base">
                    ₹{order.payablePrice.toFixed(2)}
                </span>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 transition-colors px-0 sm:px-2"
                    >
                        <span className="mr-1 text-sm">View details</span>
                        <FiChevronRight className="w-4 h-4" />
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px] mt-12 overflow-y-auto max-h-[86vh]">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                    </DialogHeader>
                    {/* Assuming OrderDetails component can handle this 'order' structure */}
                    <OrderDetails order={order} />
                    </DialogContent>
                </Dialog>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-4">
            <h3 className="text-base font-semibold">Products</h3>
            <div className="grid grid-cols-1 gap-4">
                {/* ✅ CORRECTED: Loop through order.productDetails */}
                {order.productDetails.map((productItem: any) => (
                    <div key={productItem._id} className="flex items-center space-x-4">
                        <img
                            src={productItem.product.img[0]}
                            alt={productItem.product.name}
                            className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-grow text-sm">
                            <h4 className="font-medium">{productItem.product.name}</h4>
                            <p className="text-gray-500">Qty: {productItem.count}</p>
                            <p className="text-gray-500">Size: {productItem.sizeLabel}</p>
                        </div>
                        <div className="text-sm font-semibold">
                            ₹{productItem.offerPrice.toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Orders = () => {
  const [sortBy, setSortBy] = useState<string>("date");
  const dispatch = useDispatch<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { payload } = await dispatch(getOrdersData());
      if (payload.success) {
        // ✅ SIMPLIFIED: No need to re-map the data if the API response is already good.
        // The API populates product details, so we can use it directly.
        setOrders(payload.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4 p-6 border rounded-lg">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-16 bg-gray-200 rounded"></div>
    </div>
  );

  return (
    <div className="min-h-screen max-w-5xl mx-auto bg-white p-4 sm:p-6 lg:p-8 mt-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold">Your Orders</h1>
        </div>

        {loading ? (
          <>
            <SkeletonLoader />
            <SkeletonLoader />
          </>
        ) : orders.length > 0 ? (
            orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))
        ) : (
          <NotFound text="You have no orders yet." />
        )}
      </div>
    </div>
  );
};

export default Orders;