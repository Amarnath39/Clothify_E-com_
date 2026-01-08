// src/app/api/hook/phonepe/payment-status/[orderId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import Product from "../../../../../../model/Product";
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "../../../../../../helper/sendAdminOrderEmail";
import { getPhonePeClient } from "@/lib/phonepeClient";
import Coupon from "../../../../../../model/Coupon";

// The handler now accepts a 'params' object because of the [orderId] in the folder name
export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    // ===================================================================
    // 🔒 STEP 1: VALIDATE THE WEBHOOK
    // ===================================================================
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const checksum = req.headers.get("x-verify") || "";
    const saltKey = process.env.PHONEPE_SALT_KEY as string;
    const saltIndex = process.env.PHONEPE_SALT_INDEX as string;

    // This is the crucial security check.
    const isGenuine = getPhonePeClient().validateCallback(
      rawBody,
      checksum,
      saltKey,
      saltIndex
    );

    if (!isGenuine) {
      console.error("Invalid PhonePe webhook signature received.");
      return NextResponse.json(
        { success: false, msg: "Invalid signature" },
        { status: 401 }
      );
    }

    const { response } = body;
    if (!response) {
      console.log("No response field in callback body");
      return NextResponse.json(
        { success: false, msg: "No response field found in callback" },
        { status: 400 }
      );
    }

    const decodedResponse = JSON.parse(atob(response) || "{}");

    // ===================================================================
    // ✅ STEP 2: PROCESS THE VALIDATED WEBHOOK
    // ===================================================================

    const { orderId } = params;

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 HANDLE PAYMENT SUCCESS WITH ATOMIC IDEMPOTENCY
    // ═══════════════════════════════════════════════════════════════════
    if (decodedResponse?.code === "PAYMENT_SUCCESS") {
      console.log(`Processing PAYMENT_SUCCESS for order: ${orderId}`);

      // 🔒 ATOMIC UPDATE: Only update if payment status is NOT already success
      // This prevents duplicate processing even if webhook is called multiple times
      const order = await Order.findOneAndUpdate(
        {
          orderId,
          paymentStatus: { $ne: "PAYMENT_SUCCESS" }, // Critical: prevents duplicate processing
        },
        {
          paymentStatus: "PAYMENT_SUCCESS",
          paymentMethod: decodedResponse?.data?.paymentInstrument?.type,
          transactionId: decodedResponse?.data?.transactionId,
          date: new Date(),
          $push: {
            paymentLogs: {
              status: "PAYMENT_SUCCESS_WEBHOOK",
              timestamp: new Date(),
              details: {
                transactionId: decodedResponse?.data?.transactionId,
                paymentInstrument: decodedResponse?.data?.paymentInstrument?.type,
              },
            },
          },
        },
        {
          new: true, // Return the updated document
          runValidators: true,
        }
      )
        .populate("user")
        .populate("productDetails.product");

      // If order is null, it means either:
      // 1. Order doesn't exist, OR
      // 2. Order already has PAYMENT_SUCCESS status (already processed)
      if (!order) {
        console.log(
          `Order ${orderId} already processed or not found - skipping duplicate webhook`
        );
        return NextResponse.json(
          { success: true, msg: "Order already processed or not found" },
          { status: 200 }
        );
      }

      console.log(`✅ Atomically updated order ${orderId} to PAYMENT_SUCCESS`);

      // ═══════════════════════════════════════════════════════════════════
      // ⭐ CONSUME COUPON (Now safe - will only run once)
      // ═══════════════════════════════════════════════════════════════════
      if (order.couponCode) {
        const code = order.couponCode.toUpperCase();
        console.log("🎫 ===== WEBHOOK: Starting coupon consumption =====");
        console.log("🎫 Coupon code:", code);
        console.log("🎫 Order ID:", order._id);
        console.log("🎫 User ID:", order.user._id);

        try {
          const coupon = await Coupon.findOne({ couponCode: code });

          if (!coupon) {
            console.warn("⚠️ WEBHOOK: Coupon not found:", code);
            order.paymentLogs.push({
              status: "COUPON_WARNING",
              timestamp: new Date(),
              details: { couponCode: code, message: "Coupon not found in DB" },
            });
          } else {
            console.log("🎫 Coupon found:", {
              code: coupon.couponCode,
              currentUserCount: coupon.userCount,
              availableFor: coupon.availableFor,
              multiUse: coupon.multiUse,
              currentUsers: coupon.user.length,
            });

            // Atomic update: only increment if usage limit not exceeded
            const filter: any = {
              couponCode: code,
              userCount: { $lt: coupon.availableFor },
            };

            // For single-use coupons, check user hasn't used it
            if (!coupon.multiUse) {
              filter.user = { $ne: order.user._id };
              console.log(
                "🎫 Single-use coupon - checking if user already used it"
              );
            } else {
              console.log("🎫 Multi-use coupon - user can use multiple times");
            }

            const update: any = {
              $inc: { userCount: 1 },
              $addToSet: { user: order.user._id }, // Always add user to array (for tracking)
            };

            console.log("🎫 Update filter:", JSON.stringify(filter));
            console.log("🎫 Update operation:", JSON.stringify(update));

            const result = await Coupon.updateOne(filter, update);

            console.log("🎫 Update result:", {
              matchedCount: result.matchedCount,
              modifiedCount: result.modifiedCount,
              acknowledged: result.acknowledged,
            });

            if (result.modifiedCount === 0) {
              console.warn("⚠️ WEBHOOK: Coupon could not be consumed:", code);

              // Better error detection
              const existingCoupon = await Coupon.findOne({ couponCode: code });
              let errorReason = "Unknown";

              if (existingCoupon) {
                console.log("🎫 Checking why update failed:", {
                  currentUserCount: existingCoupon.userCount,
                  limit: existingCoupon.availableFor,
                  userAlreadyInArray: existingCoupon.user.includes(
                    order.user._id
                  ),
                  multiUse: existingCoupon.multiUse,
                });

                if (existingCoupon.userCount >= existingCoupon.availableFor) {
                  errorReason = "Usage limit reached";
                  console.error("❌ WEBHOOK: Usage limit reached!");
                } else if (
                  !existingCoupon.multiUse &&
                  existingCoupon.user.includes(order.user._id)
                ) {
                  errorReason = "User already used this single-use coupon";
                  console.error(
                    "❌ WEBHOOK: User already used this single-use coupon!"
                  );
                } else {
                  console.error("❌ WEBHOOK: Unknown reason for failure");
                }
              }

              order.paymentLogs.push({
                status: "COUPON_LIMIT_REACHED",
                timestamp: new Date(),
                details: {
                  couponCode: code,
                  message: errorReason,
                  currentCount: existingCoupon?.userCount,
                  limit: existingCoupon?.availableFor,
                },
              });
            } else {
              console.log("✅ WEBHOOK: Coupon consumed successfully:", code);
              console.log("✅ New user count:", coupon.userCount + 1);
              console.log("✅ User added to array:", order.user._id);

              order.paymentLogs.push({
                status: "COUPON_CONSUMED",
                timestamp: new Date(),
                details: {
                  couponCode: code,
                  newUserCount: coupon.userCount + 1,
                  multiUse: coupon.multiUse,
                  userId: order.user._id,
                },
              });
            }
          }
        } catch (err: any) {
          console.error("❌ WEBHOOK: Coupon consumption error:", err.message);
          console.error("❌ WEBHOOK: Full error:", err);
          order.paymentLogs.push({
            status: "COUPON_ERROR",
            timestamp: new Date(),
            details: { couponCode: order.couponCode, error: err.message },
          });
        }

        console.log("🎫 ===== WEBHOOK: Finished coupon consumption =====");
      }

      // ═══════════════════════════════════════════════════════════════════
      // ⭐ UPDATE STOCK LEVELS (Now safe - will only run once)
      // ═══════════════════════════════════════════════════════════════════
      console.log(`📦 Starting stock update for order: ${orderId}`);

      for (const item of order.productDetails) {
        const totalOrderedCount = (item.count || 0) + (item.freeCount || 0);
        const productId = item.product._id;
        const sizeName = item.size.size;

        console.log(`📦 Updating stock for product ${productId}, size ${sizeName}, qty: -${totalOrderedCount}`);

        await Product.updateOne(
          { _id: productId, "sizes.size": sizeName },
          {
            $inc: {
              "sizes.$.stock": -totalOrderedCount,
              "sizes.$.sellCount": totalOrderedCount,
            },
          }
        );
      }

      console.log(`✅ Stock updated successfully for order: ${orderId}`);

      // ═══════════════════════════════════════════════════════════════════
      // 📧 SEND CONFIRMATION EMAILS
      // ═══════════════════════════════════════════════════════════════════
      try {
        await sendUserOrderEmail(order);
        console.log(`✅ User email sent for order: ${orderId}`);
      } catch (emailError) {
        console.error(`❌ Failed to send user email for order ${orderId}:`, emailError);
        // Don't fail the webhook - email is not critical
      }

      try {
        const adminOrderDetails: OrderDetails = {
          orderId: order.orderId,
          customerName: order.shippingAddress?.name,
          customerEmail: order.user?.email,
          totalAmount: order.payablePrice,
          orderDate: new Date(order.updatedAt).toLocaleString().split(",")[0],
        };
        await sendAdminOrderEmail(adminOrderDetails);
        console.log(`✅ Admin email sent for order: ${orderId}`);
      } catch (emailError) {
        console.error(`❌ Failed to send admin email for order ${orderId}:`, emailError);
        // Don't fail the webhook - email is not critical
      }

      // Save payment logs updates
      await order.save();

      console.log(`✅ Successfully processed payment for order: ${orderId}`);
      return NextResponse.json({
        success: true,
        msg: "Order processed successfully",
      });

    } else {
      // ═══════════════════════════════════════════════════════════════════
      // ❌ HANDLE FAILED OR PENDING PAYMENTS
      // ═══════════════════════════════════════════════════════════════════
      console.log(
        `Processing non-success payment for order: ${orderId}, status: ${decodedResponse?.code}`
      );

      const order = await Order.findOne({ orderId });

      if (!order) {
        console.log(`Order not found: ${orderId}`);
        return NextResponse.json(
          { success: true, msg: "Order not found" },
          { status: 200 }
        );
      }

      // Don't overwrite PAYMENT_SUCCESS if it's already set
      if (order.paymentStatus === "PAYMENT_SUCCESS") {
        console.log(
          `Order ${orderId} already successful - ignoring status: ${decodedResponse?.code}`
        );
        return NextResponse.json(
          { success: true, msg: "Order already processed successfully" },
          { status: 200 }
        );
      }

      // Update to failed/pending status
      order.paymentStatus = decodedResponse?.code || "PAYMENT_FAILED";
      order.paymentLogs.push({
        status: decodedResponse?.code || "PAYMENT_FAILED",
        timestamp: new Date(),
        details: decodedResponse,
      });

      await order.save();

      console.log(
        `Payment failed or pending for order: ${orderId}. Status: ${order.paymentStatus}`
      );
      return NextResponse.json({
        success: true,
        msg: "Payment status updated to failed/pending",
      });
    }
  } catch (error) {
    console.error("Error in PhonePe webhook: ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};