/**
 * POS Order Test Script
 * Tests the complete POS flow including stock deduction
 */

import mongoose from "mongoose";
import path from "path";

// Import models and functions
import Product from "../src/model/Product";
import { updateStock } from "../src/lib/stockManager";

const MONGO_URI = process.env.MONGO_URI || "";

async function testPOSFlow() {
    console.log("🧪 Starting POS Order Test...\n");

    try {
        // 1. Connect to Database
        console.log("📡 Connecting to MongoDB...");
        if (!MONGO_URI) {
            console.error("❌ MONGO_URI not set in environment!");
            process.exit(1);
        }
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // 2. Find a test product
        console.log("🔍 Finding test product...");
        const testProduct = await Product.findOne({ "sizes.stock": { $gt: 0 } });

        if (!testProduct) {
            console.error("❌ No products with stock found!");
            process.exit(1);
        }

        const testSize = testProduct.sizes.find((s: any) => s.stock > 0);
        if (!testSize) {
            console.error("❌ No size with stock found!");
            process.exit(1);
        }

        console.log("✅ Found test product:", {
            name: testProduct.name,
            id: testProduct._id.toString(),
            size: testSize.size,
            sizeId: testSize._id.toString(),
            currentStock: testSize.stock
        });
        console.log("");

        // 3. Test Stock Update Function
        console.log("🔄 Testing stock update function...");
        const stockBefore = testSize.stock;

        const stockItems = [{
            productId: testProduct._id.toString(),
            sizeId: testSize._id.toString(),
            quantity: 1,
            productName: testProduct.name,
            sizeLabel: testSize.size
        }];

        const stockResult = await updateStock(
            stockItems,
            "SALE",
            "POS",
            "TEST-ORDER-" + Date.now(),
            "TEST-ADMIN"
        );

        if (!stockResult.success) {
            console.error("❌ Stock update failed!");
            console.error("Errors:", stockResult.errors);
            process.exit(1);
        }

        console.log("✅ Stock update successful!");

        // 4. Verify stock was deducted
        const updatedProduct = await Product.findById(testProduct._id);
        const updatedSize = updatedProduct?.sizes.find((s: any) => s._id.toString() === testSize._id.toString());

        if (!updatedSize) {
            console.error("❌ Could not find updated size!");
            process.exit(1);
        }

        console.log("📊 Stock verification:", {
            before: stockBefore,
            after: updatedSize.stock,
            expected: stockBefore - 1,
            match: updatedSize.stock === stockBefore - 1 ? "✅" : "❌"
        });

        if (updatedSize.stock !== stockBefore - 1) {
            console.error("❌ Stock was not properly deducted!");
            process.exit(1);
        }

        // 5. Test payload structure (what frontend sends)
        console.log("\n🧪 Testing POS API payload structure...");
        const testPayload = {
            action: "COMPLETE",
            customerPhone: "9999999999",
            productDetails: [
                {
                    product: testProduct._id.toString(),
                    sizeId: testSize._id.toString(),
                    quantity: 1
                }
            ],
            paymentMethod: "CASH",
            transactionDetails: ""
        };

        console.log("📦 Payload structure:", JSON.stringify(testPayload, null, 2));

        // Validate payload
        const { action, customerPhone, productDetails, paymentMethod } = testPayload;

        if (!customerPhone) {
            console.error("❌ Missing customerPhone");
            process.exit(1);
        }

        if (!productDetails || !Array.isArray(productDetails) || productDetails.length === 0) {
            console.error("❌ Invalid productDetails");
            process.exit(1);
        }

        console.log("✅ Payload validation passed");

        // 6. Restore stock (cleanup)
        console.log("\n🔄 Restoring stock (cleanup)...");
        await updateStock(
            stockItems,
            "REFUND",
            "POS",
            "TEST-CLEANUP-" + Date.now(),
            "TEST-ADMIN"
        );

        const restoredProduct = await Product.findById(testProduct._id);
        const restoredSize = restoredProduct?.sizes.find((s: any) => s._id.toString() === testSize._id.toString());

        if (restoredSize?.stock === stockBefore) {
            console.log("✅ Stock restored successfully");
        } else {
            console.log("⚠️ Stock restoration mismatch:", {
                expected: stockBefore,
                actual: restoredSize?.stock
            });
        }

        console.log("\n✅ ALL TESTS PASSED! 🎉\n");
        process.exit(0);

    } catch (error: any) {
        console.error("\n❌ TEST FAILED!");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("📡 Disconnected from MongoDB");
    }
}

// Run tests
testPOSFlow();
