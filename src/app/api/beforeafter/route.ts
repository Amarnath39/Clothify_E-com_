import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "../../../helper/uploadFile";
import BeforeAfter from "../../../model/BeforeAfter";
import { connectDB } from "../../../../db";

connectDB();
export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const beforeFile = formData.get("beforefile") as File;
    const afterFile = formData.get("afterfile") as File;
    const title = formData.get("title") as string;

    if (!beforeFile || !afterFile) {
      return NextResponse.json(
        { success: false, msg: "No files received." },
        { status: 400 }
      );
    }

    //Upload image
    const beforeImgUrl = await uploadFile("server/beforeafter", beforeFile);
    const afterImgUrl = await uploadFile("server/beforeafter", afterFile);
    if (beforeImgUrl === null || afterImgUrl === null)
      return NextResponse.json(
        { success: false, msg: "Internal Server Error" },
        { status: 500 }
      );

    // Store in DB
    const beforeAfter = await BeforeAfter.create({
      title,
      beforeImg: beforeImgUrl,
      afterImg: afterImgUrl,
    });

    return NextResponse.json(
      { success: true, msg: "Success", beforeAfter },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error to create before after", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const beforeAfter = await BeforeAfter.find();
    return NextResponse.json(
      { success: true, msg: "Success", beforeAfter },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to get before after", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";
