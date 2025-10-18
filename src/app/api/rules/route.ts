import { NextRequest, NextResponse } from "next/server";
import ReturnRules from "../../../model/ReturnRules";
import { connectDB } from "../../../../db";

connectDB();

export const GET = async (req: NextRequest) => {
  try {
    const rules = await ReturnRules.find();
    return NextResponse.json({ success: true, rules }, { status: 200 });
  } catch (error) {
    console.log("Error to get rules", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"
