import { NextRequest, NextResponse } from "next/server";
import Category from "../../../model/Category";
import Product from "../../../model/Product";
export const dynamic = "force-dynamic";


export const GET = async (req: NextRequest) => {
    try {
        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";
        const categories = await Category.find({name: new RegExp(search, "i")});
        const products = await Product.find({$or:[{name: new RegExp(search, "i")}, {sku: new RegExp(search, "i")}]});
        let suggestion: any[] = [];
        products.forEach((v) => {
            suggestion.push({name: v.name, type: 'product'});
        });
        categories.forEach((v)=>{
            suggestion.push({name: v.name, type: 'category'});
        });
        return NextResponse.json({ success: true, msg: "Success", suggestion },{ status: 200 });
    } catch (error) {
        console.log("Error to get search products ", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
}
