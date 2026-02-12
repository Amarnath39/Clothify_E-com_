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
        name: "Swaarasya",
        address: "BiBi Square, Shop No 2,Chalad, Kannur 670014",
        footer: "Thank you for shopping with Swaarasya!",
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
                            <img src="/assets/static/logo/saw.svg" alt="Swaarasya" className="object-contain h-16 w-auto" />
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
                    <table className="w-full text-left border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-2 px-3 text-sm font-semibold text-gray-600 uppercase border border-gray-300">Description</th>
                                <th className="py-2 px-3 text-sm font-semibold text-gray-600 uppercase text-center border border-gray-300">Size</th>
                                <th className="py-2 px-3 text-sm font-semibold text-gray-600 uppercase text-center border border-gray-300">Qty</th>
                                <th className="py-2 px-3 text-sm font-semibold text-gray-600 uppercase text-right border border-gray-300">Unit Price</th>
                                <th className="py-2 px-3 text-sm font-semibold text-gray-600 uppercase text-right border border-gray-300">Taxable Value</th>
                                <th className="py-2 px-3 text-sm font-semibold text-gray-600 uppercase text-right whitespace-nowrap border border-gray-300">SGST</th>
                                <th className="py-2 px-3 text-sm font-semibold text-gray-600 uppercase text-right whitespace-nowrap border border-gray-300">CGST</th>
                                <th className="py-2 px-3 text-sm font-semibold text-gray-600 uppercase text-right border border-gray-300">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {order.productDetails.map((item: any, index: number) => {
                                const productName = item.product?.name || "Unknown Product";
                                const size = item.sizeLabel || item.size?.size || "-";
                                const quantity = item.quantity || item.count || 0;
                                const unitPrice = item.offerPrice || item.product?.offerPrice || item.product?.actualPrice || 0;

                                // Find tax details for this product from metadata
                                const itemTaxInfo = order.metadata?.taxDetails?.find(
                                    (td: any) => td.productId?.toString() === item.product?._id?.toString()
                                );

                                let totalGst = itemTaxInfo?.gstAmount;

                                // Fallback for orders without metadata tax details
                                if (totalGst === undefined) {
                                    let gstPercent = 0;
                                    const categories = item.product?.categories;
                                    if (categories && Array.isArray(categories)) {
                                        gstPercent = Math.max(0, ...categories.map((c: any) => c.gst || 0));
                                    }
                                    const unitTaxableValue = (unitPrice * 100) / (100 + gstPercent);
                                    totalGst = (unitPrice - unitTaxableValue) * quantity;
                                }

                                const unitGst = quantity > 0 ? (totalGst / quantity) : 0;
                                const unitTaxable = unitPrice - unitGst;
                                const sgstUnit = unitGst / 2;
                                const cgstUnit = unitGst / 2;

                                const totalRow = quantity * unitPrice;

                                return (
                                    <tr key={index}>
                                        <td className="py-3 px-3 border border-gray-300">
                                            <div className="font-medium text-gray-900">{productName}</div>
                                        </td>
                                        <td className="py-3 px-3 text-center border border-gray-300">{size}</td>
                                        <td className="py-3 px-3 text-center border border-gray-300">{quantity}</td>
                                        <td className="py-3 px-3 text-right border border-gray-300">₹{unitPrice.toFixed(2)}</td>
                                        <td className="py-3 px-3 text-right border border-gray-300">₹{unitTaxable.toFixed(2)}</td>
                                        <td className="py-3 px-3 text-right border border-gray-300">₹{sgstUnit.toFixed(2)}</td>
                                        <td className="py-3 px-3 text-right border border-gray-300">₹{cgstUnit.toFixed(2)}</td>
                                        <td className="py-3 px-3 text-right font-medium text-gray-900 border border-gray-300">₹{totalRow.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="p-8 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/2 lg:w-1/3 space-y-4">
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-semibold">Total Price (Incl. GST)</span>
                                <span className="text-gray-900">₹{(order.payablePrice - (order.shippingCost || 0)).toFixed(2)}</span>
                            </div>

                            {order.shippingCost > 0 && (
                                <div className="flex justify-between items-center text-gray-700">
                                    <span className="font-semibold">Shipping Charges</span>
                                    <span className="text-gray-900">₹{order.shippingCost.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="border-t-2 border-gray-300 pt-4 flex justify-between items-center">
                                <span className="text-xl font-black text-gray-900 uppercase">Grand Total</span>
                                <span className="text-2xl font-black text-blue-900">₹{order.payablePrice.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Status</span>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === "PAYMENT_SUCCESS"
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {order.paymentStatus?.replace(/_/g, " ")}
                                </div>
                            </div>

                            <div className="text-right pt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
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
