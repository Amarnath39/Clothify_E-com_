"use client";

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSelector } from "react-redux";
import { Button as ZapanButton, ZapanInput, Badge as ZapanBadge } from "@/theme/components";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RefundModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RefundModal({ order, isOpen, onClose, onSuccess }: RefundModalProps) {
    const [type, setType] = useState<"REFUND" | "EXCHANGE">("REFUND");
    const [reason, setReason] = useState("");
    const [condition, setCondition] = useState<"GOOD" | "DAMAGED">("GOOD");
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const { user } = useSelector((state: any) => state.auth);

    if (!order) return null;

    const handleItemCheck = (key: string, checked: boolean, maxQty: number) => {
        if (checked) {
            setSelectedItems(prev => ({ ...prev, [key]: maxQty })); // Default to full qty
        } else {
            const next = { ...selectedItems };
            delete next[key];
            setSelectedItems(next);
        }
    };

    const handleQtyChange = (key: string, qty: number, maxQty: number) => {
        if (qty < 1) return;
        if (qty > maxQty) {
            toast.error(`Max quantity is ${maxQty}`);
            return;
        }
        setSelectedItems(prev => ({ ...prev, [key]: qty }));
    };

    const handleSubmit = async () => {
        if (Object.keys(selectedItems).length === 0) {
            toast.error("Select at least one item");
            return;
        }
        if (!reason) {
            toast.error("Select a reason");
            return;
        }

        setLoading(true);
        try {
            const itemsToRefund = Object.entries(selectedItems).map(([key, qty]) => {
                const [productId, sizeId] = key.split("_");
                return { productId, sizeId, quantity: qty };
            });

            const res = await axios.post("/api/admin/pos/refund", {
                orderId: order.orderId,
                orderRef: order._id,
                type,
                reason,
                condition,
                items: itemsToRefund,
                createdBy: user?._id || localStorage.getItem("adminId")
            });

            if (res.data.success) {
                toast.success(type === "REFUND" ? "Refund Processed" : "Return Processed for Exchange");
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to process request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="bg-gray-50 p-8 border-b border-gray-100">
                    <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                        {type === "REFUND" ? "Process Refund" : "Exchange Order"}
                        <span className="block text-xs font-bold text-gray-400 mt-1">Order #{order.orderId}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Action Type */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Action Type</label>
                        <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="flex gap-4">
                            <div className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${type === "REFUND" ? "border-[#7C1D3E] bg-[#7C1D3E]/5 text-[#7C1D3E]" : "border-gray-100 text-gray-400 hover:border-gray-200"}`} onClick={() => setType("REFUND")}>
                                <RadioGroupItem value="REFUND" id="r1" className="sr-only" />
                                <span className="font-bold text-sm uppercase tracking-wider">Refund</span>
                            </div>
                            <div className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${type === "EXCHANGE" ? "border-[#7C1D3E] bg-[#7C1D3E]/5 text-[#7C1D3E]" : "border-gray-100 text-gray-400 hover:border-gray-200"}`} onClick={() => setType("EXCHANGE")}>
                                <RadioGroupItem value="EXCHANGE" id="r2" className="sr-only" />
                                <span className="font-bold text-sm uppercase tracking-wider">Exchange</span>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Condition */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Item Condition</label>
                        <RadioGroup value={condition} onValueChange={(v: any) => setCondition(v)} className="flex gap-4">
                            <div className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${condition === "GOOD" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-100 text-gray-400 hover:border-gray-200"}`} onClick={() => setCondition("GOOD")}>
                                <RadioGroupItem value="GOOD" id="c1" className="sr-only" />
                                <span className="font-bold text-sm uppercase tracking-wider">Resalable</span>
                            </div>
                            <div className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${condition === "DAMAGED" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-100 text-gray-400 hover:border-gray-200"}`} onClick={() => setCondition("DAMAGED")}>
                                <RadioGroupItem value="DAMAGED" id="c2" className="sr-only" />
                                <span className="font-bold text-sm uppercase tracking-wider">Damaged</span>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Items Table */}
                    <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4 ml-1">Select Items to Return</label>
                        <div className="space-y-2">
                            {order.productDetails.map((item: any, idx: number) => {
                                // Handle both populated and unpopulated product/size fields
                                const productId = item.product?._id || item.product;
                                const sizeId = item.size?._id || item.sizeId || item._id; // Fallback to item._id if no size
                                const key = `${productId}_${sizeId}`;
                                const productName = item.product?.name || "Product";
                                const sizeLabel = item.size?.size || item.sizeLabel || "N/A";
                                const isSelected = !!selectedItems[key];

                                return (
                                    <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isSelected ? "bg-white border-[#7C1D3E]/30 shadow-sm" : "bg-transparent border-transparent hover:bg-white hover:border-gray-100"}`}>
                                        <div className="flex items-center gap-4">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(c) => handleItemCheck(key, !!c, item.count)}
                                                className="data-[state=checked]:bg-[#7C1D3E] data-[state=checked]:border-[#7C1D3E]"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{productName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <ZapanBadge variant="neutral" className="text-[10px] py-0 px-1.5 h-auto">{sizeLabel}</ZapanBadge>
                                                    <span className="text-[10px] font-bold text-gray-400">Qty: {item.count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase ml-2 mr-1">Return:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.count}
                                                    className="w-12 h-8 bg-white border border-gray-200 rounded text-center text-sm font-bold focus:outline-none focus:border-[#7C1D3E]"
                                                    value={selectedItems[key]}
                                                    onChange={(e) => handleQtyChange(key, parseInt(e.target.value), item.count)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Return Reason</label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 font-bold text-sm focus:ring-[#7C1D3E]/20">
                                <SelectValue placeholder="Select Reason" />
                            </SelectTrigger>
                            <SelectContent className="z-[99999] rounded-xl border-gray-100 shadow-xl" position="popper">
                                <SelectItem value="Wrong Size" className="font-medium py-2">Wrong Size</SelectItem>
                                <SelectItem value="Defective" className="font-medium py-2">Defective</SelectItem>
                                <SelectItem value="Changed Mind" className="font-medium py-2">Changed Mind</SelectItem>
                                <SelectItem value="Other" className="font-medium py-2">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100 gap-3">
                    <ZapanButton variant="outline" onClick={onClose} className="h-12 rounded-xl border-gray-200">Cancel</ZapanButton>
                    <ZapanButton onClick={handleSubmit} disabled={loading} className={`h-12 rounded-xl text-white font-bold uppercase tracking-widest shadow-lg ${type === "REFUND" ? "bg-red-600 hover:bg-red-700 shadow-red-500/30" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"}`}>
                        {loading ? "Processing..." : `Confirm ${type}`}
                    </ZapanButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
