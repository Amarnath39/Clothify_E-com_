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
import { Pagination } from "@/components/ui/pagination";

const OrdersPage = () => {
  const [expandedOrder, setExpandedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [selectedImage, setSelectedImage] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState("all");
  const [orderSource, setOrderSource] = useState("all"); // ✅ NEW: Filter by order source
  const [newStatuses, setNewStatuses] = useState<{ [key: string]: string }>({});
  const [dateRange, setDateRange] = useState<any>([null, null]);
  const [labelError, setLabelError] = useState<{ [key: string]: string }>({});
  const [labelLoading, setLabelLoading] = useState<{ [key: string]: boolean }>({});
  const [startDate, endDate] = dateRange;
  const [ordersSuccess, setOrderSuccess] = useState(0);
  const dispatch = useDispatch<any>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 10;

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

  const callGetOrdersApi = async () => {
    try {
      const response = await axios.get("/api/admin/order", {
        params: {
          search: searchTerm,
          paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
          orderStatus: orderStatus !== "all" ? orderStatus : undefined,
          orderSource: orderSource !== "all" ? orderSource : undefined, // ✅ NEW
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          limit: 500,
          page: currentPage,
        },
      });
      // console.log(response, "response");

      if (response.data.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
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
  }, [searchTerm, paymentStatus, orderStatus, orderSource, endDate, currentPage]); // ✅ Added orderSource

  const validateShippingDetails = (order) => {
    const newStatus = newStatuses[order._id];
    if (
      (newStatus === "Shipped" || newStatus === "Delivered") &&
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

  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const refreshTransactionState = async (orderId: any, transactionId: any) => {
    // console.log(orderId, transactionId, "id::");
    const data = { orderId: orderId, transactionId: transactionId };

    try {
      const { payload } = await dispatch(refreshOrderStatus(data));
      // console.log(payload, "refresh");
      toast(payload?.msg ?? "refresh");
      callGetOrdersApi();
    } catch (error) { }
  };

  // ✅ Handle shipping label print (no authentication required)
  const handlePrintLabel = async (orderId: string) => {
    setLabelLoading({ ...labelLoading, [orderId]: true });
    setLabelError({ ...labelError, [orderId]: "" });

    try {
      const response = await fetch(`/api/admin/shipping-label/${orderId}`);
      if (!response.ok) {
        const error = await response.json();
        setLabelError({ ...labelError, [orderId]: error.error || "Failed to fetch label" });
        toast.error(error.error || "Failed to fetch shipping label");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow?.print();
      };

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast.success("Shipping label ready for printing");
    } catch (error) {
      console.error("Print label error:", error);
      setLabelError({ ...labelError, [orderId]: "Error printing label" });
      toast.error("Error printing label");
    } finally {
      setLabelLoading({ ...labelLoading, [orderId]: false });
    }
  };

  // ✅ NEW: Handle shipping label download
  const handleDownloadLabel = async (orderId: string) => {
    setLabelLoading({ ...labelLoading, [orderId]: true });
    setLabelError({ ...labelError, [orderId]: "" });

    try {
      const response = await fetch(`/api/admin/shipping-label/${orderId}`);
      if (!response.ok) {
        const error = await response.json();
        setLabelError({ ...labelError, [orderId]: error.error || "Failed to fetch label" });
        toast.error(error.error || "Failed to fetch shipping label");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipping-label-${orderId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Shipping label downloaded successfully");
    } catch (error) {
      console.error("Download label error:", error);
      setLabelError({ ...labelError, [orderId]: "Error downloading label" });
      toast.error("Error downloading label");
    } finally {
      setLabelLoading({ ...labelLoading, [orderId]: false });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Orders</h1>

        <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-sm">
          <span className="text-red-600 font-bold text-lg">{ordersSuccess}</span>{" "}
          Successful Orders Last 24h
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="w-full">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            className="w-full"
          />
        </div>
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="w-full">
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
          <SelectTrigger className="w-full">
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
        {/* ✅ NEW: Order Source Filter */}
        <Select value={orderSource} onValueChange={setOrderSource}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Order Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="online">Online Orders</SelectItem>
            {/* <SelectItem value="offline">Offline Orders</SelectItem> */}
          </SelectContent>
        </Select>

        <div className="relative w-full">
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => {
              setDateRange(update);
            }}
            customInput={
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <FaCalendarAlt className="mr-2 h-4 w-4" />
                {startDate
                  ? startDate.toLocaleDateString()
                  : "Select Date Range"}
              </Button>
            }
          />
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <CardTitle className="mt-[2px]">Orders List</CardTitle>
          <p className="text-xs text-muted-foreground">
            Refresh pending transactions for accurate data
          </p>
        </CardHeader>
        <CardContent className="p-0 md:p-6">

          {/* ✅ DESKTOP VIEW (Table) */}
          <div className="hidden md:block overflow-x-auto">
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.orderId}
                          {/* ✅ NEW: Show OFFLINE badge for admin-created orders */}
                          {order.orderSource === "ADMIN_OFFLINE" && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                              OFFLINE
                            </Badge>
                          )}
                        </div>
                      </TableCell>
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
                            order.paymentStatus === "succeeded" || order.paymentStatus === "PAYMENT_SUCCESS"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {order.paymentStatus}
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
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
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
                          ${order.paymentStatus === "PAYMENT_SUCCESS"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                                }`}
                            ></div>
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
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
                        <TableCell colSpan={10}>
                          {/* Reusing the Expanded Card Logic Here (Desktop) */}
                          <Card className="mt-4">
                            <CardContent className="space-y-6 mt-4 ">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* User Details */}
                                <Card className="shadow-sm">
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                      <FaUser className="mr-2" /> User Details
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      <p><span className="font-semibold">Name:</span> {order?.user?.name}</p>
                                      <p><span className="font-semibold">Phone:</span> {order?.user?.phone}</p>
                                      <p><span className="font-semibold">Email:</span> {order?.user?.email}</p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Shipping Address */}
                                <Card className="shadow-sm">
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                      <FaMapMarkerAlt className="mr-2" /> Shipping Address
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-1 text-sm">
                                      <p className="font-medium">{order?.shippingAddress?.name}</p>
                                      <p>{order?.shippingAddress?.houseNumber}, {order?.shippingAddress?.address}</p>
                                      <p>{order?.shippingAddress?.landmark}</p>
                                      <p>{order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.zip}</p>
                                      <p>{order?.shippingAddress?.country}</p>
                                      <p className="mt-2 font-medium">Phone: {order?.shippingAddress?.mobile}</p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Payment Details */}
                                <Card className="shadow-sm">
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                      <FaCreditCard className="mr-2" /> Payment Details
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      <p><span className="font-semibold">Method:</span> <Badge>{order?.paymentMethod || "N/A"}</Badge></p>
                                      <p><span className="font-semibold">Status:</span> <Badge variant={order?.paymentStatus === "PAYMENT_SUCCESS" ? "default" : "destructive"}>{order?.paymentStatus}</Badge></p>
                                      <p><span className="font-semibold">Transaction ID:</span> {order?.phonePeTransactionId || "N/A"}</p>
                                      <Separator className="my-2" />
                                      <div className="text-lg font-bold text-green-600">Total: ₹ {order?.payablePrice?.toFixed(2)}</div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                              <Separator />
                              {/* ✅ Product Details Section */}
                              <Card className="shadow-sm mb-6">
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center">
                                    <FaBox className="mr-2" /> Ordered Items ({order.productDetails?.length || 0})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {order.productDetails?.map((item: any, idx: number) => (
                                      <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b last:border-0 pb-4 last:pb-0">
                                        <div className="flex items-center gap-4 flex-1">
                                          {item.product?.img?.[0] ? (
                                            <img
                                              src={item.product.img[0]}
                                              alt={item.product.name}
                                              className="w-16 h-16 object-cover rounded-md border"
                                            />
                                          ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                              No Img
                                            </div>
                                          )}
                                          <div>
                                            <p className="font-semibold text-gray-800">{item.product?.name || "Unknown Product"}</p>
                                            <div className="text-sm text-gray-500 mt-1 flex gap-2">
                                              <Badge variant="outline" className="text-xs">Size: {item.sizeLabel}</Badge>
                                              <Badge variant="outline" className="text-xs">Qty: {item.count}</Badge>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="font-bold text-lg md:text-right">
                                          ₹{item.offerPrice} <span className="text-xs font-normal text-gray-500">x {item.count}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Shipping Update Panel */}
                                <Card className="shadow-sm">
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center"><FaTruck className="mr-2" /> Shipping Details</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <Select value={order.deliveryPartner || ""} onValueChange={(v) => handleShippingPartnerChange(order._id, v)}>
                                      <SelectTrigger><SelectValue placeholder="Select delivery partner" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="fedex">FedEx</SelectItem>
                                        <SelectItem value="Delhivery">Delhivery</SelectItem>
                                        <SelectItem value="Ecom Express">Ecom Express</SelectItem>
                                        <SelectItem value="Blue Dart">Blue Dart</SelectItem>
                                        <SelectItem value="XpressBees">XpressBees</SelectItem>
                                        <SelectItem value="Ekart Logistics">Ekart Logistics</SelectItem>
                                        <SelectItem value="DTDC">DTDC</SelectItem>
                                        <SelectItem value="UPS">UPS</SelectItem>
                                        <SelectItem value="DHL">DHL</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input placeholder="Enter tracking ID" value={order.trackingId || ""} onChange={(e) => handleTrackingIdChange(order._id, e.target.value)} />
                                    <Button onClick={() => updateOrderApi(order._id)}>Update Shipping</Button>
                                  </CardContent>
                                </Card>

                                {/* Shipping Label Logic */}
                                {order.paymentStatus === "PAYMENT_SUCCESS" && (
                                  <Card className="shadow-sm">
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center">
                                        🖨️ Shipping Label
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      {order.dtdc?.referenceNumber ? (
                                        <>
                                          <div className="p-3 bg-purple-50 text-purple-700 rounded-md text-sm mb-2">
                                            <strong>AWB Generated:</strong> {order.dtdc.referenceNumber}
                                          </div>
                                          <div className="flex gap-3">
                                            <Button
                                              variant="outline"
                                              className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                                              onClick={() => window.open(`/api/admin/shipping-label/${order.orderId || order._id}`, '_blank')}
                                            >
                                              <FaSearch className="mr-2" /> View Label
                                            </Button>
                                            <Button
                                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                              onClick={() => handlePrintLabel(order.orderId || order._id)}
                                              disabled={labelLoading[order.orderId || order._id]}
                                            >
                                              {labelLoading[order.orderId || order._id] ? (
                                                <LuLoader className="animate-spin" />
                                              ) : (
                                                <FaDownload className="mr-2" />
                                              )}
                                              Download
                                            </Button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-center p-4 border border-dashed border-red-200 rounded-lg bg-red-50">
                                          <p className="text-red-600 font-medium text-sm">
                                            Shipping label unavailable – shipment not created
                                          </p>
                                          <p className="text-xs text-red-500 mt-1">
                                            AWB Reference Number missing.
                                          </p>
                                          <Button
                                            variant="outline"
                                            className="mt-3 w-full opacity-50 cursor-not-allowed"
                                            disabled
                                          >
                                            <FaDownload className="mr-2" /> Download Label
                                          </Button>
                                        </div>
                                      )}

                                      {labelError[order.orderId || order._id] && (
                                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                                          ⚠️ {labelError[order.orderId || order._id]}
                                        </p>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
                              </div>

                              <Card className="shadow-sm mt-6">
                                <CardHeader><CardTitle className="text-lg">Order Status</CardTitle></CardHeader>
                                <CardContent>
                                  <Select value={newStatuses[order._id] || order.currentStatus} onValueChange={(v) => setNewStatuses(prev => ({ ...prev, [order._id]: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING">PENDING</SelectItem>
                                      <SelectItem value="Processing">Processing</SelectItem>
                                      <SelectItem value="Shipped">Shipped</SelectItem>
                                      <SelectItem value="Delivered">Delivered</SelectItem>
                                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button className="mt-4" onClick={() => handleStatusChange(order._id, newStatuses[order._id] || order.currentStatus)}>Update Status</Button>
                                </CardContent>
                              </Card>
                            </CardContent>
                          </Card>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ✅ MOBILE VIEW (Cards) */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="overflow-hidden border-l-4 border-l-purple-500 shadow-md">
                <CardHeader className="bg-gray-50 p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-md text-gray-800">#{order.orderId}</span>
                      <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Badge variant={order.paymentStatus === "PAYMENT_SUCCESS" ? "default" : "secondary"}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex justify-between items-center my-2">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">₹{order.payablePrice?.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">{order.currentStatus}</Badge>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-3 bg-purple-100 text-purple-700 hover:bg-purple-200"
                    variant="ghost"
                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                  >
                    {expandedOrder === order._id ? "Hide Details" : "View Details"}
                  </Button>

                  {/* Mobile Expanded Details */}
                  {expandedOrder === order._id && (
                    <div className="mt-4 space-y-4 border-t pt-4 animate-in fade-in slide-in-from-top-2">
                      {/* Compact Mobile Details sections */}
                      <div className="bg-white border rounded p-3 shadow-sm">
                        <p className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <FaBox className="text-purple-600" /> Items ({order.productDetails?.length || 0})
                        </p>
                        <div className="space-y-3">
                          {order.productDetails?.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                              {item?.product?.img?.[0] ? (
                                <img
                                  src={item.product.img[0]}
                                  className="w-12 h-12 object-cover rounded bg-gray-100"
                                  alt=""
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">
                                  No Img
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {item?.product?.name || "Unknown Product"}
                                </p>
                                <div className="flex justify-between mt-1 text-xs text-gray-500">
                                  <span>Qty: {item.count} | Size: {item.sizeLabel}</span>
                                  <span className="font-bold text-gray-900">₹{item.offerPrice}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div className="space-y-1 text-sm bg-gray-50 p-3 rounded">
                        <p className="font-bold text-gray-700 mb-1">📍 Delivery To:</p>
                        <p>{order?.shippingAddress?.name}</p>
                        <p>{order?.shippingAddress?.address}, {order?.shippingAddress?.city}</p>
                        <p>{order?.shippingAddress?.state} - {order?.shippingAddress?.zip}</p>
                        <p>Phone: {order?.shippingAddress?.mobile}</p>
                      </div>

                      {/* Mobile Shipping Actions */}
                      {order.paymentStatus === "PAYMENT_SUCCESS" && order.dtdc?.referenceNumber && (
                        <div className="bg-purple-50 p-3 rounded border border-purple-100">
                          <p className="text-xs font-bold text-purple-800 mb-2">AWB: {order.dtdc.referenceNumber}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => window.open(`/api/admin/shipping-label/${order.orderId || order._id}`, '_blank')}>
                              View
                            </Button>
                            <Button size="sm" className="flex-1 h-8 text-xs bg-purple-600" onClick={() => handlePrintLabel(order.orderId || order._id)}>
                              Download
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="font-bold text-sm">Update Status:</p>
                        <Select value={newStatuses[order._id] || order.currentStatus} onValueChange={(v) => setNewStatuses(prev => ({ ...prev, [order._id]: v }))}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="w-full" onClick={() => handleStatusChange(order._id, newStatuses[order._id] || order.currentStatus)}>Update</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent >
      </Card >
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div >
  );
};

export default OrdersPage;