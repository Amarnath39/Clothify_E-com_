import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import Product from "../../../../../model/Product";
import mongoose from "mongoose";
import { uploadFile } from "../../../../../helper/uploadFile";
import { deleteFile } from "../../../../../helper/deleteFile";
import Admin from "../../../../../model/Admin";

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

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await connectDB();
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
    const id = params.id;
    const product = await Product.findByIdAndDelete(id);
    if (!product)
      return NextResponse.json(
        { success: false, msg: "Product not found" },
        { status: 404 }
      );
    return NextResponse.json(
      { success: true, msg: "Success", product },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to delete product by id", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await connectDB();
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
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, msg: "Invalid product ID" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    console.log(formData, "fromdata");
    const files = formData.getAll("file") as File[];
    const name = formData.get("name") as string | null;
    const sku = formData.get("sku") as string | null;
    console.log(name, "name");
    const categories = JSON.parse(
      (formData.get("categories") as string) || "[]"
    ) as string[];
    const description = formData.get("description") as string | null;
    const actualPrice = formData.get("actualPrice") as string | null;
    const width = formData.get("width") as string | null;
    const height = formData.get("height") as string | null;
    const material = JSON.parse(
      (formData.get("material") as string) || "[]"
    ) as string[] | null;
    const sizes = JSON.parse((formData.get("sizes") as string) || "[]") as
      | Sizes[]
      | null;
    const washCare = formData.get("washCare") as string | null;
    const note = formData.get("note") as string | null;
    const color = formData.get("color") as string | null;
    const colors = JSON.parse(
      (formData.get("colors") as string) || "[]"
    ) as Colors[];
    const offers = JSON.parse(
      (formData.get("offers") as string) || "[]"
    ) as Offers[];
    const returnRules = JSON.parse(
      (formData.get("returnRules") as string) || "[]"
    ) as string[];
    const existingImgUrls = JSON.parse(
      (formData.get("existingImages") as string) || "[]"
    ) as string[];
    const featureProduct = formData.get("featureProduct") as string;
    const latestProduct = formData.get("latestProduct") as string;
    const bestsellerProduct = formData.get("bestsellerProduct") as string;
    const rating = Number(formData.get("rating") as string) || null;
    const ratedBy = parseInt(formData.get("ratedBy") as string) || null;
    const additionalFields =
      (formData.get("additionalFields") as string) || null;

    const is_prebooking = formData.get("is_prebooking");
    const prebooking_start_at = formData.get("prebooking_start_at");
    const prebooking_end_at = formData.get("prebooking_end_at");

    console.log(ratedBy, "rated by");

    const updateData: any = {};

    if (name !== null) updateData.name = name;
    if (sku !== null) updateData.sku = sku;
    if (categories.length > 0) updateData.categories = categories;
    if (description !== null) updateData.description = description;
    if (actualPrice !== null) updateData.actualPrice = parseFloat(actualPrice);
    if (sizes !== null && sizes.length > 0) {
      // Preserve sellCount when updating sizes
      const existingProduct = await Product.findById(id);
      if (existingProduct && existingProduct.sizes) {
        updateData.sizes = sizes.map((newSize: any) => {
          const existingSize = existingProduct.sizes.find(
            (s: any) => s._id.toString() === newSize._id || s.size === newSize.size
          );
          return {
            ...newSize,
            sellCount: existingSize?.sellCount || newSize.sellCount || 0, // Preserve sellCount
          };
        });
      } else {
        updateData.sizes = sizes;
      }
    }
    if (width !== null) updateData.width = width;
    if (height !== null) updateData.height = height;
    if (material !== null && material.length > 0)
      updateData.material = material;
    if (washCare !== null) updateData.washCare = washCare;
    if (note !== null) updateData.note = note;
    if (color !== null) updateData.color = color;
    if (offers && offers !== null) updateData.offers = offers;
    if (returnRules.length > 0) updateData.returnRules = returnRules;
    if (featureProduct !== null) updateData.featureProduct = featureProduct;
    if (latestProduct !== null) updateData.latestProduct = latestProduct;
    if (bestsellerProduct !== null)
      updateData.bestsellerProduct = bestsellerProduct;
    console.log(updateData, "upadtdata1");
    if (rating !== null)
      updateData.rating = { ...updateData?.rating, star: rating };

    if (ratedBy !== null)
      updateData.rating = { ...updateData?.rating, ratedBy };
    if (additionalFields !== null)
      updateData.additionalFields = JSON.parse(additionalFields || "{}");

    if (is_prebooking !== null) updateData.is_prebooking = is_prebooking === "true";
    if (prebooking_start_at !== null) {
      updateData.prebooking_start_at = prebooking_start_at ? new Date(prebooking_start_at as string) : null;
    }
    if (prebooking_end_at !== null) {
      updateData.prebooking_end_at = prebooking_end_at ? new Date(prebooking_end_at as string) : null;
    }

    const imgUrls: any[] = [];
    // Handling image files and updating img field if necessary
    if (files.length > 0) {
      //Upload image
      for (const file of files) {
        const imgUrl = await uploadFile("server/product", file);
        if (imgUrl === null)
          return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
          );
        imgUrls.push(imgUrl);
      }
    }
    updateData.img = [...existingImgUrls, ...imgUrls];
    console.log(updateData, "upadtdata");

    const prevProduct = await Product.findById(id);
    if (prevProduct) {
      prevProduct.img.forEach(async (v: string) => {
        if (!existingImgUrls.includes(v)) {
          // Delete Img
          await deleteFile(v);
        }
      });
    }

    // Remove old variant references
    await Product.updateMany(
      { "colors.varientId": id },
      { $pull: { colors: { varientId: id } } }
    );

    // ✅ NEW: Recalculate Inventory Fields if sizes or other affecting fields are updated
    if (updateData.sizes) {
      const totalStock = updateData.sizes.reduce((acc: any, curr: any) => acc + parseInt(curr.stock || "0"), 0);
      updateData.totalStock = totalStock;

      // Preserve reserved stock (fetch current if not available in updateData/calculation)
      // Since we don't have reservedStock in form data, we need to defer this or fetch.
      // Easiest is to handle "availableStock" logic after fetching existing product or assume reserved is unchanged.
      // But `reservedStock` is new, likely 0. 
      // Let's assume calculated totalStock - existingReserved.

      // We need to fetch the document first if we want accurate availableStock calculation while preserving reserved.
      // We already fetched `prevProduct` (at line 206) but it might be slightly stale if we want to be super precise, but fine for now.
      const existingReserved = prevProduct?.reservedStock || 0;
      updateData.availableStock = totalStock - existingReserved;
    }


    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, msg: "Product not found" },
        { status: 404 }
      );
    }

    const off =
      ((updatedProduct.actualPrice - updatedProduct.offerPrice) /
        updatedProduct.actualPrice) *
      100;
    updatedProduct.off = off.toFixed(2);

    updatedProduct.save();

    // Function to recursively collect all linked variant IDs
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
    allLinkedVariants.set(id, updatedProduct.color);
    for (const colorVariant of colors) {
      await collectAllLinkedVariants(colorVariant.varientId, allLinkedVariants);
    }

    // Update all linked products with the complete set of variants
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
    const finalUpdatedProduct = await Product.findById(id);
    return NextResponse.json(
      { success: true, data: finalUpdatedProduct },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to delete product by id", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";
