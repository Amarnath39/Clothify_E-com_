import { NextRequest, NextResponse } from "next/server";
import BeforeAfter from "../../../../model/BeforeAfter";
import { connectDB } from "../../../../../db";

connectDB();

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const id = params.id;
    const beforeAfter = await BeforeAfter.findByIdAndDelete(id);
    if (!beforeAfter) {
      return NextResponse.json(
        { success: false, msg: "Before After not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, msg: "Success", beforeAfter },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to delete Before After", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";
