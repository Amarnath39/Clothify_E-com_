import { connectDB } from "@/../db";
import Order from "@/model/Order";
import Product from "@/model/Product";
import { notFound } from "next/navigation";
import InvoiceClient from "./InvoiceClient";

export default async function InvoicePage({ params }: { params: { id: string } }) {
    await connectDB();

    // Ensure models are registered
    const productModel = Product;

    // Find order by invoiceId
    const order = await Order.findOne({ invoiceId: params.id })
        .populate({
            path: "productDetails.product",
            select: "name actualPrice offerPrice images"
        })
        .lean();

    if (!order) {
        return notFound();
    }

    // Convert ObjectId to string for client component serialization
    const serializedOrder = JSON.parse(JSON.stringify(order));

    return <InvoiceClient order={serializedOrder} />;
}
