"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { ZapanInput, PageHeader, Card as ZapanCard, Badge, Button } from "@/theme/components";
import { toast } from "react-hot-toast";
import axios from "axios";
import { FiShield, FiSmartphone, FiCheckCircle, FiAlertTriangle, FiCopy } from "react-icons/fi";

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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    }

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <PageHeader
                title="Two-Factor Authentication"
                description="Secure your account with an extra layer of protection."
                action={
                    <Badge variant="brand">
                        Security Protocol
                    </Badge>
                }
            />

            <ZapanCard className="max-w-3xl mx-auto p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                        <FiShield size={20} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Security Status</h3>
                </div>

                {step === "status" && (
                    <div className="space-y-6">
                        <div className={`flex items-center justify-between p-6 rounded-[2rem] border-2 ${status?.enabled ? "border-green-100 bg-green-50/50" : "border-red-100 bg-red-50/50"}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status?.enabled ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                    {status?.enabled ? <FiCheckCircle size={24} /> : <FiAlertTriangle size={24} />}
                                </div>
                                <div>
                                    <h4 className={`text-lg font-black ${status?.enabled ? "text-green-900" : "text-red-900"}`}>
                                        {status?.enabled ? "2FA is Active" : "2FA is Disabled"}
                                    </h4>
                                    <p className={`text-sm font-medium ${status?.enabled ? "text-green-700" : "text-red-700"}`}>
                                        {status?.enabled ? "Your account is currently protected." : "Enable 2FA to secure your account."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            {status?.enabled ? (
                                <Button
                                    variant="danger"
                                    onClick={handleDisable}
                                    disabled={loading}
                                    className="rounded-xl px-8 py-3"
                                >
                                    Disable 2FA
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleEnableStart}
                                    disabled={loading}
                                    className="rounded-xl px-8 py-3"
                                >
                                    Enable 2FA Protection
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {step === "setup" && setupData && (
                    <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                                <FiSmartphone size={32} />
                            </div>
                            <h4 className="text-xl font-black text-gray-900">Scan QR Code</h4>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code below.
                            </p>
                        </div>

                        <div className="flex justify-center p-6 bg-white border border-gray-100 rounded-3xl shadow-sm max-w-xs mx-auto">
                            <img src={setupData.qr} alt="2FA QR Code" className="w-48 h-48 mix-blend-multiply" />
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 text-center space-y-3 max-w-md mx-auto">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Manual Entry Key</p>
                            <div className="flex items-center justify-center gap-2">
                                <code className="text-sm font-mono font-bold text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-200">
                                    {setupData.manualKey}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(setupData.manualKey)}
                                    className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                                >
                                    <FiCopy size={14} />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400">Save this key in a secure location.</p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setStep("status")} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={() => setStep("verify")} className="flex-1">
                                Continue to Verification
                            </Button>
                        </div>
                    </div>
                )}

                {step === "verify" && (
                    <div className="animate-in slide-in-from-right-4 duration-500 space-y-8 max-w-md mx-auto">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 rounded-2xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center mx-auto mb-4">
                                <FiShield size={32} />
                            </div>
                            <h4 className="text-xl font-black text-gray-900">Verify Code</h4>
                            <p className="text-gray-500">
                                Enter the 6-digit code generated by your authenticator app to confirm setup.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <ZapanInput
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="text-center text-3xl tracking-[0.5em] font-mono h-20"
                                label="Verification Code"
                            />

                            <Button
                                onClick={handleVerify}
                                className="w-full h-14 text-lg"
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? "Verifying..." : "Verify & Enable 2FA"}
                            </Button>

                            <Button variant="ghost" onClick={() => setStep("setup")} className="w-full">
                                Back to QR Code
                            </Button>
                        </div>
                    </div>
                )}

            </ZapanCard>
        </div>
    );
};

export default TwoFASettings;
