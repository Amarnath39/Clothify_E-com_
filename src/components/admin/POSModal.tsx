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
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

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
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<any>(null);

    // ✅ Refs
    const searchInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);

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
            if (firstProduct.sizes.length === 1) {
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

        cart.forEach((item) => {
            const price = item.selectedSize.offerPrice || item.product.actualPrice;
            subtotal += price * item.quantity;
            totalItems += item.quantity;
        });

        const discount = 0; // Can add discount logic later
        const total = subtotal - discount;

        return { subtotal, discount, total, totalItems };
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

            const { data } = await axios.post(
                "/api/admin/pos",
                {
                    customerPhone,
                    productDetails,
                    paymentMethod,
                    shippingCost: 0,
                },
                {
                    headers: {
                        "x-admin-id": localStorage.getItem("adminId"),
                    },
                }
            );

            if (data.success) {
                toast.success("POS order completed successfully!");
                setCompletedOrder(data.order);
                // Don't close modal yet - show invoice print option
            }
        } catch (error: any) {
            console.error("POS order failed:", error);
            const errorMessage =
                error.response?.data?.message || "POS order failed";
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    // ✅ Print Invoice
    const printInvoice = () => {
        if (!completedOrder) return;

        // Create print window
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast.error("Please allow popups to print invoice");
            return;
        }

        const totals = calculateTotals();

        const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${completedOrder.invoiceId}</title>
        <style>
          @media print {
            body { margin: 0; padding: 10px; font-family: monospace; font-size: 12px; }
          }
          body { width: 80mm; font-family: monospace; font-size: 12px; }
          h1 { font-size: 16px; text-align: center; margin: 10px 0; }
          .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 3px 0; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        <h1>POS INVOICE</h1>
        <div class="divider"></div>
        <p><strong>Invoice:</strong> ${completedOrder.invoiceId}</p>
        <p><strong>Date:</strong> ${new Date(completedOrder.createdAt).toLocaleString()}</p>
        <p><strong>Phone:</strong> ${completedOrder.customerPhone}</p>
        <p><strong>Payment:</strong> ${completedOrder.paymentMethod}</p>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map((item) => {
            const price = item.selectedSize.offerPrice || item.product.actualPrice;
            const total = price * item.quantity;
            return `
                <tr>
                  <td>${item.product.name}<br><small>${item.selectedSize.size}</small></td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">₹${price}</td>
                  <td class="right">₹${total}</td>
                </tr>
              `;
        }).join("")}
          </tbody>
        </table>
        <div class="divider"></div>
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="right">₹${totals.subtotal.toFixed(2)}</td>
          </tr>
          ${totals.discount > 0 ? `
          <tr>
            <td>Discount:</td>
            <td class="right">-₹${totals.discount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total">
            <td>TOTAL:</td>
            <td class="right">₹${totals.total.toFixed(2)}</td>
          </tr>
        </table>
        <div class="divider"></div>
        <p style="text-align: center; margin-top: 15px;">Thank You!</p>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    };

    // ✅ Reset POS
    const resetPOS = () => {
        setCart([]);
        setCustomerPhone("");
        setPaymentMethod("CASH");
        setSearchQuery("");
        setSearchResults([]);
        setCompletedOrder(null);
        generateInvoiceNumber();
    };

    // ✅ Close and reset
    const handleClose = () => {
        if (cart.length > 0 && !completedOrder) {
            if (!confirm("Cart has items. Are you sure you want to close?")) {
                return;
            }
        }
        onClose();
    };

    const totals = calculateTotals();

    // ✅ If order completed, show success screen
    if (completedOrder) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
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
            </Dialog>
        );
    }

    // ✅ Main POS Interface
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
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
                                                    {product.sizes.map((size) => (
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
                                                    ))}
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
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CASH">💵 Cash</SelectItem>
                                            <SelectItem value="UPI">📱 UPI</SelectItem>
                                            <SelectItem value="CARD">💳 Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Totals */}
                        <Card>
                            <CardContent className="p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>₹{totals.subtotal.toFixed(2)}</span>
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
        </Dialog>
    );
};

export default POSModal;
