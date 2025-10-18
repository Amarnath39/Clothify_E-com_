// import { NextRequest, NextResponse } from "next/server";
// import ZoomData from "../../../../../model/ZoomData";
// import { connectDB } from "../../../../../db";
// import Admin from "../../../../../model/Admin";

// connectDB();

// export const POST = async (req: NextRequest) => {
//     try {
//         const adminId = req.headers.get('x-admin-id');
//         if (!adminId) {
//             return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
//         }

//         const admin = await Admin.findById(adminId);
//         if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
//             return NextResponse.json(
//                 { success: false, msg: "Unauthorized" },
//                 { status: 401 }
//             );
//         }

//         const formData = await req.formData();
//         const items = JSON.parse(formData.get("title") as string || '[]') as { img: string, title: string }[];

//         if (!items || items.length === 0) {
//             return NextResponse.json(
//                 { success: false, msg: "No items received." },
//                 { status: 400 }
//             );
//         }

//         const zoomDataArray: any[] = [];

//         for (const item of items) {
//             const zoomData = await ZoomData.create({
//                 img: item.img,
//                 title: item.title,
//             });
//             zoomDataArray.push(zoomData);
//         }

//         return NextResponse.json(
//             { success: true, msg: "Created successfully", zoomData: zoomDataArray },
//             {
//                 status: 201, headers: {
//                     'Cache-Control': 'no-store, max-age=0'
//                 }
//             }
//         );
//     } catch (error) {
//         console.log("Error creating zoom data", error);
//         return NextResponse.json(
//             { success: false, msg: "Internal Server Error" },
//             { status: 500 }
//         );
//     }
// };

import { NextRequest, NextResponse } from "next/server";
import ZoomData from "../../../../model/ZoomData";
import { connectDB } from "../../../../../db";
import Admin from "../../../../model/Admin";
import { writeFile, mkdir, unlink, access } from "fs/promises";
import path from "path";
import { uploadFile } from "../../../../helper/uploadFile";

connectDB();

export const POST = async (req: NextRequest) => {
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

    const formData = await req.formData();
    const zoomDataArray: any[] = [];

    // Ensure the directory exists
    // const uploadDir = path.join(
    //   process.cwd(),
    //   "public",
    //   "assets",
    //   "server",
    //   "zoomData"
    // );
    // await mkdir(uploadDir, { recursive: true });

    // // Delete all previous zoom data and their associated files
    // const previousZoomData = await ZoomData.find();
    // for (const item of previousZoomData) {
    //   const filePath = path.join(process.cwd(), "public", item.img);
    //   try {
    //     await unlink(filePath);
    //   } catch (error) {
    //     console.log(`Failed to delete file: ${filePath}`, error);
    //   }
    // }
    // await ZoomData.deleteMany({});

    for (let i = 0; i < 4; i++) {
      const file = formData.get(`image${i}`) as File;
      const title = formData.get(`title${i}`) as string;

      if (!file || !title) {
        return NextResponse.json(
          { success: false, msg: `Missing image or title for item ${i + 1}` },
          { status: 400 }
        );
      }

      // const bytes = await file.arrayBuffer();
      // const buffer = Buffer.from(bytes);

      // // Save the file
      // const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      // const filepath = path.join(uploadDir, filename);
      // await writeFile(filepath, buffer);

      const imgUrl = await uploadFile("server/zoomData", file);

      // Save to database
      const zoomData = await ZoomData.create({
        img: imgUrl,
        title: title,
      });
      zoomDataArray.push(zoomData);
    }

    return NextResponse.json(
      { success: true, msg: "Created successfully", zoomData: zoomDataArray },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Error creating zoom data", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"