import { NextRequest, NextResponse } from "next/server";
import Product from "../../../model/Product";
import Category from "../../../model/Category";
import { connectDB } from "../../../../db";
import "../../../model/Category";

connectDB();

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const categoryId = url.searchParams.get("categoryId");
    const page = parseInt(url.searchParams.get("page") as string) || 1;
    const limit = parseInt(url.searchParams.get("limit") as string) || 10;
    const sort = url.searchParams.get("sort");
    const percentageOff = parseInt(url.searchParams.get("percentageOff") as string);
    const colors = JSON.parse((url.searchParams.get("colors") as string) || "[]") as string[];
    const material = JSON.parse((url.searchParams.get("material") as string) || "[]") as string[];
    const minPrice = parseFloat(url.searchParams.get("minPrice") as string);
    const maxPrice = parseFloat(url.searchParams.get("maxPrice") as string);
    const featureProduct = url.searchParams.get("featureProduct") as string;
    const bestsellerProduct = url.searchParams.get("bestsellerProduct") as string;
    const latestProduct = url.searchParams.get("latestProduct") as string;
    const sizes = JSON.parse((url.searchParams.get("sizes") as string) || "[]") as string[];
    const filterCategories = JSON.parse((url.searchParams.get("filterCategories") as string) || "[]") as string[];

    const searchCriteria: any = {};
    if (search) {
      const regex = new RegExp(search, "i");
      searchCriteria.$or = [{ name: regex }, { description: regex }, { sku: regex }];
    }

    searchCriteria.sizes = { $elemMatch: {} };

    if (filterCategories.length > 0) {
      searchCriteria.categories = { $in: filterCategories };
    } else if (categoryId) {
      searchCriteria.categories = categoryId;
    }

    if (search) {
      const matchingCategories = await Category.find({ name: new RegExp(search, "i") });
      const matchingCategoryIds = matchingCategories.map((c) => c._id);
      searchCriteria.$or.push({ categories: { $in: matchingCategoryIds } });
    }

    if (colors.length > 0) {
      searchCriteria.$or = [
        { color: { $in: colors.map((c) => new RegExp(c, "i")) } },
        { colors: { $elemMatch: { color: { $in: colors.map((c) => new RegExp(c, "i")) } } } },
      ];
    }

    if (material.length > 0) {
      searchCriteria.material = { $in: material.map((m) => new RegExp(m, "i")) };
    }

    if (sizes.length > 0) {
      searchCriteria.sizes = { $in: { size: sizes.map((s) => new RegExp(s, "i")) } };
    }

    if (featureProduct) searchCriteria.featureProduct = featureProduct;
    if (bestsellerProduct) searchCriteria.bestsellerProduct = bestsellerProduct;
    if (latestProduct) searchCriteria.latestProduct = latestProduct;

    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      if (!isNaN(minPrice)) {
        searchCriteria.sizes.$elemMatch.offerPrice = { $gte: minPrice };
      }
      if (!isNaN(maxPrice)) {
        searchCriteria.sizes.$elemMatch.offerPrice = {
          ...searchCriteria.sizes.$elemMatch.offerPrice,
          $lte: maxPrice,
        };
      }
    }

    let sortCriteria = {};
    if (sort === "newlyArrived") sortCriteria = { createdAt: -1 };
    else if (sort === "priceHighToLow") sortCriteria = { "sizes.offerPrice": -1 };
    else if (sort === "priceLowToHigh") sortCriteria = { "sizes.offerPrice": 1 };

    const skip = (page - 1) * limit;

    const products = await Product.find(searchCriteria)
      .populate("categories")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const sizeOrder = ["M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "Others", "Freesize"];
    products.forEach((product) => {
      product.sizes.sort((a: any, b: any) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));
    });

    const totalProducts = await Product.countDocuments(searchCriteria);
    const totalPages = Math.ceil(totalProducts / limit);

    return NextResponse.json(
      {
        success: true,
        msg: "Success",
        products,
        totalPages,
        previousPage: page === 1 ? null : page - 1,
        currentPage: page,
        nextPage: page === totalPages ? null : page + 1,
        totalProducts,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching products:", error);

    return NextResponse.json(
      {
        success: false,
        msg: error.message || "An unexpected error occurred.",
        errorType: error.name || "UnknownError",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";
