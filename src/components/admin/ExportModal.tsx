"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Button,
    ZapanInput,
    Badge,
    Card,
    SearchInput,
} from "@/theme/components";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FaDownload,
    FaSave,
    FaFilter,
    FaColumns,
    FaCheckCircle,
    FaTimes,
    FaSearch,
    FaTrash,
    FaChevronDown,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { LuLoader } from "react-icons/lu";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: any;
    adminId: string;
}

const AVAILABLE_FIELDS = [
    { id: "orderId", label: "Order ID", category: "Order Info" },
    { id: "totalPrice", label: "Total Price", category: "Payment" },
    { id: "payablePrice", label: "Payable Price", category: "Payment" },
    { id: "paymentStatus", label: "Payment Status", category: "Payment" },
    { id: "paymentMethod", label: "Payment Method", category: "Payment" },
    { id: "payerEmail", label: "Payer Email", category: "Customer" },
    { id: "orderType", label: "Order Type", category: "Order Info" },
    { id: "productCount", label: "Product Count", category: "Order Info" },
    { id: "createdAt", label: "Date Created", category: "Order Info" },
    { id: "currentStatus", label: "Order Status", category: "Order Info" },
    { id: "trackingId", label: "Tracking ID", category: "Shipping" },
    { id: "deliveryPartner", label: "Delivery Partner", category: "Shipping" },
    { id: "shippingAddressName", label: "Customer Name", category: "Customer" },
    { id: "shippingAddressPhone", label: "Customer Phone", category: "Customer" },
    { id: "shippingAddressCity", label: "City", category: "Customer" },
];

const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    currentFilters,
    adminId,
}) => {
    const [presets, setPresets] = useState<any[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<string>("default");
    const [selectedFields, setSelectedFields] = useState<string[]>([
        "orderId",
        "payablePrice",
        "paymentStatus",
        "createdAt",
    ]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [isSavingPreset, setIsSavingPreset] = useState(false);
    const [showSaveAs, setShowSaveAs] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch presets on open
    useEffect(() => {
        if (isOpen && adminId) {
            fetchPresets();
        }
    }, [isOpen, adminId]);

    const fetchPresets = async () => {
        console.log("fetchPresets | Starting fetch with adminId:", adminId);
        try {
            const { data } = await axios.get("/api/admin/export-presets", {
                headers: { "x-admin-id": adminId },
            });
            console.log("fetchPresets | Received data:", data);
            if (data.success) {
                // Ensure all IDs are strings
                const stringifiedPresets = data.presets.map((p: any) => ({
                    ...p,
                    _id: p._id.toString(),
                }));
                console.log("fetchPresets | Setting stringified presets:", stringifiedPresets);
                setPresets(stringifiedPresets);
            }
        } catch (error) {
            console.error("fetchPresets | Failed to fetch presets:", error);
            toast.error("Failed to load presets");
        }
    };

    const handlePresetChange = (presetId: string) => {
        console.log("handlePresetChange | Selected ID:", presetId);
        setSelectedPreset(presetId);
        if (presetId === "default") {
            setSelectedFields(["orderId", "payablePrice", "paymentStatus", "createdAt"]);
        } else {
            const preset = presets.find((p) => p._id.toString() === presetId.toString());
            console.log("handlePresetChange | Found preset:", preset);
            if (preset) {
                setSelectedFields(preset.fields);
            }
        }
    };

    const toggleField = (fieldId: string) => {
        setSelectedFields((prev) =>
            prev.includes(fieldId)
                ? prev.filter((f) => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleExport = async () => {
        if (selectedFields.length === 0) {
            toast.error("Please select at least one field");
            return;
        }

        setIsExporting(true);
        try {
            const response = await axios.post(
                "/api/admin/order/export",
                {
                    filters: currentFilters,
                    fields: selectedFields,
                },
                {
                    responseType: "blob",
                    headers: { "x-admin-id": adminId },
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `orders_export_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Export successful!");
            onClose();
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export data");
        } finally {
            setIsExporting(false);
        }
    };

    const savePreset = async () => {
        if (!newPresetName.trim()) {
            toast.error("Please enter a preset name");
            return;
        }

        setIsSavingPreset(true);
        try {
            const { data } = await axios.post(
                "/api/admin/export-presets",
                {
                    name: newPresetName,
                    fields: selectedFields,
                    filters: currentFilters,
                    createdBy: adminId,
                },
                {
                    headers: { "x-admin-id": adminId },
                }
            );

            if (data.success) {
                toast.success("Preset saved!");
                setShowSaveAs(false);
                setNewPresetName("");
                fetchPresets();
            }
        } catch (error) {
            console.error("Failed to save preset:", error);
            toast.error("Failed to save preset");
        } finally {
            setIsSavingPreset(false);
        }
    };

    const deletePreset = async (e: React.MouseEvent, presetId: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this preset?")) return;

        try {
            const { data } = await axios.delete(`/api/admin/export-presets?id=${presetId}`, {
                headers: { "x-admin-id": adminId },
            });

            if (data.success) {
                toast.success("Preset deleted");
                if (selectedPreset === presetId) {
                    setSelectedPreset("default");
                    setSelectedFields(["orderId", "payablePrice", "paymentStatus", "createdAt"]);
                }
                fetchPresets();
            }
        } catch (error) {
            console.error("Failed to delete preset:", error);
            toast.error("Failed to delete preset");
        }
    };

    const filteredFields = AVAILABLE_FIELDS.filter((f) =>
        f.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = Array.from(new Set(AVAILABLE_FIELDS.map((f) => f.category)));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FaDownload className="text-[#7C1D3E]" size={18} />
                            Export Orders Data
                        </DialogTitle>
                        <p className="text-xs text-gray-500 mt-1">Configure your Excel export with presets or custom fields.</p>
                    </div>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-[500px]">
                    {/* Left: Options & Presets */}
                    <div className="w-full md:w-1/3 p-6 bg-gray-50/50 border-r border-gray-100 space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Preset</label>
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full h-11 px-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs font-bold hover:border-gray-300 transition-all outline-none focus:ring-2 focus:ring-[#7C1D3E]/10"
                                >
                                    <span className="truncate">
                                        {selectedPreset === "default"
                                            ? "System Default"
                                            : presets.find(p => p._id === selectedPreset)?.name || "Select Preset"}
                                    </span>
                                    <FaChevronDown className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} size={12} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 w-64 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin py-2">
                                            {/* System Default */}
                                            <button
                                                onClick={() => {
                                                    handlePresetChange("default");
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-3 ${selectedPreset === "default" ? "text-[#7C1D3E] bg-[#7C1D3E]/5" : "text-gray-700"}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${selectedPreset === "default" ? "bg-[#7C1D3E]" : "bg-transparent"}`} />
                                                System Default
                                            </button>

                                            {/* Custom Presets */}
                                            {presets.map((p) => (
                                                <div
                                                    key={p._id}
                                                    className={`group relative flex items-center transition-colors hover:bg-gray-50 ${selectedPreset === p._id ? "bg-[#7C1D3E]/5" : ""}`}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            handlePresetChange(p._id);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`flex-1 px-4 py-3 text-left text-xs font-bold flex items-center gap-3 ${selectedPreset === p._id ? "text-[#7C1D3E]" : "text-gray-700"}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedPreset === p._id ? "bg-[#7C1D3E]" : "bg-transparent"}`} />
                                                        <span className="truncate">{p.name}</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => deletePreset(e, p._id)}
                                                        className="p-2 mr-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete Preset"
                                                    >
                                                        <FaTrash size={10} />
                                                    </button>
                                                </div>
                                            ))}

                                            {presets.length === 0 && (
                                                <div className="px-4 py-4 text-center">
                                                    <p className="text-[10px] text-gray-400 font-medium italic">No saved presets yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Card className="p-4 bg-white border-dashed">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <FaFilter /> Active Filters
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500">Search:</span>
                                    <span className="text-gray-900 font-bold">{currentFilters.search || "None"}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500">Payment:</span>
                                    <Badge variant="brand" className="text-[9px] py-0 px-1.5">{currentFilters.paymentStatus || "All"}</Badge>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500">Status:</span>
                                    <span className="text-gray-900 font-bold">{currentFilters.orderStatus || "All"}</span>
                                </div>
                            </div>
                        </Card>

                        {!showSaveAs ? (
                            <Button
                                variant="outline"
                                className="w-full h-11 rounded-xl text-xs font-bold gap-2"
                                onClick={() => setShowSaveAs(true)}
                            >
                                <FaSave /> Save as New Preset
                            </Button>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <ZapanInput
                                    placeholder="Preset Name..."
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    className="h-10 text-xs"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        className="flex-1 h-9 text-[10px]"
                                        onClick={savePreset}
                                        disabled={isSavingPreset}
                                    >
                                        {isSavingPreset ? <LuLoader className="animate-spin" /> : "Save"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-9 text-[10px]"
                                        onClick={() => setShowSaveAs(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Field Selection */}
                    <div className="flex-1 p-6 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Columns ({selectedFields.length})</label>
                            <div className="flex gap-2">
                                <button
                                    className="text-[10px] font-bold text-[#7C1D3E] hover:underline"
                                    onClick={() => setSelectedFields(AVAILABLE_FIELDS.map(f => f.id))}
                                >
                                    Select All
                                </button>
                                <button
                                    className="text-[10px] font-bold text-gray-400 hover:underline"
                                    onClick={() => setSelectedFields([])}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="relative mb-4">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                            <input
                                type="text"
                                placeholder="Search columns..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#7C1D3E]/20 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                            <div className="space-y-6">
                                {categories.map((cat) => {
                                    const fields = filteredFields.filter((f) => f.category === cat);
                                    if (fields.length === 0) return null;
                                    return (
                                        <div key={cat} className="space-y-2">
                                            <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{cat}</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                {fields.map((field) => (
                                                    <div
                                                        key={field.id}
                                                        onClick={() => toggleField(field.id)}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedFields.includes(field.id)
                                                            ? "bg-[#7C1D3E]/5 border-[#7C1D3E]/30 text-[#7C1D3E]"
                                                            : "bg-white border-gray-100 hover:border-gray-200 text-gray-600"
                                                            }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedFields.includes(field.id)
                                                            ? "bg-[#7C1D3E] border-[#7C1D3E] text-white"
                                                            : "bg-gray-50 border-gray-200 text-transparent"
                                                            }`}>
                                                            <FaCheckCircle size={10} />
                                                        </div>
                                                        <span className="text-xs font-bold">{field.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-medium">Your data will be exported as .xlsx for Microsoft Excel.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-11 px-6 rounded-xl" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            className="h-11 px-8 rounded-xl shadow-lg shadow-[#7C1D3E]/20"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <>
                                    <LuLoader className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FaDownload />
                                    Export to Excel
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExportModal;
