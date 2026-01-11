"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination"; // Assuming this component exists
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaHistory, FaSearch, FaExclamationTriangle } from "react-icons/fa";

const InventoryPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]); // For History Modal
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory?page=${page}&limit=10&search=${search}`);
      const json = await res.json();
      if (json.success) {
        setData(json.inventory);
        setTotalPages(json.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/admin/inventory?type=history&limit=20`);
      const json = await res.json();
      if (json.success) {
        setHistory(json.history);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, [page, search]);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock": return "default"; // or green
      case "Low Stock": return "warning"; // yellow/orange
      case "Out of Stock": return "destructive"; // red
      default: return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Button variant="outline" onClick={() => setShowHistory(true)}>
          <FaHistory className="mr-2" /> View Stock History
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full md:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">No products found</TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {item.img && <img src={item.img} className="w-10 h-10 object-cover rounded" alt="" />}
                      {item.name}
                    </TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.totalStock}</TableCell>
                    <TableCell className="font-bold">{item.availableStock}</TableCell>
                    <TableCell>{item.reservedStock}</TableCell>
                    <TableCell>{item.lowStockThreshold}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(item.status) as any}>
                        {item.status === "Low Stock" && <FaExclamationTriangle className="mr-1 inline w-3 h-3" />}
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Change History</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Old &rarr; New</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h._id}>
                  <TableCell className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-sm font-medium">{h.productId?.name}</TableCell>
                  <TableCell><Badge variant="outline">{h.action}</Badge></TableCell>
                  <TableCell className={h.changeAmount < 0 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                    {h.changeAmount > 0 ? "+" : ""}{h.changeAmount}
                  </TableCell>
                  <TableCell className="text-xs">{h.oldStock} &rarr; {h.newStock}</TableCell>
                  <TableCell className="text-xs text-gray-500">{h.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
