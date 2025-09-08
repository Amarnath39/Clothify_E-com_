"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
} from "react-icons/fa";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import { Pagination } from "@/components/ui/pagination";

const Page = () => {
  const [products, setProducts] = useState<any>(null);
  const [duplicatedProducts, setDuplicatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 10;

  useEffect(() => {
    getProduct();
  }, [search, currentPage]);

  const getProduct = async () => {
    try {
      const response = await fetch(
        `/api/products/?page=${currentPage}&limit=${productsPerPage}&search=${search}`,
        { method: "GET" }
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      if (data.msg === "Success") {
        setProducts(data.products);
        setTotalPages(data.totalPages);
      } else {
        setError("Please Login again");
      }
    } catch (error) {
      setError("Please Login again");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (confirmDelete) {
      try {
        const response = await fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          alert("Successfully deleted");
          getProduct();
        } else {
          throw new Error("Delete failed");
        }
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleDuplicate = (product) => {
    // Create a new ID for the duplicated product
    const tempId = `temp-${Date.now()}`;

    // Create a copy of the product with the new ID and mark it as a duplicate
    const duplicatedProduct = {
      ...JSON.parse(JSON.stringify(product)), // Deep clone to avoid reference issues
      _id: tempId,
      isDuplicate: true,
      sku: `${product.sku}-copy`,
    };
    console.log(duplicatedProduct, "duplicatedProduct");

    // Add the duplicated product to the state - at the beginning of the array
    setDuplicatedProducts([duplicatedProduct, ...duplicatedProducts]);

    // Scroll to the top of the page to show the duplicated product
    window.scrollTo(0, 0);
  };

  const handleDeleteDuplicate = (tempId) => {
    setDuplicatedProducts(duplicatedProducts.filter((p) => p._id !== tempId));
  };

  const handleEditDuplicate = (tempId) => {
    // Find the duplicated product
    const duplicateToEdit = duplicatedProducts.find((p) => p._id === tempId);

    if (duplicateToEdit) {
      // Store the duplicate product in localStorage for the edit page to use
      localStorage.setItem(
        "editDuplicateProduct",
        JSON.stringify(duplicateToEdit)
      );

      // Redirect to a new product page
      window.location.href = "/admin/addProduct?duplicate=true";
    }
  };

  // Combine server products and duplicated products for display
  // Put duplicated products at the top
  const allProducts = [...duplicatedProducts, ...(products || [])];

  if (loading) return "Loading";
  if (error)
    return (
      <div className="flex justify-center items-center h-screen">{error}</div>
    );
  if (!allProducts.length)
    return (
      <div className="flex justify-center items-center h-screen">
        No product found
      </div>
    );

  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 overflow-hidden">
      {/* Logo added above Products heading */}
      <div className="flex flex-col items-start space-y-2 mb-2">
        <img
          src="/assets/static/logo/2_4__1_-removebg-preview (1).png"
          alt="Logo"
          className="w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 object-contain"
          style={{ marginTop: 0, marginBottom: 0 }}
        />
      </div>
      <h1 className="text-3xl font-bold">Products</h1>
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setCurrentPage(1);
            setSearch(e.target.value);
          }}
          className="pl-10"
        />
      </div>

      {duplicatedProducts.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">
            Duplicated Products ({duplicatedProducts.length})
          </h2>
          <p className="text-sm text-blue-600">
            These products exist only in this session and will be lost if you
            refresh the page. Click Edit to modify and save them to your
            database.
          </p>
        </div>
      )}

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">SKU</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Size/Stock/Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allProducts.map((product, index) => (
                <TableRow
                  key={product._id}
                  className={
                    product.isDuplicate
                      ? "bg-blue-50 border-b-2 border-blue-200"
                      : ""
                  }
                >
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>
                    <div className="w-28 h-28 relative">
                      <Swiper
                        modules={[Navigation]}
                        navigation={{
                          prevEl: ".swiper-button-prev",
                          nextEl: ".swiper-button-next",
                        }}
                        className="w-full h-full"
                      >
                        {product.img.map((image, i) => (
                          <SwiperSlide key={i}>
                            <img
                              src={image}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          </SwiperSlide>
                        ))}
                        <div className="swiper-button-prev !w-6 !h-6 !bg-black/50 !text-white after:!text-[10px]"></div>
                        <div className="swiper-button-next !w-6 !h-6 !bg-black/50 !text-white after:!text-[10px]"></div>
                      </Swiper>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px]">
                    {product.name}
                    {product.isDuplicate && (
                      <Badge variant="outline" className="ml-2 bg-blue-100">
                        Duplicate
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-bold">
                      ₹{product?.sizes[0]?.offerPrice}
                    </span>
                    <span className="text-sm text-gray-500 line-through ml-2">
                      ₹{product.actualPrice}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {product.sizes.map((size) => (
                        <span key={size._id || `size-${Math.random()}`}>
                          {size?.size}: {size?.stock} :{size?.offerPrice}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap flex-col gap-1">
                      {product.categories.map((cat) => (
                        <Badge
                          className="w-fit"
                          key={cat._id || `cat-${Math.random()}`}
                          variant="outline"
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.featureProduct ? "default" : "secondary"}
                    >
                      {product.featureProduct ? "Featured" : "Not Featured"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {product.isDuplicate ? (
                        <Button
                          size="icon"
                          onClick={() => handleEditDuplicate(product._id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FaEdit className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Link href={`/admin/updateProduct/${product._id}`}>
                          <Button size="icon">
                            <FaEdit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                      {!product.isDuplicate && (
                        <Button
                          size="icon"
                          onClick={() => handleDuplicate(product)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <FaCopy className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                          product.isDuplicate
                            ? handleDeleteDuplicate(product._id)
                            : handleDelete(product._id)
                        }
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Page;
