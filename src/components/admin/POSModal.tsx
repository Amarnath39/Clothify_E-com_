"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
    FaSearch,
    FaTrash,
    FaPlus,
    FaMinus,
    FaPrint,
    FaBarcode,
    FaCopy,
    FaExternalLinkAlt,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

// Razorpay SDK logic removed as per new requirements (Manual UPI/Card)

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
    categories?: Array<{
        _id: string;
        name: string;
        gst: number;
    }>;
}

interface CartItem {
    product: Product;
    selectedSize: {
        _id: string;
        size: string;
        stock: number;
        offerPrice: number;
    };
    quantity: number;
}

interface POSModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const POSModal: React.FC<POSModalProps> = ({ isOpen, onClose }) => {
    // ✅ Core State
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "RAZORPAY_PAYMENT_LINK">("CASH");
    const [transactionDetails, setTransactionDetails] = useState(""); // ✅ For UPI/Card transaction ID
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<any>(null);

    // ✅ Get Admin from Redux
    const { user } = useSelector((state: any) => state.auth);

    // ✅ Refs
    const searchInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);

    // ✅ NEW: Payment Link State
    const [paymentLinkInfo, setPaymentLinkInfo] = useState<{
        link: string;
        orderId: string;
        invoiceId: string;
    } | null>(null);

    // ✅ Auto-focus search input when modal opens
    useEffect(() => {
        if (isOpen) {
            generateInvoiceNumber();
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        } else {
            // Reset on close
            resetPOS();
        }
    }, [isOpen]);

    // ✅ COPY PAYMENT LINK
    const copyPaymentLink = () => {
        if (paymentLinkInfo?.link) {
            navigator.clipboard.writeText(paymentLinkInfo.link);
            toast.success("Link copied to clipboard!");
        }
    };

    // ✅ OPEN PAYMENT LINK
    const openPaymentLink = () => {
        if (paymentLinkInfo?.link) {
            window.open(paymentLinkInfo.link, "_blank");
        }
    };

    // ✅ Real-time Payment Listener (SSE)
    useEffect(() => {
        if (!paymentLinkInfo?.orderId || completedOrder) return;

        console.log("📡 Starting SSE listener for order:", paymentLinkInfo.orderId);

        const eventSource = new EventSource(`/api/order/status/sse?orderId=${paymentLinkInfo.orderId}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📩 SSE Message Received:", data);

                if (data.paymentStatus === "PAYMENT_SUCCESS") {
                    toast.success("Payment confirmed!");
                    // Fetch final order details to show success screen
                    fetchOrderDetails(paymentLinkInfo.orderId);
                    eventSource.close();
                }
            } catch (err) {
                console.error("Failed to parse SSE data:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Error:", err);
            // Reconnects automatically by default, so we don't necessarily close
        };

        return () => {
            console.log("📡 Closing SSE listener");
            eventSource.close();
        };
    }, [paymentLinkInfo, completedOrder]);

    // ✅ Helper to fetch order details after payment
    const fetchOrderDetails = async (orderId: string) => {
        try {
            // Find the database ID (_id) for this orderId (orderId like ORD-...)
            // Actually, for POS orders, we might need to search by orderId string or pass _id in SSE
            // Let's use the fetching endpoint I just added
            const { data } = await axios.get(`/api/admin/order/${orderId}`, {
                headers: { "x-admin-id": localStorage.getItem("adminId") || user?._id }
            });
            if (data.success) {
                setCompletedOrder(data.order);
            }
        } catch (error) {
            console.error("Failed to fetch order details:", error);
            // Fallback: just show a generic success if we can't get details
            setCompletedOrder({
                orderId: orderId,
                invoiceId: paymentLinkInfo?.invoiceId,
                payablePrice: totals.total,
                paymentMethod: "RAZORPAY",
                customerPhone: customerPhone
            });
        }
    };

    // ✅ Generate invoice number on modal open
    const generateInvoiceNumber = () => {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
        const randomSeq = Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, "0");
        setInvoiceNumber(`POS-${dateStr}-${randomSeq}`);
    };

    // ✅ Product Search (with debounce)
    const searchProducts = async (query: string) => {
        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const { data } = await axios.get(`/api/admin/pos/products/search?q=${query}`, {
                headers: {
                    "x-admin-id": localStorage.getItem("adminId"),
                },
            });

            if (data.success) {
                setSearchResults(data.products);
            }
        } catch (error: any) {
            console.error("Search failed:", error);
            toast.error("Product search failed");
        } finally {
            setIsSearching(false);
        }
    };

    // ✅ Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchProducts(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ✅ Handle barcode/SKU scan (Enter key)
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchResults.length > 0) {
            const firstProduct = searchResults[0];
            if (firstProduct.sizes && firstProduct.sizes.length === 1) {
                // Auto-add if only one size available
                addToCart(firstProduct, firstProduct.sizes[0]._id, 1);
                setSearchQuery("");
                setSearchResults([]);
            }
        }
    };

    // ✅ Add product to cart
    const addToCart = (product: Product, sizeId: string, quantity: number = 1) => {
        const selectedSize = product.sizes.find((s) => s._id === sizeId);

        if (!selectedSize) {
            toast.error("Size not found");
            return;
        }

        // Check if product+size already in cart
        const existingItemIndex = cart.findIndex(
            (item) =>
                item.product._id === product._id &&
                item.selectedSize._id === selectedSize._id
        );

        if (existingItemIndex >= 0) {
            // Update quantity
            const updatedCart = [...cart];
            const newQuantity = updatedCart[existingItemIndex].quantity + quantity;

            if (newQuantity > selectedSize.stock) {
                toast.error(`Only ${selectedSize.stock} items available`);
                return;
            }

            updatedCart[existingItemIndex].quantity = newQuantity;
            setCart(updatedCart);
            toast.success("Quantity updated");
        } else {
            // Add new item
            if (quantity > selectedSize.stock) {
                toast.error(`Only ${selectedSize.stock} items available`);
                return;
            }

            setCart([
                ...cart,
                {
                    product,
                    selectedSize,
                    quantity,
                },
            ]);
            toast.success("Product added to cart");
        }

        // Clear search after adding
        setSearchQuery("");
        setSearchResults([]);
        searchInputRef.current?.focus();
    };

    // ✅ Remove from cart
    const removeFromCart = (index: number) => {
        const updatedCart = [...cart];
        updatedCart.splice(index, 1);
        setCart(updatedCart);
        toast.success("Product removed");
    };

    // ✅ Update quantity
    const updateQuantity = (index: number, newQuantity: number) => {
        const updatedCart = [...cart];
        const item = updatedCart[index];

        if (newQuantity < 1) {
            removeFromCart(index);
            return;
        }

        if (newQuantity > item.selectedSize.stock) {
            toast.error(`Only ${item.selectedSize.stock} items available`);
            return;
        }

        updatedCart[index].quantity = newQuantity;
        setCart(updatedCart);
    };

    // ✅ Calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        let totalItems = 0;
        let totalGst = 0;

        cart.forEach((item) => {
            const price = item.selectedSize.offerPrice || item.product.actualPrice;
            subtotal += price * item.quantity;
            totalItems += item.quantity;

            // GST
            let gstPercent = 0;
            if (item.product.categories && Array.isArray(item.product.categories)) {
                const gstValues = item.product.categories.map((c: any) => typeof c === 'object' ? (c.gst || 0) : 0);
                if (gstValues.length > 0) gstPercent = Math.max(...gstValues);
            }

            totalGst += (price * gstPercent / 100) * item.quantity;
        });

        const discount = 0;
        const total = subtotal + totalGst - discount;

        return { subtotal, totalGst, discount, total, totalItems };
    };

    // ✅ Process POS Order
    const processPOSOrder = async () => {
        // Validation
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        if (!customerPhone || customerPhone.trim().length !== 10) {
            toast.error("Valid 10-digit phone number required");
            phoneInputRef.current?.focus();
            return;
        }

        if (!paymentMethod) {
            toast.error("Please select payment method");
            return;
        }

        setIsProcessing(true);

        try {
            const productDetails = cart.map((item) => ({
                product: item.product._id,
                sizeId: item.selectedSize._id,
                quantity: item.quantity,
            }));

            const adminId = user?._id || localStorage.getItem("adminId");
            if (!adminId) {
                toast.error("Admin ID not found. Please log in again.");
                setIsProcessing(false);
                return;
            }

            const requestBody: any = {
                customerPhone,
                productDetails,
                paymentMethod,
                shippingCost: 0,
                transactionDetails: transactionDetails || undefined
            };

            // ═════════════════════════════════════════════════════════════════════
            // CASE 1: Payment Link (Requires Webhook Confirmation)
            // ═════════════════════════════════════════════════════════════════════
            if (paymentMethod === "RAZORPAY_PAYMENT_LINK") {
                const { data } = await axios.post(
                    "/api/admin/pos",
                    { ...requestBody, action: "GenerateLink" },
                    { headers: { "x-admin-id": adminId } }
                );

                if (data.success) {
                    console.log("✅ Payment link generated successfully:", data);
                    toast.success("Payment Link Sent!");

                    setPaymentLinkInfo({
                        link: data.paymentLink,
                        orderId: data.order.orderId,
                        invoiceId: data.invoiceId,
                    });

                    // No polling. Just display link.
                } else {
                    toast.error(data.message || "Failed to generate link");
                }
            }
            // ═════════════════════════════════════════════════════════════════════
            // CASE 2: CASH, UPI (Offline), CARD (Offline) -> Immediate Completion
            // ═════════════════════════════════════════════════════════════════════
            else {
                const { data } = await axios.post(
                    "/api/admin/pos",
                    { ...requestBody, action: "COMPLETE" }, // Explicit action for immediate completion
                    { headers: { "x-admin-id": localStorage.getItem("adminId") } }
                );

                if (data.success) {
                    toast.success("Order Completed Successfully!");
                    setCompletedOrder(data.order);
                } else {
                    throw new Error(data.message || "Order failed");
                }
            }

        } catch (error: any) {
            console.error("POS order failed:", error);

            let errorMessage = "POS order failed";

            if (error.response?.data) {
                const data = error.response.data;
                // Check if response is HTML (starts with <)
                if (typeof data === 'string' && data.trim().startsWith("<")) {
                    errorMessage = "Server Error: received HTML response. Check server logs.";
                } else {
                    errorMessage = data.message || data.error || (typeof data === 'string' ? data : errorMessage);
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            // ALWAYS Stop spinner
            setIsProcessing(false);
        }
    };

    // ✅ Print Invoice
    const printInvoice = () => {
        if (!completedOrder) return;
        window.open(`/invoice/${completedOrder.invoiceId}`, "_blank");
    };

    // ✅ Reset POS
    const resetPOS = () => {
        setCart([]);
        setCustomerPhone("");
        setPaymentMethod("CASH");
        setTransactionDetails(""); // ✅ Reset transaction details
        setSearchQuery("");
        setSearchResults([]);
        setCompletedOrder(null);
        setPaymentLinkInfo(null);
        generateInvoiceNumber();
    };

    // ✅ Close and reset
    const handleClose = () => {
        // If payment link is generated, close immediately without confirm (as link is active)
        if (paymentLinkInfo) {
            onClose();
            return;
        }

        if (cart.length > 0 && !completedOrder) {
            if (!confirm("Cart has items. Are you sure you want to close?")) {
                return;
            }
        }
        onClose();
    };

    const totals = calculateTotals();

    console.log("🛠️ POS Modal Render State:", {
        paymentLinkInfo: !!paymentLinkInfo,
        completedOrder: !!completedOrder,
        isOpen
    });

    // ✅ Main POS Interface
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            {/* ═════════════════════════════════════════════════════════════════════
                CASE 1: Success Screen (Order Completed)
                ═════════════════════════════════════════════════════════════════════ */}
            {completedOrder ? (
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-green-600 text-2xl">
                            ✅ Order Completed
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Invoice Number</p>
                            <p className="text-xl font-bold">{completedOrder.invoiceId}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span>Total Amount:</span>
                                <span className="font-bold">₹{completedOrder.payablePrice}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment Method:</span>
                                <span className="font-bold">{completedOrder.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Customer Phone:</span>
                                <span>{completedOrder.customerPhone}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={printInvoice}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                <FaPrint className="mr-2" />
                                Print Invoice
                            </Button>
                            <Button
                                onClick={() => {
                                    resetPOS();
                                    searchInputRef.current?.focus();
                                }}
                                className="flex-1"
                                variant="outline"
                            >
                                New Order
                            </Button>
                        </div>

                        <Button
                            onClick={handleClose}
                            variant="ghost"
                            className="w-full"
                        >
                            Close POS
                        </Button>
                    </div>
                </DialogContent>
            ) :

                /* ═════════════════════════════════════════════════════════════════════
                    CASE 2: Awaiting Payment (Link Generated)
                    ═════════════════════════════════════════════════════════════════════ */
                paymentLinkInfo ? (
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-center text-blue-600 text-2xl">
                                🔗 Payment Link Generated
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Status Indicator with Live Listener */}
                            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center space-y-4">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full" />
                                    <p className="text-lg font-semibold text-gray-800">
                                        Awaiting Payment...
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Link sent to <strong>{customerPhone}</strong>. The window will automatically confirm once paid.
                                </p>
                            </div>

                            {/* Payment Link Display */}
                            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 space-y-4">
                                <p className="text-sm font-semibold text-gray-700">Payment Link:</p>
                                <div className="bg-white p-4 rounded border border-blue-200 break-all text-blue-600 font-mono text-sm">
                                    {paymentLinkInfo.link}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={copyPaymentLink}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <FaCopy className="mr-2" />
                                        Copy Link
                                    </Button>
                                    <Button
                                        onClick={openPaymentLink}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        variant="default"
                                    >
                                        <FaExternalLinkAlt className="mr-2" />
                                        Open Link
                                    </Button>
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order ID:</span>
                                    <span className="font-bold">{paymentLinkInfo.orderId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Invoice ID:</span>
                                    <span className="font-bold">{paymentLinkInfo.invoiceId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Customer Phone:</span>
                                    <span className="font-bold">{customerPhone}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        resetPOS();
                                        searchInputRef.current?.focus();
                                    }}
                                    className="flex-1"
                                    variant="outline"
                                >
                                    Start New Order
                                </Button>
                                <Button
                                    onClick={handleClose}
                                    variant="default"
                                    className="flex-1"
                                >
                                    Close POS
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                ) :

                    /* ═════════════════════════════════════════════════════════════════════
                        CASE 3: Main POS Cart / Checkout
                        ═════════════════════════════════════════════════════════════════════ */
                    (
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                                    <span>🏪 Point of Sale (POS)</span>
                                    <span className="text-sm font-normal text-gray-600">
                                        {invoiceNumber}
                                    </span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Left: Product Search & Cart */}
                                <div className="md:col-span-2 space-y-4">
                                    {/* Search Bar */}
                                    <Card>
                                        <CardContent className="p-4">
                                            <Label className="flex items-center gap-2 mb-2">
                                                <FaBarcode />
                                                Scan Barcode / Enter SKU / Product Name
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    placeholder="Scan barcode or type product name..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={handleSearchKeyDown}
                                                    className="pr-10"
                                                />
                                                <FaSearch className="absolute right-3 top-3 text-gray-400" />
                                            </div>

                                            {/* Search Results */}
                                            {isSearching && (
                                                <p className="text-sm text-gray-500 mt-2">Searching...</p>
                                            )}

                                            {searchResults.length > 0 && (
                                                <div className="mt-3 max-h-64 overflow-y-auto border rounded-md">
                                                    {searchResults.map((product) => (
                                                        <div
                                                            key={product._id}
                                                            className="p-3 hover:bg-gray-50 border-b last:border-b-0"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={product.img[0] || "/placeholder.png"}
                                                                    alt={product.name}
                                                                    className="w-12 h-12 object-cover rounded"
                                                                />
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm">{product.name}</p>
                                                                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                                                </div>
                                                            </div>

                                                            {/* Size Selection */}
                                                            <div className="mt-2 flex gap-2 flex-wrap">
                                                                {product.sizes && Array.isArray(product.sizes) ? (
                                                                    product.sizes.map((size) => (
                                                                        <Button
                                                                            key={size._id}
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => addToCart(product, size._id, 1)}
                                                                            disabled={size.stock === 0}
                                                                            className="text-xs"
                                                                        >
                                                                            {size.size} (₹{size.offerPrice || product.actualPrice})
                                                                            {size.stock === 0 && " - Out of Stock"}
                                                                        </Button>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-xs text-red-500">No sizes configured</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Cart Items */}
                                    <Card>
                                        <CardContent className="p-4">
                                            <h3 className="font-bold mb-3">
                                                Cart ({totals.totalItems} items)
                                            </h3>

                                            {cart.length === 0 ? (
                                                <p className="text-gray-500 text-center py-8">
                                                    Cart is empty. Scan products to add.
                                                </p>
                                            ) : (
                                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                                    {cart.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                                        >
                                                            <img
                                                                src={item.product.img[0] || "/placeholder.png"}
                                                                alt={item.product.name}
                                                                className="w-16 h-16 object-cover rounded"
                                                            />

                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm">
                                                                    {item.product.name}
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    Size: {item.selectedSize.size}
                                                                </p>
                                                                <p className="text-sm font-bold text-blue-600">
                                                                    ₹
                                                                    {item.selectedSize.offerPrice ||
                                                                        item.product.actualPrice}{" "}
                                                                    × {item.quantity}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        updateQuantity(index, item.quantity - 1)
                                                                    }
                                                                >
                                                                    <FaMinus />
                                                                </Button>
                                                                <span className="w-8 text-center font-bold">
                                                                    {item.quantity}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        updateQuantity(index, item.quantity + 1)
                                                                    }
                                                                >
                                                                    <FaPlus />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => removeFromCart(index)}
                                                                >
                                                                    <FaTrash />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right: Payment & Checkout */}
                                <div className="space-y-4">
                                    {/* Customer Info */}
                                    <Card>
                                        <CardContent className="p-4 space-y-3">
                                            <div>
                                                <Label htmlFor="customerPhone">
                                                    Customer Phone <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    ref={phoneInputRef}
                                                    id="customerPhone"
                                                    type="tel"
                                                    placeholder="10-digit phone number"
                                                    value={customerPhone}
                                                    onChange={(e) =>
                                                        setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                                                    }
                                                    maxLength={10}
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="paymentMethod">
                                                    Payment Method <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={paymentMethod}
                                                    onValueChange={(value: any) => setPaymentMethod(value)}
                                                >
                                                    <SelectTrigger id="paymentMethod">
                                                        <SelectValue placeholder="Select payment method" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999]">
                                                        <SelectItem value="CASH">💵 Cash (Immediate)</SelectItem>
                                                        <SelectItem value="UPI">📱 UPI (Offline / Manual)</SelectItem>
                                                        <SelectItem value="CARD">💳 Card (Offline / Swipe)</SelectItem>
                                                        <SelectItem value="RAZORPAY_PAYMENT_LINK">🔗 Payment Link (Razorpay)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* ✅ NEW: Transaction Details for UPI/Card */}
                                            {(paymentMethod === "UPI" || paymentMethod === "CARD") && (
                                                <div>
                                                    <Label htmlFor="transactionDetails">
                                                        Transaction Note / Manual ID
                                                        <span className="text-gray-500 text-xs ml-1">(Optional)</span>
                                                    </Label>
                                                    <Input
                                                        id="transactionDetails"
                                                        type="text"
                                                        placeholder="Enter note or transaction ID..."
                                                        value={transactionDetails}
                                                        onChange={(e) => setTransactionDetails(e.target.value)}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        For record keeping and verification
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Totals */}
                                    <Card>
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Subtotal:</span>
                                                <span>₹{totals.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>GST:</span>
                                                <span>₹{totals.totalGst.toFixed(2)}</span>
                                            </div>
                                            {totals.discount > 0 && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Discount:</span>
                                                    <span>-₹{totals.discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                                <span>Total:</span>
                                                <span className="text-blue-600">₹{totals.total.toFixed(2)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Checkout Button */}
                                    <Button
                                        onClick={processPOSOrder}
                                        disabled={isProcessing || cart.length === 0}
                                        className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                                    >
                                        {isProcessing ? "Processing..." : `Checkout - ₹${totals.total.toFixed(2)}`}
                                    </Button>

                                    <Button
                                        onClick={resetPOS}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Clear Cart
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    )}
        </Dialog>
    );
};

export default POSModal;
