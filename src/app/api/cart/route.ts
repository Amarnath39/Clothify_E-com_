import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../db";
import Product from "../../../../model/Product";
import "../../../../model/Category";
import "../../../../model/ReturnRules";

connectDB();

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {carts} = body;
        if (carts.length===0) {
            return NextResponse.json({ success: true, products: [] }, { status: 200 });
        }
        const products = await Product.find({_id: {$in: carts}}).populate(['categories', 'returnRules']);
        if (!products || products.length===0)  return NextResponse.json({ success: false, msg: "Products not found" }, { status: 404 });
        return NextResponse.json({ success: true, msg: "Success", products }, { status: 200 });
    } catch (error) {
        console.log("Error to get cart products ", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" , error: error.message }, { status: 500 });
    }
}

export const dynamic = "force-dynamic"