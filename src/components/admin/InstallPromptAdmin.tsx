"use client";

import React, { useEffect, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";

/**
 * Admin Install Prompt Component
 * Shows install prompt for admin PWA
 * Only appears after beforeinstallprompt event
 */
export default function InstallPromptAdmin() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already installed or dismissed
        const isDismissed = localStorage.getItem("admin-pwa-dismissed");
        const isInstalled = localStorage.getItem("admin-pwa-installed");

        if (isDismissed || isInstalled) {
            return;
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Listen for successful installation
        window.addEventListener("appinstalled", () => {
            localStorage.setItem("admin-pwa-installed", "true");
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show install prompt
        deferredPrompt.prompt();

        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("Admin PWA installed");
            localStorage.setItem("admin-pwa-installed", "true");
        } else {
            console.log("Admin PWA installation dismissed");
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem("admin-pwa-dismissed", "true");
        setShowPrompt(false);
    };

    if (!showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C1D3E] to-[#E91E7B] flex items-center justify-center">
                            <FiDownload className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Install Admin Panel</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Quick access from your device</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    Install the admin panel as an app for faster access and offline UI support.
                </p>

                <div className="flex gap-2">
                    <Button
                        onClick={handleInstall}
                        className="flex-1 bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B] hover:opacity-90 text-white font-bold"
                    >
                        Install Now
                    </Button>
                    <Button
                        onClick={handleDismiss}
                        variant="outline"
                        className="flex-1"
                    >
                        Maybe Later
                    </Button>
                </div>
            </div>
        </div>
    );
}
