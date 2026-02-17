"use client";

import React, { useCallback, useEffect, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";

const STORAGE_KEYS = {
    installed: "admin-pwa-installed",
    neverShow: "admin-pwa-never-show",
    cooldownUntil: "admin-pwa-cooldown-until",
    shownThisSession: "admin-pwa-shown-this-session",
} as const;

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Admin Install Prompt Component
 * Shows install prompt for admin PWA
 * Only appears after beforeinstallprompt event
 */
export default function InstallPromptAdmin() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [neverShowAgainChecked, setNeverShowAgainChecked] = useState(false);

    const markShownThisSession = useCallback(() => {
        sessionStorage.setItem(STORAGE_KEYS.shownThisSession, "true");
    }, []);

    const isInstalled = useCallback(() => {
        if (typeof window === "undefined") return false;
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
            localStorage.getItem(STORAGE_KEYS.installed) === "true"
        );
    }, []);

    const isEligibleToShow = useCallback(() => {
        if (typeof window === "undefined") return false;

        const neverShow = localStorage.getItem(STORAGE_KEYS.neverShow) === "true";
        const shownThisSession = sessionStorage.getItem(STORAGE_KEYS.shownThisSession) === "true";
        const cooldownUntil = Number(localStorage.getItem(STORAGE_KEYS.cooldownUntil) || "0");
        const inCooldown = cooldownUntil > Date.now();

        return !neverShow && !shownThisSession && !inCooldown && !isInstalled();
    }, [isInstalled]);

    useEffect(() => {
        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);

            if (isEligibleToShow()) {
                setNeverShowAgainChecked(false);
                setShowPrompt(true);
                markShownThisSession();
            }
        };

        const handleAppInstalled = () => {
            localStorage.setItem(STORAGE_KEYS.installed, "true");
            localStorage.setItem(STORAGE_KEYS.neverShow, "true");
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Listen for successful installation
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, [isEligibleToShow, markShownThisSession]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Rule: once user clicks install, never show this popup again.
        localStorage.setItem(STORAGE_KEYS.neverShow, "true");
        markShownThisSession();

        // Show install prompt
        deferredPrompt.prompt();

        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("Admin PWA installed");
            localStorage.setItem(STORAGE_KEYS.installed, "true");
        } else {
            console.log("Admin PWA installation dismissed");
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleMaybeLaterOrClose = () => {
        if (neverShowAgainChecked) {
            localStorage.setItem(STORAGE_KEYS.neverShow, "true");
            localStorage.removeItem(STORAGE_KEYS.cooldownUntil);
        } else {
            localStorage.setItem(STORAGE_KEYS.cooldownUntil, String(Date.now() + THREE_DAYS_MS));
        }

        markShownThisSession();
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
                        onClick={handleMaybeLaterOrClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    Install the admin panel as an app for faster access and offline UI support.
                </p>

                <label className="flex items-center gap-2 mb-4 text-xs text-gray-600 select-none">
                    <input
                        type="checkbox"
                        checked={neverShowAgainChecked}
                        onChange={(e) => setNeverShowAgainChecked(e.target.checked)}
                        className="h-4 w-4 accent-[#7C1D3E]"
                    />
                    Never show this message again
                </label>

                <div className="flex gap-2">
                    <Button
                        onClick={handleInstall}
                        className="flex-1 bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B] hover:opacity-90 text-white font-bold"
                    >
                        Install
                    </Button>
                    <Button
                        onClick={handleMaybeLaterOrClose}
                        variant="outline"
                        className="flex-1"
                    >
                        Maybe later
                    </Button>
                </div>
            </div>
        </div>
    );
}

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
