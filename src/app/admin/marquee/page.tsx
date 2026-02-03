"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
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
        } catch (error: any) {
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

    // Preview text
    const previewText = marqueeEntries.map(e => e.text).join(" | ");

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Marquee Text Management</h1>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="bg-black text-white hover:bg-gray-800"
                        onClick={() => setIsEditing(false)}
                    >
                        <FiPlus className="mr-2" /> Add New Entry
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Edit Marquee Entry" : "Create Marquee Entry"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <Input
                                type="text"
                                name="text"
                                placeholder="Enter marquee text (e.g., Free Shipping on Orders Above ₹5,000)"
                                defaultValue={selectedEntry?.text || ""}
                            />
                            <Button
                                className="bg-black text-white hover:bg-black"
                                type="submit"
                            >
                                {isEditing ? "Update" : "Create"} Entry
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Entries List */}
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {marqueeEntries.map((entry) => (
                    <Card key={entry._id}>
                        <CardHeader>
                            <CardTitle className="text-sm">Marquee Entry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{entry.text}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => handleEdit(entry)}>
                                <FiEdit2 className="mr-2" /> Edit
                            </Button>
                            <Button
                                className="bg-black text-white hover:bg-gray-800"
                                onClick={() => handleDelete(entry._id)}
                            >
                                <FiTrash2 className="mr-2" /> Delete
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AdminMarquee;
