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
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaHistory, FaSearch, FaExclamationTriangle, FaEdit } from "react-icons/fa";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";

const InventoryPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  // Edit State
  const [editItem, setEditItem] = useState<any>(null);
  const [newStockValue, setNewStockValue] = useState("");
  const [updateReason, setUpdateReason] = useState("");

  const handleUpdateStock = async (productId: string, variantId: string | undefined, stockValue: string) => {
    if (!stockValue) {
      toast.error("Please enter a stock value");
      return;
    }
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId,
          newStock: stockValue,
          reason: updateReason,
          // adminId: user._id // If available in context, or handled by session
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Stock updated successfully");
        setEditItem(null);
        setNewStockValue("");
        setUpdateReason("");
        fetchInventory(); // Refresh
      } else {
        toast.error(json.msg || "Failed to update");
      }
    } catch (error) {
      toast.error("Error updating stock");
    }
  };

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
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">No products found</TableCell>
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
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditItem(item);
                        setNewStockValue(item.totalStock.toString());
                      }}>
                        <FaEdit />
                      </Button>
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

      {/* Edit Stock Modal */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Stock: {editItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editItem?.sizes && editItem.sizes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Update per size:</p>
                <ScrollArea className="h-48 border rounded p-2">
                  {editItem.sizes.map((size: any) => (
                    <div key={size._id} className="flex justify-between items-center mb-2 p-2 bg-gray-50 rounded">
                      <span className="font-semibold">{size.size}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Current: {size.stock}</span>
                        <Input
                          type="number"
                          placeholder="New Stock"
                          className="w-24 h-8"
                          onChange={(e) => {
                            // Should handle local state if we want to type before updating
                          }}
                          onBlur={(e) => {
                            if (e.target.value) handleUpdateStock(editItem._id, size._id, e.target.value);
                          }}
                        />
                        {/* Optional: Add explicit update button if onBlur isn't enough */}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
                <p className="text-xs text-yellow-600">Updating a size will automatically recalculate Total Stock.</p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">New Total Stock</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                  />
                  <Button onClick={() => handleUpdateStock(editItem?._id, undefined, newStockValue)}>Update</Button>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Reason for Change</label>
              <Input
                placeholder="e.g. Broken item, Found extra stock"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
