"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { toast } from "react-hot-toast";
import axios from "axios";

const TwoFASettings = () => {
    const { user } = useSelector((state: any) => state.auth);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState<any>(null);
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"status" | "setup" | "verify">("status");

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get("/api/2fa/status", {
                headers: { "x-admin-id": user._id }
            });
            if (data.success) {
                setStatus({ enabled: data.enabled });
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error("Failed to fetch 2FA status:", error);
            toast.error("Failed to fetch accurate 2FA status from server");
            // Fallback to Redux user state if API fails
            setStatus(user.twoFA || { enabled: false });
        }
    };

    useEffect(() => {
        if (user) {
            fetchStatus();
        }
    }, [user]);

    const handleEnableStart = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post("/api/2fa/setup", {}, {
                headers: { "x-admin-id": user._id }
            });
            if (data.qr) {
                setSetupData(data);
                setStep("setup");
            }
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            toast.error(error.response?.data?.msg || "Failed to start 2FA setup");
        }
    };

    const handleVerify = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post("/api/2fa/verify", { token: otp }, {
                headers: { "x-admin-id": user._id }
            });
            if (data.success || data.msg === "2FA enabled") {
                toast.success("2FA Enabled Successfully");
                setStep("status");
                setStatus({ enabled: true });
            }
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            toast.error(error.response?.data?.msg || "Failed to verify 2FA");
        }
    };

    const handleDisable = async () => {
        if (!confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;
        try {
            setLoading(true);
            // We need a disable endpoint
            const { data } = await axios.post("/api/2fa/disable", {}, {
                headers: { "x-admin-id": user._id }
            });
            if (data.success) {
                toast.success("2FA Disabled");
                setStatus({ enabled: false });
            }
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            toast.error(error.response?.data?.msg || "Failed to disable 2FA");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === "status" && (
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div>
                                <p className="font-medium">Status</p>
                                <p className={`text-sm ${status?.enabled ? "text-green-600" : "text-red-600"}`}>
                                    {status?.enabled ? "Enabled" : "Disabled"}
                                </p>
                            </div>
                            {status?.enabled ? (
                                <Button variant="destructive" onClick={handleDisable} disabled={loading}>
                                    Disable 2FA
                                </Button>
                            ) : (
                                <Button onClick={handleEnableStart} disabled={loading}>
                                    Enable 2FA
                                </Button>
                            )}
                        </div>
                    )}

                    {step === "setup" && setupData && (
                        <div className="space-y-4 text-center">
                            <p className="text-sm text-gray-600">
                                Scan the QR code below with your Authenticator app (Google Authenticator, Microsoft Authenticator, etc.)
                            </p>
                            <div className="flex justify-center p-4 bg-white border rounded-lg">
                                <img src={setupData.qr} alt="2FA QR Code" className="w-48 h-48" />
                            </div>
                            <div className="text-left space-y-2">
                                <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                                    Manual Key: {setupData.manualKey}
                                </p>
                            </div>
                            <Button onClick={() => setStep("verify")} className="w-full">
                                I've scanned the code
                            </Button>
                            <Button variant="ghost" onClick={() => setStep("status")} className="w-full">
                                Cancel
                            </Button>
                        </div>
                    )}

                    {step === "verify" && (
                        <div className="space-y-4">
                            <p className="text-sm text-center text-gray-600">
                                Enter the 6-digit code from your authenticator app to verify.
                            </p>
                            <Input
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="text-center text-2xl tracking-widest"
                            />
                            <Button onClick={handleVerify} className="w-full" disabled={loading || otp.length !== 6}>
                                {loading ? "Verifying..." : "Verify & Enable"}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep("setup")} className="w-full">
                                Back
                            </Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="text-xs text-gray-500">
                    Make sure you have a backup of your manual key in case you lose access to your device.
                </CardFooter>
            </Card>
        </div>
    );
};

export default TwoFASettings;
