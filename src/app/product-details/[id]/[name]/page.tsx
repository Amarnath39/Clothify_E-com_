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

  // Create a rich description for social sharing
  const productDescription = product.description
    ? product.description.substring(0, 200).trim()
    : "Shop stylish S.I.S – Strong, Independent, Stylish.";

  const description = `${productDescription}${productDescription.length >= 200 ? '...' : ''}\n\nPrice: ₹${price}`;

  const fullTitle = `${product.name}`;

  const imageUrl = product.img && product.img.length > 0
    ? (product.img[0].startsWith("http") ? product.img[0] : `https://www.Swaarasya.com${product.img[0].startsWith('/') ? '' : '/'}${product.img[0]}`)
    : "https://www.Swaarasya.com/assets/static/logo/logo cropped.png";

  const productUrl = `https://www.Swaarasya.com/product-details/${id}/${params.name}`;

  return {
    title: fullTitle,
    description: description,
    openGraph: {
      title: fullTitle,
      description: description,
      url: productUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ],
      type: "website",
      siteName: "S.I.S BY MV PV",
      locale: "en_IN",
    },
    other: {
      "og:price:amount": price.toString(),
      "og:price:currency": "INR",
      "product:price:amount": price.toString(),
      "product:price:currency": "INR",
      "product:availability": "in stock",
      "product:condition": "new",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: description,
      images: [imageUrl],
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
