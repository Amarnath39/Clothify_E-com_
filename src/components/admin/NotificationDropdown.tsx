"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiBell, FiPackage, FiShoppingCart, FiClock, FiTrash2, FiMaximize2, FiActivity } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Notification {
    _id: string;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any;
}

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/admin/notifications?limit=20");
            const json = await res.json();
            if (json.success) {
                setNotifications(json.notifications);
                setUnreadCount(json.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const res = await fetch(`/api/admin/notifications/${id}`, {
                method: "PATCH",
            });
            const json = await res.json();
            if (json.success) {
                setNotifications((prev) =>
                    prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        if (notification.type === "LOW_STOCK") {
            router.push("/admin/inventory");
        } else if (notification.type === "ORDER_PLACED" && notification.data?.orderId) {
            router.push("/admin/get-orders");
        }
        setIsOpen(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "LOW_STOCK": return <FiPackage className="text-amber-500" />;
            case "ORDER_PLACED": return <FiShoppingCart className="text-[#7C1D3E]" />;
            default: return <FiBell className="text-gray-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className={`relative cursor-pointer w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 border ${isOpen ? 'bg-[#7C1D3E] text-white border-[#7C1D3E] shadow-lg shadow-[#7C1D3E]/20' : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200 hover:text-gray-900 group'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <FiBell size={20} className={isOpen ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-[#E91E7B] rounded-full border-2 border-white ring-2 ring-[#E91E7B]/10 animate-pulse"></span>
                )}
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[22rem] md:w-96 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(124,29,62,0.15)] z-[60] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-black text-lg text-gray-900 leading-none">Intelligence</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Activity Stream</p>
                        </div>
                        {unreadCount > 0 && (
                            <Badge className="bg-[#7C1D3E] text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">{unreadCount} New</Badge>
                        )}
                    </div>

                    <ScrollArea className="h-[450px]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-6 text-gray-200">
                                    <FiActivity size={32} />
                                </div>
                                <h4 className="font-black text-gray-900 text-sm">Quiet for now</h4>
                                <p className="text-xs text-gray-400 mt-2 font-medium">Any system alerts or new orders will appear here in real-time.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-6 hover:bg-gray-50 cursor-pointer transition-all border-l-4 ${!notification.isRead ? 'border-[#7C1D3E] bg-[#7C1D3E]/[0.02]' : 'border-transparent'}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${!notification.isRead ? 'bg-white border-[#7C1D3E]/10 shadow-sm' : 'bg-gray-50 border-transparent'}`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[13px] leading-relaxed ${!notification.isRead ? 'font-black text-gray-900' : 'font-bold text-gray-500'}`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                                                        <FiClock size={10} /> {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => markAsRead(notification._id, e)}
                                                            className="text-[9px] font-black text-[#7C1D3E] uppercase tracking-[0.2em] hover:underline"
                                                        >
                                                            Settle
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
                            onClick={() => fetchNotifications()}
                        >
                            Refine Stream
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-11 h-11 rounded-xl text-gray-400 hover:text-[#7C1D3E] hover:bg-[#7C1D3E]/5 p-0 transition-all border border-transparent hover:border-[#7C1D3E]/20"
                        >
                            <FiMaximize2 size={18} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
