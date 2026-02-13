import { connectDB } from "@/../db";
import Order from "@/model/Order";
import Product from "@/model/Product";
import { notFound } from "next/navigation";
import InvoiceClient from "./InvoiceClient";
import mongoose from "mongoose";

export default async function InvoicePage({ params }: { params: { id: string } }) {
    await connectDB();

    // Ensure models are registered
    const productModel = Product;

    // Find order by invoiceId OR database _id
    let query: any = { invoiceId: params.id };

    // Check if the ID provided is a valid MongoDB ObjectId to use as fallback
    if (mongoose.isValidObjectId(params.id)) {
        query = {
            $or: [
                { invoiceId: params.id },
                { _id: params.id }
            ]
        };
    }

    const order = await Order.findOne(query)
        .populate({
            path: "productDetails.product",
            select: "name actualPrice offerPrice images",
            populate: {
                path: "categories",
                select: "gst hsnCode"
            }
        });

    if (!order) {
        return notFound();
    }

    // Generate invoiceId if missing (legacy orders created before immediate generation)
    if (!order.invoiceId) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        const lastOrder = await Order.findOne({
            invoiceId: { $regex: /^INV-/ },
            createdAt: { $gte: todayStart, $lte: todayEnd },
        })
            .sort({ createdAt: -1 })
            .select("invoiceId")
            .lean() as { invoiceId: string } | null;

        let seq = 1;
        if (lastOrder?.invoiceId) {
            const parts = lastOrder.invoiceId.split("-");
            if (parts.length === 3) {
                const lastSeq = parseInt(parts[2]);
                if (!isNaN(lastSeq)) seq = lastSeq + 1;
            }
        }

        order.invoiceId = `INV-${dateStr}-${seq.toString().padStart(4, "0")}`;
        await order.save();
    }

    // Convert ObjectId to string for client component serialization
    const serializedOrder = JSON.parse(JSON.stringify(order));

    return <InvoiceClient order={serializedOrder} />;
}
