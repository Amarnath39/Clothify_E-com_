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

  return (
    <div className="mb-2">
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
                  onChange={(e) => setCouponCode(e.target.value)}
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
            absolute z-10 mt-2 w-full border rounded-md shadow-lg bg-white overflow-y-auto
            transition-all duration-300 ease-in-out
            ${isOpen ? "opacity-100 max-h-60" : "opacity-0 max-h-0"}
          `}
              >
                <div className="overflow-y-auto">
                  {visibleCoupons && visibleCoupons.length > 0 ? (
                    visibleCoupons.map((coupon) => (
                      <div
                        
                        key={coupon._id}
                        className="p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200 ease-in-out"
                        onClick={() => handleSelectCoupon(coupon)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FaTag className="text-blue-500 mr-2" />
                            <span className="font-semibold text-blue-600">
                              {coupon.couponCode}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {coupon.type}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          upto ₹{coupon.amount} off on min. purchase of ₹
                          {coupon.purchaseAmount}
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
            className="sm:w-2/12 w-full   sm:mt-5 bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            onClick={() => handleApplyCoupon(couponCode)}
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
              className="flex justify-between items-center bg-gray-100 p-2 rounded mb-2"
            >
              <span>
                {coupon.couponCode} - ₹{discountAmount} off
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCoupon(coupon.couponCode)}
                className="text-red-500 hover:text-red-700"
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
