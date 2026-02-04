"use client";

import React from "react";
import Image from "next/image";
import { FaPrint, FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";

interface InvoiceClientProps {
    order: any;
}

const InvoiceClient: React.FC<InvoiceClientProps> = ({ order }) => {
    const handlePrint = () => {
        window.print();
    };

    const companyDetails = {
        name: "Sindhoora Ethnics",
        address: "Thrissur, Kerala, India\nPhone: +91 6282 025 003",
        footer: "Thank you for shopping with Sindhoora Ethnics!",
    };

    // Helper to safely get date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white">
            {/* Toolbar - Hidden when printing */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold text-gray-800">Invoice Preview</h1>
                <div className="space-x-4">
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <FaPrint className="mr-2" /> Print / Save PDF
                    </Button>
                </div>
            </div>

            {/* Invoice Container */}
            <div
                id="invoice-container"
                className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden print:shadow-none print:max-w-none print:w-full"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                    <div>
                        <div className="relative w-48 h-16 mb-2">
                            {/* Use img for better print support than Next Image sometimes */}
                            <img src="/assets/static/logo/saw.svg" alt="Sindhoora Ethnics" className="object-contain h-16 w-auto" />
                        </div>
                        <div className="text-sm text-gray-500 whitespace-pre-line mt-2">
                            {companyDetails.address}
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-wide">Invoice</h2>
                        <div className="mt-2 space-y-1">
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-800">Invoice #:</span> {order.invoiceId}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-800">Order ID:</span> {order.orderId}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-800">Date:</span> {formatDate(order.paidAt || order.createdAt)}
                            </p>
                            {order.transactionId && (
                                <p className="text-gray-600">
                                    <span className="font-semibold text-gray-800">Transaction ID:</span> <span className="font-mono text-sm">{order.transactionId}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bill To */}
                <div className="p-8 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
                    <div className="text-gray-800 font-medium text-lg">
                        {order.shippingAddress?.name || "Pos Customer"}
                    </div>
                    {order.customerPhone && (
                        <div className="text-gray-600 mt-1">
                            Phone: {order.customerPhone}
                        </div>
                    )}
                    {order.shippingAddress?.mobile && order.shippingAddress.mobile !== order.customerPhone && (
                        <div className="text-gray-600 mt-1">
                            Mobile: {order.shippingAddress.mobile}
                        </div>
                    )}
                    {order.shippingAddress?.address && (
                        <div className="text-gray-600 mt-1 whitespace-pre-line max-w-md">
                            {order.shippingAddress.address}
                            {order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ""}
                            {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                            {order.shippingAddress.pincode ? ` - ${order.shippingAddress.pincode}` : ""}
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div className="p-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="py-2 text-sm font-semibold text-gray-600 uppercase">Description</th>
                                <th className="py-2 text-sm font-semibold text-gray-600 uppercase text-center">Size</th>
                                <th className="py-2 text-sm font-semibold text-gray-600 uppercase text-center">Qty</th>
                                <th className="py-2 text-sm font-semibold text-gray-600 uppercase text-right">Price</th>
                                <th className="py-2 text-sm font-semibold text-gray-600 uppercase text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {order.productDetails.map((item: any, index: number) => {
                                const productName = item.product?.name || "Unknown Product";
                                const size = item.sizeLabel || item.size?.size || "-";
                                const price = item.product?.offerPrice || item.product?.actualPrice || 0;
                                const total = price * item.quantity;

                                return (
                                    <tr key={index} className="border-b border-gray-100 last:border-0">
                                        <td className="py-4">
                                            <div className="font-medium">{productName}</div>
                                            {/* <div className="text-xs text-gray-500">SKU: {item.product?.sku}</div> */}
                                        </td>
                                        <td className="py-4 text-center">{size}</td>
                                        <td className="py-4 text-center">{item.quantity}</td>
                                        <td className="py-4 text-right">₹{price.toFixed(2)}</td>
                                        <td className="py-4 text-right font-medium">₹{total.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="p-8 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{(order.totalPrice || 0).toFixed(2)}</span>
                            </div>

                            {/* Discount */}
                            {(order.totalPrice - order.payablePrice > 0) && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-₹{(order.totalPrice - order.payablePrice).toFixed(2)}</span>
                                </div>
                            )}

                            {/* Shipping */}
                            {order.shippingCost > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>₹{order.shippingCost.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-800">Total</span>
                                <span className="text-xl font-bold text-blue-900">₹{order.payablePrice.toFixed(2)}</span>
                            </div>

                            <div className="text-right pt-2 text-xs text-gray-500 uppercase tracking-widest">
                                Paid via {order.paymentMethod}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 text-center border-t border-gray-200">
                    <p className="text-gray-600 italic mb-2">{companyDetails.footer}</p>
                    <p className="text-xs text-gray-400">
                        This is a computer-generated invoice. No signature required.
                    </p>
                    <div className="mt-4 print:hidden text-center">
                        <p className="text-sm text-gray-500">Need help? Contact us: +91 6282 025 003</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceClient;
