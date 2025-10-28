import React from "react";
import {
  FiMapPin,
  FiCreditCard,
  FiDollarSign,
} from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const OrderDetails = ({ order }) => {

  const formatPriceValue = (value) => {
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const calculatedDiscount = order.totalPrice - order.payablePrice + (order.shippingCost || 0);
  const discountDisplay = formatPriceValue(calculatedDiscount > 0 ? calculatedDiscount : order.off || 0);

  // Simplified getImageUrl function
  const getImageUrl = (relativePath: string | undefined): string => {
    return relativePath && relativePath.startsWith('/') ? relativePath : "/android-chrome-192x192.png"; // Fallback placeholder
  };

  return (
    <div className="space-y-6">
      {/* Products Section */}
      <div className="overflow-y-auto max-h-[200px] pr-2">
        <h3 className="text-lg font-semibold mb-2 sticky top-0 bg-white py-1">Products</h3>
        {/* ✅ CORRECTED: Map with robust data access */}
        {order.productDetails?.map((item) => {
             // Determine if product data is populated or just an ID
             const isProductPopulated = typeof item.product === 'object' && item.product !== null;
             const productName = isProductPopulated ? item.product.name : "Product details missing";
             const productImg = isProductPopulated ? item.product.img?.[0] : undefined;
             const productColor = isProductPopulated ? item.product.color : 'N/A';
             // Handle both old and new size structures
             const sizeLabel = item.sizeLabel ?? item.size?.size ?? 'N/A';

             return (
                 <div key={item._id} className="flex items-start sm:items-center space-x-4 mb-4">
                   <img
                     src={getImageUrl(productImg)}
                     alt={productName}
                     className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-md flex-shrink-0"
                     onError={(e) => { (e.target as HTMLImageElement).src = '/android-chrome-192x192.png'; }}
                   />
                   <div className="flex-grow text-xs sm:text-sm space-y-1">
                     <h4 className="font-medium text-sm sm:text-base line-clamp-2">{productName}</h4>
                     <p className="text-gray-500">
                       ₹{formatPriceValue(item.offerPrice)} x {item.count ?? 1}
                     </p>
                     <p className="text-gray-600">
                         Size: <span className="font-medium">{sizeLabel}</span>
                     </p>
                     <p className="text-gray-600">
                         Color: <span className="font-medium">{productColor}</span>
                     </p>
                   </div>
                   <div className="text-xs sm:text-sm font-semibold text-gray-800 whitespace-nowrap self-start sm:self-center pt-1 sm:pt-0">
                         ₹{formatPriceValue(item.offerPrice * (item.count || 1))}
                   </div>
                 </div>
             );
        })}
      </div>
      <Separator />

      {/* Price Breakdown Section */}
      <div>
         {/* ... (Price breakdown code remains the same as previous correct version) ... */}
         <h3 className="text-lg font-semibold mb-2">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{formatPriceValue(order.totalPrice)}</span>
          </div>
           <div className="flex justify-between">
             <span>Tax</span>
             <span>₹{formatPriceValue(order.tax || 0)}</span>
           </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>₹{formatPriceValue(order.shippingCost)}</span>
          </div>
           {Number(discountDisplay) > 0 && (
             <div className="flex justify-between text-green-600">
                <span>Discounts</span>
                <span>-₹{discountDisplay}</span>
            </div>
           )}
          <Separator className="my-2"/>
          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>₹{formatPriceValue(order.payablePrice)}</span>
          </div>
        </div>
      </div>
      <Separator />

      {/* Shipping Address Section */}
      <div>
         {/* ... (Shipping address code remains the same as previous correct version) ... */}
        <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
        <div className="flex items-start space-x-3 text-sm">
           <FiMapPin className="mt-1 flex-shrink-0 text-gray-500" />
          <div>
            <p className="font-medium">{order.shippingAddress?.name ?? 'N/A'}</p>
            <p>{order.shippingAddress?.address ?? 'N/A'}</p>
            <p>
              {order.shippingAddress?.city ?? 'N/A'}, {order.shippingAddress?.state ?? 'N/A'}{" "}
              {order.shippingAddress?.zipCode ?? ''}
            </p>
            <p>{order.shippingAddress?.country ?? 'N/A'}</p>
            <p>{order.shippingAddress?.mobile ?? 'N/A'}</p>
          </div>
        </div>
      </div>
      <Separator />

      {/* Payment Method Section */}
      <div>
         {/* ... (Payment method code remains the same as previous correct version) ... */}
         <h3 className="text-lg font-semibold mb-2">Payment Method</h3>
         <div className="flex items-center space-x-2 text-sm">
          <FiCreditCard className="text-gray-500"/>
           <span>{order.paymentMethod || "Online Payment"}</span>
        </div>
         <div className="flex items-center space-x-2 text-sm mt-2">
           <FiDollarSign className="text-gray-500"/>
           <span>Status: <Badge variant={order.paymentStatus === 'PAYMENT_SUCCESS' ? 'default' : 'destructive'} className={order.paymentStatus === 'PAYMENT_SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{order.paymentStatus ?? 'N/A'}</Badge></span>
         </div>
      </div>
    </div>
  );
};

export default OrderDetails;
