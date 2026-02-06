import mongoose from "mongoose";
import { connectDB } from "./src/db";
import RefundRequest from "./src/model/RefundRequest";

async function cleanup() {
    try {
        await connectDB();
        console.log("Connected to DB. Searching for duplicate refunds...");

        const productId = "696f62c53d596ec4632a5fec";

        // Find refund requests containing this product
        const duplicates = await RefundRequest.find({
            "items.product": productId
        });

        if (duplicates.length === 0) {
            console.log("No duplicate refunds found for this product.");
        } else {
            console.log(`Found ${duplicates.length} refund records. Deleting them to allow a fresh retry...`);

            for (const doc of duplicates) {
                await RefundRequest.findByIdAndDelete(doc._id);
                console.log(`Deleted RefundRequest: ${doc._id}`);
            }

            console.log("✅ Cleanup complete. You can now try the refund again.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Cleanup failed:", err);
        process.exit(1);
    }
}

cleanup();
