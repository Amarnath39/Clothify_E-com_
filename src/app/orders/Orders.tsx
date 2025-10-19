"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Country } from "@/lib/CountryProvider";
import useCountry from "@/lib/useCountry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FiChevronRight,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import { useDispatch } from "react-redux";
import { getOrdersData } from "@/lib/features/order";
import { formatDate } from "@/helpers/helpers";
import useWindowSize from "@/hooks/useWindowSize";
import NotFound from "@/components/NotFound";
import { useRouter } from "next/navigation";
import OrderDetails from "./OrderDetails";

const OrderCard = ({ order, fetchOrderDetails }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { selectedCountry } = useCountry();
  const { width } = useWindowSize();

  const showRetryButton =
    order.paymentStatus === "PAYMENT_ERROR" ||
    order.paymentStatus === "TIMED_OUT" ||
    order.paymentStatus === "PAYMENT_DECLINED" ||
    order.paymentStatus === "INITIATED";

  const PAYMENT_STATUS_MAP = {
    PAYMENT_SUCCESS: {
      label: "Payment Successful",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    PAYMENT_ERROR: {
      label: "Payment Failed",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    TIMED_OUT: {
      label: "Payment Expired",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
    PAYMENT_DECLINED: {
      label: "Payment Declined",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    PAYMENT_PENDING: {
      label: "Payment Processing",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    COMPLETED: {
      label: "Payment Successful",
      className: "bg-green-100 text-green-800 border-green-200",
    },
  };

  const statusInfo = PAYMENT_STATUS_MAP[order.paymentStatus] || {
    label: "Pending",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const getCurrencyCode = (country?: Country | null) => {
    const c = country || (localStorage.getItem("country") as Country) || "IND";
    return c === "IND" ? "INR" : "AED";
  };

  const getCountryPrice = (country: Country | null, price: Record<"IND" | "UAE", number>) => {
    const c = country || "IND";
    return c === "IND" ? price.IND : price.UAE;
  };

  const formatPrice = (price: any, country: Country | null) => {
    if (!price) return `${getCurrencyCode(country)} 0`;
    if (typeof price === "object")
      return `${getCurrencyCode(country)} ${getCountryPrice(country, price)}`;
    return `${getCurrencyCode(country)} ${price}`;
  };

  const handleRetryPayment = () => {
    router.push("/cart");
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "Pending":
        return { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" };
      case "Processing":
        return { label: "Processing", className: "bg-blue-100 text-blue-800 border-blue-300" };
      case "Completed":
        return { label: "Completed", className: "bg-green-100 text-green-800 border-green-300" };
      case "Cancelled":
        return { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-300" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800 border-gray-300" };
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
              <p className="text-xs sm:text-sm text-gray-500 break-words">
                TXNID: {order.transactionId}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Placed on: {formatDate(order.date)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 flex flex-wrap gap-1 items-center">
                Order Status:
                <Badge
                  variant="outline"
                  className={`font-medium ${getStatusInfo(order.OrderStatus).className}`}
                >
                  {getStatusInfo(order.OrderStatus).label}
                </Badge>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {showRetryButton && (
                <Button
                  onClick={handleRetryPayment}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Retry Payment
                </Button>
              )}
              <Badge
                variant="outline"
                className="text-xs sm:text-sm w-fit self-start sm:self-center"
              >
                {order.status}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 w-full">
            <div className="flex items-center space-x-2 text-sm text-gray-600 w-full sm:w-auto">
              <FiUser className="text-gray-400" />
              <span className="truncate">{order.shippingAddress.name}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-2 gap-2 w-full sm:w-auto">
              <span className="font-semibold text-sm sm:text-base">
                {formatPrice(order.priceBreakup.total, selectedCountry)}
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
                  <OrderDetails order={order} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4">Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {order.products.map((product: any) => (
                <Card
                  key={product.id}
                  onClick={() =>
                    (window.location.href = `/product-details/${product.id}/${product.name
                      .split(" ")
                      .join("-")}`)
                  }
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-shrink-0 self-center sm:self-auto">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded mx-auto sm:mx-0"
                      />
                      <span className="absolute bottom-1 right-1 text-xs bg-white w-6 h-6 flex items-center justify-center rounded-full shadow">
                        x{product.quantity}
                      </span>
                    </div>
                    <div className="flex flex-col items-start text-sm w-full">
                      <h4 className="font-medium break-words">{product.name}</h4>
                      <p className="text-gray-500">
                        {formatPrice(product.price, selectedCountry)} × {product.quantity}
                      </p>
                      <p className="flex flex-wrap gap-2 text-gray-700">
                        <span className="font-semibold">Size:</span>
                        <span>{product.size}</span>
                        <span className="font-semibold">Color:</span>
                        <span>{product.color}</span>
                      </p>
                      <p className="font-semibold mt-1">
                        {formatPrice(
                          typeof product.price === "object"
                            ? {
                                IND: product.price.IND * product.quantity,
                                UAE: product.price.UAE * product.quantity,
                              }
                            : product.price * product.quantity,
                          selectedCountry
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />
        </div>
      </CardContent>
    </Card>
  );
};

const Orders = () => {
  const [sortBy, setSortBy] = useState<any>("date");
  const dispatch = useDispatch<any>();
  const [orderData, setOrderData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { payload } = await dispatch(getOrdersData());
      if (payload.success) {
        const formattedOrders = payload.orders.map((order: any) => ({
          orderId: order.orderId,
          id: order._id,
          date: order.createdAt,
          products: order.productDetails.map((item: any) => ({
            id: item.product._id,
            name: item.product.name,
            color: item.product.color,
            image: item.product.img[0],
            price: item.size.offerPrice,
            quantity: item.count,
            size: item.size.size,
          })),
          priceBreakup: {
            subtotal: order.totalPrice,
            tax: 0,
            shipping: 0,
            total: order.payablePrice,
          },
          shippingAddress: {
            name: order.shippingAddress.name,
            street: order.shippingAddress.address,
            city: order.shippingAddress.state,
            state: order.shippingAddress.state,
            zip: order.shippingAddress.zipCode,
            country: order.shippingAddress.country,
          },
          paymentMethod: order.paymentMethod,
          status: order.currentStatus,
          OrderStatus: order.OrderStatus,
          trackingNumber: order?.trackingId,
          transactionId: order.transactionId,
          deliveryDate: order.updatedAt,
          paymentStatus: order.paymentStatus,
          deliveryPartner: order.deliveryPartner,
        }));

        setOrderData(formattedOrders);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-8 sm:h-10 bg-gray-200 rounded w-1/3 sm:w-1/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen max-w-5xl mx-auto bg-white p-4 sm:p-6 lg:p-8 mt-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold">Your Orders</h1>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded p-2 text-sm sm:text-base w-full sm:w-auto"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {loading ? (
          <>
            <SkeletonLoader />
            <SkeletonLoader />
            <SkeletonLoader />
          </>
        ) : orderData.length > 0 ? (
          orderData.map((order) => (
            <OrderCard key={order.orderId} order={order} fetchOrderDetails={fetchOrderDetails} />
          ))
        ) : (
          <NotFound text="Orders" />
        )}
      </div>
    </div>
  );
};

export default Orders;