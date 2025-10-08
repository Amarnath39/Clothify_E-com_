import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { getAllProducts } from "@/lib/features/catogary";

export const ColorVariantSelector = ({ onChange, value, currentProductId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [color, setColor] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const dispatch = useDispatch<any>();

  const fetchProducts = async () => {
    const queryParams = new URLSearchParams({ search });
    const { payload } = await dispatch(getAllProducts(queryParams.toString()));

    if (payload.success) {
      // Filter out the current product
      const filteredProducts = payload.products.filter(
        (product) => product._id !== currentProductId
      );
      setProducts(filteredProducts);
    } else {
      toast.error(payload.msg);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [search, isOpen]);

  useEffect(() => {
    if (color) {
      const filtered = products.filter((product: any) =>
        product.color.toLowerCase().includes(color.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [color, products]);

  useEffect(() => {
    if (isOpen && filteredProducts.length > 0) {
      const preSelectedProducts = filteredProducts.filter((product: any) =>
        value.some(
          (variant: any) =>
            variant.varientId === product._id && variant.color === color
        )
      );
      setSelectedProducts(preSelectedProducts);
    }
  }, [isOpen, filteredProducts, value, color]);

  const handleProductSelection = (product) => {
    setSelectedProducts((prev: any) =>
      prev.some((p: any) => p._id === product._id)
        ? prev.filter((p) => p._id !== product._id)
        : [...prev, product]
    );
  };

  const handleAddVariant = () => {
    if (!color || selectedProducts.length === 0) {
      toast.error("Please enter a color and select at least one product");
      return;
    }

    const newVariants = selectedProducts.map((product: any) => ({
      color,
      varientId: product._id,
    }));

    // Remove any existing variants with the same color before adding new ones
    const updatedValue = value.filter((v) => v.color !== color);
    onChange([...updatedValue, ...newVariants]);

    setColor("");
    setSelectedProducts([]);
    setIsOpen(false);
  };

  const handleRemoveVariant = (colorToRemove) => {
    onChange(value.filter((v) => v.color !== colorToRemove));
  };

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            Add Color Variant
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Add Color Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Enter color"
              />
            </div>
            <div>
              <Label htmlFor="productSearch">Search Products</Label>
              <Input
                id="productSearch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
              />
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {filteredProducts.map((product: any) => (
                <div
                  key={product._id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100"
                >
                  <Checkbox
                    checked={selectedProducts.some(
                      (p: any) => p._id === product._id
                    )}
                    onCheckedChange={() => handleProductSelection(product)}
                    id={`product-${product._id}`}
                  />
                  <label
                    htmlFor={`product-${product._id}`}
                    className="flex-grow cursor-pointer"
                  >
                    {product.name} - {product.color}
                  </label>
                </div>
              ))}
            </ScrollArea>
            <Button type="button" onClick={handleAddVariant}>
              Add Color Variant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {value?.length > 0 && (
        <div className="mt-4">
          <Label className="text-gray-600 text-[12px]">Color Variants</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {Array.from(new Set(value.map((v) => v.color))).map(
              (color: any) => (
                <Badge
                  key={color}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {color}
                  <X
                    size={14}
                    className="cursor-pointer"
                    onClick={() => handleRemoveVariant(color)}
                  />
                </Badge>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
