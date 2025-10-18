import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import { uploadFile } from "../../../../helper/uploadFile";
import Product from "../../../../model/Product";
import Admin from "../../../../model/Admin";

connectDB();
interface Colors {
  color: string;
  varientId: string;
}

interface Offers {
  purchaseQuantity: number;
  freeQuantity: number;
  status?: string;
  products?: Object[];
}

interface Sizes {
  size: string;
  stock: string;
  offerPrice: Number;
  deliveryPrice: Number;
}
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
    if (
      !admin ||
      (admin.role !== "Sales person" &&
        admin.role !== "Admin" &&
        admin.role !== "SuperAdmin")
    ) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }
    const formData = await req.formData();

    const files = formData.getAll("file") as File[];
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const categories = JSON.parse(
      (formData.get("categories") as string) || "[]"
    ) as string[];
    const description = formData.get("description") as string;
    const actualPrice = parseFloat(formData.get("actualPrice") as string);
    const width = formData.get("width") as string;
    const height = formData.get("height") as string;
    const material = JSON.parse(
      (formData.get("material") as string) || "[]"
    ) as string[];
    const sizes = JSON.parse(
      (formData.get("sizes") as string) || "[]"
    ) as Sizes[];
    const washCare = formData.get("washCare") as string;
    const note = formData.get("note") as string;
    const color = formData.get("color") as string;
    const colors = JSON.parse(
      (formData.get("colors") as string) || "[]"
    ) as Colors[];
    const offers = JSON.parse(
      (formData.get("offers") as string) || "[]"
    ) as Offers[];
    const returnRules = JSON.parse(
      (formData.get("returnRules") as string) || "[]"
    ) as string[];
    const featureProduct =
      (formData.get("featureProduct") as string) || "false";
    const latestProduct = (formData.get("latestProduct") as string) || "false";
    const bestsellerProduct =
      (formData.get("bestsellerProduct") as string) || "false";
    const rating = Number(formData.get("rating") as string);
    const ratedBy = parseInt(formData.get("ratedBy") as string);
    const additionalFields = formData.get("additionalFields") as string;
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, msg: "No files received." },
        { status: 400 }
      );
    }
    //Upload image
    const imgUrls: any = [];
    for (const file of files) {
      const imgUrl = await uploadFile("server/product", file);
      if (imgUrl === null)
        return NextResponse.json(
          { success: false, msg: "Internal Server Error" },
          { status: 500 }
        );
      imgUrls.push(imgUrl);
    }

    // const off = ((actualPrice - offerPrice) / actualPrice) * 100;

    // Store in DB
    const newProduct = await Product.create({
      name,
      sku,
      img: imgUrls,
      categories: categories,
      description,
      actualPrice,
      width,
      height,
      material,
      washCare,
      note,
      color,
      sizes,
      colors: [],
      offers,
      returnRules,
      featureProduct,
      latestProduct,
      bestsellerProduct,
      rating: {
        star: rating,
        ratedBy: ratedBy,
      },
      additionalFields: JSON.parse(additionalFields || "{}"),
    });

    // Function to recursively collect all linked variant IDs and their colors
    async function collectAllLinkedVariants(
      productId: string,
      collected = new Map<string, string>()
    ): Promise<Map<string, string>> {
      if (collected.has(productId)) return collected;

      const product = await Product.findById(productId);
      if (!product) return collected;

      collected.set(productId, product.color);

      for (const colorEntry of product.colors) {
        await collectAllLinkedVariants(
          colorEntry.varientId.toString(),
          collected
        );
      }

      return collected;
    }

    // Collect all linked variants, including those from the form data
    const allLinkedVariants = new Map<string, string>();
    allLinkedVariants.set(newProduct._id.toString(), newProduct.color);
    for (const colorVariant of colors) {
      await collectAllLinkedVariants(colorVariant.varientId, allLinkedVariants);
    }

    // Update all linked products (including the new one) with the complete set of variants
    for (const [variantId, variantColor] of allLinkedVariants) {
      const updatedColors = Array.from(allLinkedVariants)
        .filter(([linkedId]) => linkedId !== variantId)
        .map(([linkedId, linkedColor]) => ({
          color: linkedColor,
          varientId: linkedId,
        }));

      await Product.findByIdAndUpdate(variantId, { colors: updatedColors });
    }

    // Fetch the final updated product
    const finalProduct = await Product.findById(newProduct._id);

    return NextResponse.json(
      { success: true, msg: "Success", product: finalProduct },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error to create product", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";
