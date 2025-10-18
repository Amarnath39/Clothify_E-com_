"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FaSpinner,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import axios from "axios";

const MostSellingProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<any>({
    key: null,
    direction: "asc",
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/dashboard/mostselling", {
        params: {
          page,
          search: searchTerm,
        },
      });
      if (data.success) {
        setProducts(data.mostSellingProducts);
        setDisplayedProducts(data.mostSellingProducts);
        setTotalPages(data.totalPages);
      } else {
        console.error(data.msg);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  useEffect(() => {
    sortProducts();
  }, [sortConfig, products]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortProducts = () => {
    const sortedProducts = [...products].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    setDisplayedProducts(sortedProducts);
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? (
      <FaSortAmountUp className="ml-2" />
    ) : (
      <FaSortAmountDown className="ml-2" />
    );
  };

  return (
    <Card className="container mx-auto p-6 mt-8">
      <CardHeader>
        <CardTitle className="text-3xl font-bold mb-6 text-center text-gray-800">
          Most Selling Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-x-auto min-h-[50vh]">
          <Table>
            <TableCaption>A list of the most selling products.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Product {<SortIcon column="name" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("sellCount")}
                >
                  Sold {<SortIcon column="sellCount" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("offerPrice")}
                >
                  Price {<SortIcon column="offerPrice" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("stock")}
                >
                  Stock {<SortIcon column="stock" />}
                </TableHead>
                <TableHead>Categories</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.map((item: any) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12">
                          <img src={item.img[0]} alt={item.name} />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.sellCount}
                  </TableCell>
                  <TableCell>₹ {item?.sizes[0]?.offerPrice?.toFixed(2)}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.categories.map((category, index) => (
                        <Badge key={index} variant="secondary">
                          {category?.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {loading && (
          <div className="flex justify-center items-center mt-4">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
          </div>
        )}
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1} className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Previous
          </Button>
          <span className="self-center">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages} className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MostSellingProductsPage;
