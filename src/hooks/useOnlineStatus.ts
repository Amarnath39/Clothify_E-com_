"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook to detect online/offline status
 * Returns true when online, false when offline
 */
export default function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Check initial status
        setIsOnline(navigator.onLine);

        // Event handlers
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Add event listeners
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}
