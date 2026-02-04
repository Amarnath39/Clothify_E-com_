import { NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import mongoose from "mongoose";

/**
 * Health Check Endpoint for POS System
 * GET /api/admin/pos/health
 */
export async function GET() {
    const healthStatus: any = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "unknown",
        checks: {}
    };

    // Check MongoDB Connection
    try {
        await connectDB();
        healthStatus.checks.mongodb = {
            status: "✅ Connected",
            state: mongoose.connection.readyState,
            // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
            stateText: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown",
            host: mongoose.connection.host || "N/A"
        };
    } catch (error: any) {
        healthStatus.checks.mongodb = {
            status: "❌ Failed",
            error: error.message
        };
    }

    // Check Environment Variables
    healthStatus.checks.env = {
        MONGO_URI: process.env.MONGO_URI ? "✅ Set" : "❌ Missing",
        JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? "✅ Set" : "❌ Missing",
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? "✅ Set" : "❌ Missing",
        RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing",
        NODE_ENV: process.env.NODE_ENV || "❓ Not set"
    };

    // Check MongoDB Features
    try {
        const adminDb = mongoose.connection.db?.admin();
        if (adminDb) {
            const serverStatus = await adminDb.serverStatus();
            const buildInfo = await adminDb.buildInfo();

            healthStatus.checks.mongoFeatures = {
                version: buildInfo.version,
                storageEngine: serverStatus.storageEngine?.name || "unknown",
                replication: serverStatus.repl ? "✅ Replica Set" : "⚠️  Standalone (no transactions)"
            };
        }
    } catch (error: any) {
        healthStatus.checks.mongoFeatures = {
            status: "⚠️  Could not determine",
            note: "This is OK - stock updates will work without transactions"
        };
    }

    // Overall Status
    const hasMongoConnection = healthStatus.checks.mongodb?.status?.includes("✅");
    const hasRequiredEnv =
        healthStatus.checks.env.MONGO_URI === "✅ Set" &&
        healthStatus.checks.env.JWT_SECRET === "✅ Set";

    healthStatus.overall = hasMongoConnection && hasRequiredEnv ? "✅ Healthy" : "❌ Unhealthy";
    healthStatus.ready = hasMongoConnection && hasRequiredEnv;

    const statusCode = healthStatus.ready ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
}
