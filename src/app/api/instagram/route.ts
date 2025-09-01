import { NextRequest, NextResponse } from "next/server";
import Instagram from "../../../../model/Instagram";
import { connectDB } from "../../../../db";

connectDB();

export const GET = async (req: NextRequest) => {
    try {
      const instagramDetails = await Instagram.find();
      return NextResponse.json(
        { success: true, msg: "Success", instagramDetails },
        { status: 200,  headers: {
          'Cache-Control': 'no-store, max-age=0'
      } }
      );
    } catch (error) {
      console.log("Error to get insta details", error);
      return NextResponse.json(
        { success: false, msg: "Internal Server Error" },
        { status: 500 }
      );
    }
  };

  export const dynamic = "force-dynamic"