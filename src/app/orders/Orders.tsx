"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { FiChevronRight, FiRefreshCw, FiUser } from "react-icons/fi";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useDispatch } from "react-redux";
import { getOrdersData } from "@/lib/features/order";
import { formatDate } from "@/helpers/helpers";
import NotFound from "@/components/NotFound";
import { useRouter } from "next/navigation";
import OrderDetails from "./OrderDetails";
import toast from 'react-hot-toast';

// --- OrderCard Component ---
const OrderCard = ({ order }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Map for ORDER status display
  const getOrderStatusInfo = (status: string) => {
    switch (status) {
      case "CONFIRMED": return { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-blue-300" };
      case "PROCESSING": return { label: "Processing", className: "bg-yellow-100 text-yellow-800 border-yellow-300" };
      case "SHIPPED": return { label: "Shipped", className: "bg-purple-100 text-purple-800 border-purple-300" };
      case "DELIVERED": return { label: "Delivered", className: "bg-green-100 text-green-800 border-green-300" };
      case "CANCELLED": return { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-300" };
      default: return { label: status || "Pending", className: "bg-gray-100 text-gray-800 border-gray-300" };
    }
  };

  // Map for PAYMENT status display
  const getPaymentStatusInfo = (status: string) => {
    switch (status) {
      case "PAYMENT_SUCCESS": return { label: "Paid", className: "bg-green-100 text-green-800 border-green-200" };
      // ... (keep other payment statuses) ...
      default: return { label: status || "Pending", className: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const showRetryButton =
    order.paymentStatus === "PAYMENT_ERROR" ||
    // ... (keep other conditions) ...
    order.paymentStatus === "INITIATED";

  const handleRetryPayment = () => {
    toast.error("Payment retry functionality not yet implemented.");
  };

  // Simplified getImageUrl function for integrated Next.js
  const getImageUrl = (relativePath: string | undefined): string => {
    return relativePath && relativePath.startsWith('/') ? relativePath : "/android-chrome-192x192.png"; // Use correct placeholder path
  };

  return (
    <Card className="w-full mb-6 shadow-md border border-gray-100 rounded-lg">
      <CardHeader className="p-4 sm:p-6 bg-gray-50 rounded-t-lg">
        {/* ... (Header remains the same, including modal trigger) ... */}
        <div className="flex flex-col space-y-3">
          {/* Row 1 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="w-full sm:w-auto">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-800">
                Order #{order.orderId}
              </CardTitle>
              <p className="text-xs text-gray-500 break-all">
                TXNID: {order.transactionId ?? order.tempTransactionId ?? 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                Placed on: {formatDate(order.createdAt ?? order.date)}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-gray-900">
                  ₹{order.payablePrice?.toFixed(2) ?? '0.00'}
                </span>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-800 h-auto p-0 text-xs sm:text-sm">
                      View details <FiChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px] mt-12 overflow-y-auto max-h-[86vh] z-[100] p-0">
                    <DialogClose asChild className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Cross2Icon className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </Button>
                    </DialogClose>
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                      <DialogTitle>Order Details</DialogTitle>
                    </DialogHeader>
                    <div className="px-6 pb-6">
                      <OrderDetails order={order} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {/* Payment Status */}
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span>Payment:</span>
                <Badge
                  variant="outline"
                  className={`font-medium text-xs px-2 py-0.5 ${getPaymentStatusInfo(order.paymentStatus).className}`}
                >
                  {getPaymentStatusInfo(order.paymentStatus).label}
                </Badge>
              </div>
              {/* Order Status */}
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span>Status:</span>
                <Badge
                  variant="outline"
                  className={`font-medium text-xs px-2 py-0.5 ${getOrderStatusInfo(order.currentStatus).className}`}
                >
                  {getOrderStatusInfo(order.currentStatus).label}
                </Badge>
              </div>
            </div>
          </div>
          {/* Row 2 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
              <FiUser className="text-gray-400 flex-shrink-0" />
              <span className="font-medium truncate">{order.shippingAddress?.name ?? 'Customer'}</span>
            </div>
            {showRetryButton && (
              <Button onClick={handleRetryPayment} variant="outline" size="sm" className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 text-xs px-2 py-1 h-auto w-full sm:w-auto">
                <FiRefreshCw className="w-3 h-3" />
                Retry Payment
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* ✅ CORRECTED: Map with robust data access */}
          {order.productDetails?.map((item: any) => {
            // Determine if product data is populated or just an ID
            const isProductPopulated = typeof item.product === 'object' && item.product !== null;
            const productName = isProductPopulated ? item.product.name : "Product details missing"; // Fallback name
            const productImg = isProductPopulated ? item.product.img?.[0] : undefined;
            const productColor = isProductPopulated ? item.product.color : 'N/A';
            // Handle both old and new size structures
            const sizeLabel = item.sizeLabel ?? item.size?.size ?? 'N/A';

            return (
              <div key={item._id} className="flex items-start sm:items-center space-x-4 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <img
                  src={getImageUrl(productImg)}
                  alt={productName}
                  className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-md flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/android-chrome-192x192.png'; }}
                />
                <div className="flex-grow text-xs sm:text-sm space-y-1">
                  <h4 className="font-medium text-sm sm:text-base line-clamp-2">{productName}</h4>
                  <p className="text-gray-500">
                    ₹{item.offerPrice?.toFixed(2) ?? '0.00'} x {item.count ?? 1}
                  </p>
                  <p className="text-gray-600">
                    Size: <span className="font-medium">{sizeLabel}</span>
                  </p>
                  <p className="text-gray-600">
                    Color: <span className="font-medium">{productColor}</span>
                  </p>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-800 whitespace-nowrap self-start sm:self-center pt-1 sm:pt-0">
                  ₹{(item.offerPrice * (item.count || 1))?.toFixed(2) ?? '0.00'}
                </div>
              </div>
            );
          })}
        </div>

        {/* ✅ NEW: Tracking Information Section */}
        {order.dtdc?.referenceNumber && order.paymentStatus === "PAYMENT_SUCCESS" && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                Shipping Details
              </h4>
              <div className="space-y-1.5 text-xs sm:text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Courier Partner:</span> DTDC
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Tracking Number:</span>{" "}
                  <span className="font-mono text-xs sm:text-sm">{order.dtdc.referenceNumber}</span>
                </p>
                <a
                  href="https://www.dtdc.in/tracking.asp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mt-1"
                >
                  Track Your Shipment
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Orders Component (Main Page) ---
const Orders = () => {
  const dispatch = useDispatch<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { payload } = await dispatch(getOrdersData());
      if (payload.success) {
        setOrders(Array.isArray(payload.orders) ? payload.orders : []);
      } else {
        toast.error(payload.msg || "Could not fetch orders.");
        setOrders([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      toast.error("An error occurred while fetching orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4 p-6 border rounded-lg bg-white shadow">
      {/* ... skeleton content ... */}
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-5 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="flex items-center space-x-4 pt-4 border-t mt-4">
        <div className="h-16 w-16 bg-gray-200 rounded"></div>
        <div className="space-y-2 flex-grow">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-1/6"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Orders</h1>
        </div>

        {loading ? (
          <div className="space-y-6">
            <SkeletonLoader />
            <SkeletonLoader />
          </div>
        ) : orders.length > 0 ? (
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((order) => (
              order && order._id ? <OrderCard key={order._id} order={order} /> : null
            ))
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <NotFound text="You haven't placed any orders yet." />
            <Button onClick={() => router.push('/')} className="mt-6 bg-black text-white hover:bg-gray-800">
              Start Shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
