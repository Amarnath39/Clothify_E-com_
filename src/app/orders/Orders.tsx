// src/app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  User, 
  ChevronRight 
} from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useDispatch } from "react-redux";
import { getOrdersData } from "@/lib/features/order";
import { formatDate } from "@/helpers/helpers";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

// Status configuration
const statusConfig: any = {
  CONFIRMED: { 
    icon: Clock, 
    color: '#2563eb', 
    bg: '#eff6ff', 
    border: '#dbeafe', 
    label: 'Confirmed' 
  },
  PROCESSING: { 
    icon: Clock, 
    color: '#d97706', 
    bg: '#fffbeb', 
    border: '#fef3c7', 
    label: 'Processing' 
  },
  SHIPPED: { 
    icon: Truck, 
    color: '#7c3aed', 
    bg: '#f5f3ff', 
    border: '#ede9fe', 
    label: 'Shipped' 
  },
  DELIVERED: { 
    icon: CheckCircle, 
    color: '#16a34a', 
    bg: '#f0fdf4', 
    border: '#dcfce7', 
    label: 'Delivered' 
  },
  CANCELLED: { 
    icon: AlertCircle, 
    color: '#dc2626', 
    bg: '#fef2f2', 
    border: '#fee2e2', 
    label: 'Cancelled' 
  },
  DEFAULT: { 
    icon: Package, 
    color: '#4b5563', 
    bg: '#f9fafb', 
    border: '#f3f4f6', 
    label: 'Pending' 
  }
};

const OrderCard = ({ order }: { order: any }) => {
  const currentStatus = order.currentStatus || "DEFAULT";
  const config = statusConfig[currentStatus] || statusConfig.DEFAULT;
  const StatusIcon = config.icon;
  const showRetryButton = order.paymentStatus === "PAYMENT_ERROR" || order.paymentStatus === "INITIATED";

  return (
    <Card className="w-full mb-6 shadow-sm border border-gray-100 rounded-xl overflow-hidden bg-white">
      {/* Header Section */}
      <div className="p-5 border-b border-gray-100 bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 text-left">
            <h3 className="text-lg font-bold" style={{ color: '#7C1D3E' }}>
              Order #{order.orderId}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
              <span>{formatDate(order.createdAt ?? order.date)}</span>
              <span className="text-gray-300">|</span>
              <span className="font-mono">TXN: {order.transactionId ?? 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ 
                backgroundColor: config.bg, 
                color: config.color, 
                borderColor: config.border 
              }}
            >
              <StatusIcon size={14} />
              {config.label}
            </span>
            <div className="text-xl font-bold text-gray-900">₹{order.payablePrice?.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={16} className="text-gray-400" />
            <span className="font-semibold text-gray-800">{order.shippingAddress?.name ?? 'Customer'}</span>
          </div>
        </div>
      </div>

      {/* Product List Section */}
      <CardContent className="p-5" style={{ backgroundColor: '#f9fafb40' }}>
        <div className="grid gap-3">
          {order.productDetails?.map((item: any) => (
            <div key={item._id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <img 
                src={item.product?.img?.[0] || "/placeholder.png"} 
                className="w-16 h-16 object-cover rounded-md border border-gray-50" 
                alt="product"
              />
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-sm font-bold text-gray-900 truncate">
                  {item.product?.name || "Product"}
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  Qty: {item.count} • Size: {item.sizeLabel || 'N/A'}
                </p>
              </div>
              <div className="text-sm font-bold text-gray-900">
                ₹{item.offerPrice?.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function OrdersPage() {
  const dispatch = useDispatch<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { payload } = await dispatch(getOrdersData());
        if (payload.success) {
          setOrders(payload.orders || []);
        }
      } catch (error) {
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-xl"></div>
            <div className="h-40 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Orders</h1>
          <p className="text-gray-500 font-medium">Manage and track your shopping history</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 mb-4">No orders found.</p>
            <Button 
              onClick={() => router.push('/')} 
              style={{ backgroundColor: '#7C1D3E' }}
              className="text-white hover:opacity-90"
            >
              Start Shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}