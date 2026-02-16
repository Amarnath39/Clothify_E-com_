"use client";

import React, { useEffect, useState } from "react";
import {
    PageHeader,
    Card as ZapanCard,
    ZapanInput,
    Badge as ZapanBadge,
    Button as ZapanButton, // Use Zapan Button
} from "@/theme/components";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FaSearch, FaReceipt } from "react-icons/fa"; // Removed FaFilter, Input
import axios from "axios";
import toast from "react-hot-toast";
import RefundModal from "@/components/admin/RefundModal";
import { useSelector } from "react-redux";
import { LuLoader } from "react-icons/lu";

interface POSOrder {
    _id: string;
    orderId: string;
    invoiceId: string;
    createdAt: string;
    payablePrice: number;
    paymentMethod: string;
    shippingAddress: {
        mobile: string;
    };
    createdBy: {
        name: string;
    };
    productDetails: any[];
    transactionId?: string;
    // Refund status
    isRefunded?: boolean;
    isFullyRefunded?: boolean;
    refundedQty?: number;
    totalOrderQty?: number;
}

const POSOrdersPage = () => {
    const { user } = useSelector((state: any) => state.auth);
    const [orders, setOrders] = useState<POSOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filteredOrders, setFilteredOrders] = useState<POSOrder[]>([]);

    // Refund State
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [orderToRefund, setOrderToRefund] = useState<POSOrder | null>(null);

    useEffect(() => {
        fetchPOSOrders();
    }, []);

    useEffect(() => {
        if (search.trim()) {
            const filtered = orders.filter(
                (order) =>
                    order.orderId.toLowerCase().includes(search.toLowerCase()) ||
                    order.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
                    order.shippingAddress.mobile.includes(search)
            );
            setFilteredOrders(filtered);
        } else {
            setFilteredOrders(orders);
        }
    }, [search, orders]);

    const fetchPOSOrders = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/admin/pos/orders", {
                headers: {
                    "x-admin-id": user?._id || localStorage.getItem("adminId"),
                },
            });

            if (data.success) {
                setOrders(data.orders);
                setFilteredOrders(data.orders);
            }
        } catch (error: any) {
            console.error("Failed to fetch POS orders", error);
            toast.error("Failed to load POS orders");
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = (order: POSOrder) => {
        const idToUse = order.invoiceId || order._id;
        if (idToUse) {
            window.open(`/invoice/${idToUse}`, '_blank');
        } else {
            toast.error("Order ID missing for this order");
        }
    };

    const handleRefundClick = (order: POSOrder) => {
        if (order.isFullyRefunded) {
            toast.error("This order has already been fully refunded.");
            return;
        }
        setOrderToRefund(order);
        setIsRefundModalOpen(true);
    };

    const handleRefundSuccess = () => {
        fetchPOSOrders();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="POS Transactions"
                description="Real-time history of all point-of-sale orders and payments."
                action={
                    <ZapanButton onClick={fetchPOSOrders} className="h-10 px-6 rounded-lg bg-gray-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
                        Refresh List
                    </ZapanButton>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ZapanCard className="p-6 flex flex-col justify-between border-t-4 border-t-gray-900 shadow-lg shadow-gray-200/50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Orders</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{filteredOrders.length}</p>
                </ZapanCard>
                <ZapanCard className="p-6 flex flex-col justify-between border-t-4 border-t-[#7C1D3E] shadow-lg shadow-[#7C1D3E]/10">
                    <p className="text-[10px] font-black text-[#7C1D3E] uppercase tracking-widest">Total Revenue</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">₹{filteredOrders.reduce((sum, order) => sum + order.payablePrice, 0).toFixed(2)}</p>
                </ZapanCard>
                <ZapanCard className="p-6 flex flex-col justify-between border-t-4 border-t-emerald-500 shadow-lg shadow-emerald-500/10">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cash Payments</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{filteredOrders.filter(o => o.paymentMethod === "CASH").length}</p>
                </ZapanCard>
                <ZapanCard className="p-6 flex flex-col justify-between border-t-4 border-t-blue-500 shadow-lg shadow-blue-500/10">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Digital Payments</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{filteredOrders.filter(o => o.paymentMethod !== "CASH").length}</p>
                </ZapanCard>
            </div>

            <ZapanCard className="overflow-hidden border-gray-100 shadow-xl shadow-gray-200/50 min-h-[500px]">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/30">
                    <div className="w-full max-w-md">
                        <ZapanInput
                            icon={FaSearch}
                            placeholder="Find by ID, Phone or Invoice..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b border-gray-100">
                                <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice</TableHead>
                                <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</TableHead>
                                <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</TableHead>
                                <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</TableHead>
                                <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</TableHead>
                                <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff</TableHead>
                                <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</TableHead>
                                <TableHead className="py-4 px-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20">
                                        <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E] mx-auto mb-4" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Records...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20 text-gray-400">
                                        No transactions found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                                        <TableCell className="py-4 px-6 font-mono text-xs font-bold text-gray-500">
                                            {order.invoiceId}
                                            <div className="text-[10px] text-gray-300 font-normal mt-0.5">{order.orderId}</div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-sm font-bold text-gray-700">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                            <div className="text-[10px] text-gray-400 font-normal">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-sm font-bold text-gray-900">{order.shippingAddress.mobile}</TableCell>
                                        <TableCell className="py-4 px-6 text-sm font-black text-gray-900">₹{order.payablePrice.toFixed(2)}</TableCell>
                                        <TableCell className="py-4 px-6">
                                            <ZapanBadge variant={
                                                order.paymentMethod === "CASH" ? "success" :
                                                    (order.paymentMethod.includes("UPI") || order.paymentMethod.includes("LINK")) ? "brand" : "neutral"
                                            } className="text-[10px]">
                                                {order.paymentMethod === "CASH" && "💵 "}
                                                {order.paymentMethod.includes("UPI") && "📱 "}
                                                {order.paymentMethod.includes("CARD") && "💳 "}
                                                {order.paymentMethod.includes("LINK") && "🔗 "}
                                                {order.paymentMethod.replace("RAZORPAY_", "")}
                                            </ZapanBadge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-xs font-bold text-gray-500">{order.createdBy?.name || "System"}</TableCell>
                                        <TableCell className="py-4 px-6 text-xs font-bold text-gray-500">{order.productDetails.length}</TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <ZapanButton
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => downloadInvoice(order)}
                                                    className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-[#7C1D3E] hover:bg-[#7C1D3E]/10"
                                                >
                                                    <FaReceipt />
                                                </ZapanButton>
                                                <ZapanButton
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`${order.isFullyRefunded
                                                        ? "text-gray-300 cursor-not-allowed hidden"
                                                        : "text-orange-400 hover:text-orange-600 hover:bg-orange-50"
                                                        } h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider`}
                                                    onClick={() => handleRefundClick(order)}
                                                    disabled={order.isFullyRefunded}
                                                >
                                                    {order.isFullyRefunded ? "" : "Refund"}
                                                </ZapanButton>
                                                {order.isRefunded && !order.isFullyRefunded && (
                                                    <ZapanBadge variant="neutral" className="text-[9px] bg-yellow-50 text-yellow-600 border-yellow-200">
                                                        Partial
                                                    </ZapanBadge>
                                                )}
                                                {order.isFullyRefunded && (
                                                    <ZapanBadge variant="neutral" className="text-[9px] bg-gray-100 text-gray-400 border-gray-200">
                                                        Refunded
                                                    </ZapanBadge>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </ZapanCard>

            {/* Refund Modal */}
            {orderToRefund && (
                <RefundModal
                    isOpen={isRefundModalOpen}
                    onClose={() => setIsRefundModalOpen(false)}
                    onSuccess={handleRefundSuccess}
                    order={orderToRefund}
                />
            )}
        </div>
    );
};

export default POSOrdersPage;
