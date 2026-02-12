"use client";

import React from "react";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import toast from "react-hot-toast";

/**
 * Higher-Order Component to wrap components that require online status
 * Prevents actions when offline and shows warning
 */
export default function withOnlineCheck<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options?: {
        showToast?: boolean;
        customMessage?: string;
    }
) {
    return function WithOnlineCheckWrapper(props: P) {
        const isOnline = useOnlineStatus();

        const handleOfflineAction = (e: React.MouseEvent) => {
            if (!isOnline) {
                e.preventDefault();
                e.stopPropagation();

                const message = options?.customMessage ||
                    "You are offline. This action requires an internet connection.";

                if (options?.showToast !== false) {
                    toast.error(message, {
                        icon: "📡",
                        duration: 4000,
                    });
                }
            }
        };

        return (
            <div onClick={handleOfflineAction} className={!isOnline ? "pointer-events-none opacity-50" : ""}>
                <WrappedComponent {...props} />
            </div>
        );
    };
}
