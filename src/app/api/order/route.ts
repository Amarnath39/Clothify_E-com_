import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../db";
import Order from "../../../model/Order"; // Corrected path assuming model folder is at root/model
import Coupon from "../../../model/Coupon"; // Corrected path
import Product from "../../../model/Product"; // Corrected path
import User from "../../../model/User"; // Corrected path
import "../../../../model/Address"; // Corrected path
import "../../../../model/Exchange"; // Corrected path
import Address from "../../../model/Address"; // Corrected path

connectDB();

const generateOrderId = async (): Promise<string> => {
  try {
    // Use findOneAndUpdate to atomically get and increment the latest order number
    const lastOrder = await Order.findOneAndUpdate(
      {},
      { $inc: { orderSeq: 1 } }, // Increment the sequence atomically
      {
        sort: { orderSeq: -1 },
        upsert: true,
        new: true,
      }
    ).select("orderSeq");

    const orderNumber = lastOrder?.orderSeq || 0;

    return `ON-${orderNumber.toString().padStart(6, "0")}`;
  } catch (error) {
    console.error("Error generating order ID:", error);
    throw error;
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Please provide User Id" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productDetails, couponCode, orderId, shippingCost = 0 } = body;

    // Validate input
    if (
      !userId ||
      !productDetails ||
      !Array.isArray(productDetails) ||
      productDetails.length === 0
    ) {
      return NextResponse.json(
        { success: false, msg: "Invalid input" },
        { status: 400 }
      );
    }

    const uniqueProductIds = [
      ...new Set(productDetails.map((pd) => pd.product)),
    ];

    const products = await Product.find({ _id: { $in: uniqueProductIds } });

    if (products.length !== uniqueProductIds.length) {
      return NextResponse.json(
        { success: false, msg: "Some products not found" },
        { status: 404 }
      );
    }

    // Calculate total actual price and total offer price
    let totalActualPrice = 0;
    let totalOfferPrice = 0;
    let totalQuantity = 0;
    const outOfStockProducts: string[] = [];
    const shippingAddress = await Address.findById(user.defaultAddress);

    const processedProductDetails = productDetails
      .map((pd) => {
        const product = products.find((p) => p._id.toString() === pd.product);
        if (product) {
          const quantity = pd.count || 1;
          const selectedSizeId = pd.size; // The size ID from the frontend

          // ✅ START: ADDED DEBUG LOGS
          console.log("--- DEBUGGING STOCK CHECK ---");
          console.log("Frontend sent this Size ID:", selectedSizeId);
          console.log(
            "Product's available sizes in the database:",
            JSON.stringify(product.sizes, null, 2)
          );
          // ✅ END: ADDED DEBUG LOGS

          const sizeObj = product.sizes.find(
            (size: any) => size._id.toString() === selectedSizeId
          );

          // ✅ START: ADDED DEBUG LOGS
          console.log(
            "Result of finding the size in the database:",
            sizeObj
          );
          console.log("----------------------------");
          // ✅ END: ADDED DEBUG LOGS

          if (!sizeObj || sizeObj.stock < quantity) {
            outOfStockProducts.push(product._id.toString());
            return null;
          } else {
            totalActualPrice += product.actualPrice * quantity;
            totalOfferPrice +=
              (sizeObj.offerPrice || product.actualPrice) * quantity;
          }
          totalQuantity += quantity;

          // Return the structure needed for saving to DB (ensure this matches your schema)
          return {
            product: product._id, // Store only the ID
            count: quantity,
            sizeId: sizeObj._id, // Correct field for schema
            sizeLabel: sizeObj.size, // Correct field for schema
            actualPrice: product.actualPrice, // Correct field for schema
            offerPrice: sizeObj.offerPrice || product.actualPrice, // Correct field for schema
            // Include other fields required by your schema if any
          };
        }
        return null;
      })
      .filter((pd) => pd !== null);

    if (outOfStockProducts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          msg: "Some products are out of stock",
          outOfStockProducts,
        },
        { status: 400 }
      );
    }

    // Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ couponCode });
      if (coupon) {
        const isValid =
          coupon.validity &&
          new Date(coupon.validity) > new Date() &&
          coupon.availableFor > coupon.userCount &&
          coupon.purchaseAmount <= totalOfferPrice;

        const hasUserUsedCoupon = coupon.user.includes(userId);
        if (isValid && (!hasUserUsedCoupon || coupon.multiUse)) {
          if (coupon.type === "percentage") {
            discount = (totalOfferPrice * coupon.off) / 100;
            discount = Math.min(discount, coupon.amount);
          } else if (coupon.type === "flat") {
            discount = coupon.off;
            discount = Math.min(discount, coupon.amount);
          }
          discount = Math.max(discount, 1);

          if (!coupon.multiUse) {
            coupon.user.push(userId);
          }
          coupon.userCount += 1;
          await coupon.save();
        }
      }
    }

    // Final payable price (offer - discount + shipping)
    let totalPayablePrice = totalOfferPrice - discount + shippingCost;
    totalPayablePrice = Math.max(totalPayablePrice, 1);

    let newOrder;
    if (orderId) {
      newOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            user: userId,
            productDetails: processedProductDetails,
            totalPrice: totalActualPrice,
            payablePrice: totalPayablePrice,
            off: discount,
            shippingAddress,
            shippingCost,
          },
        },
        { new: true }
      );
    } else {
      newOrder = new Order({
        orderId: await generateOrderId(),
        user: userId,
        productDetails: processedProductDetails,
        totalPrice: totalActualPrice,
        payablePrice: totalPayablePrice,
        off: discount,
        shippingAddress,
        shippingCost,
      });

      await newOrder.save();
    }

    return NextResponse.json(
      {
        success: true,
        msg: "Order created successfully",
        orderDetails: newOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to create order", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const userId = req.headers.get("x-user-id");

    const orders = await Order.find({ user: userId }).populate(["user"]).lean();
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