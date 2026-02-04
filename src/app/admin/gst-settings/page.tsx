"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Category {
    _id: string;
    name: string;
    gst: number;
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

    const handleUpdate = async (id: string, newGst: number) => {
        setUpdating(id);
        try {
            await axios.patch("/api/admin/gst-settings", {
                categoryId: id,
                gst: newGst,
            });
            toast.success("GST updated successfully");
            fetchCategories(); // Refresh
        } catch (error) {
            toast.error("Failed to update GST");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">GST Settings</h1>
            <p className="text-gray-600 mb-6">
                Set GST percentages for each category. This will be applied to POS orders.
            </p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 font-semibold uppercase text-sm text-gray-600">Category Name</th>
                            <th className="p-4 font-semibold uppercase text-sm text-gray-600">Current GST %</th>
                            <th className="p-4 font-semibold uppercase text-sm text-gray-600">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="p-4 text-center">Loading...</td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-4 text-center">No categories found</td>
                            </tr>
                        ) : (
                            categories.map((cat) => (
                                <GSTRow key={cat._id} category={cat} onUpdate={handleUpdate} updating={updating === cat._id} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GSTRow = ({ category, onUpdate, updating }: { category: Category; onUpdate: (id: string, gst: number) => void; updating: boolean }) => {
    const [gstValue, setGstValue] = useState(category.gst || 0);
    const hasChanged = gstValue !== (category.gst || 0);

    return (
        <tr className="hover:bg-gray-50">
            <td className="p-4 font-medium">{category.name}</td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min="0"
                        max="100"
                        value={gstValue}
                        onChange={(e) => setGstValue(Number(e.target.value))}
                        className="w-24"
                    />
                    <span>%</span>
                </div>
            </td>
            <td className="p-4">
                <Button
                    size="sm"
                    onClick={() => onUpdate(category._id, gstValue)}
                    disabled={updating || !hasChanged}
                    className={hasChanged ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}
                >
                    {updating ? "Saving..." : "Update"}
                </Button>
            </td>
        </tr>
    );
};

export default GSTSettingsPage;
