import React from "react";
import {
  FiMapPin,
  FiCreditCard,
  FiPackage,
  FiDollarSign,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";

const OrderDetails = ({ order }) => {


  
  return (
    <div className="space-y-6">
      <div className="overflow-y-auto max-h-[200px]">
        <h3 className="text-lg font-semibold mb-2">Products</h3>
        {order.products.map((product) => (
          <div key={product.id} className="flex items-center space-x-4 mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h4 className="font-medium">{product.name}</h4>
              <p className="text-sm text-gray-500">
              ₹{product.price.toFixed(2)} x {product.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold mb-2">Price Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.priceBreakup.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>₹{order.priceBreakup.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>₹{order.priceBreakup.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-500">
            <span>Discounts</span>
            <span>
            ₹{order.priceBreakup.subtotal - order.priceBreakup.total}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{order.priceBreakup.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
        <div className="flex items-start space-x-2">
          <FiMapPin className="mt-1" />
          <div>
            <p>{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.zip}
            </p>
            <p>{order.shippingAddress.country}</p>
            <p>{order?.shippingAddress?.mobile}</p>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment Method</h3>
        <div className="flex items-center space-x-2">
          <FiCreditCard />
          <span>{order.paymentMethod}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
