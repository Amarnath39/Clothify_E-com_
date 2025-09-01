import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../../../../model/Coupon";
import Admin from "../../../../../../model/Admin";
import { connectDB } from "../../../../../../db";

connectDB();

export const DELETE = async (
    req: NextRequest,
    { params }: { params: { id: string } }
) => {
    try {
        const adminId = req.headers.get('x-admin-id');
        if (!adminId) {
            return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
        }
        const admin = await Admin.findById(adminId);
        if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
            return NextResponse.json(
                { success: false, msg: "Unauthorized" },
                { status: 401 }
            );
        }
        const id = params.id;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            return NextResponse.json(
                { success: false, msg: "coupon not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: true, msg: "Success", coupon },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error to delete coupon", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
};


export const PATCH = async (req: NextRequest) => {
    try {
        const adminId = req.headers.get("x-admin-id");
        if (!adminId) {
            return NextResponse.json(
                { success: false, msg: "Please provide Admin Id" },
                { status: 400 }
            );
        }
        const admin = await Admin.findById(adminId);
        if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
            return NextResponse.json(
                { success: false, msg: "Unauthorized" },
                { status: 401 }
            );
        }
        const body = await req.json();
        const {
            couponCode,
            description,
            categories,
            validity,
            type,
            off,
            availableFor,
            amount,
            purchaseAmount,
            visible,
            multiUse,
        } = body;

        const updateCoupon: any = {};
        if (couponCode) updateCoupon.couponCode = couponCode;
        if (description) updateCoupon.description = description;
        if (validity) updateCoupon.validity = new Date(validity);
        if (type) updateCoupon.type = type;
        if (off) updateCoupon.off = off;
        if (availableFor) updateCoupon.availableFor = availableFor;
        if (amount) updateCoupon.amount = amount;
        if (purchaseAmount) updateCoupon.purchaseAmount = purchaseAmount;
        if (visible !== undefined) updateCoupon.visible = visible;
        if (multiUse !== undefined) updateCoupon.multiUse = multiUse;

        // Handle validOnCategories as an array of ObjectId references
        if (categories && Array.isArray(categories)) {
            updateCoupon.validOnCategories = categories;
        }

        // Find the coupon by couponCode and update it
        const coupon = await Coupon.findOneAndUpdate(
            { couponCode: couponCode },
            { $set: updateCoupon },
            { new: true } // Return the updated document
        );

        if (!coupon) {
            return NextResponse.json(
                { success: false, msg: "Coupon not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, msg: "Coupon updated successfully", coupon },
            { status: 200 }
        );

    } catch (error) {
        console.log("Error to delete coupon", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic"