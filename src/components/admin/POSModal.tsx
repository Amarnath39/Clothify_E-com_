"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ZapanInput,
    Button as ZapanButton,
    Card as ZapanCard,
    Badge as ZapanBadge
} from "@/theme/components";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Removed: Button, Input, Label, Card imports from shadcn
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
    FaWallet,
    FaReceipt
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
                console.log("📩 SSE Message Received: ", data);

                if (data.paymentStatus === "PAYMENT_SUCCESS") {
                    console.log("✅ Payment Success observed via SSE!");
                    toast.success("Payment confirmed!");
                    // Fetch final order details to show success screen
                    fetchOrderDetails(orderId);
                    eventSource.close();
                } else {
                    console.log("ℹ️ Other SSE status update: ", data.paymentStatus);
                }
            } catch (err) {
                console.error("Failed to parse SSE data: ", err, event.data);
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
            const adminId = localStorage.getItem("adminId") || user?._id;
            const { data } = await axios.get(`/api/admin/order/${orderId}`, {
                headers: { "x-admin-id": adminId }
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
            const adminId = localStorage.getItem("adminId") || user?._id;
            const { data } = await axios.get(`/api/admin/pos/products/search?q=${query}`, {
                headers: {
                    "x-admin-id": adminId,
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
        let subtotal = 0; // Total Inclusive
        let totalItems = 0;
        let totalGst = 0;

        cart.forEach((item) => {
            const price = item.selectedSize.offerPrice || item.product.actualPrice;
            const quantity = item.quantity;
            const itemTotalInclusive = price * quantity;

            subtotal += itemTotalInclusive;
            totalItems += quantity;

            // Extract GST for internal tracking if needed
            let gstPercent = 0;
            if (item.product.categories && Array.isArray(item.product.categories)) {
                const gstValues = item.product.categories.map((c: any) => typeof c === 'object' ? (c.gst || 0) : 0);
                if (gstValues.length > 0) gstPercent = Math.max(...gstValues);
            }

            const taxableValue = (itemTotalInclusive * 100) / (100 + gstPercent);
            totalGst += (itemTotalInclusive - taxableValue);
        });

        const discount = 0;
        const total = subtotal - discount;

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
                const adminId = localStorage.getItem("adminId") || user?._id;
                const { data } = await axios.post(
                    "/api/admin/pos",
                    { ...requestBody, action: "COMPLETE" }, // Explicit action for immediate completion
                    { headers: { "x-admin-id": adminId } }
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
            <DialogContent className={`${completedOrder ? 'max-w-md' : (paymentLinkInfo || paymentQRInfo) ? 'max-w-4xl h-fit' : 'max-w-[1400px] w-[95vw] h-[95vh] sm:h-[90vh]'} p-0 overflow-y-auto scrollbar-hide border-none shadow-2xl rounded-[1.5rem] md:rounded-[2rem] bg-gray-50`}>
                {/* ═════════════════════════════════════════════════════════════════════
                    CASE 1: Success Screen (Order Completed)
                    ═════════════════════════════════════════════════════════════════════ */}
                {completedOrder ? (
                    <div className="flex flex-col">
                        <DialogHeader className="bg-emerald-50 p-6 border-b border-emerald-100">
                            <DialogTitle className="text-center text-emerald-800 text-2xl font-black uppercase tracking-wider flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                                    <FaReceipt />
                                </div>
                                Order Completed
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 p-8 bg-white">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoice Number</p>
                                <p className="text-2xl font-black text-gray-900 font-mono tracking-tight">{completedOrder.invoiceId}</p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-gray-500">Total Amount</span>
                                    <span className="font-black text-xl text-gray-900">₹{completedOrder.payablePrice}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-gray-500">Payment Method</span>
                                    <ZapanBadge variant="neutral" className="bg-white border-gray-200 text-gray-900">{completedOrder.paymentMethod}</ZapanBadge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-gray-500">Customer</span>
                                    <span className="font-bold text-gray-900">{completedOrder.customerPhone}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <ZapanButton
                                    onClick={printInvoice}
                                    className="flex-1 bg-gray-900 text-white hover:bg-black h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                                >
                                    <FaPrint className="mr-2" />
                                    Print
                                </ZapanButton>
                                <ZapanButton
                                    variant="outline"
                                    onClick={() => {
                                        resetPOS();
                                        searchInputRef.current?.focus();
                                    }}
                                    className="flex-1 bg-white border-2 border-gray-100 text-gray-900 hover:bg-gray-50 h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm"
                                >
                                    New Order
                                </ZapanButton>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors"
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                ) :

                    /* ═════════════════════════════════════════════════════════════════════
                        CASE 2: Awaiting Payment (Link Generated)
                        ═════════════════════════════════════════════════════════════════════ */
                    paymentLinkInfo ? (
                        <div className="flex flex-col md:flex-row bg-white min-h-[500px]">
                            {/* Left Side: Large QR Display */}
                            <div className="w-full md:w-1/2 bg-[#7C1D3E]/5 flex flex-col items-center justify-center p-10 border-r border-[#7C1D3E]/10 relative">
                                <div className="absolute top-8 left-8 bg-[#7C1D3E] text-white px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-[#7C1D3E]/30">
                                    Scan to Pay
                                </div>

                                <div className="relative p-8 bg-white border-4 border-[#7C1D3E]/20 rounded-[3rem] shadow-2xl group transition-all duration-500 hover:border-[#7C1D3E]/40">
                                    <QRCode value={paymentLinkInfo.link} size={280} className="rounded-xl" />
                                </div>
                                <div className="mt-8 text-center">
                                    <p className="text-xs font-black text-[#7C1D3E]/60 mb-3 uppercase tracking-widest">Supports Any UPI App</p>
                                    <div className="flex gap-4 items-center justify-center opacity-50 grayscale hover:grayscale-0 transition-all">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-5" alt="UPI" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Pay_Logo.svg" className="h-5" alt="GPay" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-4" alt="Paytm" />
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Order Info & Actions */}
                            <div className="w-full md:w-1/2 p-12 flex flex-col justify-between space-y-8">
                                <div className="space-y-8">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payment Link</h2>
                                            <p className="text-gray-400 font-bold text-sm mt-1">Remote Checkout Session</p>
                                        </div>
                                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-100">
                                            <div className="relative flex">
                                                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                                                <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Payable</p>
                                        <p className="text-5xl font-black text-[#7C1D3E]">₹{totals.total}</p>
                                    </div>

                                    <div className="bg-[#7C1D3E]/5 border border-[#7C1D3E]/10 p-5 rounded-2xl">
                                        <span className="text-[10px] uppercase font-black text-[#7C1D3E]/60 block mb-2 tracking-widest">Payment Link</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 truncate font-mono text-xs text-[#7C1D3E] font-bold bg-white px-4 py-3 rounded-xl border border-[#7C1D3E]/10 shadow-sm">
                                                {paymentLinkInfo.link}
                                            </div>
                                            <ZapanButton size="lg" className="shrink-0 aspect-square p-0 bg-white text-[#7C1D3E] border border-[#7C1D3E]/20 hover:bg-[#7C1D3E] hover:text-white rounded-xl shadow-sm" onClick={copyPaymentLink}>
                                                <FaCopy />
                                            </ZapanButton>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <ZapanButton
                                        variant="outline"
                                        onClick={() => {
                                            resetPOS();
                                            searchInputRef.current?.focus();
                                        }}
                                        className="flex-1 h-14 rounded-2xl bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-900 text-sm font-bold uppercase tracking-widest"
                                    >
                                        <FaPlus className="mr-2" /> New Order
                                    </ZapanButton>
                                    <ZapanButton
                                        onClick={openPaymentLink}
                                        className="flex-1 h-14 rounded-2xl bg-[#7C1D3E] hover:bg-[#601630] text-white text-sm font-bold uppercase tracking-widest shadow-xl shadow-[#7C1D3E]/20"
                                    >
                                        Open Link
                                    </ZapanButton>
                                    <ZapanButton
                                        onClick={handleClose}
                                        className="h-14 w-14 rounded-2xl bg-gray-900 hover:bg-black text-white p-0 shadow-lg"
                                        title="Close"
                                    >
                                        <FaPlus className="rotate-45 text-xl" />
                                    </ZapanButton>
                                </div>
                            </div>
                        </div>
                    ) :

                        /* ═════════════════════════════════════════════════════════════════════
                            CASE 2.5: Awaiting Payment (Dynamic QR Generated)
                            ═════════════════════════════════════════════════════════════════════ */
                        paymentQRInfo ? (
                            <div className="flex flex-col md:flex-row bg-white min-h-[500px]">
                                {/* Left Side: Large QR Display */}
                                <div className="w-full md:w-1/2 bg-blue-50 flex flex-col items-center justify-center p-10 border-r border-blue-100 relative">
                                    <div className="absolute top-8 left-8 bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-blue-500/30">
                                        UPI Dynamic QR
                                    </div>

                                    <div className="relative p-8 bg-white border-4 border-blue-200 rounded-[3rem] shadow-2xl group transition-all duration-500 hover:border-blue-400">
                                        <img
                                            src={paymentQRInfo.qrCode}
                                            alt="Payment QR"
                                            className="w-[280px] h-[280px] object-contain rounded-xl"
                                        />
                                    </div>
                                    <div className="mt-8 text-center text-blue-400">
                                        <p className="text-xs font-black mb-3 uppercase tracking-widest">Auto-Confirming Payment</p>
                                    </div>
                                </div>

                                {/* Right Side: Order Info & Actions */}
                                <div className="w-full md:w-1/2 p-12 flex flex-col justify-between space-y-8">
                                    <div className="space-y-8">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Checkout</h2>
                                                <p className="text-gray-400 font-bold text-sm mt-1">Scanner Active</p>
                                            </div>
                                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-100">
                                                <div className="animate-spin text-blue-600">
                                                    <FaQrcode />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Waiting</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
                                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Amount to Pay</p>
                                            <p className="text-6xl font-black text-gray-900 leading-tight">₹{totals.total}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Order Ref</span>
                                                <span className="text-xs font-bold text-gray-700 font-mono">{paymentQRInfo.orderId}</span>
                                            </div>
                                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Invoice</span>
                                                <span className="text-xs font-bold text-gray-700 font-mono truncate block">{paymentQRInfo.invoiceId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <ZapanButton
                                            variant="outline"
                                            onClick={() => {
                                                resetPOS();
                                                searchInputRef.current?.focus();
                                            }}
                                            className="flex-1 h-14 rounded-2xl bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-900 text-sm font-bold uppercase tracking-widest"
                                        >
                                            <FaPlus className="mr-2" /> New Order
                                        </ZapanButton>
                                        <ZapanButton
                                            onClick={handleClose}
                                            className="flex-1 h-14 rounded-2xl bg-gray-900 hover:bg-black text-white text-sm font-bold uppercase tracking-widest shadow-xl"
                                        >
                                            Close
                                        </ZapanButton>
                                    </div>
                                </div>
                            </div>
                        ) :


                            /* ═════════════════════════════════════════════════════════════════════
                                CASE 3: Main POS Cart / Checkout
                                ═════════════════════════════════════════════════════════════════════ */
                            (
                                <div className="flex flex-col lg:flex-row h-full min-h-0">
                                    {/* Left: Product Search & Cart */}
                                    <div className="flex-[1.5] flex flex-col h-full bg-white p-4 md:p-8 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-hidden min-h-[400px] lg:min-h-0">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[#7C1D3E] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#7C1D3E]/30">
                                                    <FaBarcode className="text-xl" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Point of Sale</h2>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">{invoiceNumber}</p>
                                                </div>
                                            </div>
                                            <ZapanBadge variant="brand" className="px-4 py-2 text-xs">Admin POS</ZapanBadge>
                                        </div>

                                        {/* Search Bar */}
                                        <div className="mb-6 relative z-50">
                                            <ZapanInput
                                                ref={searchInputRef}
                                                icon={FaSearch}
                                                type="text"
                                                placeholder="Scan barcode or type product name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={handleSearchKeyDown}
                                                className="h-16 text-lg shadow-lg shadow-gray-200/50 border-gray-200 focus:border-[#7C1D3E]"
                                                autoFocus
                                            />

                                            {/* Search Results Dropdown */}
                                            {searchQuery && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[400px] overflow-y-auto z-[100]">
                                                    {isSearching ? (
                                                        <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Searching...</div>
                                                    ) : searchResults.length > 0 ? (
                                                        <div className="p-2">
                                                            {searchResults.map((product) => (
                                                                <div key={product._id} className="p-4 hover:bg-gray-50 rounded-xl mb-1 group transition-colors">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                                                            <img src={product.img[0] || "/placeholder.png"} className="w-full h-full object-cover" alt="" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-bold text-gray-900 mb-0.5">{product.name}</p>
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU: {product.sku}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-4 flex flex-wrap gap-2 pl-16">
                                                                        {product.sizes && Array.isArray(product.sizes) ? (
                                                                            product.sizes.map((size) => (
                                                                                <button
                                                                                    key={size._id}
                                                                                    onClick={() => addToCart(product, size._id, 1)}
                                                                                    disabled={size.stock === 0}
                                                                                    className={`px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all
                                                                                        ${size.stock === 0
                                                                                            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                                                                                            : 'border-gray-200 text-gray-600 hover:border-[#7C1D3E] hover:text-[#7C1D3E] hover:bg-[#7C1D3E]/5'
                                                                                        }`}
                                                                                >
                                                                                    {size.size} — ₹{size.offerPrice || product.actualPrice}
                                                                                    {size.stock === 0 && " (Out)"}
                                                                                </button>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-xs text-red-500 font-bold">No sizes</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-8 text-center text-gray-400 font-bold text-sm">No products found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Cart Items List */}
                                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                                            {cart.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                                                    <FaBarcode className="text-6xl opacity-20" />
                                                    <p className="font-bold uppercase tracking-widest text-sm text-center">Cart is empty<br />Scan to start</p>
                                                </div>
                                            ) : (
                                                cart.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-[#7C1D3E]/20 transition-colors">
                                                        <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shadow-sm shrink-0">
                                                            <img src={item.product.img[0] || "/placeholder.png"} className="w-full h-full object-cover" alt="" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-gray-900 truncate">{item.product.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                                    {item.selectedSize.size}
                                                                </span>
                                                                <span className="text-xs font-bold text-[#7C1D3E]">
                                                                    ₹{item.selectedSize.offerPrice || item.product.actualPrice}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                                                            <button
                                                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                                            >
                                                                <FaMinus className="text-xs" />
                                                            </button>
                                                            <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                                            >
                                                                <FaPlus className="text-xs" />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => removeFromCart(index)}
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all ml-2"
                                                        >
                                                            <FaTrash className="text-sm" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Payment & Checkout */}
                                    <div className="w-full lg:w-[400px] xl:w-[450px] bg-gray-50 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-gray-100 min-h-0">
                                        <div className="p-4 md:p-8 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                                            {/* Customer */}
                                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                                                <div className="flex items-center gap-2 text-[#7C1D3E] mb-2">
                                                    <FaMobileAlt />
                                                    <span className="text-xs font-black uppercase tracking-widest">Customer Details</span>
                                                </div>
                                                <ZapanInput
                                                    ref={phoneInputRef}
                                                    label="Mobile Number *"
                                                    placeholder="10-digit number"
                                                    value={customerPhone}
                                                    onChange={(e: any) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                    maxLength={10}
                                                    className="bg-gray-50 border-gray-200"
                                                />
                                            </div>

                                            {/* Payment */}
                                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                                                <div className="flex items-center gap-2 text-[#7C1D3E] mb-2">
                                                    <FaWallet />
                                                    <span className="text-xs font-black uppercase tracking-widest">Payment Method</span>
                                                </div>

                                                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                                                    <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-100 bg-gray-50 font-bold text-sm text-gray-900 focus:ring-[#7C1D3E]/20 hover:border-[#7C1D3E]/30 transition-colors">
                                                        <SelectValue placeholder="Select Method" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-gray-100 shadow-xl z-[99999]" position="popper" sideOffset={5}>
                                                        <SelectItem value="CASH" className="py-3 px-4 font-bold text-gray-700 focus:bg-emerald-50 focus:text-emerald-700">💵 Cash Payment</SelectItem>
                                                        <SelectItem value="UPI" className="py-3 px-4 font-bold text-gray-700 focus:bg-blue-50 focus:text-blue-700">📱 UPI (Manual)</SelectItem>
                                                        <SelectItem value="CARD" className="py-3 px-4 font-bold text-gray-700 focus:bg-purple-50 focus:text-purple-700">💳 Card Swipe</SelectItem>
                                                        <SelectItem value="RAZORPAY_QR" className="py-3 px-4 font-bold text-gray-700 focus:bg-indigo-50 focus:text-indigo-700">🔳 Dynamic QR</SelectItem>
                                                        <SelectItem value="RAZORPAY_PAYMENT_LINK" className="py-3 px-4 font-bold text-gray-700 focus:bg-pink-50 focus:text-pink-700">🔗 Send Link</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {(paymentMethod === "UPI" || paymentMethod === "CARD") && (
                                                    <div className="animate-in slide-in-from-top-2 pt-2">
                                                        <ZapanInput
                                                            label="Transaction ID (Optional)"
                                                            placeholder="Enter Ref No."
                                                            value={transactionDetails}
                                                            onChange={(e: any) => setTransactionDetails(e.target.value)}
                                                            className="bg-gray-50 border-gray-200"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Summary Footer */}
                                        <div className="bg-white p-4 md:p-8 rounded-t-[2rem] md:rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] space-y-4 md:space-y-6 z-10 sticky bottom-0 border-t border-gray-50">
                                            <div className="space-y-2 md:space-y-3">
                                                <div className="flex justify-between text-xs md:text-sm text-gray-500 font-medium">
                                                    <span>Subtotal</span>
                                                    <span>₹{totals.subtotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 md:pt-4 border-t border-gray-100">
                                                    <span className="text-gray-900 font-black text-base md:text-lg">Total Payable</span>
                                                    <span className="text-[#7C1D3E] font-black text-2xl md:text-3xl">₹{totals.total.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 md:gap-3">
                                                <ZapanButton
                                                    onClick={resetPOS}
                                                    className="flex-none w-12 h-12 md:w-14 md:h-14 bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl md:rounded-2xl"
                                                    title="Clear Cart"
                                                >
                                                    <FaTrash />
                                                </ZapanButton>
                                                <ZapanButton
                                                    onClick={processPOSOrder}
                                                    disabled={isProcessing || cart.length === 0}
                                                    className={`flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl text-sm md:text-base font-black uppercase tracking-widest shadow-xl transition-all
                                                        ${isProcessing || cart.length === 0
                                                            ? 'bg-gray-200 text-gray-400 shadow-none'
                                                            : 'bg-[#7C1D3E] hover:bg-[#601630] text-white hover:scale-[1.02] shadow-[#7C1D3E]/30'
                                                        }`}
                                                >
                                                    {isProcessing ? "Processing..." : "Complete Order"}
                                                </ZapanButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
            </DialogContent>
        </Dialog>
    );
};

export default POSModal;
