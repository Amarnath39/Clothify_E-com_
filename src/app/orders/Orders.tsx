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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OrderDetails from "./OrderDetails";

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

const OrderCard = ({ order, onViewDetails }: { order: any, onViewDetails: (order: any) => void }) => {
  const currentStatus = order.currentStatus || "DEFAULT";
  const config = statusConfig[currentStatus] || statusConfig.DEFAULT;
  const StatusIcon = config.icon;
  // const showRetryButton = order.paymentStatus === "PAYMENT_ERROR" || order.paymentStatus === "INITIATED";

  return (
    <Card className="group bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Card Header: ID and Status */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order ID</span>
            <h3 className="text-lg font-bold text-slate-900 font-quicksand">#{order.orderId}</h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium uppercase tracking-tighter">
            <span>{formatDate(order.createdAt ?? order.date)}</span>
            <span className="text-slate-200 font-normal">|</span>
            <span className="font-mono lowercase opacity-70">txn: {order.transactionId ?? 'n/a'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payable</span>
            <div className="text-xl font-black text-slate-900 leading-none mt-0.5">₹{order.payablePrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm"
            style={{
              backgroundColor: `${config.bg}`,
              color: config.color,
              borderColor: `${config.border}`
            }}
          >
            <StatusIcon size={12} className="opacity-80" />
            {config.label}
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {order.productDetails?.map((item: any) => (
            <div key={item._id} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-slate-100 bg-white">
                <img
                  src={item.product?.img?.[0] || "/placeholder.png"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt="product"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate font-quicksand">
                  {item.product?.name || "Product"}
                </h4>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-100">
                    Qty: {item.count}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-100">
                    Size: {item.sizeLabel || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-slate-900">₹{item.offerPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-slate-400 font-medium">Per Item</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <User size={12} />
            Recipient: <span className="text-slate-700">{order.shippingAddress?.name ?? 'Customer'}</span>
          </div>
          <Button
            onClick={() => onViewDetails(order)}
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] font-bold uppercase tracking-widest text-brand hover:bg-brand/5 border border-transparent hover:border-brand/10 rounded-lg"
          >
            View Details <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function OrdersPage() {
  const dispatch = useDispatch<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

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
      <div className="min-h-screen pt-32 pb-16 bg-slate-50 px-4 font-roboto">
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 w-48 bg-slate-200 rounded-lg" />
          <div className="space-y-6">
            <div className="h-48 bg-slate-200 rounded-2xl" />
            <div className="h-48 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-16 bg-slate-50 px-4 font-roboto">
      <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
        <div className="border-b border-slate-200 pb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-quicksand">Order History</h1>
            <p className="text-slate-500 max-w-lg">View, track, and manage your shopping journey with us.</p>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} onViewDetails={handleViewDetails} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 flex items-center justify-center rounded-full">
              <Package size={40} />
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              <h3 className="text-xl font-bold text-slate-900 font-quicksand">No Orders Found</h3>
              <p className="text-slate-500 text-sm">It seems you haven't placed any orders yet. Start exploring our collection!</p>
            </div>
            <Button
              onClick={() => router.push('/')}
              className="bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-10 h-11 shadow-lg shadow-brand/10 transition-all"
            >
              Start Shopping
            </Button>
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader className="border-b border-slate-100 pb-4">
              <DialogTitle className="text-2xl font-bold text-slate-900 font-quicksand">
                Order Details #{selectedOrder?.orderId}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <OrderDetails order={selectedOrder} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
