"use client";

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
                createdBy: localStorage.getItem("adminId")
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Refund / Exchange Order #{order.orderId}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Action Type */}
                    <div className="flex gap-4">
                        <Label>Action:</Label>
                        <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="REFUND" id="r1" />
                                <Label htmlFor="r1">Refund</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="EXCHANGE" id="r2" />
                                <Label htmlFor="r2">Exchange</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Condition */}
                    <div className="flex gap-4">
                        <Label>Condition:</Label>
                        <RadioGroup value={condition} onValueChange={(v: any) => setCondition(v)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="GOOD" id="c1" />
                                <Label htmlFor="c1" className="text-green-600 font-medium">Good (Restock)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="DAMAGED" id="c2" />
                                <Label htmlFor="c2" className="text-red-600 font-medium">Damaged (Discard)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Items Table */}
                    <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                        <Label className="mb-2 block">Select Items to Return:</Label>
                        {order.productDetails.map((item: any, idx: number) => {
                            const key = `${item.product._id || item.product}_${item.size._id}`;
                            // Note: item.product might be populated (object) or ID (string). 
                            // POSOrdersPage usually populates. Handle safe check.
                            // Assuming order passed from POSOrdersPage is populated.
                            const isSelected = !!selectedItems[key];

                            return (
                                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(c) => handleItemCheck(key, !!c, item.count)}
                                        />
                                        <div>
                                            <p className="text-sm font-medium">{item.product.name || "Product"}</p>
                                            <p className="text-xs text-gray-500">
                                                Size: {item.size.size} | Qty: {item.count}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs">Return Qty:</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max={item.count}
                                                className="w-16 h-8"
                                                value={selectedItems[key]}
                                                onChange={(e) => handleQtyChange(key, parseInt(e.target.value), item.count)}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Reason */}
                    <div>
                        <Label>Reason:</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Reason" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="Wrong Size">Wrong Size</SelectItem>
                                <SelectItem value="Defective">Defective</SelectItem>
                                <SelectItem value="Changed Mind">Changed Mind</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className={type === "REFUND" ? "bg-red-600" : "bg-blue-600"}>
                        {loading ? "Processing..." : `Confirm ${type}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
