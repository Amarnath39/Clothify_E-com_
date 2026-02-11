"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  SearchInput,
  Pagination,
  Alert,
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
  FaEdit,
  FaTrash,
  FaCopy,
  FaPlus,
  FaImage,
} from "react-icons/fa";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import { LuLoader } from "react-icons/lu";

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [duplicatedProducts, setDuplicatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [search, currentPage]);

  const fetchProducts = async () => {
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
        setError("Failed to load products. Please check your connection.");
      }
    } catch (error) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchProducts();
        } else {
          throw new Error("Delete failed");
        }
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleDuplicate = (product: any) => {
    const tempId = `temp-${Date.now()}`;
    const duplicatedProduct = {
      ...JSON.parse(JSON.stringify(product)),
      _id: tempId,
      isDuplicate: true,
      sku: `${product.sku}-copy`,
    };
    setDuplicatedProducts([duplicatedProduct, ...duplicatedProducts]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDuplicate = (tempId: string) => {
    setDuplicatedProducts(duplicatedProducts.filter((p) => p._id !== tempId));
  };

  const handleEditDuplicate = (tempId: string) => {
    const duplicateToEdit = duplicatedProducts.find((p) => p._id === tempId);
    if (duplicateToEdit) {
      localStorage.setItem("editDuplicateProduct", JSON.stringify(duplicateToEdit));
      window.location.href = "/admin/addProduct?duplicate=true";
    }
  };

  const allProducts = [...duplicatedProducts, ...products];

  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Products Management"
        description="View, edit, and manage your product catalog, inventory, and categories."
        action={
          <Link href="/admin/addProduct">
            <Button variant="primary" size="md">
              <FaPlus size={14} /> Add New Product
            </Button>
          </Link>
        }
      />

      <Card className="p-6">
        <div className="w-full max-w-md">
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Search Inventory</label>
          <SearchInput
            placeholder="Search by name, SKU, or category..."
            value={search}
            onChange={(val: string) => {
              setCurrentPage(1);
              setSearch(val);
            }}
          />
        </div>
      </Card>

      {duplicatedProducts.length > 0 && (
        <Alert
          type="info"
          message={`You have ${duplicatedProducts.length} unsaved duplicate product(s) in this session. Click Edit to save them permanently.`}
          onDismiss={() => setDuplicatedProducts([])}
        />
      )}

      {error && (
        <Alert type="error" message={error} />
      )}

      {!allProducts.length ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <FaImage className="mx-auto text-gray-200 text-6xl mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No products found</h3>
          <p className="text-gray-500">Try adjusting your search criteria or add a new product.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-b border-gray-100">
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Product</TableHead>
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-center">Price</TableHead>
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Size / Stock</TableHead>
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Category</TableHead>
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Status</TableHead>
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProducts.map((product) => (
                  <TableRow
                    key={product._id}
                    className={`border-b border-gray-50 hover:bg-gray-50/30 transition-colors ${product.isDuplicate ? "bg-blue-50/50" : ""
                      }`}
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4 min-w-[300px]">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 relative">
                          <Swiper
                            modules={[Navigation]}
                            navigation={{
                              prevEl: `.prev-${product._id}`,
                              nextEl: `.next-${product._id}`,
                            }}
                            className="w-full h-full"
                          >
                            {product.img.map((image: string, i: number) => (
                              <SwiperSlide key={i}>
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                          {product.img.length > 1 && (
                            <div className="absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-between px-1 pointer-events-none">
                              <button className={`prev-${product._id} pointer-events-auto w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center text-[8px]`}><FaPlus className="rotate-45" /></button>
                              <button className={`next-${product._id} pointer-events-auto w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center text-[8px]`}><FaPlus /></button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-900 line-clamp-2 leading-tight">{product.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SKU: {product.sku}</span>
                          {product.isDuplicate && (
                            <Badge variant="brand" className="w-fit text-[8px] h-4 mt-1">Duplicate</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-center">
                      <span className="font-bold text-gray-900">₹{product?.sizes?.[0]?.offerPrice}</span>
                    </TableCell>

                    <TableCell className="py-4 px-6">
                      <div className="space-y-1">
                        {product.sizes.map((size: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-[10px]">
                            <span className="font-bold text-gray-600 w-4">{size?.size}:</span>
                            <span className={`font-medium ${size?.stock > 5 ? 'text-green-600' : 'text-red-500'}`}>{size?.stock} in stock</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {product.categories.map((cat: any, idx: number) => (
                          <Badge
                            key={idx}
                            variant="neutral"
                            className="text-[9px] px-1.5 py-0 border-gray-100"
                          >
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6">
                      <Badge
                        variant={product.featureProduct ? "brand" : "neutral"}
                        className="rounded-lg px-2 py-0.5 text-[10px]"
                        dot={product.featureProduct}
                      >
                        {product.featureProduct ? "Featured" : "Standard"}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.isDuplicate ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditDuplicate(product._id)}
                            title="Edit & Save"
                          >
                            <FaEdit size={14} />
                          </Button>
                        ) : (
                          <Link href={`/admin/updateProduct/${product._id}`}>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-[#7C1D3E]" size="sm">
                              <FaEdit size={14} />
                            </Button>
                          </Link>
                        )}

                        {!product.isDuplicate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicate(product)}
                            className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-green-600"
                            title="Duplicate"
                          >
                            <FaCopy size={14} />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-red-600"
                          onClick={() =>
                            product.isDuplicate
                              ? handleDeleteDuplicate(product._id)
                              : handleDelete(product._id)
                          }
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ProductsPage;
