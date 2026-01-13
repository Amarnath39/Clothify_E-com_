"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    FaWhatsapp,
    FaFacebook,
    FaFacebookMessenger,
    FaCopy,
    FaShareAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

interface ShareProps {
    product: {
        name: string;
        description?: string;
        img: string[];
        actualPrice: number;
        offerPrice?: number;
    };
    currentPrice?: number;
}

const UniversalShare = ({ product, currentPrice }: ShareProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const productUrl = typeof window !== "undefined" ? window.location.href : "";
    const price = currentPrice || product.offerPrice || product.actualPrice;
    const shareText = `Check out this product: ${product.name}\nPrice: ₹${price}\n`;

    const handleShare = async () => {
        if (navigator.share) {
            setIsSharing(true);
            try {
                const shareData: ShareData = {
                    title: product.name,
                    text: shareText,
                    url: productUrl,
                };

                // Try to share with image if supported
                if (navigator.canShare && product.img && product.img.length > 0) {
                    try {
                        let imageUrl = product.img[0];
                        if (!imageUrl.startsWith("http")) {
                            imageUrl = window.location.origin + imageUrl;
                        }
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        const file = new File([blob], "product.jpg", { type: blob.type });

                        if (navigator.canShare({ files: [file] })) {
                            shareData.files = [file];
                        }
                    } catch (err) {
                        console.error("Error preparing file for share:", err);
                    }
                }

                await navigator.share(shareData);
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    console.error("Error sharing:", err);
                    setIsOpen(true); // Fallback to modal on error
                }
            } finally {
                setIsSharing(false);
            }
        } else {
            setIsOpen(true); // Fallback to modal if Web Share API is not supported
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(productUrl);
        toast.success("Link copied to clipboard!");
        setIsOpen(false);
    };

    const shareToWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
            shareText + " " + productUrl
        )}`;
        window.open(whatsappUrl, "_blank");
        setIsOpen(false);
    };

    const shareToFacebook = () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            productUrl
        )}`;
        window.open(fbUrl, "_blank");
        setIsOpen(false);
    };

    const shareToMessenger = () => {
        // Messenger sharing works best via the Facebook sharer or dedicated mobile link
        const messengerUrl = `fb-messenger://share/?link=${encodeURIComponent(
            productUrl
        )}`;
        // Fallback if app not installed
        const webMessengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
            productUrl
        )}&app_id=YOUR_FB_APP_ID&redirect_uri=${encodeURIComponent(productUrl)}`;

        window.open(messengerUrl, "_blank");
        // Since we don't have an FB APP ID, the best fallback is copy link or normal FB share.
        // For now, we just try the messenger protocol.
        setIsOpen(false);
    };

    return (
        <>
            <Button
                variant="outline"
                className="h-12 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 transition-colors px-4"
                onClick={handleShare}
                disabled={isSharing}
                title="Share product"
            >
                <FaShareAlt className="text-blue-600" />
                <span className="font-medium text-blue-600">Share</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center sm:text-left">Share Product</DialogTitle>
                        <DialogDescription className="text-center sm:text-left">
                            Share "{product.name}" with your friends and family.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-4 gap-4 py-6">
                        <button
                            onClick={shareToWhatsApp}
                            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-green-200 group-hover:shadow-green-300 transition-all">
                                <FaWhatsapp size={28} />
                            </div>
                            <span className="text-xs font-medium text-gray-600">WhatsApp</span>
                        </button>
                        <button
                            onClick={shareToFacebook}
                            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:shadow-blue-300 transition-all">
                                <FaFacebook size={28} />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Facebook</span>
                        </button>
                        <button
                            onClick={shareToMessenger}
                            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#006AFF] via-[#00B2FF] to-[#00FFF0] flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:shadow-blue-200 transition-all">
                                <FaFacebookMessenger size={28} />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Messenger</span>
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 shadow-lg shadow-gray-100 group-hover:shadow-gray-200 transition-all">
                                <FaCopy size={24} />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Copy Link</span>
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <input
                            className="flex-1 bg-transparent text-sm text-gray-500 outline-none truncate"
                            value={productUrl}
                            readOnly
                        />
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={copyToClipboard}>
                            Copy
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UniversalShare;
