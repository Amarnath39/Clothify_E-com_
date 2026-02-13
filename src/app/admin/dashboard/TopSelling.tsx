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
import { Badge, SearchInput, Pagination, Button } from "@/theme/components";
import {
  FiSearch,
  FiChevronUp,
  FiChevronDown,
  FiBox,
  FiTrendingUp,
  FiShoppingBag
} from "react-icons/fi";
import { LuLoader } from "react-icons/lu";
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
        setTotalPages(data.totalPages);
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
    return sortConfig.direction === "asc" ? <FiChevronUp size={14} className="ml-1" /> : <FiChevronDown size={14} className="ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full max-w-md">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider">Search Products</label>
          <SearchInput
            placeholder="Filter by name..."
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full md:w-auto">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider">Region</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className="h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 transition-all appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22currentColor%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22 /%3E%3C/svg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.75rem_center] bg-no-repeat"
          >
            <option value="IND">India (₹)</option>
            {/* UAE can be added if backend supports */}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin rounded-xl border border-gray-100">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-b border-gray-100">
              <TableHead className="py-4 px-6 cursor-pointer group" onClick={() => handleSort("name")}>
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Product <SortIcon column="name" />
                </div>
              </TableHead>
              <TableHead className="py-4 px-6 text-center cursor-pointer group" onClick={() => handleSort("sellCount")}>
                <div className="flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Sold <SortIcon column="sellCount" />
                </div>
              </TableHead>
              <TableHead className="py-4 px-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Market Price</TableHead>
              <TableHead className="py-4 px-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Availability</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categories</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && displayedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E] mx-auto" />
                </TableCell>
              </TableRow>
            ) : displayedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                  <FiShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium">No results matched your search.</p>
                </TableCell>
              </TableRow>
            ) : (
              displayedProducts.map((item) => (
                <TableRow key={item._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                        <img src={item.img[0]} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="font-bold text-sm text-gray-900 leading-tight line-clamp-1">{item.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-black">
                      <FiTrendingUp size={10} />
                      {item.sizes.reduce((sum, s) => sum + (s.sellCount || 0), 0)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-gray-900">
                        {getCurrencySymbol(country)}
                        {(typeof item?.actualPrice === "object" ? item?.actualPrice?.[country] : item?.actualPrice) ?? 0}
                      </span>
                      {typeof item?.sizes?.[0]?.offerPrice === "object" && (item?.sizes?.[0]?.offerPrice?.[country] ?? 0) < (item?.actualPrice?.[country] ?? 0) && (
                        <span className="text-[10px] text-gray-400 line-through">
                          {getCurrencySymbol(country)}
                          {item?.sizes[0].offerPrice[country]}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center">
                    <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      {item.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)} IN STOCK
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {item.categories.slice(0, 2).map((cat, idx) => (
                        <Badge key={idx} variant="neutral" className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest leading-none h-auto">
                          {cat.name}
                        </Badge>
                      ))}
                      {item.categories.length > 2 && (
                        <span className="text-[9px] text-gray-400 font-bold ml-1">+{item.categories.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default MostSellingProductsPage;







