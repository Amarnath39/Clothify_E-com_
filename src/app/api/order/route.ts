import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../db";
import Order from "../../../model/Order";
import Coupon from "../../../model/Coupon";
import Product from "../../../model/Product";
import User from "../../../model/User";
import Address from "../../../model/Address";

connectDB();

const generateOrderId = async (): Promise<string> => {
  try {
    const lastOrder = await Order.findOne()
      .sort({ orderSeq: -1 })
      .select("orderSeq")
      .lean() as { orderSeq: number } | null;

    const nextSeq = (lastOrder?.orderSeq || 1799) + 1;

    return `ON-${nextSeq.toString().padStart(6, "0")}`;
  } catch (error) {
    console.error("Error generating order ID:", error);
    throw error;
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const userId = req.headers.get("x-user-id");
    console.log("📍 Step 1: User ID received:", userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Please provide User Id" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    console.log("📍 Step 2: User found:", user ? "Yes" : "No");

    if (!user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📍 Step 3: Request body:", JSON.stringify(body, null, 2));
    const { productDetails, couponCode, orderId, shippingCost = 0 } = body;
    console.log("📍 Step 4: Extracted data - Products:", productDetails?.length, "Coupon:", couponCode, "OrderId:", orderId);

    // Validate input
    if (!productDetails || !Array.isArray(productDetails) || productDetails.length === 0) {
      console.log("❌ Validation failed");
      return NextResponse.json({ success: false, msg: "Invalid input" }, { status: 400 });
    }

    const uniqueProductIds = [...new Set(productDetails.map((pd: any) => pd.product))];
    console.log("📍 Step 5: Unique product IDs:", uniqueProductIds);

    const products = await Product.find({ _id: { $in: uniqueProductIds } });
    console.log("📍 Step 6: Products found:", products.length);

    const isPreBookingOrder = products.some((p) => p.is_prebooking);
    const orderType = isPreBookingOrder ? "prebooking" : "normal";

    if (products.length !== uniqueProductIds.length) {
      return NextResponse.json({ success: false, msg: "Some products not found" }, { status: 404 });
    }

    // Calculate prices
    let totalActualPrice = 0;
    let totalOfferPrice = 0;
    let totalQuantity = 0;
    const outOfStockProducts: string[] = [];

    console.log("📍 Step 7: Fetching shipping address for:", user.defaultAddress);
    const shippingAddress = await Address.findById(user.defaultAddress);
    console.log("📍 Step 7.5: Shipping address found:", shippingAddress ? "Yes" : "No");

    const processedProductDetails = productDetails
      .map((pd: any) => {
        const product = products.find((p) => p._id.toString() === pd.product);
        if (product) {
          const quantity = pd.count || 1;
          const selectedSize = pd.size;
          const sizeObj = product.sizes.find((size: any) => size._id.toString() === selectedSize);

          if (!sizeObj || (sizeObj.stock < quantity && !product.is_prebooking)) {
            outOfStockProducts.push(product._id.toString());
            return null;
          }

          totalActualPrice += product.actualPrice * quantity;
          totalOfferPrice += (sizeObj.offerPrice || product.actualPrice) * quantity;
          totalQuantity += quantity;

          return {
            product: product._id,
            count: quantity,
            size: {
              _id: sizeObj._id,
              size: sizeObj.size
            },
            actualPrice: product.actualPrice,
            offerPrice: sizeObj.offerPrice || product.actualPrice,
          };
        }
        return null;
      })
      .filter((pd: any) => pd !== null);

    console.log("📍 Step 8: Processed products:", processedProductDetails.length, "Out of stock:", outOfStockProducts.length);

    if (outOfStockProducts.length > 0) {
      return NextResponse.json(
        { success: false, msg: "Some products are out of stock", outOfStockProducts },
        { status: 400 }
      );
    }

    console.log(totalActualPrice, totalOfferPrice, "price details::::");

    // Apply coupon
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ couponCode });
      console.log(coupon, "coupon details::::");

      if (coupon) {
        const isValid =
          coupon.validity &&
          new Date(coupon.validity) > new Date() &&
          coupon.availableFor > coupon.userCount &&
          coupon.purchaseAmount <= totalOfferPrice;

        const hasUserUsedCoupon = coupon.user.includes(userId);
        if (isValid && (!hasUserUsedCoupon || coupon.multiUse)) {
          if (coupon.type === "percentage") {
            const percentageDiscount = (totalOfferPrice * parseFloat(coupon.off)) / 100;
            discount = Math.min(percentageDiscount, coupon.amount);
            console.log(percentageDiscount, coupon.amount, "percentage discount::::");
          } else if (coupon.type === "flat") {
            discount = coupon.amount;
            console.log(discount, "flat discount::::");
          }
          discount = Math.max(discount, 0);
          appliedCoupon = couponCode;
        }
      }
    }

    console.log(discount, "final discount::::");

    let totalPayablePrice = totalOfferPrice - discount + shippingCost;
    totalPayablePrice = Math.max(totalPayablePrice, 1);

    let newOrder;

    // ✅ CRITICAL FIX: Handle order update/create properly
    if (orderId) {
      console.log("📍 Step 11: Attempting to update existing order:", orderId);
      newOrder = await Order.findOneAndUpdate(
        { orderId: orderId },
        {
          $set: {
            user: userId,
            productDetails: processedProductDetails,
            totalPrice: totalActualPrice,
            payablePrice: totalPayablePrice,
            off: discount,
            shippingAddress,
            shippingCost,
            couponCode: appliedCoupon,
            order_type: orderType,
          },
        },
        { new: true }
      );
      console.log("📍 Step 11.5: Order found and updated:", newOrder ? "Yes" : "No");

      // ✅ If order not found with that orderId, create new one
      if (!newOrder) {
        console.log("📍 Step 11.6: Order not found, creating new order instead");
        const lastOrder = await Order.findOne().sort({ orderSeq: -1 }).select("orderSeq").lean() as { orderSeq: number } | null;
        const nextSeq = (lastOrder?.orderSeq || 1799) + 1;

        newOrder = new Order({
          orderId: await generateOrderId(),
          orderSeq: nextSeq,
          user: userId,
          productDetails: processedProductDetails,
          totalPrice: totalActualPrice,
          payablePrice: totalPayablePrice,
          off: discount,
          shippingAddress,
          shippingCost,
          couponCode: appliedCoupon,
          order_type: orderType,
        });

        await newOrder.save();
        console.log("📍 Step 11.7: New order created with ID:", newOrder._id);
      }
    } else {
      console.log("📍 Step 12: Creating new order (no orderId provided)");
      const lastOrder = await Order.findOne().sort({ orderSeq: -1 }).select("orderSeq").lean() as { orderSeq: number } | null;
      const nextSeq = (lastOrder?.orderSeq || 1799) + 1;
      console.log("📍 Step 12.5: Next sequence:", nextSeq);

      newOrder = new Order({
        orderId: await generateOrderId(),
        orderSeq: nextSeq,
        user: userId,
        productDetails: processedProductDetails,
        totalPrice: totalActualPrice,
        payablePrice: totalPayablePrice,
        off: discount,
        shippingAddress,
        shippingCost,
        couponCode: appliedCoupon,
        order_type: orderType,
      });

      await newOrder.save();
      console.log("📍 Step 12.6: Order saved with ID:", newOrder._id);
    }

    console.log("📍 Step 13: Preparing response");

    // ✅ Final safety check
    if (!newOrder) {
      console.error("❌ newOrder is still null!");
      return NextResponse.json({ success: false, msg: "Failed to create or update order" }, { status: 500 });
    }

    const response = {
      success: true,
      msg: "Order created successfully",
      orderDetails: {
        _id: newOrder._id,
        orderId: newOrder.orderId,
        totalPrice: totalActualPrice,
        payablePrice: totalPayablePrice,
        off: discount,
        shippingCost: shippingCost,
        productDiscount: totalActualPrice - totalOfferPrice,
        productDetails: processedProductDetails,
        shippingAddress: newOrder.shippingAddress,
        couponCode: appliedCoupon,
        createdAt: newOrder.createdAt,
      },
    };

    console.log("✅ Step 14: Success! Returning order:", newOrder.orderId);
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("❌ ERROR in Order API:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("❌ Error message:", error instanceof Error ? error.message : String(error));

    return NextResponse.json(
      {
        success: false,
        msg: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const userId = req.headers.get("x-user-id");

    const orders = await Order.find({ user: userId })
      .populate(["user"])
      .populate("productDetails.product")
      .lean();

    console.log("--- DEBUG: Populated Orders in API ---");
    console.log(JSON.stringify(orders, null, 2));
    console.log("-------------------------------------");

    return NextResponse.json(
      { success: true, msg: "Success", orders },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to get order", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};