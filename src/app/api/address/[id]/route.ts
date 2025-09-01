import { NextRequest, NextResponse } from "next/server";
import Address from "../../../../../model/Address";
import { connectDB } from "../../../../../db";
import User from "../../../../../model/User";

connectDB();

export const DELETE = async (req: NextRequest, {params}: {params: {id: string}}) => {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ success: false, msg: "Please provide User Id" }, { status: 400 });
        }
        const checkUser = await User.findById(userId);
        if (!checkUser) {
            return NextResponse.json(
                { success: false, msg: "Unauthorized" },
                { status: 401 }
            );
        }
        const id = params.id;
        const address = await Address.findByIdAndDelete(id);
        if (!address) {
            return NextResponse.json({ success: false, msg: "Address not found" }, { status: 404 });
        }
        const user = await User.findByIdAndUpdate(userId, {$pull: {address: id}}, {new: true});
        if (!user) {
            return NextResponse.json({ success: false, msg: "User not found" }, { status: 401 });
        }
        return NextResponse.json({ success: true, msg: "Success", address }, { status: 200 });
    } catch (error) {
        console.log("Error to delete address", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const PATCH = async (req: NextRequest, {params}: {params: {id: string}}) => {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ success: false, msg: "Please provide User Id" }, { status: 400 });
        }
        const checkUser = await User.findById(userId);
        if (!checkUser) {
            return NextResponse.json(
                { success: false, msg: "Unauthorized" },
                { status: 401 }
            );
        }
        const id = params.id;
        const body = await req.json();
        const { name, address, mobile, country, state, addressType, zipCode,city } = body;

        const newAddress: any = {};

        if(name) newAddress.name = name;
        if(address) newAddress.address = address;
        if(mobile) newAddress.mobile = mobile;
        if(country) newAddress.country = country;
        if(state) newAddress.state = state;
        if(addressType) newAddress.addressType = addressType;
        if(zipCode) newAddress.zipCode = zipCode;
        if(city) newAddress.city = city;

        const updatedAddress = await Address.findByIdAndUpdate(id, newAddress , {new: true});
        if (!updatedAddress) {
            return NextResponse.json({ success: false, msg: "Address not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, msg: "Success", updatedAddress }, { status: 200 });
    } catch (error) {
        console.log("Error to update address", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}