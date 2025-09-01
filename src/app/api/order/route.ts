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
    const { productDetails, couponCode, orderId } = body;

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
    // Fetch product details from the database

    if (products.length !== uniqueProductIds.length) {
      return NextResponse.json(
        { success: false, msg: "Some products not found" },
        { status: 404 }
      );
    }

    // Calculate total actual price and total offer price
    let totalActualPrice = 0;
    let totalOfferPrice = 0;
    let shippingCost = 0;
    let totalQuantity = 0;
    const outOfStockProducts: string[] = [];
    const shippingAddress = await Address.findById(user.defaultAddress);

    const processedProductDetails = productDetails
      .map((pd) => {
        const product = products.find((p) => p._id.toString() === pd.product);
        // console.log(pd, "pd:::::");
        if (product) {
          const quantity = pd.count || 1;
          const selectedSize = pd.size;

          // Find the size object from the product's sizes array
          const sizeObj = product.sizes.find(
            (size: any) => size._id.toString() === selectedSize
          );
          // console.log(product, pd, selectedSize, sizeObj, "quan::::");

          if (!sizeObj || sizeObj.stock < quantity) {
            outOfStockProducts.push(product._id.toString());
            return null;
          } else {
            // Update total prices
            totalActualPrice += product.actualPrice * quantity;
            totalOfferPrice +=
              (sizeObj.offerPrice || product.actualPrice) * quantity;
          }
          totalQuantity += quantity;
          shippingCost = totalQuantity * 100;

          // Return the product and size details statically
          return {
            product: product,
            size: sizeObj,
            count: quantity,
          };
        }
        return null;
      })
      .filter((pd) => pd !== null);

    // If there are out-of-stock products, return them in the response
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

    // Calculate discount based on the coupon code
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ couponCode });
      // console.log(coupon, "coupon");
      if (coupon) {
        const isValid =
          coupon.validity &&
          new Date(coupon.validity) > new Date() &&
          coupon.availableFor > coupon.userCount &&
          coupon.purchaseAmount <= totalOfferPrice;

        // console.log(isValid, "isvalid");
        const hasUserUsedCoupon = coupon.user.includes(userId);
        if (isValid && (!hasUserUsedCoupon || coupon.multiUse)) {
          if (coupon.type === "percentage") {
            discount = (totalOfferPrice * coupon.off) / 100;
            discount = Math.min(discount, coupon.amount);
          } else if (coupon.type === "flat") {
            discount = coupon.off;
            // console.log(discount, coupon.amount, "discount");
            discount = Math.min(discount, coupon.amount);
          }
          discount = Math.max(discount, 1); // Discount should not exceed total offer price
          // console.log(discount, coupon.amount, "discount:");

          // If multiUse is false, add userId to coupon's userId array
          if (!coupon.multiUse) {
            coupon.user.push(userId);
          }
          // Increment userCount
          coupon.userCount += 1;
          await coupon.save();
        }
      }
    }

    // let generatedOrderId = await generateOrderId();

    // Calculate the total payable price
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
            shippingCost
          },
        },
        { new: true }
      );
    } else {
      // Create and save the order
      newOrder = new Order({
        orderId: await generateOrderId(),
        user: userId,
        productDetails: processedProductDetails,
        totalPrice: totalActualPrice,
        payablePrice: totalPayablePrice,
        off: discount,
        shippingAddress,
        shippingCost
        
      });

      await newOrder.save();
    }
    // Return the total payable price in the response
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
