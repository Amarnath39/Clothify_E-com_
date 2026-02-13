import mongoose from "mongoose";
import Order from "./src/model/Order";
import RefundRequest from "./src/model/RefundRequest";
import { connectDB } from "./db";

async function diagnose() {
    await connectDB();
    console.log("Checking for orders with multiple refund requests...");

    const refunds = await RefundRequest.find({});
    const orderRefMap: Record<string, any[]> = {};

    refunds.forEach(r => {
        const key = r.orderRef?.toString() || r.orderId;
        if (!orderRefMap[key]) orderRefMap[key] = [];
        orderRefMap[key].push(r);
    });

    for (const [key, list] of Object.entries(orderRefMap)) {
        if (list.length > 0) {
            console.log(`Order ${key} has ${list.length} refund records.`);
            list.forEach(r => {
                console.log(`  - Refund ID: ${r._id}, Created: ${r.createdAt}, Items: ${JSON.stringify(r.items)}`);
            });
        }
    }

    process.exit(0);
}

diagnose();
