"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaSpinner, FaSearch, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import axios from "axios";

type Country = "IND" | "UAE";

interface ProductSize {
  _id: string;
  size: string;
  stock: number;
  sellCount: number;
  offerPrice: Record<Country, number>;
}

interface Product {
  _id: string;
  name: string;
  sellCount: number;
  sizes: ProductSize[];
  actualPrice: Record<Country, number>;
  img: string[];
  categories: { name: string }[];
}

const MostSellingProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });
  const [country, setCountry] = useState<Country>("IND");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/dashboard/mostselling", {
        params: { page, search: searchTerm },
      });
      if (data.success) {
        setProducts(data.mostSellingProducts);
        setDisplayedProducts(data.mostSellingProducts);
        console.log(data.mostSellingProducts);
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSort = (key: keyof Product) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortProducts = () => {
    if (!sortConfig.key) {
      setDisplayedProducts(products);
      return;
    }

    const sorted = [...products].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return 0;
    });

    setDisplayedProducts(sorted);
  };

  const getCurrencySymbol = (country: Country) => (country === "IND" ? "₹" : "AED ");

  const SortIcon: React.FC<{ column: keyof Product }> = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? <FaSortAmountUp className="ml-2" /> : <FaSortAmountDown className="ml-2" />;
  };

  return (
    <Card className="container mx-auto p-6 mt-8">
      <CardHeader>
        <CardTitle className="text-3xl font-bold mb-6 text-center text-gray-800">Most Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search + Country Selector */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className="border rounded px-2 py-1 appearance-none"
          >
            <option value="IND">India (₹)</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  Product {<SortIcon column="name" />}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("sellCount")}>
                  Sold {<SortIcon column="sellCount" />}
                </TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Categories</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12">
                          <img src={item.img[0]} alt={item.name} />
                        </div>
                      </div>
                      <div className="font-bold">{item.name}</div>
                    </div>
                  </TableCell>
                    <TableCell>{item?.sizes?.[0]?.sellCount ?? 0}</TableCell>
                  <TableCell>
  <span className="text-green-600 font-bold">
    {getCurrencySymbol(country)}
    {typeof item?.sizes?.[0]?.offerPrice === "object"
      ? item?.sizes?.[0]?.offerPrice?.[country] ?? 0
      : item?.sizes?.[0]?.offerPrice ?? 0}
  </span>
  <span className="text-sm text-gray-500 line-through ml-2">
    {getCurrencySymbol(country)}
    {typeof item?.actualPrice === "object"
      ? item?.actualPrice?.[country] ?? 0
      : item?.actualPrice ?? 0}
  </span>
</TableCell>

                  <TableCell>{item?.sizes[0]?.stock}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.categories.map((cat, idx) => (
                        <Badge key={idx} variant="secondary">{cat.name}</Badge>
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

        {/* Pagination */}
        <div className="flex justify-center mt-4 space-x-2">
          <Button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="self-center">Page {page} of {totalPages}</span>
          <Button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MostSellingProductsPage;







