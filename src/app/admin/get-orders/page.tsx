"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaSearch, FaChevronDown, FaChevronUp, FaDownload, FaUser, FaMapMarkerAlt, FaCreditCard, FaBox, FaTruck, FaCalendarAlt } from "react-icons/fa";
import { IoIosRefresh } from "react-icons/io";
import { LuLoader } from "react-icons/lu";
import axios from "axios";
import toast from "react-hot-toast";
import useCountry from "@/lib/useCountry";
import { refreshOrderStatus } from "@/lib/features/order";
import { useDispatch } from "react-redux";

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [orderStatus, setOrderStatus] = useState("all");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [loading, setLoading] = useState(true);
  const [newStatuses, setNewStatuses] = useState<{ [key: string]: string }>({});
  const [ordersSuccess, setOrdersSuccess] = useState(0);

  const { selectedCountry } = useCountry();
  const dispatch = useDispatch<any>();
  const [startDate, endDate] = dateRange;
  const [adminActionStatus, setAdminActionStatus] = useState<{ [key: string]: string }>({});
  // Fetch Orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/order", {
        params: {
          search,
          paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
          orderStatus: orderStatus !== "all" ? orderStatus : undefined,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setOrders(response.data.orders);

        // Count success orders in last 24 hours
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const successCount = response.data.orders.filter(
          (order: any) =>
            order.paymentStatus === "PAYMENT_SUCCESS" &&
            new Date(order.date) >= twentyFourHoursAgo &&
            new Date(order.date) <= now
        ).length;
        setOrdersSuccess(successCount);
      } else {
        toast(response.data.msg);
      }
    } catch (error) {
      console.error(error);
      toast("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, paymentStatus, orderStatus, endDate]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;

    if (newStatus === "Shipped" && (!order.trackingId || !order.deliveryPartner)) {
      return toast.error("Provide tracking ID and delivery partner before shipping.");
    }

    try {
      const response = await axios.patch(`/api/admin/order/${orderId}`, { status: newStatus });
      if (response.data.success) {
        toast(response.data.msg);
        fetchOrders();
        setNewStatuses((prev) => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
      toast("Failed to update order");
    }
  };

  const handleShippingChange = (orderId: string, key: "deliveryPartner" | "trackingId", value: string) => {
    setOrders((prev) =>
      prev.map((order) => (order._id === orderId ? { ...order, [key]: value } : order))
    );
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/invoice/${orderId}`);
      if (!response.ok) throw new Error("Failed to download invoice");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshTransaction = async (orderId: string, transactionId: string) => {
    try {
      const { payload } = await dispatch(refreshOrderStatus({ orderId, transactionId }));
      toast(payload?.msg || "Refreshed");
      fetchOrders();
    } catch {}
  };

  if (loading) return <div className="flex justify-center items-center mt-12"><LuLoader size={32} className="animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Orders</h1>
        <span className="text-red font-bold text-xl">{ordersSuccess} Success Orders in Last 24h</span>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          {/* <SelectTrigger className="w-[200px]"><SelectValue placeholder="Payment Status" /></SelectTrigger> */}
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</SelectItem>
            <SelectItem value="INITIATED">INITIATED</SelectItem>
            <SelectItem value="PAYMENT_ERROR">PAYMENT_ERROR</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
          </SelectContent>
        </Select>

        <Select value={orderStatus} onValueChange={setOrderStatus}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Order Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
            <SelectItem value="PROCESSING">PROCESSING</SelectItem>
            <SelectItem value="SHIPPED">SHIPPED</SelectItem>
            <SelectItem value="DELIVERED">DELIVERED</SelectItem>
            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
          </SelectContent>
        </Select>

        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
          customInput={
            <Button className="w-[200px] flex items-center gap-2">
              <FaCalendarAlt /> {startDate ? startDate.toLocaleDateString() : "Select Date Range"}
            </Button>
          }
        />
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <TableRow>
                    <TableCell>{order.orderId}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{order.date && new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{order.user?.phone}</TableCell>
                    <TableCell>{order.payablePrice?.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={order.paymentStatus === "PAYMENT_SUCCESS" ? "default" : "secondary"}>{order.paymentStatus}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{order.currentStatus}</Badge></TableCell>
                  <TableCell>
  <Select
    value={adminActionStatus[order._id] || ""}
    onValueChange={async (paymentStatus) => {
      try {
        const token = localStorage.getItem("token");

        // ✅ Dynamically include orderId and send paymentStatus in body
        await axios.post(
          `/api/payment/status/${order.orderId}`,
          { paymentStatus },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAdminActionStatus((prev) => ({
          ...prev,
          [order._id]: paymentStatus,
        }));

        toast.success(`Order marked as ${paymentStatus.replace("_", " ")}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update payment status");
      }
    }}
  >
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="Select Status" />
    </SelectTrigger>
    <SelectContent>
      {["COMPLETED", "CONTACTED", "NOT_PAID"].map((status) => (
        <SelectItem key={status} value={status}>
          {status.replace("_", " ")}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</TableCell>





                    <TableCell>
                      <Button size="sm" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                        {expandedOrder === order._id ? <FaChevronUp /> : <FaChevronDown />}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expandedOrder === order._id && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Card className="mt-4 p-4 space-y-4">
                          <div className="grid md:grid-cols-3 gap-4">
                            {/* User Details */}
                            <Card className="shadow-sm p-2">
                              <CardHeader><CardTitle className="flex items-center gap-2"><FaUser /> User</CardTitle></CardHeader>
                              <CardContent className="space-y-1">
                                <p>Name: {order.user?.name}</p>
                                <p>Phone: {order.user?.phone}</p>
                                <p>Email: {order.user?.email}</p>
                              </CardContent>
                            </Card>

                            {/* Shipping Address */}
                            <Card className="shadow-sm p-2">
                              <CardHeader><CardTitle className="flex items-center gap-2"><FaMapMarkerAlt /> Shipping</CardTitle></CardHeader>
                              <CardContent className="space-y-1">
                                <p>{order.shippingAddress?.name}</p>
                                <p>{order.shippingAddress?.address}</p>
                                <p>{order.shippingAddress?.state}, {order.shippingAddress?.zipCode}</p>
                                <p>{order.shippingAddress?.country}</p>
                                <p>{order.shippingAddress?.mobile}</p>
                              </CardContent>
                            </Card>

                            {/* Payment */}
                            <Card className="shadow-sm p-2">
                              <CardHeader><CardTitle className="flex items-center gap-2"><FaCreditCard /> Payment</CardTitle></CardHeader>
                              <CardContent className="space-y-1">
                                <p>Status: {order.paymentStatus}</p>
                                <p>Method: {order.paymentMethod}</p>
                                {/* <p>Transaction ID: {order.tempTransactionId}</p> */}
                                <p>Total: ₹{order.payablePrice?.toFixed(2)}</p>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="flex gap-4 mt-4">
                            <Select
                              value={newStatuses[order._id] || order.currentStatus}
                              onValueChange={(value) => setNewStatuses((prev) => ({ ...prev, [order._id]: value }))}
                            >
                              <SelectTrigger><SelectValue placeholder="Update Status" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">PENDING</SelectItem>
                                <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                                <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                                <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button onClick={() => handleStatusChange(order._id, newStatuses[order._id])}>Submit</Button>
                            {/* <Button onClick={() => downloadInvoice(order._id)}><FaDownload /> Invoice</Button> */}
                          </div>
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