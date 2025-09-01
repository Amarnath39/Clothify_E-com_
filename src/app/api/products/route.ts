import { NextRequest, NextResponse } from "next/server";
import Product from "../../../../model/Product";
import Category from "../../../../model/Category";
import { connectDB } from "../../../../db";
import "../../../../model/Category";

connectDB();

export const GET = async (req: NextRequest) => {
  try {
    // Parse the URL to get query parameters
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const categoryId = url.searchParams.get("categoryId");
    const page = parseInt(url.searchParams.get("page") as string) || 1; // Default to page 1
    const limit = parseInt(url.searchParams.get("limit") as string) || 10; // Default to 10 items per page
    const sort = url.searchParams.get("sort"); // For sorting
    const percentageOff = parseInt(
      url.searchParams.get("percentageOff") as string
    );
    const colors = JSON.parse(
      (url.searchParams.get("colors") as string) || "[]"
    ) as string[];
    const material = JSON.parse(
      (url.searchParams.get("material") as string) || "[]"
    ) as string[];
    const minPrice = parseFloat(url.searchParams.get("minPrice") as string);
    const maxPrice = parseFloat(url.searchParams.get("maxPrice") as string);
    const featureProduct = url.searchParams.get("featureProduct") as string;
    const bestsellerProduct = url.searchParams.get(
      "bestsellerProduct"
    ) as string;
    const latestProduct = url.searchParams.get("latestProduct") as string;
    const sizes = JSON.parse(
      (url.searchParams.get("sizes") as string) || "[]"
    ) as string[];
    // Build the search criteria
    const searchCriteria: any = {};

    if (search) {
      const regex = new RegExp(search, "i"); // 'i' for case-insensitive
      searchCriteria.$or = [
        { name: regex },
        { description: regex },
        { sku: regex },
      ];
    }
    searchCriteria.sizes = {
      $elemMatch: {},
    };

    if (categoryId) {
      searchCriteria.categories = categoryId;
    }

    // If searching by category name, first find matching category IDs
    if (search) {
      const matchingCategories = await Category.find({
        name: new RegExp(search, "i"),
      });
      const matchingCategoryIds = matchingCategories.map(
        (category) => category._id
      );

      // Add category search to criteria
      searchCriteria.$or.push({ categories: { $in: matchingCategoryIds } });
    }

    // if (!isNaN(percentageOff)) {
    //   searchCriteria.off = { $gte: percentageOff };
    // }

    if (colors && colors.length > 0) {
      searchCriteria.$or = [
        { color: { $in: colors.map((c) => new RegExp(c, "i")) } },
        {
          colors: {
            $elemMatch: {
              color: { $in: colors.map((c) => new RegExp(c, "i")) },
            },
          },
        },
      ];
    }

    if (material && material.length > 0) {
      searchCriteria.material = {
        $in: material.map((m) => new RegExp(m, "i")),
      };
    }
    if (sizes && sizes.length > 0) {
      searchCriteria.sizes = {
        $in: { size: sizes.map((s) => new RegExp(s, "i")) },
      };
    }
    if (featureProduct) {
      searchCriteria.featureProduct = featureProduct;
    }
    if (bestsellerProduct) {
      searchCriteria.bestsellerProduct = bestsellerProduct;
    }
    if (latestProduct) {
      searchCriteria.latestProduct = latestProduct;
    }

    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      if (!isNaN(minPrice)) {
        searchCriteria.sizes.$elemMatch.offerPrice = {
          $gte: minPrice,
        };
      }

      if (!isNaN(maxPrice)) {
        searchCriteria.sizes.$elemMatch.offerPrice = {
          ...searchCriteria.sizes.$elemMatch.offerPrice,
          $lte: maxPrice,
        };
      }
    }

    // Determine sorting
    let sortCriteria = {};
    if (sort === "newlyArrived") {
      sortCriteria = { createdAt: -1 }; // Sort by newly arrived
    } else if (sort === "priceHighToLow") {
      sortCriteria = { offerPrice: -1 }; // Sort by price high to low
    } else if (sort === "priceLowToHigh") {
      sortCriteria = { offerPrice: 1 }; // Sort by price low to high
    }

    // Calculate the skip value
    const skip = (page - 1) * limit;

    // Query the products with pagination
    const products = await Product.find(searchCriteria)
      .populate("categories")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const sizeOrder = [
      "M",
      "L",
      "XL",
      "XXL",
      "3XL",
      "4XL",
      "5XL",
      "6XL",
      "Others",
      "Freesize",
    ];

    products.forEach((product) => {
      product.sizes.sort((a: any, b: any) => {
        return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
      });
    });
    // Get the total count of products matching the search criteria
    const totalProducts = await Product.countDocuments(searchCriteria);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalProducts / limit);
    return NextResponse.json(
      {
        success: true,
        msg: "Success",
        products,
        totalPages,
        previousPage: page == 1 ? null : page - 1,
        currentPage: page,
        nextPage: page === totalPages ? null : page + 1,
        totalProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to get all products ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";
