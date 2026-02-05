"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FaHistory,
  FaSearch,
  FaExclamationTriangle,
  FaEdit,
  FaBoxOpen,
  FaSync,
  FaClipboardList,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
} from "react-icons/fa";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  img?: string;
  totalStock: number;
  availableStock: number;
  soldStock: number;
  lowStockThreshold: number;
  status: string;
  sizes: Array<{
    _id: string;
    size: string;
    stock: number;
  }>;
}

interface HistoryItem {
  _id: string;
  createdAt: string;
  productId?: {
    name: string;
    sku: string;
    img?: string;
  };
  action: string;
  changeAmount: number;
  oldStock: number;
  newStock: number;
  reason: string;
  orderId?: {
    _id: string;
    orderId: string;
  };
}

const InventoryPage = () => {
  // Inventory State
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Edit State
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [newStockValue, setNewStockValue] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Inventory
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/inventory?page=${page}&limit=10&search=${search}`
      );
      const json = await res.json();
      if (json.success) {
        setData(json.inventory);
        setTotalPages(json.totalPages);
      } else {
        toast.error("Failed to load inventory");
      }
    } catch (error) {
      console.error("Failed to fetch inventory", error);
      toast.error("Error loading inventory");
    } finally {
      setLoading(false);
    }
  };

  // Fetch History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/admin/inventory?type=history&page=${historyPage}&limit=15`
      );
      const json = await res.json();
      if (json.success) {
        setHistory(json.history);
        setHistoryTotalPages(json.totalPages);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error loading history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Initial Load & Effects
  useEffect(() => {
    fetchInventory();
  }, [page, search]);

  useEffect(() => {
    // Fetch history when tab might be active or essentially on mount if we want data ready
    fetchHistory();
  }, [historyPage]); // Re-fetch when history page changes

  // Update Stock Handler
  const handleUpdateStock = async (
    productId: string,
    variantId: string | undefined,
    stockValue: string
  ) => {
    if (!stockValue) {
      toast.error("Please enter a stock value");
      return;
    }

    setIsUpdating(true);
    try {
      const adminId = localStorage.getItem("adminId");
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId,
          newStock: stockValue,
          reason: updateReason,
          adminId,
        }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success("Stock updated successfully");

        // If updating a specific size, we might want to keep the modal open or refresh local state
        // But for simplicity, we refresh the inventory and close modal if it was a total update
        // For size update, we'll refresh inventory in background
        fetchInventory();
        fetchHistory(); // Refresh history log too

        if (!variantId) {
          // Closed if total update
          setEditItem(null);
          setNewStockValue("");
          setUpdateReason("");
        } else {
          // If variant update, clear only the input logic if needed, or notify user
          // We can close modal too to be safe
          // setEditItem(null);
        }
      } else {
        toast.error(json.msg || "Failed to update");
      }
    } catch (error) {
      toast.error("Error updating stock");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper for Status Badge Color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "default"; // Black/Primary
      case "Low Stock":
        return "warning"; // Yellow/Orange
      case "Out of Stock":
        return "destructive"; // Red
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-500 mt-1">
            Track stock levels, update quantities, and view history.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInventory} variant="outline">
            <FaSync className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="inventory" className="flex gap-2">
            <FaBoxOpen /> Active Inventory
          </TabsTrigger>
          <TabsTrigger value="history" className="flex gap-2" onClick={fetchHistory}>
            <FaHistory /> Stock History
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: INVENTORY --- */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center space-x-2 bg-white p-4 rounded-lg border shadow-sm">
            <div className="relative w-full md:w-1/3">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by product name or SKU..."
                className="pl-10 border-gray-200 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Total Stock</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead className="text-center">Sold</TableHead>
                    <TableHead className="text-center">Low Stock Alert</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FaSync className="animate-spin text-2xl" />
                          <p>Loading inventory data...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-gray-500">
                        No products found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item._id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-gray-100 border overflow-hidden flex-shrink-0">
                              {item.img ? (
                                <img
                                  src={item.img}
                                  className="w-full h-full object-cover"
                                  alt={item.name}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <FaBoxOpen />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {item.name}
                              </p>
                              {item.sizes?.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  {item.sizes.length} Variants
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 font-mono text-xs">
                          {item.sku}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-gray-100">
                            {item.totalStock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-gray-900">
                          {item.availableStock}
                        </TableCell>
                        <TableCell className="text-center text-gray-600">
                          {item.soldStock}
                        </TableCell>
                        <TableCell className="text-center text-gray-500">
                          {item.lowStockThreshold}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusColor(item.status) as any}
                            className="flex w-fit items-center gap-1"
                          >
                            {item.status === "Low Stock" && (
                              <FaExclamationTriangle className="w-3 h-3" />
                            )}
                            {item.status === "Out of Stock" && (
                              <FaExclamationTriangle className="w-3 h-3" />
                            )}
                            {item.status === "In Stock" && (
                              <FaCheckCircle className="w-3 h-3" />
                            )}
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditItem(item);
                              setNewStockValue(item.totalStock.toString());
                              setUpdateReason("");
                            }}
                            className="hover:border-blue-500 hover:text-blue-600"
                          >
                            <FaEdit className="mr-2 h-3 w-3" />
                            Adjust
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
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </TabsContent>

        {/* --- TAB 2: HISTORY --- */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement Log</CardTitle>
              <CardDescription>
                Detailed history of all inventory changes including orders and manual updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Order ID / Reference</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-center">Change</TableHead>
                    <TableHead className="text-center">Stock Flow</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FaSync className="animate-spin text-2xl" />
                          <p>Loading history...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                        No history records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((h) => (
                      <TableRow key={h._id} className="hover:bg-gray-50/50">
                        <TableCell className="text-xs text-gray-600">
                          {new Date(h.createdAt).toLocaleDateString()}{" "}
                          <span className="text-gray-400">
                            {new Date(h.createdAt).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {h.productId?.name || "Unknown Product"}
                        </TableCell>
                        <TableCell>
                          {h.orderId ? (
                            <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer">
                              #{h.orderId.orderId}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs italic">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {h.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`font-bold flex items-center justify-center gap-1 ${h.changeAmount > 0 ? "text-green-600" : "text-red-600"
                            }`}>
                            {h.changeAmount > 0 ? <FaArrowUp className="w-3 h-3" /> : <FaArrowDown className="w-3 h-3" />}
                            {Math.abs(h.changeAmount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono text-gray-500">
                          {h.oldStock} <span className="text-gray-300">→</span> {h.newStock}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[200px] truncate" title={h.reason}>
                          {h.reason}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {historyTotalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={historyPage}
                totalPages={historyTotalPages}
                onPageChange={setHistoryPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit DIALOG */}
      <Dialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              Manually adjust stock levels for <strong>{editItem?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {editItem?.sizes && editItem.sizes.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">Variants:</p>
                <ScrollArea className="h-[200px] pr-4 border rounded-md bg-gray-50 p-2">
                  {editItem.sizes.map((size) => (
                    <div
                      key={size._id}
                      className="flex items-center justify-between p-3 mb-2 bg-white rounded shadow-sm border"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{size.size}</span>
                        <span className="text-xs text-gray-500">
                          Current: {size.stock}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="New"
                          className="w-20 h-8 text-right"
                          defaultValue={size.stock}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val && val !== size.stock.toString()) {
                              handleUpdateStock(editItem._id, size._id, val);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </ScrollArea>
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <FaExclamationTriangle className="inline mr-1" />
                  Tip: Changes to variants are saved immediately when clicking outside the input.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Total Stock</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                    placeholder="Enter total stock quantity"
                  />
                  <Button
                    onClick={() =>
                      handleUpdateStock(editItem?._id || "", undefined, newStockValue)
                    }
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="text-sm font-medium text-gray-700">
                Reason for Change
              </label>
              <Input
                placeholder="e.g. Stock Count, Damage, Gift..."
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
