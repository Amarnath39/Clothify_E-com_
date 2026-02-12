"use client";

import React from "react";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { FiWifiOff } from "react-icons/fi";

/**
 * Admin Offline Warning Banner
 * Shows a fixed banner at the top when admin is offline
 */
export default function OfflineWarningAdmin() {
    const isOnline = useOnlineStatus();

    if (isOnline) {
        return null; // Don't render when online
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xl">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-center gap-3">
                    <FiWifiOff size={20} className="animate-pulse" />
                    <p className="text-sm font-bold tracking-wide">
                        You are offline. Inventory updates and real-time data are disabled.
                    </p>
                </div>
            </div>
        </div>
    );
}
