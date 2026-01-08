import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaChevronDown, FaTag, FaTimes } from "react-icons/fa";
import useOnClickOutside from "@/hooks/useOnClickOutside";

const CouponSelector = ({
  visibleCoupons,
  appliedCoupons,
  handleApplyCoupon,
  handleRemoveCoupon,
  discountAmount,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<any>();
  const arrowRef = useRef<any>();

  // console.log("🎟️ CouponSelector Debug:", {
  //   visibleCouponsCount: visibleCoupons?.length || 0,
  //   appliedCoupons,
  //   discountAmount
  // });

  const handleSelectCoupon = (selectedCoupon) => {
    if (
      !appliedCoupons.some(
        (coupon) => coupon.couponCode === selectedCoupon.couponCode
      )
    ) {
      handleApplyCoupon(selectedCoupon.couponCode);
    }
    setCouponCode("");
    setIsOpen(false);
  };

  useOnClickOutside(dropdownRef, arrowRef, () => {
    setIsOpen(false);
  });

  // ✅ Use OLD field names: amount, maxDiscount
  const getCouponDisplayText = (coupon) => {
    // console.log("🔍 Coupon object:", coupon);
    
    if (coupon.type === "percentage") {
      const percentText = `${coupon.amount}% off`;
      const maxText = coupon.maxDiscount 
        ? ` (max ₹${coupon.maxDiscount})` 
        : "";
      return percentText + maxText;
    } else {
      return `₹${coupon.amount} off`;
    }
  };

  return (
    <div className="mb-6">
      {appliedCoupons.length === 0 && (
        <div className="flex gap-2 items-center sm:flex-row flex-col">
          <div className="sm:w-10/12 w-full">
            <Label
              htmlFor="coupon"
              className="mb-2 block text-lg font-semibold"
            >
              Have a coupon?
            </Label>
            <div className="relative sm:mb-4">
              <div className="flex items-center">
                <Input
                  type="text"
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-grow rounded-r-none focus:ring-2 focus:ring-blue-300 transition-all"
                  placeholder="Enter or select a coupon"
                />
                <Button
                  variant="outline"
                  className="ml-0 rounded-l-none border-l-0 bg-white hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(!isOpen)}
                  ref={arrowRef}
                >
                  <FaChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
              <div
                ref={dropdownRef} 
                className={`
                  absolute z-10 mt-2 w-full border rounded-md shadow-lg bg-white overflow-hidden
                  transition-all duration-300 ease-in-out
                  ${isOpen ? "opacity-100 max-h-60" : "opacity-0 max-h-0"}
                `}
              >
                <div className="overflow-y-auto max-h-60">
                  {visibleCoupons && visibleCoupons.length > 0 ? (
                    visibleCoupons.map((coupon) => (
                      <div
                        key={coupon._id}
                        className="p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200 ease-in-out border-b last:border-b-0"
                        onClick={() => handleSelectCoupon(coupon)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FaTag className="text-blue-500 mr-2" />
                            <span className="font-semibold text-blue-600">
                              {coupon.couponCode}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {coupon.type}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {getCouponDisplayText(coupon)}
                          {coupon.purchaseAmount > 0 && (
                            <> on min. purchase of ₹{coupon.purchaseAmount}</>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No coupons available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button
            className="sm:w-2/12 w-full sm:mt-5 text-white transition-colors"
            onClick={() => handleApplyCoupon(couponCode)}
            disabled={!couponCode.trim()}
          >
            Apply
          </Button>
        </div>
      )}
      {appliedCoupons.length > 0 && (
        <div className="mt-2">
          <h3 className="font-semibold mb-2">Applied Coupon:</h3>
          {appliedCoupons.map((coupon) => (
            <div
              key={coupon._id}
              className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-lg mb-2"
            >
              <div>
                <span className="font-semibold text-green-700">
                  {coupon.couponCode}
                </span>
                <span className="text-green-600 ml-2">
                  - ₹{discountAmount.toFixed(2)} off
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCoupon(coupon.couponCode)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <FaTimes />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponSelector;