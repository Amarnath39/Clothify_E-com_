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
import {
  FiPackage,
  FiTruck,
  FiCheck,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";
import Steps from "@/components/steps";
import { OrderStatus } from "./Status";
import OrderDetails from "./OrderDetails";
import { useDispatch } from "react-redux";
import { getOrdersData } from "@/lib/features/order";
import { formatDate } from "@/helpers/helpers";
import useWindowSize from "@/hooks/useWindowSize";
import NotFound from "@/components/NotFound";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/features/cart";

const OrderCard = ({ order, fetchOrderDetails }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const showRetryButton =
    order.paymentStatus === "PAYMENT_ERROR" ||
    order.paymentStatus === "TIMED_OUT" ||
    order.paymentStatus === "PAYMENT_DECLINED" ||
    order.paymentStatus === "INITIATED";

  const PAYMENT_STATUS_MAP = {
    PAYMENT_SUCCESS: {
      label: "Payment Successful",
      variant: "success",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    PAYMENT_ERROR: {
      label: "Payment Failed",
      variant: "destructive",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    TIMED_OUT: {
      label: "Payment Expired",
      variant: "warning",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
    PAYMENT_DECLINED: {
      label: "Payment Declined",
      variant: "destructive",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    PAYMENT_PENDING: {
      label: "Payment Processing",
      variant: "secondary",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    COMPLETED: {
      label: "Payment Successful",
      variant: "success",
      className: "bg-green-100 text-green-800 border-green-200",
    },
  };

  const addProductsToCart = (products) => {
    // products.forEach((product) => {
    //   dispatch(
    //     addToCart({
    //       id: product.id,
    //       count: product.quantity,
    //     })
    //   );
    // });
  };

  const handleRetryPayment = (products) => {
    // addProductsToCart(products);
    router.push("/cart");
  };

  const statusInfo = PAYMENT_STATUS_MAP[order.paymentStatus] || {
    label: "Pending",
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const { width } = useWindowSize();
  return (
    <Card className="w-full mb-6">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Order #{order.orderId}</CardTitle>
              <p className="text-sm text-gray-500">
                TXNID: {order.transactionId}
              </p>
              <p className="text-sm text-gray-500">
                Placed on: {formatDate(order.date)}
              </p>
              <p className="text-sm text-gray-500">
                Payment Status:{" "}
                <Badge
                  variant="outline"
                  className={`font-medium ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </Badge>
              </p>
            </div>
            {showRetryButton && (
              <Button
                onClick={() => handleRetryPayment(order?.products)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <FiRefreshCw className="w-4 h-4" />
                Retry Payment
              </Button>
            )}
            {width > 768 && (
              <Badge variant="outline" className="text-sm">
                {order.status}
              </Badge>
            )}
          </div>
          {width < 768 && (
            <Badge variant="outline" className="text-sm w-fit">
              {order.status}
            </Badge>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <FiUser className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {order.shippingAddress.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">
                ₹{order.priceBreakup.total.toFixed(2)}
              </span>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span className="mr-1">View details</span>
                    <FiChevronRight />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px] mt-12 overflow-y-auto  max-h-[86vh] ">
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
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {order.products.map((product) => (
                <Card
                  key={product.id}
                  onClick={() =>
                    (window.location.href = `/product-details/${
                      product.id
                    }/${product.name.split(" ").join("-")}`)
                  }
                >
                  <CardContent className="p-4 flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="min-w-20 max-w-24 object-cover rounded"
                      />
                      <span className="absolute bottom-1 right-1 text-sm bg-white w-6 h-6 flex items-center justify-center rounded-full">
                        x{product.quantity}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-500">
                        ₹{product.price.toFixed(2)} x {product.quantity}
                      </p>
                      <p className="flex items-center space-x-2">
                        <span className="font-semibold">Size:</span>
                        <span>{product.size}</span>
                        <span className="w-2"></span>
                        <span className="font-semibold">Color:</span>
                        <span>{product.color}</span>
                      </p>
                      <p className="font-semibold mt-1">
                        ₹{(product.price * product.quantity).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Separator />

          <div>
            <OrderStatus
              status={order.status}
              trackingNumber={order.trackingNumber}
              deliveryPartner={order.deliveryPartner}
              deliveryDate={order.deliveryDate}
              orderId={order.orderId}
              id={order.id}
              fetchOrderDetails={fetchOrderDetails}
            />
          </div>
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
        const formattedOrders = payload.orders.map((order) => ({
          orderId: order.orderId,
          id: order._id,
          date: order.createdAt,
          products: order.productDetails.map((item) => ({
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
            tax: 0, // Assuming no tax is provided in the API response
            shipping: 0, // Assuming no shipping cost is provided in the API response
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
          trackingNumber: order?.trackingId,
          transactionId: order.transactionId,
          deliveryDate: order.updatedAt,
          paymentStatus: order.paymentStatus,
          deliveryPartner: order.deliveryPartner,
        }));

        console.log(formattedOrders, "formattedOrders");

        const actualOrders = formattedOrders.filter(
          (order) =>
            order.paymentStatus === "PAYMENT_SUCCESS" ||
            order.paymentStatus === "PAYMENT_ERROR" ||
            order.paymentStatus === "TIMED_OUT" ||
            order.paymentStatus === "PAYMENT_DECLINED" ||
            order.paymentStatus === "PAYMENT_PENDING" ||
            order.paymentStatus === "INITIATED" ||
            order.paymentStatus === "COMPLETED"
        );
        console.log(actualOrders, "actual");
        setOrderData(actualOrders);
      }
      setLoading(false);
    } catch (error) {
      // console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );

  // console.log(typeof orderData,"type");
  // const ordersArray = Object.values(orderData);
  // const sortedOrders = ordersArray.sort((a, b) => {
  //     if (sortBy === "date") {
  //         return new Date(b.date).getTime() - new Date(a.date).getTime();
  //     }
  //     return 0;
  // });

  return (
    <div className="min-h-screen max-w-5xl mx-auto bg-white p-4 sm:p-6 lg:p-8 mt-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold ">Your Orders</h1>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded p-2"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
        {loading ? (
          // Display skeleton loaders while loading
          <>
            <SkeletonLoader />
            <SkeletonLoader />
            <SkeletonLoader />
          </>
        ) : orderData.length > 0 ? (
          orderData.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              fetchOrderDetails={fetchOrderDetails}
            />
          ))
        ) : (
          <NotFound text="Orders" />
        )}
      </div>
    </div>
  );
};

export default Orders;
