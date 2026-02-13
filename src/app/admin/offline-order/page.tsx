"use client";

import React, { useState } from "react";
import { ZapanInput, ZapanTextarea, PageHeader, Card as ZapanCard, Badge } from "@/theme/components";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
    FiUser,
    FiBox,
    FiCreditCard,
    FiTruck,
    FiSearch,
    FiTrash2,
    FiPlus,
    FiExternalLink,
    FiCheckCircle,
    FiAlertCircle
} from "react-icons/fi";
import { indianStates } from "@/app/profile/state";

interface Product {
    _id: string;
    name: string;
    sku: string;
    img: string[];
    actualPrice: number;
    sizes: Array<{
        _id: string;
        size: string;
        stock: number;
        offerPrice: number;
    }>;
}

interface SelectedProduct {
    product: Product;
    selectedSize: string;
    quantity: number;
}

const CreateOfflineOrderPage = () => {
    const router = useRouter();
    const { user } = useSelector((state: any) => state.auth);

    // Customer Details State
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");

    // Billing Address
    const [billingAddress, setBillingAddress] = useState("");
    const [billingCity, setBillingCity] = useState("");
    const [billingState, setBillingState] = useState("");
    const [billingZipCode, setBillingZipCode] = useState("");

    // Shipping Address
    const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
    const [shippingName, setShippingName] = useState("");
    const [shippingPhone, setShippingPhone] = useState("");
    const [shippingAddress, setShippingAddress] = useState("");
    const [shippingCity, setShippingCity] = useState("");
    const [shippingState, setShippingState] = useState("");
    const [shippingZipCode, setShippingZipCode] = useState("");

    // Product Selection
    const [productSearch, setProductSearch] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
        []
    );
    const [isSearching, setIsSearching] = useState(false);

    // Payment
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [paymentStatus, setPaymentStatus] = useState("Paid");

    // Auto-update status when mode changes
    React.useEffect(() => {
        if (paymentMode === "RAZORPAY_LINK") {
            setPaymentStatus("Pending");
        }
    }, [paymentMode]);

    // Shipping
    const [shippingMethod, setShippingMethod] = useState("MANUAL");
    const [shippingCost, setShippingCost] = useState(0);

    // DTDC Details
    const [dtdcPickupPincode, setDtdcPickupPincode] = useState("695573");
    const [dtdcDeliveryPincode, setDtdcDeliveryPincode] = useState("");
    const [dtdcWeight, setDtdcWeight] = useState("");
    const [dtdcLength, setDtdcLength] = useState("1");
    const [dtdcBreadth, setDtdcBreadth] = useState("1");
    const [dtdcHeight, setDtdcHeight] = useState("1");

    // Manual Shipping
    const [manualCourierName, setManualCourierName] = useState("");
    const [manualTrackingNumber, setManualTrackingNumber] = useState("");

    // Notifications
    const [sendEmail, setSendEmail] = useState(true);
    const [sendWhatsApp, setSendWhatsApp] = useState(true);

    // Loading
    const [isSubmitting, setIsSubmitting] = useState(false);

    // RAZORPAY LINK STATE
    const [paymentLinkData, setPaymentLinkData] = useState<any>(null);
    const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState("");

    // ✅ Search Products
    const handleProductSearch = async () => {
        if (!productSearch.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Use public products API with search parameter
            const response = await axios.get("/api/products", {
                params: { search: productSearch },
            });

            if (response.data.success) {
                // Limit to 10 results for better UX
                const products = (response.data.products || []).slice(0, 10);
                setSearchResults(products);
            } else {
                toast.error("Failed to search products");
            }
        } catch (error) {
            console.error("Product search error:", error);
            toast.error("Error searching products");
        } finally {
            setIsSearching(false);
        }
    };

    // ✅ 📡 Poll for Payment Confirmation (Replaces SSE)
    React.useEffect(() => {
        let pollTimer: NodeJS.Timeout;

        if (isWaitingForPayment && createdOrderId) {
            console.log(`📡 Polling for payment updates for ${createdOrderId}...`);

            pollTimer = setInterval(async () => {
                try {
                    const { data } = await axios.get(`/api/admin/order/${createdOrderId}`, {
                        headers: { "x-admin-id": user?._id || localStorage.getItem("adminId") }
                    });

                    if (data.success && data.order) {
                        const status = data.order.paymentStatus;
                        console.log(`🔄 Poll Status: ${status}`);

                        if (status === "PAYMENT_SUCCESS") {
                            toast.success("Payment Received!");
                            setPaymentLinkData(null);
                            setIsWaitingForPayment(false);
                            router.push(`/admin/get-orders`);
                        }
                    }
                } catch (error) {
                    console.error("Polling error:", error);
                    // Don't stop polling on transient errors
                }
            }, 3000); // Poll every 3 seconds
        }

        return () => {
            if (pollTimer) clearInterval(pollTimer);
        };
    }, [isWaitingForPayment, createdOrderId, router, user]);

    // ✅ Add Product to Order
    const handleAddProduct = (product: Product, sizeId: string, quantity: number) => {
        if (!sizeId || quantity < 1) {
            toast.error("Please select size and quantity");
            return;
        }

        const size = product.sizes.find((s) => s._id === sizeId);
        if (!size) {
            toast.error("Invalid size selected");
            return;
        }

        if (size.stock < quantity) {
            toast.error(`Only ${size.stock} items in stock`);
            return;
        }

        setSelectedProducts([
            ...selectedProducts,
            { product, selectedSize: sizeId, quantity },
        ]);
        setProductSearch("");
        setSearchResults([]);
        toast.success("Product added");
    };

    // ✅ Remove Product
    const handleRemoveProduct = (index: number) => {
        setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    };

    // ✅ Calculate Totals
    const calculateTotals = () => {
        let subtotal = 0;
        selectedProducts.forEach((item) => {
            const size = item.product.sizes.find((s) => s._id === item.selectedSize);
            const price = size?.offerPrice || item.product.actualPrice;
            subtotal += price * item.quantity;
        });

        const total = subtotal + shippingCost;

        return { subtotal, total };
    };

    const { subtotal, total } = calculateTotals();

    // ✅ Submit Order
    const handleSubmitOrder = async () => {
        // Validation
        const phoneRegex = /^[0-9]{10}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!customerName || !customerPhone) {
            toast.error("Customer name and phone are required");
            return;
        }

        if (!phoneRegex.test(customerPhone)) {
            toast.error("Invalid phone number. Must be 10 digits.");
            return;
        }

        if (customerEmail && !emailRegex.test(customerEmail)) {
            toast.error("Invalid email address format.");
            return;
        }

        if (!billingAddress || !billingCity || !billingState || !billingZipCode) {
            toast.error("Complete billing address is required");
            return;
        }

        if (selectedProducts.length === 0) {
            toast.error("Please add at least one product");
            return;
        }

        if (shippingMethod === "DTDC" && !dtdcDeliveryPincode) {
            toast.error("DTDC delivery pincode is required");
            return;
        }

        if (shippingMethod === "MANUAL" && !manualCourierName) {
            toast.error("Courier name is required for manual shipping");
            return;
        }

        setIsSubmitting(true);

        try {
            const shippingAddr = shippingSameAsBilling
                ? {
                    name: customerName,
                    phone: customerPhone,
                    address: billingAddress,
                    city: billingCity,
                    state: billingState,
                    zipCode: billingZipCode,
                    country: "India",
                }
                : {
                    name: shippingName || customerName,
                    phone: shippingPhone || customerPhone,
                    address: shippingAddress,
                    city: shippingCity,
                    state: shippingState,
                    zipCode: shippingZipCode,
                    country: "India",
                };

            const payload = {
                customerDetails: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    billingAddress: {
                        name: customerName,
                        phone: customerPhone,
                        address: billingAddress,
                        city: billingCity,
                        state: billingState,
                        zipCode: billingZipCode,
                        country: "India",
                    },
                    shippingAddress: shippingAddr,
                },
                productDetails: selectedProducts.map((item) => ({
                    product: item.product._id,
                    size: item.selectedSize,
                    count: item.quantity,
                })),
                paymentMode,
                paymentStatus,
                shippingMethod,
                shippingCost,
                dtdcDetails:
                    shippingMethod === "DTDC"
                        ? {
                            pickupPincode: dtdcPickupPincode,
                            deliveryPincode: dtdcDeliveryPincode,
                            weight: dtdcWeight,
                            length: dtdcLength,
                            breadth: dtdcBreadth,
                            height: dtdcHeight,
                        }
                        : undefined,
                manualShipping:
                    shippingMethod === "MANUAL"
                        ? {
                            courierName: manualCourierName,
                            trackingNumber: manualTrackingNumber,
                        }
                        : undefined,
                sendEmail,
                sendWhatsApp,
            };

            const response = await axios.post("/api/admin/offline-order", payload, {
                headers: { "x-admin-id": user?._id || localStorage.getItem("adminId") }
            });

            if (response.data.success) {
                if (response.data.paymentLink) {
                    // 🚀 Show Payment Link Modal
                    setCreatedOrderId(response.data.orderId);
                    setPaymentLinkData(response.data.paymentLink);
                    setIsWaitingForPayment(true);
                    toast.success("Payment Link Generated!");
                } else {
                    toast.success("Offline order created successfully!");
                    router.push(`/admin/get-orders`);
                }
            } else {
                toast.error(response.data.msg || "Failed to create order");
            }
        } catch (error: any) {
            console.error("Order creation error:", error);
            toast.error(
                error.response?.data?.msg || "Error creating offline order"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ Copy Link Helper
    const copyToClipboard = () => {
        if (paymentLinkData?.url) {
            navigator.clipboard.writeText(paymentLinkData.url);
            toast.success("Link copied!");
        }
    };


    // 🟢 RENDER PAYMENT LINK MODAL
    if (paymentLinkData) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                <ZapanCard className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl border-gray-100 p-8 rounded-[2.5rem]">
                    <div className="text-center pb-6 border-b border-gray-100">
                        <div className="mx-auto bg-blue-50 p-4 rounded-2xl w-20 h-20 flex items-center justify-center mb-4 shadow-inner">
                            <FiCreditCard className="text-blue-600 text-3xl" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Payment Link Generated</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{createdOrderId}</p>
                    </div>
                    <div className="space-y-6 pt-6">
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount Due</p>
                            <p className="text-4xl font-black text-emerald-600 tracking-tighter">₹{total.toFixed(2)}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 group hover:bg-white hover:shadow-lg transition-all">
                            <input
                                readOnly
                                value={paymentLinkData.url}
                                className="flex-1 bg-transparent border-none text-xs font-mono text-gray-600 focus:outline-none w-full"
                            />
                            <Button size="sm" onClick={copyToClipboard} className="bg-white text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 rounded-xl px-4 py-1 h-8 text-[10px] font-black uppercase tracking-widest">
                                Copy
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-3 text-blue-600">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Customer Action...</span>
                            </div>
                            <p className="text-[10px] text-center text-gray-400 font-medium">
                                The dashboard will automatically synchronize upon payment confirmation.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-200 hover:bg-gray-50"
                                onClick={() => {
                                    if (window.confirm("Payment is still pending. Leave this page?")) {
                                        router.push('/admin/get-orders');
                                    }
                                }}
                            >
                                Defer & Exit
                            </Button>
                        </div>
                    </div>
                </ZapanCard>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <PageHeader
                title="Create Offline Order"
                description="Manually generate orders for offline customers or special requests."
                action={
                    <Badge variant="brand">
                        Admin Protocol
                    </Badge>
                }
            />

            {/* 1️⃣ CUSTOMER DETAILS */}
            <ZapanCard className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                        <FiUser size={20} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Customer Identity</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ZapanInput
                        label="Full Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        required
                    />
                    <ZapanInput
                        label="Phone Number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter phone number"
                        required
                    />
                    <ZapanInput
                        label="Email Address"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Enter email (optional)"
                    />
                </div>

                <div className="h-px bg-gray-100 my-8"></div>

                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Billing Coordinates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                        <ZapanTextarea
                            label="Billing Address"
                            value={billingAddress}
                            onChange={(e) => setBillingAddress(e.target.value)}
                            placeholder="Enter full billing address"
                            required
                        />
                    </div>
                    <ZapanInput
                        label="City"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder="City"
                        required
                    />
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">State</label>
                        <Select value={billingState} onValueChange={setBillingState}>
                            <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl px-6 focus:ring-2 focus:ring-[#7C1D3E]/20 transition-all">
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {indianStates.map((state) => (
                                    <SelectItem key={state} value={state}>
                                        {state}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <ZapanInput
                        label="Pincode"
                        value={billingZipCode}
                        onChange={(e) => setBillingZipCode(e.target.value)}
                        placeholder="ZIP Code"
                        required
                    />
                </div>

                <div className="h-px bg-gray-100 my-8"></div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-8">
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Replicate billing for shipping</span>
                    <Checkbox
                        checked={shippingSameAsBilling}
                        onCheckedChange={(checked) =>
                            setShippingSameAsBilling(checked as boolean)
                        }
                        className="border-gray-300"
                    />
                </div>

                {!shippingSameAsBilling && (
                    <div className="animate-in slide-in-from-top-4 duration-500">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Shipping Coordinates</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ZapanInput
                                label="Recipient Name"
                                value={shippingName}
                                onChange={(e) => setShippingName(e.target.value)}
                                placeholder="Recipient name"
                            />
                            <ZapanInput
                                label="Recipient Phone"
                                value={shippingPhone}
                                onChange={(e) => setShippingPhone(e.target.value)}
                                placeholder="Recipient phone"
                            />
                            <div className="md:col-span-2">
                                <ZapanTextarea
                                    label="Shipping Address"
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    placeholder="Shipping address"
                                />
                            </div>
                            <ZapanInput
                                label="City"
                                value={shippingCity}
                                onChange={(e) => setShippingCity(e.target.value)}
                                placeholder="City"
                            />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">State</label>
                                <Select value={shippingState} onValueChange={setShippingState}>
                                    <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl px-6 focus:ring-2 focus:ring-[#7C1D3E]/20 transition-all">
                                        <SelectValue placeholder="Select State" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {indianStates.map((state) => (
                                            <SelectItem key={state} value={state}>
                                                {state}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <ZapanInput
                                label="Pincode"
                                value={shippingZipCode}
                                onChange={(e) => setShippingZipCode(e.target.value)}
                                placeholder="ZIP Code"
                            />
                        </div>
                    </div>
                )}
            </ZapanCard>


            {/* 2️⃣ PRODUCT SELECTION */}
            <ZapanCard className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                        <FiBox size={20} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Inventory Allocation</h3>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <ZapanInput
                            label="Search Inventory"
                            placeholder="Enter product name or SKU..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
                        />
                        <div className="absolute right-3 top-1/2 translate-y-2 text-gray-400">
                            <FiSearch />
                        </div>
                    </div>
                    <Button
                        onClick={handleProductSearch}
                        disabled={isSearching}
                        className="h-14 mt-4 px-8 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest shadow-lg shadow-gray-900/10 hover:scale-105 active:scale-95 transition-all"
                    >
                        {isSearching ? "Scanning..." : "Search"}
                    </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-6 border border-gray-100 rounded-[2rem] p-6 space-y-4 max-h-[500px] overflow-y-auto bg-gray-50/50">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Search Results</h4>
                        {searchResults.map((product) => (
                            <ProductSearchItem
                                key={product._id}
                                product={product}
                                onAdd={handleAddProduct}
                            />
                        ))}
                    </div>
                )}

                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                    <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="h-px bg-gray-100 mb-8"></div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Allocated Units</h4>

                        <div className="space-y-3">
                            {selectedProducts.map((item, index) => {
                                const size = item.product.sizes.find(
                                    (s) => s._id === item.selectedSize
                                );
                                const price = size?.offerPrice || item.product.actualPrice;
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={item.product.img[0]}
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded-xl shadow-sm"
                                            />
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{item.product.name}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-600 uppercase tracking-wide">Size: {size?.size}</span>
                                                    <span className="px-2 py-0.5 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-wide">Qty: {item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="text-sm font-black text-gray-900">
                                                ₹{(price * item.quantity).toFixed(2)}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveProduct(index)}
                                                className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all p-0"
                                            >
                                                <FiTrash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </ZapanCard>


            {/* 3️⃣ PAYMENT & PRICE SUMMARY */}
            <ZapanCard className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                        <FiCreditCard size={20} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Transaction Protocol</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Payment Mode</label>
                        <Select value={paymentMode} onValueChange={setPaymentMode}>
                            <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl px-6 focus:ring-2 focus:ring-[#7C1D3E]/20 transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="COD">COD</SelectItem>
                                <SelectItem value="RAZORPAY_LINK">Razorpay Link (SMS/Email)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Payment Status</label>
                        <Select
                            value={paymentStatus}
                            onValueChange={setPaymentStatus}
                            disabled={paymentMode === "RAZORPAY_LINK"} // Auto-set to Pending for Link
                        >
                            <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl px-6 focus:ring-2 focus:ring-[#7C1D3E]/20 transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="h-px bg-gray-100 my-8"></div>

                <div className="bg-gray-50 rounded-[2rem] p-8 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-500 uppercase tracking-wide">Subtotal</span>
                        <span className="font-black text-gray-900 text-lg">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-500 uppercase tracking-wide">Shipping</span>
                        <span className="font-black text-gray-900 text-lg">₹{shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-gray-200 my-4"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-black text-[#7C1D3E] uppercase tracking-tighter">Total Payable</span>
                        <span className="text-3xl font-black text-[#7C1D3E] tracking-tighter">₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </ZapanCard>

            {/* 4️⃣ SHIPPING */}
            <ZapanCard className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                        <FiTruck size={20} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Logistics Protocol</h3>
                </div>

                <div className="space-y-8">
                    <ZapanInput
                        label="Shipping Cost (₹)"
                        type="number"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(Number(e.target.value))}
                        placeholder="0"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            onClick={() => setShippingMethod("DTDC")}
                            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${shippingMethod === "DTDC" ? "border-[#7C1D3E] bg-[#7C1D3E]/5" : "border-gray-100 bg-white hover:border-gray-200"}`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === "DTDC" ? "border-[#7C1D3E]" : "border-gray-300"}`}>
                                {shippingMethod === "DTDC" && <div className="w-2.5 h-2.5 rounded-full bg-[#7C1D3E]" />}
                            </div>
                            <span className="font-black text-gray-900 uppercase tracking-widest text-xs">Ship via DTDC</span>
                        </div>

                        <div
                            onClick={() => setShippingMethod("MANUAL")}
                            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${shippingMethod === "MANUAL" ? "border-[#7C1D3E] bg-[#7C1D3E]/5" : "border-gray-100 bg-white hover:border-gray-200"}`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === "MANUAL" ? "border-[#7C1D3E]" : "border-gray-300"}`}>
                                {shippingMethod === "MANUAL" && <div className="w-2.5 h-2.5 rounded-full bg-[#7C1D3E]" />}
                            </div>
                            <span className="font-black text-gray-900 uppercase tracking-widest text-xs">Manual / Self Shipping</span>
                        </div>
                    </div>

                    {shippingMethod === "DTDC" && (
                        <div className="animate-in slide-in-from-top-4 duration-500 bg-blue-50/50 border border-blue-100 rounded-[2rem] p-8 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <FiExternalLink size={16} />
                                </div>
                                <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">DTDC Integration</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ZapanInput
                                    label="Pickup Pincode"
                                    value={dtdcPickupPincode}
                                    onChange={(e) => setDtdcPickupPincode(e.target.value)}
                                    className="bg-white"
                                />
                                <ZapanInput
                                    label="Delivery Pincode"
                                    value={dtdcDeliveryPincode}
                                    onChange={(e) => setDtdcDeliveryPincode(e.target.value)}
                                    placeholder="Required"
                                    className="bg-white border-blue-200 focus:ring-blue-200/50"
                                />
                                <ZapanInput
                                    label="Weight (kg)"
                                    value={dtdcWeight}
                                    onChange={(e) => setDtdcWeight(e.target.value)}
                                    placeholder="Auto"
                                    className="bg-white"
                                />
                                <div className="grid grid-cols-3 gap-4 md:col-span-1">
                                    <ZapanInput
                                        label="Len (cm)"
                                        value={dtdcLength}
                                        onChange={(e) => setDtdcLength(e.target.value)}
                                        className="bg-white"
                                    />
                                    <ZapanInput
                                        label="Bre (cm)"
                                        value={dtdcBreadth}
                                        onChange={(e) => setDtdcBreadth(e.target.value)}
                                        className="bg-white"
                                    />
                                    <ZapanInput
                                        label="Hgt (cm)"
                                        value={dtdcHeight}
                                        onChange={(e) => setDtdcHeight(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}


                    {shippingMethod === "MANUAL" && (
                        <div className="animate-in slide-in-from-top-4 duration-500 bg-gray-50 border border-gray-100 rounded-[2rem] p-8 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center">
                                    <FiBox size={16} />
                                </div>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Manual Logistics</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ZapanInput
                                    label="Courier Service"
                                    value={manualCourierName}
                                    onChange={(e) => setManualCourierName(e.target.value)}
                                    placeholder="e.g. Delhivery, BlueDart"
                                    className="bg-white"
                                />
                                <ZapanInput
                                    label="Tracking ID"
                                    value={manualTrackingNumber}
                                    onChange={(e) => setManualTrackingNumber(e.target.value)}
                                    placeholder="AWB Number"
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </ZapanCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Email Notification</span>
                    <Checkbox
                        checked={sendEmail}
                        onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                        className="border-gray-300"
                    />
                </div>
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">WhatsApp Alert</span>
                    <Checkbox
                        checked={sendWhatsApp}
                        onCheckedChange={(checked) => setSendWhatsApp(checked as boolean)}
                        className="border-gray-300"
                    />
                </div>
            </div>

            <Button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full h-16 bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B] text-white text-lg font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-[#7C1D3E]/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
                {isSubmitting ? "Processing Order..." : "Create Offline Order"}
            </Button>
        </div>
    );
};

// ✅ Product Search Item Component
const ProductSearchItem = ({
    product,
    onAdd,
}: {
    product: Product;
    onAdd: (product: Product, sizeId: string, quantity: number) => void;
}) => {
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);

    // Calculate dynamic price based on selected size
    const sizeObj = product.sizes.find((s) => s._id === selectedSize);
    const priceToDisplay = sizeObj ? sizeObj.offerPrice : product.actualPrice;

    return (
        <div className="flex items-start gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg transition-all bg-white mb-2 group">
            <img
                src={product.img[0]}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-xl shadow-sm"
            />
            <div className="flex-1">
                <h4 className="font-black text-gray-900 text-sm mb-1">{product.name}</h4>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="neutral" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider border-gray-200">
                        SKU: {product.sku}
                    </Badge>
                </div>
                <p className="text-sm font-black text-[#7C1D3E]">
                    ₹{priceToDisplay}
                </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                    <div className="w-28">
                        <Select value={selectedSize} onValueChange={setSelectedSize}>
                            <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-100 rounded-lg">
                                <SelectValue placeholder="Select Size" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-lg border-gray-100 p-1">
                                {product.sizes.map((size) => (
                                    <SelectItem key={size._id} value={size._id} className="text-xs rounded-lg cursor-pointer">
                                        {size.size} (Qty: {size.stock})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-16">
                        <ZapanInput
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="h-9 text-xs py-0"
                            placeholder="Qty"
                        />
                    </div>
                </div>
                <Button
                    size="sm"
                    onClick={() => onAdd(product, selectedSize, quantity)}
                    className="w-full bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                    <FiPlus className="mr-2" /> Add to Order
                </Button>
            </div>
        </div>
    );
};

export default CreateOfflineOrderPage;
