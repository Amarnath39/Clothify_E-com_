import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../db";
import Order from "../../../../model/Order";
import Coupon from "../../../../model/Coupon";
import Product from "../../../../model/Product";
import User from "../../../../model/User";
import "../../../../model/Address";
import "../../../../model/Exchange";
import Address from "../../../../model/Address";

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

    // console.log(lastOrder?.orderSeq, "sequence::::");
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
    const { productDetails, couponCode, orderId, shippingCost = 0 } = body; // ✅ shippingCost comes from frontend

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
          const selectedSize = pd.size;

          const sizeObj = product.sizes.find(
            (size: any) => size._id.toString() === selectedSize
          );

          if (!sizeObj || sizeObj.stock < quantity) {
            outOfStockProducts.push(product._id.toString());
            return null;
          } else {
            totalActualPrice += product.actualPrice * quantity;
            totalOfferPrice +=
              (sizeObj.offerPrice || product.actualPrice) * quantity;
          }
          totalQuantity += quantity;

         return {
  product: product._id, // ✅ Store only the product's ID
  count: quantity,
  sizeId: sizeObj._id,   // ✅ Save sizeId
  sizeLabel: sizeObj.size, // ✅ Save sizeLabel
  actualPrice: product.actualPrice, // ✅ Save actualPrice
  offerPrice: sizeObj.offerPrice || product.actualPrice, // ✅ Save offerPrice
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
            shippingCost, // ✅ frontend shipping cost
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
        shippingCost, // ✅ frontend shipping cost
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

    const orders = await Order.find({ user: userId }).populate(["user"]).populate("productDetails.product").lean();

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
