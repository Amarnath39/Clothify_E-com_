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
  DialogTrigger,
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

const Coupons = () => {
  const [coupons, setCoupons] = useState<any>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>({
    couponCode: "",
    validity: "",
    type: "",
    amount: "",
    purchaseAmount: "",
    availableFor: "",
    visible: false,
    multiUse: false,
    off: 0,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get("/api/coupon/all");
      setCoupons(response.data.coupon);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await axios.patch(`/api/admin/coupon/${editingCoupon._id}`, formData);
        toast({
          title: "Success",
          description: "Coupon updated successfully",
        });
      } else {
        await axios.post("/api/admin/coupon", formData);
        toast({
          title: "Success",
          description: "Coupon created successfully",
        });
      }
      setIsDialogOpen(false);
      fetchCoupons();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save coupon",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
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

  const openDialog = (coupon: any = null) => {
    setEditingCoupon(coupon);
    if (coupon) {
      setFormData({
        ...coupon,
        validity: new Date(coupon.validity).toISOString().split("T")[0],
      });
    } else {
      setFormData({
        couponCode: "",
        validity: "",
        type: "",
        amount: "",
        purchaseAmount: "",
        availableFor: "",
        visible: false,
        multiUse: false,
        off: 0,
      });
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

  return (
    <div className="container mx-auto p-6">
      
      <h1 className="text-3xl font-bold mb-6">Coupon Management</h1>
      <Button onClick={() => openDialog()} className="mb-4">
        <FiPlus className="mr-2" /> Add New Coupon
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Coupon Code</TableHead>
            <TableHead>Validity</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Purchase Amount</TableHead>
            <TableHead>Available For</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons?.map((coupon: any) => (
            <TableRow key={coupon._id}>
              <TableCell>{coupon.couponCode}</TableCell>
              <TableCell>
                {new Date(coupon.validity).toLocaleDateString()}
              </TableCell>
              <TableCell>{coupon.type}</TableCell>
              <TableCell>{coupon.amount}</TableCell>
              <TableCell>{coupon.purchaseAmount}</TableCell>
              <TableCell>{coupon.availableFor}</TableCell>
              <TableCell>{coupon.visible ? "Yes" : "No"}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog(coupon)}
                  className="mr-2"
                >
                  <FiEdit className="mr-2" /> Edit
                </Button>
                <Button
                 
                  size="sm"
                  onClick={() => handleDelete(coupon._id)}
                >
                  <FiTrash2 className="mr-2" /> Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="couponCode">Coupon Code</Label>
              <Input
                id="couponCode"
                name="couponCode"
                value={formData.couponCode}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="validity">Validity</Label>
              <Input
                id="validity"
                name="validity"
                type="date"
                value={formData.validity}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                name="type"
                value={formData.type}
                onValueChange={(value) =>
                  handleInputChange({ target: { name: "type", value } })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Off</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="off"> Max Off Upto</Label>
              <Input
                id="off"
                name="off"
                type="number"
                value={formData.off}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="purchaseAmount">Purchase Amount</Label>
              <Input
                id="purchaseAmount"
                name="purchaseAmount"
                type="number"
                value={formData.purchaseAmount}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="availableFor">Available For</Label>
              <Input
                id="availableFor"
                name="availableFor"
                type="number"
                value={formData.availableFor}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex items-center space-x-2">
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
              <Label htmlFor="visible">Visible</Label>
            </div>
            <div className="flex items-center space-x-2">
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
              <Label htmlFor="multiUse">Multi-Use</Label>
            </div>
            <Button type="submit">Save Coupon</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Coupons;
