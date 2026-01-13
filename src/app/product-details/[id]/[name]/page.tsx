import React from "react";
import ProductDetails from "./Details";
import { Metadata } from "next";

import Product from "../../../../model/Product";
import { connectDB } from "../../../../../db";

export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = params;

  await connectDB();
  const product = await Product.findById(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const price = product.sizes && product.sizes.length > 0
    ? product.sizes[0].offerPrice || product.actualPrice
    : product.actualPrice;

  const description = `${product.description ? product.description.substring(0, 150) + '...' : ""} | Price: ₹${price}`;

  const fullTitle = `${product.name} - ₹${price}`;

  return {
    title: fullTitle,
    description: description,
    openGraph: {
      title: fullTitle,
      description: description,
      images: product.img && product.img.length > 0
        ? [product.img[0].startsWith("http") ? product.img[0] : `https://www.siskerala.com${product.img[0]}`]
        : ["https://www.siskerala.com/assets/static/logo/ogimage.png"],
      type: "website",
      siteName: "SIS Kerala",
    },
    other: {
      "product:price:amount": price.toString(),
      "product:price:currency": "INR",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: description,
      images: product.img && product.img.length > 0
        ? [product.img[0].startsWith("http") ? product.img[0] : `https://www.siskerala.com${product.img[0]}`]
        : ["https://www.siskerala.com/assets/static/logo/ogimage.png"],
    },
  };
}

const page = ({ params }) => {
  const { name } = params;
  return (
    <div>
      <ProductDetails params={params} />
    </div>
  );
};

export default page;
