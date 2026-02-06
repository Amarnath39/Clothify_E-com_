"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
    FaUser,
    FaBox,
    FaCreditCard,
    FaTruck,
    FaSearch,
    FaTrash,
    FaPlus,
} from "react-icons/fa";

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
        if (!customerName || !customerPhone) {
            toast.error("Customer name and phone are required");
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md bg-white shadow-xl animate-in fade-in zoom-in">
                    <CardHeader className="text-center border-b pb-4">
                        <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                            <FaCreditCard className="text-blue-600 text-2xl" />
                        </div>
                        <CardTitle>Payment Link Generated</CardTitle>
                        <p className="text-sm text-gray-500">Order ID: {createdOrderId}</p>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="text-center space-y-2">
                            <p className="font-medium">Amount to Pay</p>
                            <p className="text-3xl font-bold text-green-600">₹{total.toFixed(2)}</p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 border">
                            <Input
                                readOnly
                                value={paymentLinkData.url}
                                className="bg-white border-none shadow-none focus-visible:ring-0"
                            />
                            <Button size="sm" onClick={copyToClipboard}>Copy</Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-blue-600 animate-pulse">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <span className="font-medium">Waiting for customer to pay...</span>
                            </div>
                            <p className="text-xs text-center text-gray-400">
                                This screen will automatically update when payment is received.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    // Allow manual exit
                                    if (window.confirm("Payment is still pending. Leave this page?")) {
                                        router.push('/admin/get-orders');
                                    }
                                }}
                            >
                                Close & Check Later
                            </Button>
                            {/* Optional: Manual Refresh or Check Status button could go here */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Create Offline Order</h1>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    Admin Only
                </Badge>
            </div>

            {/* 1️⃣ CUSTOMER DETAILS */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FaUser className="mr-2" /> Customer Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Full Name *</Label>
                            <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer name"
                            />
                        </div>
                        <div>
                            <Label>Phone Number *</Label>
                            <Input
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div>
                            <Label>Email (Optional)</Label>
                            <Input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="Enter email"
                            />
                        </div>
                    </div>

                    <Separator />

                    <h4 className="font-semibold">Billing Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label>Address *</Label>
                            <Textarea
                                value={billingAddress}
                                onChange={(e) => setBillingAddress(e.target.value)}
                                placeholder="Enter billing address"
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label>City *</Label>
                            <Input
                                value={billingCity}
                                onChange={(e) => setBillingCity(e.target.value)}
                                placeholder="City"
                            />
                        </div>
                        <div>
                            <Label>State *</Label>
                            <Input
                                value={billingState}
                                onChange={(e) => setBillingState(e.target.value)}
                                placeholder="State"
                            />
                        </div>
                        <div>
                            <Label>ZIP Code *</Label>
                            <Input
                                value={billingZipCode}
                                onChange={(e) => setBillingZipCode(e.target.value)}
                                placeholder="ZIP Code"
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={shippingSameAsBilling}
                            onCheckedChange={(checked) =>
                                setShippingSameAsBilling(checked as boolean)
                            }
                        />
                        <Label>Shipping address same as billing</Label>
                    </div>

                    {!shippingSameAsBilling && (
                        <>
                            <h4 className="font-semibold">Shipping Address</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={shippingName}
                                        onChange={(e) => setShippingName(e.target.value)}
                                        placeholder="Recipient name"
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={shippingPhone}
                                        onChange={(e) => setShippingPhone(e.target.value)}
                                        placeholder="Recipient phone"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Address</Label>
                                    <Textarea
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                        placeholder="Shipping address"
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <Label>City</Label>
                                    <Input
                                        value={shippingCity}
                                        onChange={(e) => setShippingCity(e.target.value)}
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <Label>State</Label>
                                    <Input
                                        value={shippingState}
                                        onChange={(e) => setShippingState(e.target.value)}
                                        placeholder="State"
                                    />
                                </div>
                                <div>
                                    <Label>ZIP Code</Label>
                                    <Input
                                        value={shippingZipCode}
                                        onChange={(e) => setShippingZipCode(e.target.value)}
                                        placeholder="ZIP Code"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 2️⃣ PRODUCT SELECTION */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FaBox className="mr-2" /> Product Selection
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by product name or SKU..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
                        />
                        <Button onClick={handleProductSearch} disabled={isSearching}>
                            <FaSearch className="mr-2" />
                            {isSearching ? "Searching..." : "Search"}
                        </Button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
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
                        <>
                            <Separator />
                            <h4 className="font-semibold">Selected Products</h4>
                            <div className="space-y-2">
                                {selectedProducts.map((item, index) => {
                                    const size = item.product.sizes.find(
                                        (s) => s._id === item.selectedSize
                                    );
                                    const price = size?.offerPrice || item.product.actualPrice;
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.product.img[0]}
                                                    alt={item.product.name}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                                <div>
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Size: {size?.size} | Qty: {item.quantity}
                                                    </p>
                                                    <p className="text-sm font-semibold">
                                                        ₹{price} × {item.quantity} = ₹
                                                        {(price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoveProduct(index)}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 3️⃣ PAYMENT & PRICE SUMMARY */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FaCreditCard className="mr-2" /> Payment & Price Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Payment Mode</Label>
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="COD">COD</SelectItem>
                                    <SelectItem value="RAZORPAY_LINK">Razorpay Link (SMS/Email)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Payment Status</Label>
                            <Select
                                value={paymentStatus}
                                onValueChange={setPaymentStatus}
                                disabled={paymentMode === "RAZORPAY_LINK"} // Auto-set to Pending for Link
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span className="font-semibold">₹{shippingCost.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 4️⃣ SHIPPING */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FaTruck className="mr-2" /> Shipping Method
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Shipping Cost (₹)</Label>
                        <Input
                            type="number"
                            value={shippingCost}
                            onChange={(e) => setShippingCost(Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="dtdc"
                                checked={shippingMethod === "DTDC"}
                                onChange={() => setShippingMethod("DTDC")}
                            />
                            <Label htmlFor="dtdc">Ship via DTDC</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="manual"
                                checked={shippingMethod === "MANUAL"}
                                onChange={() => setShippingMethod("MANUAL")}
                            />
                            <Label htmlFor="manual">Manual / Self Shipping</Label>
                        </div>
                    </div>

                    {shippingMethod === "DTDC" && (
                        <div className="border rounded-lg p-4 space-y-4 bg-blue-50">
                            <h4 className="font-semibold">DTDC Shipping Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Pickup Pincode</Label>
                                    <Input
                                        value={dtdcPickupPincode}
                                        onChange={(e) => setDtdcPickupPincode(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Delivery Pincode *</Label>
                                    <Input
                                        value={dtdcDeliveryPincode}
                                        onChange={(e) => setDtdcDeliveryPincode(e.target.value)}
                                        placeholder="Required"
                                    />
                                </div>
                                <div>
                                    <Label>Weight (kg)</Label>
                                    <Input
                                        value={dtdcWeight}
                                        onChange={(e) => setDtdcWeight(e.target.value)}
                                        placeholder="Auto-calculated if empty"
                                    />
                                </div>
                                <div>
                                    <Label>Length (cm)</Label>
                                    <Input
                                        value={dtdcLength}
                                        onChange={(e) => setDtdcLength(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Breadth (cm)</Label>
                                    <Input
                                        value={dtdcBreadth}
                                        onChange={(e) => setDtdcBreadth(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Height (cm)</Label>
                                    <Input
                                        value={dtdcHeight}
                                        onChange={(e) => setDtdcHeight(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {shippingMethod === "MANUAL" && (
                        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                            <h4 className="font-semibold">Manual Shipping Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Courier Name *</Label>
                                    <Input
                                        value={manualCourierName}
                                        onChange={(e) => setManualCourierName(e.target.value)}
                                        placeholder="e.g., BlueDart, FedEx"
                                    />
                                </div>
                                <div>
                                    <Label>Tracking Number (Optional)</Label>
                                    <Input
                                        value={manualTrackingNumber}
                                        onChange={(e) => setManualTrackingNumber(e.target.value)}
                                        placeholder="Enter tracking number"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 5️⃣ NOTIFICATION CONTROLS */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={sendEmail}
                            onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                        />
                        <Label>Send Email Confirmation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={sendWhatsApp}
                            onCheckedChange={(checked) =>
                                setSendWhatsApp(checked as boolean)
                            }
                        />
                        <Label>Send WhatsApp Confirmation</Label>
                    </div>
                </CardContent>
            </Card>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || selectedProducts.length === 0}
                    size="lg"
                >
                    {isSubmitting ? "Creating Order..." : "Create Offline Order"}
                </Button>
            </div>
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

    return (
        <div className="flex items-start gap-4 p-3 border rounded-lg hover:bg-gray-50">
            <img
                src={product.img[0]}
                alt={product.name}
                className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <p className="text-sm font-semibold text-green-600">
                    ₹{product.actualPrice}
                </p>
            </div>
            <div className="flex gap-2 items-end">
                <div>
                    <Label className="text-xs">Size</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                        <SelectTrigger className="w-24">
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                            {product.sizes.map((size) => (
                                <SelectItem key={size._id} value={size._id}>
                                    {size.size} ({size.stock})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">Qty</Label>
                    <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-16"
                    />
                </div>
                <Button
                    size="sm"
                    onClick={() => onAdd(product, selectedSize, quantity)}
                >
                    <FaPlus />
                </Button>
            </div>
        </div>
    );
};

export default CreateOfflineOrderPage;
