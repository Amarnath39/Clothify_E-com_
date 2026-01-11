"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaBell } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            // In a real app, you might want to throttle this or use SWR/React Query
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
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
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
            markAsRead(notification._id, {} as any);
        }
        // Navigate based on type
        if (notification.type === "LOW_STOCK") {
            router.push("/admin/inventory");
        } else if (notification.type === "ORDER_PLACED" && notification.data?.orderId) {
            // Assuming we can search or filter orders, or go to detail if ID is known DB ID (not orderId string)
            // If data.orderId is the DB _id, we can go to /admin/order/[id]
            // If it's the custom OrderID, we usually go to list.
            // Let's assume list for now.
            router.push("/admin/get-orders");
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <FaBell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-md shadow-lg z-50 border border-gray-200 overflow-hidden ring-1 ring-black ring-opacity-5">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-sm text-gray-700">Notifications</h3>
                        <span className="text-xs text-gray-500">{unreadCount} unread</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <span className="h-2 w-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 hover:text-blue-800 h-auto py-1"
                            onClick={() => fetchNotifications()}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
