"use client";

import React, { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { Button } from "@/components/ui/button";

/**
 * Admin Update Notification Component
 * Notifies admin when a new service worker version is available
 */
export default function UpdateNotificationAdmin() {
    const [showUpdate, setShowUpdate] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        const checkForUpdates = async () => {
            const registration = await navigator.serviceWorker.getRegistration("/admin/");

            if (!registration) return;

            // Check if there's a waiting worker
            if (registration.waiting) {
                setWaitingWorker(registration.waiting);
                setShowUpdate(true);
            }

            // Listen for new service worker installing
            registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;

                if (!newWorker) return;

                newWorker.addEventListener("statechange", () => {
                    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                        setWaitingWorker(newWorker);
                        setShowUpdate(true);
                    }
                });
            });
        };

        checkForUpdates();

        // Listen for controller change (new SW activated)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            window.location.reload();
        });
    }, []);

    const handleUpdate = () => {
        if (!waitingWorker) return;

        // Send SKIP_WAITING message to the waiting service worker
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
    };

    if (!showUpdate) {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <FiRefreshCw className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">Update Available</h3>
                        <p className="text-xs text-gray-500 mt-0.5">A new version of the admin panel is ready</p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    Click reload to update to the latest version with new features and improvements.
                </p>

                <Button
                    onClick={handleUpdate}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-white font-bold"
                >
                    <FiRefreshCw className="mr-2" size={16} />
                    Reload to Update
                </Button>
            </div>
        </div>
    );
}
