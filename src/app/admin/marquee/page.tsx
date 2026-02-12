"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, ZapanInput, PageHeader, Card as ZapanCard, Badge } from "@/theme/components";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FiPlus, FiEdit2, FiTrash2, FiMessageSquare, FiVolume2 } from "react-icons/fi";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useSelector, useDispatch } from "react-redux";
import { getMarqueeText } from "@/lib/features/marquee";

interface MarqueeEntry {
    _id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
}

const AdminMarquee: React.FC = () => {
    const dispatch = useDispatch<any>();
    const { entries } = useSelector((state: any) => state.marquee);
    const { user } = useSelector((state: any) => state.auth);
    const [marqueeEntries, setMarqueeEntries] = useState<MarqueeEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<MarqueeEntry | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, []);

    useEffect(() => {
        if (entries) {
            setMarqueeEntries(entries);
        }
    }, [entries]);

    const fetchEntries = async () => {
        await dispatch(getMarqueeText());
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const text = formData.get("text") as string;

        if (!text?.trim()) {
            toast.error("Marquee text cannot be empty");
            return;
        }

        try {
            setLoading(true);
            if (isEditing && selectedEntry) {
                await axios.patch(
                    `/api/admin/marquee/${selectedEntry._id}`,
                    { text },
                    {
                        headers: {
                            "x-admin-id": user._id,
                        },
                    }
                );
                toast.success("Marquee entry updated successfully");
            } else {
                await axios.post(
                    "/api/admin/marquee",
                    { text },
                    {
                        headers: {
                            "x-admin-id": user._id,
                        },
                    }
                );
                toast.success("Marquee entry created successfully");
            }
            fetchEntries();
            setIsEditing(false);
            setSelectedEntry(null);
            setIsModalOpen(false);
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            toast.error(error.response?.data?.msg || "Failed to save marquee entry");
        }
    };

    const handleEdit = (entry: MarqueeEntry) => {
        setSelectedEntry(entry);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this marquee entry?"
        );
        if (confirmDelete) {
            try {
                await axios.delete(`/api/admin/marquee/${id}`, {
                    headers: {
                        "x-admin-id": user._id,
                    },
                });
                toast.success("Marquee entry deleted successfully");
                fetchEntries();
            } catch (error: any) {
                toast.error(error.response?.data?.msg || "Failed to delete marquee entry");
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedEntry(null);
        setIsEditing(false);
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <PageHeader
                title="Marquee Announcements"
                description="Manage scrolling announcements visible across your store."
                action={
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => setIsEditing(false)}
                                className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B] text-white shadow-lg shadow-[#7C1D3E]/20 hover:scale-105 transition-all font-black uppercase tracking-widest text-xs"
                            >
                                <FiPlus className="mr-2" size={16} /> New Announcement
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8 border-gray-100">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-gray-900 text-center">
                                    {isEditing ? "Edit Announcement" : "Create Announcement"}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                                <div className="space-y-2">
                                    <ZapanInput
                                        type="text"
                                        label="Announcement Text"
                                        name="text"
                                        placeholder="E.g., Free Shipping on Orders Above ₹5,000"
                                        defaultValue={selectedEntry?.text || ""}
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-gray-400 pl-1">This text will scroll horizontally at the top of your store.</p>
                                </div>
                                <Button
                                    className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : (isEditing ? "Update Announcement" : "Publish Announcement")}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            {marqueeEntries.length === 0 ? (
                <ZapanCard className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                        <FiVolume2 size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Announcements</h3>
                    <p className="text-gray-500 mb-8 max-w-xs">Create your first scrolling announcement to inform customers about offers and updates.</p>
                </ZapanCard>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {marqueeEntries.map((entry) => (
                        <ZapanCard key={entry._id} className="group relative overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex-1 p-6 space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center mb-2">
                                    <FiMessageSquare size={20} />
                                </div>
                                <p className="text-lg font-medium text-gray-900 leading-relaxed">
                                    "{entry.text}"
                                </p>
                                <div className="text-xs text-gray-400 font-mono pt-2 border-t border-gray-50">
                                    Created: {new Date(entry.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 flex justify-between items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)} className="flex-1 text-gray-600 hover:text-[#7C1D3E] hover:bg-[#7C1D3E]/10">
                                    <FiEdit2 className="mr-2" /> Edit
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(entry._id)}
                                    className="flex-1"
                                >
                                    <FiTrash2 className="mr-2" /> Delete
                                </Button>
                            </div>
                        </ZapanCard>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminMarquee;
