"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaSearch, FaReceipt, FaFilter } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

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
}

const POSOrdersPage = () => {
    const [orders, setOrders] = useState<POSOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filteredOrders, setFilteredOrders] = useState<POSOrder[]>([]);

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
                    "x-admin-id": localStorage.getItem("adminId"),
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
        // Implement invoice download/print functionality
        toast.success(`Invoice for ${order.invoiceId} downloaded`);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">🏪 POS Order History</h1>
                <Button variant="outline" onClick={fetchPOSOrders}>
                    Refresh
                </Button>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <Input
                            placeholder="Search by Order ID, Invoice ID, or Phone..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        POS Orders ({filteredOrders.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer Phone</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-10">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-10">
                                        No POS orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order._id}>
                                        <TableCell className="font-bold text-blue-600">
                                            {order.invoiceId}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {order.orderId}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{order.shippingAddress.mobile}</TableCell>
                                        <TableCell className="font-bold">
                                            ₹{order.payablePrice.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                order.paymentMethod === "CASH" ? "default" :
                                                    order.paymentMethod === "UPI" ? "secondary" : "outline"
                                            }>
                                                {order.paymentMethod === "CASH" && "💵 "}
                                                {order.paymentMethod === "UPI" && "📱 "}
                                                {order.paymentMethod === "CARD" && "💳 "}
                                                {order.paymentMethod}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600">
                                            {order.transactionId || "-"}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {order.createdBy?.name || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {order.productDetails.length} item(s)
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => downloadInvoice(order)}
                                            >
                                                <FaReceipt className="mr-1" />
                                                Invoice
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Total Orders</div>
                        <div className="text-2xl font-bold">{filteredOrders.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Total Revenue</div>
                        <div className="text-2xl font-bold text-green-600">
                            ₹{filteredOrders.reduce((sum, order) => sum + order.payablePrice, 0).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Cash Payments</div>
                        <div className="text-2xl font-bold">
                            {filteredOrders.filter(o => o.paymentMethod === "CASH").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Digital Payments</div>
                        <div className="text-2xl font-bold">
                            {filteredOrders.filter(o => o.paymentMethod !== "CASH").length}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default POSOrdersPage;
