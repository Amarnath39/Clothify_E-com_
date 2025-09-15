"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import {
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaTruck,
  FaUser,
  FaBox,
  FaCreditCard,
  FaMapMarkerAlt,
  FaSearch,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { refreshOrderStatus } from "@/lib/features/order";
import { FaCalendarAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { IoIosRefresh } from "react-icons/io";
import { LuLoader } from "react-icons/lu";

const OrdersPage = () => {
  const [expandedOrder, setExpandedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [selectedImage, setSelectedImage] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState("all");
  const [newStatuses, setNewStatuses] = useState<{ [key: string]: string }>({});
  const [dateRange, setDateRange] = useState<any>([null, null]);
  const [startDate, endDate] = dateRange;
  const [ordersSuccess, setOrderSuccess] = useState(0);
  const dispatch = useDispatch<any>();

  const countRecentSuccessfulPayments = async (orders) => {
    // Get current date
    const now: any = new Date();
    // Calculate date 24 hours ago
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Filter and count orders

    const count = orders.filter((order) => {
      const orderDate = new Date(order.date);
      return (
        order.paymentStatus === "PAYMENT_SUCCESS" &&
        orderDate >= twentyFourHoursAgo &&
        orderDate <= now
      );
    }).length;

    return count;

    // lastChecked: now.toISOString(),
  };

  // const callGetOrdersApi = async () => {
  //   try {
  //     const response = await axios.get("/api/admin/order", {
  //       params: {
  //         search: searchTerm,
  //         paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
  //         orderStatus: orderStatus !== "all" ? orderStatus : undefined,
  //         startDate: startDate?.toISOString(),
  //         endDate: endDate?.toISOString(),
  //       },
  //     });
  //     // console.log(response, "response");

  //     if (response.data.success) {
  //       setOrders(response.data.orders);
  //       const stats: any = await countRecentSuccessfulPayments(
  //         response.data.orders
  //       );
  //       setOrderSuccess(stats);
  //     } else {
  //       toast(response.data.msg);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     toast("Failed to fetch orders");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const callGetOrdersApi = async () => {
  try {
    const token = localStorage.getItem("token"); // ⬅️ get token from login

    const response = await axios.get("/api/admin/order", {
      params: {
        search: searchTerm,
        paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
        orderStatus: orderStatus !== "all" ? orderStatus : undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
      headers: {
        Authorization: `Bearer ${token}`, // ⬅️ attach token
      },
    });

    if (response.data.success) {
      setOrders(response.data.orders);

      const stats: any = await countRecentSuccessfulPayments(
        response.data.orders
      );
      setOrderSuccess(stats);
    } else {
      toast(response.data.msg);
    }
  } catch (error) {
    console.log(error);
    toast("Failed to fetch orders");
  } finally {
    setLoading(false);
  }
};


  // getting success order count

  useEffect(() => {
    callGetOrdersApi();
  }, [searchTerm, paymentStatus, orderStatus, endDate]);

  const validateShippingDetails = (order) => {
    const newStatus = newStatuses[order._id];
    if (
      newStatus === "Shipped" &&
      (!order.trackingId || !order.deliveryPartner)
    ) {
      toast.error(
        "Please provide both tracking ID and delivery partner before shipping."
      );
      return false;
    }
    return true;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find((o) => o._id === orderId);

    if (!validateShippingDetails(order)) {
      return;
    }
    setOrders(
      orders.map((order) =>
        order._id === orderId ? { ...order, currentStatus: newStatus } : order
      )
    );

    const payload = {
      status: newStatus,
    };

    try {
      const response = await axios.patch(
        `/api/admin/order/${orderId}`,
        payload
      );
      if (response.data.success) {
        toast(response.data.msg);
        callGetOrdersApi();
        setNewStatuses((prev) => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      } else {
        toast(response.data.msg);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast("Failed to update order");
    }
  };

  const handleShippingPartnerChange = (orderId, partner) => {
    setOrders(
      orders.map((order) =>
        order._id === orderId ? { ...order, deliveryPartner: partner } : order
      )
    );
  };

  const handleTrackingIdChange = (orderId, trackingId) => {
    setOrders(
      orders.map((order) =>
        order._id === orderId ? { ...order, trackingId: trackingId } : order
      )
    );
  };

  const updateOrderApi = async (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    const payload = {
      currentStatus: order.currentStatus,
      trackingId: order.trackingId,
      deliveryPartner: order.deliveryPartner,
    };
    try {
      const response = await axios.patch(
        `/api/admin/order/${orderId}`,
        payload
      );
      if (response.data.success) {
        toast(response.data.msg);
        callGetOrdersApi(); // Refresh orders after update
      } else {
        toast(response.data.msg);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast("Failed to update order");
    }
  };

  const downloadInvoice = async (orderId: any) => {
    try {
      const response = await fetch(`/api/admin/invoice/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // console.log(response, "response invoice");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      // console.log(url, "url");
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  const exchangeApplyCount = orders?.filter(
    (item) => item.currentStatus === "Applied for exchange"
  );

  const refreshTransactionState = async (orderId: any, transactionId: any) => {
    // console.log(orderId, transactionId, "id::");
    const data = { orderId: orderId, transactionId: transactionId };

    try {
      const { payload } = await dispatch(refreshOrderStatus(data));
      // console.log(payload, "refresh");
      toast(payload?.msg ?? "refresh");
      callGetOrdersApi();
    } catch (error) {}
  };

  if (loading) {
    return (
      <div className="flex flex-1 justify-center items-center mt-12">
        <LuLoader size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Orders</h1>

        <div>
          <span className="text-red font-bold text-xl">{ordersSuccess}</span>{" "}
          Successfull Orders In Last 24 Hour{" "}
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            // icon={<FaSearch className="text-gray-400" />}
          />
        </div>
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</SelectItem>
            <SelectItem value="INITIATED">INITIATED</SelectItem>
            <SelectItem value="NOT_INITIATED">NOT_INITIATED</SelectItem>
            <SelectItem value="PAYMENT_ERROR">PAYMENT_ERROR</SelectItem>
            <SelectItem value="TIMED_OUT">TIMED_OUT</SelectItem>
            <SelectItem value="PAYMENT_DECLINED">PAYMENT_DECLINED</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orderStatus} onValueChange={setOrderStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Order Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="CHECKOUT">CHECKOUT</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Exchange Approved">Exchange Approved</SelectItem>
            <SelectItem value="Exchange Cancelled">
              Exchange Cancelled
            </SelectItem>
            <SelectItem value="Applied for exchange">
              Applied for exchange
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => {
              setDateRange(update);
            }}
            customInput={
              <Button className="w-[200px]">
                <FaCalendarAlt className="mr-2" />
                {startDate
                  ? startDate.toLocaleDateString()
                  : "Select Date Range"}
              </Button>
            }
          />
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="mt-[2px]">Orders</CardTitle>
          <CardTitle className="text-yellow font-semibold">
            Please Refresh the Failed or pending transaction to see Accurate
            data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Phone no.</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Refresh T. </TableHead>
                <TableHead>Indicators </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <TableRow>
                    <TableCell>{order.orderId}</TableCell>
                    <TableCell>
                      {new Date(order?.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {order?.date &&
                        new Date(order?.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order?.user?.phone}</TableCell>
                    <TableCell>₹ {order?.payablePrice?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order?.paymentStatus === "succeeded"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {order?.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.currentStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      {order.tempTransactionId && (
                        <div
                          onClick={() =>
                            refreshTransactionState(
                              order._id,
                              order.tempTransactionId
                            )
                          }
                        >
                          <IoIosRefresh color="green" size={24} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.currentStatus !== "CHECKOUT" &&
                      (() => {
                        const now: any = new Date();
                        const twentyFourHoursAgo = new Date(
                          now - 24 * 60 * 60 * 1000
                        );
                        const orderDate = new Date(order.date);
                        return (
                          orderDate >= twentyFourHoursAgo && orderDate <= now
                        );
                      })() ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] 
                          ${
                            order.paymentStatus === "PAYMENT_SUCCESS"
                              ? "bg-green-500"
                              : "bg-red"
                          }`}
                          ></div>
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() =>
                          setExpandedOrder(
                            expandedOrder === order._id ? null : order._id
                          )
                        }
                      >
                        {expandedOrder === order._id ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedOrder === order._id && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Card className="mt-4">
                          <CardContent className="space-y-6 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <Card className="shadow-sm">
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center">
                                    <FaUser className="mr-2" /> User Details
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-semibold">
                                        Name:
                                      </span>
                                      {order?.user?.name}
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        Phone:
                                      </span>
                                      {order?.user?.phone}
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        Email:
                                      </span>
                                      {order?.user?.email}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="shadow-sm">
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center">
                                    <FaMapMarkerAlt className="mr-2" /> Shipping
                                    Address
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <p>{order?.shippingAddress?.name}</p>
                                    <p>{order?.shippingAddress?.address}</p>
                                    <p>
                                      {order?.shippingAddress?.state},{" "}
                                      {order?.shippingAddress?.zipCode}
                                    </p>
                                    <p>{order?.shippingAddress?.country}</p>
                                    <p>{order?.shippingAddress?.mobile}</p>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card className="shadow-sm">
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center">
                                    <FaCreditCard className="mr-2" /> Payment
                                    Details
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-semibold">
                                        Status:
                                      </span>{" "}
                                      {order?.paymentStatus}
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        Method:
                                      </span>{" "}
                                      {order?.paymentMethod}
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        Merchant Reference ID:
                                      </span>{" "}
                                      {order?.tempTransactionId}
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        Total:
                                      </span>{" "}
                                      ₹ {order?.payablePrice?.toFixed(2)}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            <Card className="shadow-sm">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                  <FaBox className="mr-2" /> Order Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="font-semibold">Order Date:</p>
                                    <p>
                                      {new Date(
                                        order?.createdAt
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">Order ID:</p>
                                    <p>{order.orderId}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">
                                      Total Price:
                                    </p>
                                    <p>₹ {order?.totalPrice?.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">Discount:</p>
                                    <p>₹ {order?.off?.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">
                                      Payable Price:
                                    </p>
                                    <p className="font-bold text-lg">
                                      ₹ {order?.payablePrice?.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">
                                      TransactionId:
                                    </p>
                                    <p className="font-bold text-lg">
                                      {order?.transactionId}
                                    </p>
                                  </div>
                                </div>
                                <Separator className="my-4" />
                                <h4 className="font-semibold mb-2">Products</h4>
                                <div className="flex">
                                  <p className="font-semibold">Shipping: </p>
                                  <p className="text-sm text-green-600">
                                    ₹{order?.shippingCost?.toFixed(2)}
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {order?.productDetails?.map((detail) => (
                                    <div
                                      key={detail._id}
                                      className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg"
                                    >
                                      {detail?.product?.img?.length > 0 && (
                                        <img
                                          src={detail?.product?.img[0]}
                                          alt={detail?.product?.name}
                                          className="w-20 h-20 object-cover rounded"
                                        />
                                      )}
                                      <div className="flex-grow">
                                        <p className="font-medium">
                                          {detail?.product.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Quantity: {detail?.count}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Color: {detail?.product.color}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Size: {detail?.size?.size}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Unit Price: ₹{" "}
                                          {detail?.size?.offerPrice}
                                        </p>

                                        {detail.product.off > 0 && (
                                          <p className="text-sm text-green-600">
                                            Discount: {detail?.product.off}%
                                          </p>
                                        )}
                                        <p className="text-sm font-semibold mt-1">
                                          Subtotal: ₹{" "}
                                          {(
                                            detail?.count *
                                            detail?.size.offerPrice
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card className="shadow-sm">
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center">
                                    <FaTruck className="mr-2" /> Shipping
                                    Details
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <Select
                                    value={order.deliveryPartner || ""}
                                    onValueChange={(value) =>
                                      handleShippingPartnerChange(
                                        order._id,
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select delivery partner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fedex">
                                        FedEx
                                      </SelectItem>
                                      <SelectItem value="Delhivery">
                                        Delhivery
                                      </SelectItem>
                                      <SelectItem value="Ecom Express">
                                        Ecom Express
                                      </SelectItem>
                                      <SelectItem value="Blue Dart">
                                        Blue Dart
                                      </SelectItem>
                                      <SelectItem value="XpressBees">
                                        XpressBees
                                      </SelectItem>
                                      <SelectItem value="Ekart Logistics">
                                        Ekart Logistics
                                      </SelectItem>
                                      <SelectItem value="DTDC">DTDC</SelectItem>
                                      <SelectItem value="UPS">UPS</SelectItem>
                                      <SelectItem value="DHL">DHL</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Enter tracking ID"
                                    value={order.trackingId || ""}
                                    onChange={(e) =>
                                      handleTrackingIdChange(
                                        order._id,
                                        e.target.value
                                      )
                                    }
                                  />
                                  <Button
                                    onClick={() => updateOrderApi(order._id)}
                                  >
                                    Update Shipping
                                  </Button>
                                </CardContent>
                              </Card>

                              <Card className="shadow-sm">
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center">
                                    Order Status
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <Select
                                    value={
                                      newStatuses[order._id] ||
                                      order.currentStatus
                                    }
                                    onValueChange={(value) =>
                                      setNewStatuses((prev) => ({
                                        ...prev,
                                        [order._id]: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING">
                                        PENDING
                                      </SelectItem>
                                      <SelectItem value="Processing">
                                        Processing
                                      </SelectItem>
                                      <SelectItem value="Shipped">
                                        Shipped
                                      </SelectItem>
                                      <SelectItem value="Delivered">
                                        Delivered
                                      </SelectItem>
                                      <SelectItem value="Cancelled">
                                        Cancelled
                                      </SelectItem>
                                      <SelectItem value="Exchange Approved">
                                        Exchange Approved
                                      </SelectItem>
                                      <SelectItem value="Exchange Cancelled">
                                        Exchange Cancelled
                                      </SelectItem>
                                      <SelectItem
                                        hidden
                                        unselectable="on"
                                        aria-readonly
                                        value="Applied for exchange"
                                        disabled
                                      >
                                        Applied for exchange
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {/* <Button onClick={() => updateOrderApi(order._id)}>Update Status</Button> */}
                                  <Button
                                    className="w-full"
                                    onClick={() =>
                                      handleStatusChange(
                                        order._id,
                                        newStatuses[order._id]
                                      )
                                    }
                                  >
                                    Submit
                                  </Button>
                                  <Button
                                    className="w-full"
                                    onClick={() => downloadInvoice(order._id)}
                                  >
                                    <FaDownload className="mr-2" /> Download
                                    Invoice
                                  </Button>
                                </CardContent>
                              </Card>
                              {order.exchangeReason && (
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                  <Card className="mt-6">
                                    <CardHeader>
                                      <CardTitle className="text-xl font-semibold">
                                        Exchange Details
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="mb-4">
                                        {order.exchangeReason.reason}
                                      </p>
                                      <div className="grid grid-cols-3 gap-4">
                                        {order.exchangeReason.img.map(
                                          (item, index) => (
                                            <Dialog key={index}>
                                              <DialogTrigger>
                                                <img
                                                  src={item}
                                                  alt={`Exchange image ${
                                                    index + 1
                                                  }`}
                                                  className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                  onClick={() =>
                                                    setSelectedImage(item)
                                                  }
                                                />
                                              </DialogTrigger>
                                              <DialogContent className="max-w-3xl max-h-[80vh]">
                                                <img
                                                  src={selectedImage}
                                                  alt="Full size exchange image"
                                                  className="w-full h-full object-contain max-h-[76vh]"
                                                />
                                              </DialogContent>
                                            </Dialog>
                                          )
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
