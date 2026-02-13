"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTag,
  FiClock,
  FiEye,
  FiEyeOff,
  FiZap,
  FiShoppingBag,
  FiCalendar
} from "react-icons/fi";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  ZapanInput,
  ZapanTextarea,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { LuLoader } from "react-icons/lu";

const Coupons = () => {
  const [coupons, setCoupons] = useState<any>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<any>({
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

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/coupon/all");
      setCoupons(response.data.coupon || []);
    } catch (error) {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.couponCode || !formData.validity || !formData.type || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        couponCode: formData.couponCode.toUpperCase(),
        description: formData.description || "",
        validity: formData.validity,
        type: formData.type,
        amount: parseFloat(formData.amount) || 0,
        maxDiscount: formData.type === "percentage" && formData.maxDiscount
          ? parseFloat(formData.maxDiscount)
          : null,
        purchaseAmount: parseFloat(formData.purchaseAmount) || 0,
        availableFor: parseInt(formData.availableFor) || 1,
        visible: formData.visible,
        multiUse: formData.multiUse,
        categories: [],
        off: "0",
      };

      if (editingCoupon) {
        await axios.patch(`/api/admin/coupon/${editingCoupon._id}`, payload);
        toast.success("Coupon updated successfully");
      } else {
        await axios.post("/api/admin/coupon", payload);
        toast.success("Coupon created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Failed to save coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await axios.delete(`/api/admin/coupon/${id}`);
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } catch (error) {
        toast.error("Failed to delete coupon");
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

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const formatCouponDisplay = (coupon: any) => {
    if (coupon.type === "percentage") {
      const discount = `${coupon.amount}% OFF`;
      const cap = coupon.maxDiscount ? ` (Up to ₹${coupon.maxDiscount})` : "";
      return discount + cap;
    } else {
      return `₹${coupon.amount} OFF`;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Promo Codes"
        description="Drive growth with high-converting discounts and multi-tiered coupons."
        action={
          <Button variant="primary" className="h-11 px-6 rounded-xl shadow-lg shadow-[#7C1D3E]/30" onClick={() => openDialog()}>
            <FiPlus className="mr-2" size={18} /> New Promotion
          </Button>
        }
      />

      <Card className="overflow-hidden border-gray-100 shadow-xl shadow-gray-200/40">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b border-gray-100">
                <TableHead className="py-5 px-8">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <FiTag size={12} /> Coupon Identity
                  </div>
                </TableHead>
                <TableHead className="py-5 px-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <FiZap size={12} /> Offer Value
                  </div>
                </TableHead>
                <TableHead className="py-5 px-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <FiShoppingBag size={12} /> Min. Spend
                  </div>
                </TableHead>
                <TableHead className="py-5 px-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <FiCalendar size={12} /> Expiration
                  </div>
                </TableHead>
                <TableHead className="py-5 px-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Utilization
                  </div>
                </TableHead>
                <TableHead className="py-5 px-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Exposure
                  </div>
                </TableHead>
                <TableHead className="py-5 px-8 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Management
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <LuLoader className="w-10 h-10 animate-spin text-[#7C1D3E] mx-auto" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6">Decoding Active Promos...</p>
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-32 text-gray-400">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                      <FiTag size={32} />
                    </div>
                    <p className="font-bold text-gray-600">No active campaigns found.</p>
                    <p className="text-xs mt-1">Start your first promotion to drive sales.</p>
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon: any) => (
                  <TableRow key={coupon._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0 text-black">
                    <TableCell className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#7C1D3E]/5 flex items-center justify-center text-[#7C1D3E] border border-[#7C1D3E]/10 group-hover:bg-[#7C1D3E] group-hover:text-white transition-all shadow-sm">
                          <FiTag size={20} />
                        </div>
                        <div>
                          <span className="font-black text-gray-900 tracking-widest text-sm block">{coupon.couponCode}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{coupon.description || 'Global Campaign'}</span>
                        </div>
                      </div>
                    </TableCell>  
                    <TableCell className="py-5 px-8 text-center">
                      <div className="flex justify-center">
                        <span className="h-7 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center min-w-[80px]">
                          {formatCouponDisplay(coupon)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-gray-900">₹{coupon.purchaseAmount || 0}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Threshold</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-gray-900">{new Date(coupon.validity).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest mt-0.5 flex items-center gap-1"><FiClock size={10} /> Valid Until</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-center">
                          <p className="text-sm font-black text-gray-900">{coupon.userCount || 0}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Redeemed</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100"></div>
                        <div className="text-center text-black">
                          <p className="text-sm font-black text-gray-900">{coupon.availableFor === 2147483647 ? '∞' : coupon.availableFor || '∞'}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cap</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-center">
                      {coupon.visible ? (
                        <div className="flex flex-col items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] flex items-center gap-1">Publicly Discoverable</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 opacity-40">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-1">Exclusive Link Only</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(coupon)}
                          className="h-10 w-10 p-0 rounded-xl bg-gray-50 text-gray-400 hover:text-[#7C1D3E] hover:bg-[#7C1D3E]/10"
                        >
                          <FiEdit size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(coupon._id)}
                          className="h-10 w-10 p-0 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <FiTrash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#7C1D3E] p-10 text-white relative">
            <DialogTitle className="text-3xl font-black">{editingCoupon ? "Modify Promo" : "Launch Promo"}</DialogTitle>
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mt-2">{editingCoupon ? "Updating campaign parameters" : "Craft your next viral marketing offer"}</p>
            <div className="absolute top-10 right-10 w-14 h-14 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <FiTag className="transform -rotate-12" size={30} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ZapanInput
                label="Coupon Secret Code *"
                name="couponCode"
                value={formData.couponCode}
                onChange={handleInputChange}
                placeholder="E.g. VEDA2025"
                className="text-lg tracking-widest uppercase h-14"
                required
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Reward Mechanism *</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev: any) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50 font-black text-sm text-gray-900 border-2 focus:ring-[#7C1D3E]/20">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100 shadow-xl z-[99999]" position="popper" sideOffset={5}>
                    <SelectItem value="percentage" className="font-bold py-3">Percentage (%) Calculation</SelectItem>
                    <SelectItem value="flat" className="font-bold py-3">Flat Value (₹) Rebate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ZapanTextarea
              label="Campaign Headline"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="h-24"
              placeholder="Why should customers use this? (e.g., Opening celebration offer)"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ZapanInput
                label={formData.type === "percentage" ? "Percentage Multiplier *" : "Rebate Amount *"}
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                className="h-14 font-black text-xl text-[#7C1D3E]"
                placeholder={formData.type === "percentage" ? "E.g. 15" : "E.g. 1000"}
                required
              />
              {formData.type === "percentage" && (
                <ZapanInput
                  label="Liability Cap"
                  name="maxDiscount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={handleInputChange}
                  className="h-14 border-dashed"
                  placeholder="Maximum possible discount (₹)"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ZapanInput
                label="Minimum Order Basket"
                name="purchaseAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchaseAmount}
                onChange={handleInputChange}
                className="h-14"
                placeholder="₹ 0.00"
              />
              <ZapanInput
                label="Total Redemption Pool *"
                name="availableFor"
                type="number"
                min="1"
                value={formData.availableFor}
                onChange={handleInputChange}
                className="h-14"
                placeholder="2147483647"
                required
              />
            </div>

            <ZapanInput
              label="Campaign Expiry Cutoff *"
              name="validity"
              type="date"
              value={formData.validity}
              onChange={handleInputChange}
              className="h-14"
              min={new Date().toISOString().split("T")[0]}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 group transition-all hover:bg-white hover:border-[#7C1D3E]/20">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-900 uppercase tracking-widest block">Public Display</label>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Visible on cart page</p>
                </div>
                <Switch
                  checked={formData.visible}
                  onCheckedChange={(checked) => handleInputChange({ target: { name: "visible", type: "checkbox", checked } })}
                  className="data-[state=checked]:bg-[#7C1D3E]"
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 group transition-all hover:bg-white hover:border-[#7C1D3E]/20">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-900 uppercase tracking-widest block">Multiple Uses</label>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Repeat users allowed</p>
                </div>
                <Switch
                  checked={formData.multiUse}
                  onCheckedChange={(checked) => handleInputChange({ target: { name: "multiUse", type: "checkbox", checked } })}
                  className="data-[state=checked]:bg-[#7C1D3E]"
                />
              </div>
            </div>

            {formData.type && formData.amount && (
              <div className="bg-[#7C1D3E] rounded-[2rem] p-8 text-center shadow-2xl shadow-[#7C1D3E]/30 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.3em] mb-3">Live Discount Preview</p>
                <h4 className="text-5xl font-black text-white">
                  {formData.type === "percentage"
                    ? `${formData.amount}% OFF`
                    : `₹${formData.amount} OFF`
                  }
                </h4>
                {formData.maxDiscount && formData.type === 'percentage' && (
                  <p className="text-[10px] text-white/50 mt-2 font-black uppercase tracking-widest italic">Capping liability at ₹{formData.maxDiscount}</p>
                )}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">
                    Applies on checkout for baskets above <span className="text-white text-lg font-black ml-1">₹{formData.purchaseAmount || 0}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 pb-2">
              <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-black text-gray-400 border border-gray-100" onClick={() => setIsDialogOpen(false)}>Discard</Button>
              <Button type="submit" variant="primary" className="flex-[2] h-14 rounded-2xl font-black text-xl shadow-2xl shadow-[#7C1D3E]/40">
                {editingCoupon ? "Finalize Updates" : "Deploy Campaign"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Coupons;
