// admin/coupon.tsx
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

const Coupons = () => {
  const [coupons, setCoupons] = useState<any>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const { toast } = useToast();
  
  // ✅ Use OLD field names
  const [formData, setFormData] = useState<any>({
    couponCode: "",
    description: "",
    validity: "",
    type: "",
    amount: "", // Discount value (percentage or flat)
    maxDiscount: "", // Max discount cap (only for percentage)
    purchaseAmount: "",
    availableFor: "",
    visible: false,
    multiUse: false,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get("/api/coupon/all");
      // console.log("Fetched coupons:", response.data);
      setCoupons(response.data.coupon || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.couponCode || !formData.validity || !formData.type || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // ✅ Use OLD field names for payload
      const payload = {
        couponCode: formData.couponCode.toUpperCase(),
        description: formData.description || "",
        validity: formData.validity,
        type: formData.type,
        amount: parseFloat(formData.amount) || 0, // Discount value
        maxDiscount: formData.type === "percentage" && formData.maxDiscount 
          ? parseFloat(formData.maxDiscount) 
          : null, // Max cap (for percentage)
        purchaseAmount: parseFloat(formData.purchaseAmount) || 0,
        availableFor: parseInt(formData.availableFor) || 1,
        visible: formData.visible,
        multiUse: formData.multiUse,
        categories: [], // Add if needed
        off: "0", // Keep for backward compatibility
      };
      
      // console.log('Sending payload:', payload);
      
      if (editingCoupon) {
        const response = await axios.patch(`/api/admin/coupon/${editingCoupon._id}`, payload);
        // console.log('Update response:', response.data);
        toast({
          title: "Success",
          description: "Coupon updated successfully",
        });
      } else {
        const response = await axios.post("/api/admin/coupon", payload);
        // console.log('Create response:', response.data);
        toast({
          title: "Success",
          description: "Coupon created successfully",
        });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error.response?.data || error.message);
      toast({
        title: "Error",
        description: error.response?.data?.msg || "Failed to save coupon",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this coupon?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(`/api/admin/coupon/${id}`);
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        });
        fetchCoupons();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete coupon",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      couponCode: "",
      description: "",
      validity: "",
      type: "",
      amount: "",
      maxDiscount: "",
      purchaseAmount: "",
      availableFor: "",
      visible: false,
      multiUse: false,
    });
    setEditingCoupon(null);
  };

  const openDialog = (coupon: any = null) => {
    setEditingCoupon(coupon);
    if (coupon) {
      // ✅ Map OLD field names to form
      setFormData({
        couponCode: coupon.couponCode,
        description: coupon.description || "",
        validity: new Date(coupon.validity).toISOString().split("T")[0],
        type: coupon.type,
        amount: coupon.amount?.toString() || "",
        maxDiscount: coupon.maxDiscount?.toString() || "",
        purchaseAmount: coupon.purchaseAmount?.toString() || "",
        availableFor: coupon.availableFor?.toString() || "",
        visible: coupon.visible || false,
        multiUse: coupon.multiUse || false,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Use OLD field names for display
  const formatCouponDisplay = (coupon: any) => {
    if (coupon.type === "percentage") {
      const discount = `${coupon.amount}% off`;
      const cap = coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : "";
      return discount + cap;
    } else {
      return `₹${coupon.amount} off`;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <Button onClick={() => openDialog()}>
          <FiPlus className="mr-2" /> Add New Coupon
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coupon Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min Purchase</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No coupons found. Create your first coupon!
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon: any) => (
                <TableRow key={coupon._id}>
                  <TableCell className="font-semibold">{coupon.couponCode}</TableCell>
                  <TableCell>{formatCouponDisplay(coupon)}</TableCell>
                  <TableCell>₹{coupon.purchaseAmount || 0}</TableCell>
                  <TableCell>
                    {new Date(coupon.validity).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {coupon.userCount || 0} / {coupon.availableFor || 0}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      coupon.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {coupon.visible ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(coupon)}
                      >
                        <FiEdit className="mr-1" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(coupon._id)}
                      >
                        <FiTrash2 className="mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coupon Code */}
            <div>
              <Label htmlFor="couponCode">Coupon Code *</Label>
              <Input
                id="couponCode"
                name="couponCode"
                value={formData.couponCode}
                onChange={handleInputChange}
                placeholder="e.g., SAVE20"
                className="uppercase"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will be automatically converted to uppercase
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Get 20% off on all products"
                rows={2}
              />
            </div>

            {/* Type and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Discount Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>

                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">
                  {formData.type === "percentage" ? "Percentage Value *" : "Discount Amount *"}
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder={formData.type === "percentage" ? "e.g., 20 (for 20%)" : "e.g., 100 (for ₹100)"}
                  required
                />
              </div>
            </div>

            {/* Max Discount Cap (only for percentage) */}
            {formData.type === "percentage" && (
              <div>
                <Label htmlFor="maxDiscount">Maximum Discount Cap (Optional)</Label>
                <Input
                  id="maxDiscount"
                  name="maxDiscount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={handleInputChange}
                  placeholder="e.g., 500 (max ₹500 discount)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for no cap
                </p>
              </div>
            )}

            {/* Purchase Amount and Available For */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseAmount">Minimum Purchase Amount</Label>
                <Input
                  id="purchaseAmount"
                  name="purchaseAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchaseAmount}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <Label htmlFor="availableFor">Total Usage Limit *</Label>
                <Input
                  id="availableFor"
                  name="availableFor"
                  type="number"
                  min="1"
                  value={formData.availableFor}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                  required
                />
              </div>
            </div>

            {/* Validity */}
            <div>
              <Label htmlFor="validity">Valid Until *</Label>
              <Input
                id="validity"
                name="validity"
                type="date"
                value={formData.validity}
                onChange={handleInputChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="visible">Show in Coupon List</Label>
                  <p className="text-xs text-muted-foreground">
                    Display this coupon to customers
                  </p>
                </div>
                <Switch
                  id="visible"
                  name="visible"
                  checked={formData.visible}
                  onCheckedChange={(checked) =>
                    handleInputChange({
                      target: { name: "visible", type: "checkbox", checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="multiUse">Allow Multiple Uses Per User</Label>
                  <p className="text-xs text-muted-foreground">
                    Users can use this coupon multiple times
                  </p>
                </div>
                <Switch
                  id="multiUse"
                  name="multiUse"
                  checked={formData.multiUse}
                  onCheckedChange={(checked) =>
                    handleInputChange({
                      target: { name: "multiUse", type: "checkbox", checked },
                    })
                  }
                />
              </div>
            </div>

            {/* Preview */}
            {formData.type && formData.amount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Preview:</p>
                <p className="text-lg font-bold text-blue-700">
                  {formData.type === "percentage" 
                    ? `${formData.amount}% off${formData.maxDiscount ? ` (max ₹${formData.maxDiscount})` : ""}`
                    : `₹${formData.amount} off`
                  }
                </p>
                {formData.purchaseAmount && (
                  <p className="text-sm text-blue-600 mt-1">
                    On orders above ₹{formData.purchaseAmount}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Coupons;