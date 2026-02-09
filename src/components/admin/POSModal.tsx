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
    FaMobileAlt,
    FaLink,
    FaMoneyBillWave,
    FaCreditCard,
    FaQrcode,
    FaWallet
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import QRCode from "react-qr-code";

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
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "RAZORPAY_PAYMENT_LINK" | "RAZORPAY_QR">("CASH");
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

    const [paymentQRInfo, setPaymentQRInfo] = useState<{
        qrCode: string;
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
        const orderId = paymentLinkInfo?.orderId || paymentQRInfo?.orderId;
        if (!orderId || completedOrder) return;

        console.log("📡 Starting SSE listener for order:", orderId);

        const eventSource = new EventSource(`/api/order/status/sse?orderId=${orderId}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📩 SSE Message Received:", data);

                if (data.paymentStatus === "PAYMENT_SUCCESS") {
                    toast.success("Payment confirmed!");
                    // Fetch final order details to show success screen
                    fetchOrderDetails(orderId);
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
    }, [paymentLinkInfo, paymentQRInfo, completedOrder]);

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
                invoiceId: paymentLinkInfo?.invoiceId || paymentQRInfo?.invoiceId,
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
            // CASE 1.5: Razorpay Dynamic QR (Requires Webhook Confirmation)
            // ═════════════════════════════════════════════════════════════════════
            else if (paymentMethod === "RAZORPAY_QR") {
                const { data } = await axios.post(
                    "/api/admin/pos",
                    { ...requestBody, action: "GenerateQR" },
                    { headers: { "x-admin-id": adminId } }
                );

                if (data.success) {
                    console.log("✅ QR Code generated successfully:", data);
                    toast.success("QR Code Generated!");

                    setPaymentQRInfo({
                        qrCode: data.qrCode,
                        orderId: data.order.orderId,
                        invoiceId: data.invoiceId,
                    });
                } else {
                    toast.error(data.message || "Failed to generate QR");
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
        setPaymentQRInfo(null);
        generateInvoiceNumber();
    };

    // ✅ Close and reset
    const handleClose = () => {
        // If payment link or QR is generated, close immediately without confirm (as link/QR is active)
        if (paymentLinkInfo || paymentQRInfo) {
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
        paymentQRInfo: !!paymentQRInfo,
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
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                        <div className="flex flex-col md:flex-row bg-white min-h-[500px]">
                            {/* Left Side: Large QR Display */}
                            <div className="w-full md:w-1/2 bg-indigo-50 flex flex-col items-center justify-center p-8 border-r border-indigo-100 relative">
                                <div className="absolute top-6 left-8 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                                    SCAN TO PAY
                                </div>

                                <div className="relative p-8 bg-white border-4 border-indigo-200 rounded-[3rem] shadow-2xl group transition-all duration-500 hover:border-indigo-400">
                                    <QRCode value={paymentLinkInfo.link} size={300} className="rounded-xl" />
                                    {/* Corner Accents */}
                                    <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-indigo-500 rounded-tl-3xl -m-2"></div>
                                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-indigo-500 rounded-br-3xl -m-2"></div>
                                </div>
                                <div className="mt-8 text-center">
                                    <p className="text-sm font-bold text-indigo-400 mb-2">SCAN WITH ANY UPI APP</p>
                                    <div className="flex gap-4 items-center justify-center opacity-40 grayscale contrast-125">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-4" alt="UPI" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Pay_Logo.svg" className="h-4" alt="GPay" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-4" alt="Paytm" />
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Order Info & Actions */}
                            <div className="w-full md:w-1/2 p-10 flex flex-col justify-between space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payment Link</h2>
                                            <p className="text-gray-500 font-medium">Remote Secure Checkout</p>
                                        </div>
                                        <div className="bg-green-100 text-green-700 p-3 rounded-2xl flex items-center gap-2">
                                            <div className="relative flex">
                                                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
                                                <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-wider">Live Status</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Payable</p>
                                        <p className="text-5xl font-black text-indigo-600">₹{totals.total}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Order ID</span>
                                                <span className="text-xs font-bold text-gray-800">{paymentLinkInfo.orderId}</span>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Customer</span>
                                                <span className="text-xs font-bold text-gray-800">{customerPhone}</span>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                                            <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-2">Short Link</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 truncate font-mono text-xs text-indigo-600 font-bold bg-white px-3 py-2 rounded-lg border border-indigo-200">
                                                    {paymentLinkInfo.link}
                                                </div>
                                                <Button size="icon" variant="ghost" className="shrink-0 text-indigo-600 hover:bg-indigo-100" onClick={copyPaymentLink}>
                                                    <FaCopy />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        onClick={openPaymentLink}
                                        className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-bold shadow-xl transition-all hover:translate-y-[-2px]"
                                    >
                                        Open Link
                                    </Button>
                                    <Button
                                        onClick={handleClose}
                                        className="h-14 w-14 rounded-2xl bg-gray-900 hover:bg-black text-white p-0 shadow-lg"
                                        title="Close"
                                    >
                                        <FaPlus className="rotate-45 text-xl" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                ) :

                    /* ═════════════════════════════════════════════════════════════════════
                        CASE 2.5: Awaiting Payment (Dynamic QR Generated)
                        ═════════════════════════════════════════════════════════════════════ */
                    paymentQRInfo ? (
                        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                            <div className="flex flex-col md:flex-row bg-white min-h-[500px]">
                                {/* Left Side: Large QR Display */}
                                <div className="w-full md:w-1/2 bg-blue-50 flex flex-col items-center justify-center p-8 border-r border-blue-100 relative">
                                    <div className="absolute top-6 left-8 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                                        UPI DYNAMIC QR
                                    </div>

                                    <div className="relative p-8 bg-white border-4 border-blue-200 rounded-[3rem] shadow-2xl group transition-all duration-500 hover:border-blue-400">
                                        <img
                                            src={paymentQRInfo.qrCode}
                                            alt="Payment QR"
                                            className="w-[320px] h-[320px] md:w-[400px] md:h-[400px] object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
                                        />
                                        {/* Corner Accents */}
                                        <div className="absolute top-0 left-0 w-16 h-16 border-t-[10px] border-l-[10px] border-blue-500 rounded-tl-3xl -m-2"></div>
                                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[10px] border-r-[10px] border-blue-500 rounded-br-3xl -m-1"></div>
                                    </div>
                                    <div className="mt-8 text-center text-blue-400">
                                        <p className="text-sm font-bold mb-2">SCAN TO PAY INSTANTLY</p>
                                        <div className="flex gap-4 items-center justify-center opacity-40 grayscale contrast-125">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-4" alt="UPI" />
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Pay_Logo.svg" className="h-4" alt="GPay" />
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-4" alt="Paytm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Order Info & Actions */}
                                <div className="w-full md:w-1/2 p-10 flex flex-col justify-between space-y-8">
                                    <div className="space-y-8">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Checkout</h2>
                                                <p className="text-gray-500 font-medium">Auto-confirming through Razorpay</p>
                                            </div>
                                            <div className="bg-green-100 text-green-700 p-3 rounded-2xl flex items-center gap-2">
                                                <div className="relative flex">
                                                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
                                                    <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-wider">Live</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                                            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Amount to Pay</p>
                                            <p className="text-6xl font-black text-gray-900 leading-tight">₹{totals.total}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Order ID</span>
                                                <span className="text-sm font-bold text-gray-700">{paymentQRInfo.orderId}</span>
                                            </div>
                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Invoice ID</span>
                                                <span className="text-sm font-bold text-gray-700 truncate block">{paymentQRInfo.invoiceId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-center text-sm font-bold text-gray-400 animate-pulse uppercase tracking-[0.3em]">
                                            Awaiting Scan...
                                        </p>
                                        <div className="flex gap-4">
                                            <Button
                                                onClick={() => {
                                                    resetPOS();
                                                    searchInputRef.current?.focus();
                                                }}
                                                className="flex-1 h-16 rounded-3xl text-lg font-bold transition-all hover:bg-gray-100"
                                                variant="outline"
                                            >
                                                <FaPlus className="mr-2" /> New Order
                                            </Button>
                                            <Button
                                                onClick={handleClose}
                                                variant="default"
                                                className="flex-1 h-16 rounded-3xl text-lg font-bold bg-gray-900 border-none transition-all hover:bg-black shadow-xl"
                                            >
                                                Close POS
                                            </Button>
                                        </div>
                                    </div>
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
                                                        <SelectTrigger id="paymentMethod" className="h-12 text-md font-semibold border-2 hover:border-gray-400 transition-colors">
                                                            <SelectValue placeholder="Select payment method" />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[9999] min-w-[280px] p-2 rounded-xl border-gray-200">
                                                            <SelectItem value="CASH" className="py-3 px-4 rounded-lg focus:bg-emerald-50 focus:text-emerald-700">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                                                        <FaMoneyBillWave />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">Cash</span>
                                                                        <span className="text-[10px] opacity-70">Immediate Payment</span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>

                                                            <SelectItem value="UPI" className="py-3 px-4 rounded-lg focus:bg-blue-50 focus:text-blue-700">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                                        <FaWallet />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">UPI</span>
                                                                        <span className="text-[10px] opacity-70">Offline / Manual</span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>

                                                            <SelectItem value="RAZORPAY_QR" className="py-3 px-4 rounded-lg focus:bg-indigo-50 focus:text-indigo-700 border-l-4 border-indigo-500">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                                                        <FaQrcode />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">Razorpay Dynamic QR</span>
                                                                        <span className="text-[10px] font-black text-indigo-500">AUTO-CONFIRMING</span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>

                                                            <SelectItem value="CARD" className="py-3 px-4 rounded-lg focus:bg-slate-50 focus:text-slate-700">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                                                        <FaCreditCard />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">Card</span>
                                                                        <span className="text-[10px] opacity-70">Offline / Swipe</span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>

                                                            <SelectItem value="RAZORPAY_PAYMENT_LINK" className="py-3 px-4 rounded-lg focus:bg-purple-50 focus:text-purple-700">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                                                        <FaLink />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">Payment Link</span>
                                                                        <span className="text-[10px] opacity-70">Remote Checkout</span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
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
