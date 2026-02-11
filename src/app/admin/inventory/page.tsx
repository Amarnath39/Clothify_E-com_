"use client";

import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  SearchInput,
  Pagination,
  ZapanInput,
} from "@/theme/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FiBox,
  FiClock,
  FiSearch,
  FiAlertTriangle,
  FiEdit3,
  FiRefreshCw,
  FiActivity,
  FiArrowUp,
  FiArrowDown,
  FiCheckCircle,
  FiDatabase,
} from "react-icons/fi";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSelector } from "react-redux";
import { LuLoader } from "react-icons/lu";

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
  const { user } = useSelector((state: any) => state.auth);
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
    fetchHistory();
  }, [historyPage]);

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
      const adminId = user?._id || localStorage.getItem("adminId");
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
        fetchInventory();
        fetchHistory();
        if (!variantId) {
          setEditItem(null);
          setNewStockValue("");
          setUpdateReason("");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return <Badge variant="success" className="font-bold uppercase tracking-wider text-[10px]"><FiCheckCircle className="mr-1" /> In Stock</Badge>;
      case "Low Stock":
        return <Badge variant="warning" className="font-bold uppercase tracking-wider text-[10px]"><FiAlertTriangle className="mr-1" /> Low Stock</Badge>;
      case "Out of Stock":
        return <Badge variant="danger" className="font-bold uppercase tracking-wider text-[10px]"><FiAlertTriangle className="mr-1" /> Out of Stock</Badge>;
      default:
        return <Badge variant="neutral" className="font-bold uppercase tracking-wider text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels, manage variants, and track all inventory movements."
        action={
          <Button onClick={fetchInventory} variant="outline" className="h-10 rounded-xl bg-white">
            <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} size={16} />
            Sync Stock
          </Button>
        }
      />

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl border border-gray-100 mb-8 inline-flex">
          <TabsTrigger value="inventory" className="data-[state=active]:bg-[#7C1D3E] data-[state=active]:text-white rounded-lg px-6 py-2 text-sm font-bold flex items-center gap-2 transition-all">
            <FiBox size={14} /> Active Inventory
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-[#7C1D3E] data-[state=active]:text-white rounded-lg px-6 py-2 text-sm font-bold flex items-center gap-2 transition-all" onClick={fetchHistory}>
            <FiActivity size={14} /> Stock History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <Card className="p-6">
            <div className="w-full max-w-md">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider">Search Catalog</label>
              <SearchInput
                placeholder="Product name, SKU..."
                value={search}
                onChange={(val: string) => {
                  setPage(1);
                  setSearch(val);
                }}
              />
            </div>
          </Card>

          <Card className="overflow-hidden border-gray-100">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Product Details</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">SKU</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-center">Current Stock</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-center">Available/Sold</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-center text-xs">Low Stock Threshold</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-center">Status</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20">
                        <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E] mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-gray-400">
                        <FiBox className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p>No inventory records found.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                              {item.img ? (
                                <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <FiBox size={18} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                              {item.sizes?.length > 0 && (
                                <Badge variant="neutral" className="mt-1 h-5 text-[9px] uppercase font-bold tracking-widest">{item.sizes.length} SIZES</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded">{item.sku}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <span className="text-lg font-black text-gray-900">{item.totalStock}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{item.availableStock} Available</span>
                            <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{item.soldStock} Sold</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <span className="text-xs font-bold text-gray-400">{item.lowStockThreshold}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditItem(item);
                              setNewStockValue(item.totalStock.toString());
                              setUpdateReason("");
                            }}
                            className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-[#7C1D3E] hover:bg-[#7C1D3E]/5"
                          >
                            <FiEdit3 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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

        <TabsContent value="history" className="space-y-6">
          <Card className="overflow-hidden border-gray-100">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Date & Time</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Product Information</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Reference</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Action</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-center">Variance</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-center">Inventory Flow</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading && history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20">
                        <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E] mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-gray-400">
                        <FiDatabase className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p>No activity logs found.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((h) => (
                      <TableRow key={h._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900">{new Date(h.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><FiClock size={10} /> {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-sm font-bold text-gray-900">{h.productId?.name || "Unknown Product"}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {h.orderId ? (
                            <Badge variant="brand" className="h-5 text-[9px] uppercase font-bold tracking-widest border-none">
                              #{typeof h.orderId === 'object' ? h.orderId.orderId : h.orderId}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-gray-300 italic">SYSTEM ADJUST</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                          {h.action}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <div className={`font-black flex items-center justify-center gap-1 ${h.changeAmount > 0 ? "text-green-600" : "text-red-600"}`}>
                            {h.changeAmount > 0 ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                            {Math.abs(h.changeAmount)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            <span className="text-xs font-bold text-gray-400">{h.oldStock}</span>
                            <FiActivity size={10} className="text-gray-300" />
                            <span className="text-xs font-bold text-gray-900">{h.newStock}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <p className="text-xs text-gray-600 max-w-[150px] line-clamp-1" title={h.reason}>{h.reason}</p>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
          <div className="bg-[#7C1D3E] p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <FiEdit3 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black leading-tight">Adjust Stock</h2>
                <p className="text-white/60 text-xs font-medium uppercase tracking-[0.2em]">Inventory Control</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Target Product</p>
              <p className="font-bold text-lg leading-tight">{editItem?.name}</p>
              <p className="text-xs font-mono text-white/40 mt-1">{editItem?.sku}</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {editItem?.sizes && editItem.sizes.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Product Variants</label>
                  <span className="text-[10px] font-bold text-[#7C1D3E] bg-[#7C1D3E]/5 px-2 py-0.5 rounded uppercase tracking-wider">Tap to update</span>
                </div>
                <ScrollArea className="h-[250px] pr-4">
                  <div className="grid grid-cols-1 gap-3">
                    {editItem.sizes.map((size) => (
                      <div key={size._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:border-[#7C1D3E]/20 hover:bg-white hover:shadow-sm">
                        <div>
                          <p className="font-black text-gray-900">{size.size}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Stock: {size.stock}</span>
                          </div>
                        </div>
                        <input
                          type="number"
                          placeholder="New"
                          className="w-20 h-10 text-center font-bold bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C1D3E]/20 focus:border-[#7C1D3E]/50 transition-all text-sm"
                          defaultValue={size.stock}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== "" && val !== size.stock.toString()) {
                              handleUpdateStock(editItem._id, size._id, val);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <ZapanInput
                label="Total Inventory Count"
                type="number"
                value={newStockValue}
                onChange={(e: any) => setNewStockValue(e.target.value)}
                placeholder="0"
                className="text-lg font-black h-14"
              />
            )}

            <ZapanInput
              label="Audit Reason"
              placeholder="E.g. Stock Re-count, Quality Check, Damage..."
              value={updateReason}
              onChange={(e: any) => setUpdateReason(e.target.value)}
              className="italic"
            />

            {!editItem?.sizes?.length && (
              <Button
                variant="primary"
                className="w-full h-14 rounded-2xl text-md font-bold shadow-xl shadow-[#7C1D3E]/20"
                onClick={() => handleUpdateStock(editItem?._id || "", undefined, newStockValue)}
                disabled={isUpdating}
              >
                {isUpdating ? <LuLoader className="animate-spin mr-2" /> : <FiCheckCircle className="mr-2" />}
                Confirm Stock Update
              </Button>
            )}

            <div className="pt-2 text-center">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider flex items-center justify-center gap-2">
                <FiAlertTriangle className="text-[#7C1D3E]" /> All adjustments are permanently logged in audit trail
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
