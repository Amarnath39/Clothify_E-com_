import React from "react";
import Products from "./Products";
import { Metadata } from "next";

export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const search = searchParams.search || "";

  const decodedSearch = decodeURIComponent(search);

  const formattedSearch = decodedSearch
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return {
    title: search
      ? `Search Results for "${formattedSearch}"`
      : "All Products",
  };
}

const Page = () => {
  return (
    <div className="relative mx-auto px-4 py-8 mt-22 min-h-screen">
      <Products />
    </div>
  );
};

export default Page;
