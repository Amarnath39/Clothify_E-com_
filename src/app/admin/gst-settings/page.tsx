"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    PageHeader,
    Card,
    Button,
    ZapanInput,
    Badge
} from "@/theme/components";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    FiPercent,
    FiSave,
    FiSettings,
    FiHash
} from "react-icons/fi";
import { LuLoader } from "react-icons/lu";

interface Category {
    _id: string;
    name: string;
    gst: number;
    hsnCode: string | null;
}

const GSTSettingsPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get("/api/admin/gst-settings");
            if (res.data.success) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            toast.error("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string, newGst: number, newHsnCode: string | null) => {
        setUpdating(id);
        try {
            await axios.patch("/api/admin/gst-settings", {
                categoryId: id,
                gst: newGst,
                hsnCode: newHsnCode,
            });
            toast.success("Settings updated successfully");
            fetchCategories(); // Refresh
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="GST Settings"
                description="Configure tax percentages for product categories applied during checkout."
            />

            <Card className="overflow-hidden border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="overflow-x-auto scrollbar-thin">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b border-gray-100">
                                <TableHead className="py-4 px-8">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <FiHash size={12} />
                                        Category Name
                                    </div>
                                </TableHead>
                                <TableHead className="py-4 px-8 text-center border-x border-gray-100/50">
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <FiPercent size={12} />
                                        Tax Rate (%)
                                    </div>
                                </TableHead>
                                <TableHead className="py-4 px-8 text-center">
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <FiHash size={12} />
                                        HSN Code
                                    </div>
                                </TableHead>
                                <TableHead className="py-4 px-8 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-20 text-center">
                                        <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E] mx-auto" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Loading Tax Tiers...</p>
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-20 text-center text-gray-400">
                                        <FiSettings className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        <p className="font-bold text-sm">No categories mapped for tax calculation.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat) => (
                                    <GSTRow
                                        key={cat._id}
                                        category={cat}
                                        onUpdate={handleUpdate}
                                        updating={updating === cat._id}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

const GSTRow = ({ category, onUpdate, updating }: { category: Category; onUpdate: (id: string, gst: number, hsn: string | null) => void; updating: boolean }) => {
    const [gstValue, setGstValue] = useState(category.gst || 0);
    const [hsnValue, setHsnValue] = useState(category.hsnCode || "");
    const hasChanged = gstValue !== (category.gst || 0) || hsnValue !== (category.hsnCode || "");

    return (
        <TableRow className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0 text-black">
            <TableCell className="py-5 px-8">
                <div>
                    <p className="font-black text-gray-900">{category.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">ID: {category._id.slice(-6)}</p>
                </div>
            </TableCell>
            <TableCell className="py-5 px-8 border-x border-gray-100/50">
                <div className="flex justify-center">
                    <div className="relative w-28 group">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={gstValue}
                            onChange={(e) => setGstValue(Number(e.target.value))}
                            className="w-full h-11 text-center font-black bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 focus:border-[#7C1D3E]/50 transition-all text-sm pr-6"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">%</span>
                    </div>
                </div>
            </TableCell>
            <TableCell className="py-5 px-8">
                <div className="flex justify-center">
                    <div className="relative w-36 group">
                        <input
                            type="text"
                            placeholder="NULL"
                            value={hsnValue}
                            onChange={(e) => setHsnValue(e.target.value)}
                            className="w-full h-11 text-center font-black bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 focus:border-[#7C1D3E]/50 transition-all text-sm px-4"
                        />
                    </div>
                </div>
            </TableCell>
            <TableCell className="py-5 px-8 text-right">
                <Button
                    size="sm"
                    onClick={() => onUpdate(category._id, gstValue, hsnValue || null)}
                    disabled={updating || !hasChanged}
                    className={`h-11 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${hasChanged
                        ? "bg-[#7C1D3E] text-white shadow-lg shadow-[#7C1D3E]/20"
                        : "bg-gray-100 text-gray-400 opacity-50"
                        }`}
                >
                    {updating ? (
                        <LuLoader className="animate-spin" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <FiSave size={14} />
                            Update
                        </div>
                    )}
                </Button>
            </TableCell>
        </TableRow>
    );
};

export default GSTSettingsPage;
