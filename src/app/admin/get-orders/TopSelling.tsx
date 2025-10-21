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

const dummyData = [
  {
    _id: "1",
    name: "Smartphone X",
    img: "https://example.com/smartphone-x.jpg",
    sellCount: 150,
    offerPrice: 599.99,
    stock: 200,
    categories: ["Electronics", "Smartphones"],
  },
  {
    _id: "2",
    name: "Laptop Pro",
    img: "https://example.com/laptop-pro.jpg",
    sellCount: 100,
    offerPrice: 1299.99,
    stock: 50,
    categories: ["Electronics", "Computers"],
  },
  {
    _id: "3",
    name: "Wireless Earbuds",
    img: "https://example.com/wireless-earbuds.jpg",
    sellCount: 300,
    offerPrice: 129.99,
    stock: 500,
    categories: ["Electronics", "Audio"],
  },
  {
    _id: "4",
    name: "Smart Watch",
    img: "https://example.com/smart-watch.jpg",
    sellCount: 200,
    offerPrice: 249.99,
    stock: 150,
    categories: ["Electronics", "Wearables"],
  },
  {
    _id: "5",
    name: "4K TV",
    img: "https://example.com/4k-tv.jpg",
    sellCount: 75,
    offerPrice: 799.99,
    stock: 30,
    categories: ["Electronics", "TVs"],
  },
  // Add more dummy products here...
];

const MostSellingProductsPage = () => {
  const [products, setProducts] = useState(dummyData);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    // Simulating API call
    setTimeout(() => {
      setProducts(dummyData);
      setLoading(false);
    }, 1000);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    const filteredProducts = dummyData.filter((product) =>
      product.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setProducts(filteredProducts);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedProducts = [...products].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setProducts(sortedProducts);
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
            // icon={<FaSearch className="text-gray-400" />}
          />
        </div>
        <div className="overflow-x-auto">
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
              {products.map((item) => (
                <TableRow key={item?._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12">
                          <img src={item?.img} alt={item?.name} />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{item?.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item?.sellCount}
                  </TableCell>
                  <TableCell>₹ {item?.offerPrice?.toFixed(2)}</TableCell>
                  <TableCell>{item?.stock}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item?.categories?.map((category, index) => (
                        <Badge key={index} variant="secondary">
                          {category}
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
      </CardContent>
    </Card>
  );
};

export default MostSellingProductsPage;
