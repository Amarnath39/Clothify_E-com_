"use client";

import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  SearchInput,
  Pagination,
} from "@/theme/components";
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
import { Separator } from "@/components/ui/separator";

import {
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaTruck,
  FaUser,
  FaBox,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { refreshOrderStatus } from "@/lib/features/order";
import { useDispatch } from "react-redux";
import { IoIosRefresh } from "react-icons/io";
import { LuLoader } from "react-icons/lu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle } from "lucide-react";
import { useSelector } from "react-redux";
import ExportModal from "@/components/admin/ExportModal";

/**
 * Standardized Input for forms within the Zapan system
 */
const ZapanInput = ({ value, onChange, placeholder, className = "" }: any) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 focus:border-[#7C1D3E]/50 transition-all text-sm ${className}`}
  />
);

const OrdersPage = () => {
  const [expandedOrder, setExpandedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState("all");
  const [orderSource, setOrderSource] = useState("online");
  const [newStatuses, setNewStatuses] = useState<{ [key: string]: string }>({});
  const [dateRange, setDateRange] = useState<any>([null, null]);
  const [labelLoading, setLabelLoading] = useState<{ [key: string]: boolean }>({});
  const [startDate, endDate] = dateRange;
  const [ordersSuccess, setOrderSuccess] = useState(0);
  const dispatch = useDispatch<any>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { user } = useSelector((state: any) => state.auth);

  const countRecentSuccessfulPayments = async (ordersList: any[]) => {
    const now: any = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const count = ordersList.filter((order) => {
      const orderDate = new Date(order.date || order.createdAt);
      return (
        order.paymentStatus === "PAYMENT_SUCCESS" &&
        orderDate >= twentyFourHoursAgo &&
        orderDate <= now
      );
    }).length;
    return count;
  };

  const callGetOrdersApi = async () => {
    try {
      const response = await axios.get("/api/admin/order", {
        params: {
          search: searchTerm,
          paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
          orderStatus: orderStatus !== "all" ? orderStatus : undefined,
          orderSource: orderSource !== "all" ? orderSource : undefined,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          limit: 50,
          page: currentPage,
        },
      });

      if (response.data.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
        const stats = await countRecentSuccessfulPayments(response.data.orders);
        setOrderSuccess(stats);
      } else {
        toast.error(response.data.msg);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    callGetOrdersApi();
  }, [searchTerm, paymentStatus, orderStatus, orderSource, endDate, currentPage]);

  const validateShippingDetails = (order: any) => {
    const newStatus = newStatuses[order._id];
    if (
      (newStatus === "Shipped" || newStatus === "Delivered") &&
      (!order.trackingId || !order.deliveryPartner)
    ) {
      toast.error("Please provide both tracking ID and delivery partner before shipping.");
      return false;
    }
    return true;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o._id === orderId);
    if (!validateShippingDetails(order)) return;

    try {
      const response = await axios.patch(`/api/admin/order/${orderId}`, { status: newStatus });
      if (response.data.success) {
        toast.success(response.data.msg);
        callGetOrdersApi();
        setNewStatuses((prev) => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      } else {
        toast.error(response.data.msg);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleShippingPartnerChange = (orderId: string, partner: string) => {
    setOrders(orders.map((o) => (o._id === orderId ? { ...o, deliveryPartner: partner } : o)));
  };

  const handleTrackingIdChange = (orderId: string, trackingId: string) => {
    setOrders(orders.map((o) => (o._id === orderId ? { ...o, trackingId } : o)));
  };

  const updateOrderApi = async (orderId: string) => {
    const order = orders.find((o) => o._id === orderId);
    const payload = {
      currentStatus: order.currentStatus,
      trackingId: order.trackingId,
      deliveryPartner: order.deliveryPartner,
    };
    try {
      const response = await axios.patch(`/api/admin/order/${orderId}`, payload);
      if (response.data.success) {
        toast.success(response.data.msg);
        callGetOrdersApi();
      } else {
        toast.error(response.data.msg);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const refreshTransactionState = async (orderId: string, transactionId: string) => {
    try {
      const { payload } = await dispatch(refreshOrderStatus({ orderId, transactionId }));
      toast(payload?.msg ?? "Refreshed");
      callGetOrdersApi();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePrintLabel = async (orderId: string) => {
    setLabelLoading({ ...labelLoading, [orderId]: true });
    try {
      const response = await fetch(`/api/admin/shipping-label/${orderId}`);
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch shipping label");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      }, 1000);
      toast.success("Shipping label ready group for printing");
    } catch (error) {
      console.error(error);
      toast.error("Error printing label");
    } finally {
      setLabelLoading({ ...labelLoading, [orderId]: false });
    }
  };

  const downloadInvoice = (order: any) => {
    const idToUse = order.invoiceId || order._id;
    if (idToUse) {
      window.open(`/invoice/${idToUse}`, '_blank');
    } else {
      toast.error("Order ID missing for this order");
    }
  };

  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Orders Management"
        description="View and manage all customer orders, shipping labels, and status updates."
        action={
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsExportModalOpen(true)}
              variant="outline"
              className="h-12 px-6 rounded-xl border-gray-200 hover:text-[#7C1D3E] hidden md:flex items-center gap-2"
            >
              <FaDownload size={14} />
              Export Data
            </Button>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Recent Success</p>
                <p className="text-lg font-bold text-gray-900">{ordersSuccess}</p>
              </div>
            </div>
          </div>
        }
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentFilters={{
          search: searchTerm,
          paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
          orderStatus: orderStatus !== "all" ? orderStatus : undefined,
          orderSource: orderSource !== "all" ? orderSource : undefined,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        }}
        adminId={user?._id}
      />

      <Card className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
          <div className="lg:col-span-1">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Search</label>
            <SearchInput
              placeholder="Order ID, Phone..."
              value={searchTerm}
              onChange={(val) => {
                setCurrentPage(1);
                setSearchTerm(val);
              }}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Payment Status</label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-full h-11 rounded-xl border-gray-100 bg-gray-50/50">
                <SelectValue placeholder="All Payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</SelectItem>
                <SelectItem value="INITIATED">INITIATED</SelectItem>
                <SelectItem value="PAYMENT_ERROR">PAYMENT_ERROR</SelectItem>
                <SelectItem value="FAILED">FAILED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Order Status</label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-full h-11 rounded-xl border-gray-100 bg-gray-50/50">
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Order Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Date Range</label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update: [Date | null, Date | null]) => {
                setDateRange(update);
              }}
              customInput={
                <button className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-left text-sm flex items-center justify-between group hover:border-[#7C1D3E]/30 transition-colors">
                  <span className={startDate ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {startDate ? `${startDate.toLocaleDateString()} - ${endDate ? endDate.toLocaleDateString() : '...'}` : "Select dates"}
                  </span>
                  <FaCalendarAlt className="text-gray-400 group-hover:text-[#7C1D3E] transition-colors" />
                </button>
              }
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <Tabs value={orderSource} onValueChange={(val) => { setCurrentPage(1); setOrderSource(val); }} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-xl p-1 h-11">
                <TabsTrigger value="online" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#7C1D3E]">Online</TabsTrigger>
                <TabsTrigger value="offline" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#7C1D3E]">Offline</TabsTrigger>
                <TabsTrigger value="pos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#7C1D3E]">POS</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            Live Order Feed
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b border-gray-100">
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Order ID</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Customer</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Total</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Payment</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Order Status</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <TableRow className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-900">{order.orderId}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{order?.user?.name || "Guest"}</span>
                        <span className="text-xs text-gray-400">{order?.user?.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="font-bold text-gray-900">₹{order?.payablePrice?.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge variant={order.paymentStatus === "PAYMENT_SUCCESS" ? "brand" : "neutral"} className="rounded-lg px-2 py-0.5 text-[10px]">
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge variant="neutral" className="border-gray-200 text-gray-600 rounded-lg px-2 py-0.5 text-[10px]">
                        {order.currentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.tempTransactionId && (
                          <button
                            onClick={() => refreshTransactionState(order._id, order.tempTransactionId)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-green-600 transition-colors"
                            title="Refresh Transaction"
                          >
                            <IoIosRefresh size={18} />
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg h-8 px-2 text-gray-400 hover:text-[#7C1D3E]"
                          onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        >
                          {expandedOrder === order._id ? <FaChevronUp /> : <FaChevronDown />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedOrder === order._id && (
                    <TableRow className="bg-gray-50/20">
                      <TableCell colSpan={6} className="p-0">
                        <div className="p-8 border-b border-gray-100 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            {/* Address */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FaMapMarkerAlt /> Shipping Address
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p className="font-bold text-gray-900">{order?.shippingAddress?.name}</p>
                                <p>{order?.shippingAddress?.address}</p>
                                <p>{order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.zip}</p>
                                <p className="pt-2 flex items-center gap-2"><FaUser size={12} /> {order?.shippingAddress?.mobile}</p>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-4 md:col-span-2">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FaBox /> Ordered Items
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {order.productDetails?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <img src={item.product?.img?.[0]} className="w-14 h-14 rounded-lg object-cover" alt="" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-gray-900 truncate">{item.product?.name}</p>
                                      <p className="text-xs text-gray-400">Size: {item.sizeLabel} | Qty: {item.count}</p>
                                      <p className="text-sm font-bold text-[#7C1D3E] mt-1">₹{item.offerPrice}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <Separator className="mb-8 opacity-50" />

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Shipping Update */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FaTruck /> Update Shipping
                              </h4>
                              <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <Select value={order.deliveryPartner || ""} onValueChange={(v) => handleShippingPartnerChange(order._id, v)}>
                                  <SelectTrigger className="h-10 text-xs rounded-lg border-gray-100"><SelectValue placeholder="Delivery Partner" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Delhivery">Delhivery</SelectItem>
                                    <SelectItem value="Blue Dart">Blue Dart</SelectItem>
                                    <SelectItem value="Ecom Express">Ecom Express</SelectItem>
                                  </SelectContent>
                                </Select>
                                <ZapanInput
                                  placeholder="Tracking ID"
                                  value={order.trackingId || ""}
                                  onChange={(val: string) => handleTrackingIdChange(order._id, val)}
                                  className="h-10 text-xs"
                                />
                                <Button onClick={() => updateOrderApi(order._id)} className="w-full h-10 rounded-lg text-xs" variant="primary">
                                  Update Shipping
                                </Button>
                              </div>
                            </div>

                            {/* Status Update */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle size={14} /> Update Order Status
                              </h4>
                              <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <Select value={newStatuses[order._id] || order.currentStatus} onValueChange={(v) => setNewStatuses(prev => ({ ...prev, [order._id]: v }))}>
                                  <SelectTrigger className="h-10 text-xs rounded-lg border-gray-100"><SelectValue placeholder="New Status" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Processing">Processing</SelectItem>
                                    <SelectItem value="Shipped">Shipped</SelectItem>
                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button onClick={() => handleStatusChange(order._id, newStatuses[order._id] || order.currentStatus)} className="w-full h-10 rounded-lg text-xs" variant="primary">
                                  Update Status
                                </Button>
                              </div>
                            </div>

                            {/* Labels & Invoices */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FaDownload /> Documents
                              </h4>
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  className="w-full h-10 rounded-lg text-xs border-gray-100 hover:text-[#7C1D3E]"
                                  onClick={() => handlePrintLabel(order.orderId || order._id)}
                                >
                                  {labelLoading[order.orderId || order._id] ? <LuLoader className="animate-spin" /> : <><FaDownload className="mr-2" /> Download Shipping Label</>}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full h-10 rounded-lg text-xs border-gray-100 hover:text-[#7C1D3E]"
                                  onClick={() => downloadInvoice(order)}
                                >
                                  <FaDownload className="mr-2" /> Download Tax Invoice
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center py-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
