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

export const CategoryProductSelector = ({
  onChange,
  value,
  categoryId,
  currentProductId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const dispatch = useDispatch<any>();

  const fetchProducts = async () => {
    const queryString = `category=${categoryId}`;
    const { payload } = await dispatch(getAllProducts(queryString));
    if (payload.success) {
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
  }, [isOpen, categoryId]);

  useEffect(() => {
    if (isOpen && products.length > 0) {
      const preSelectedProducts = products.filter((product: any) =>
        value.some((variant: any) => variant.variantId === product._id)
      );
      setSelectedProducts(preSelectedProducts);
    }
  }, [isOpen, products, value]);

  const handleProductSelection = (product: any) => {
    setSelectedProducts((prev: any) =>
      prev.some((p) => p._id === product._id)
        ? prev.filter((p) => p._id !== product._id)
        : [...prev, product]
    );
  };

  const handleAddVariant = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    const newVariants = selectedProducts.map((product: any) => ({
      variantId: product._id,
      name: product.name,
    }));

    onChange([...value, ...newVariants]);
    setSelectedProducts([]);
    setIsOpen(false);
  };

  const handleRemoveVariant = (variantId) => {
    onChange(value.filter((v) => v.variantId !== variantId));
  };

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            Add Product Variant
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Add Product Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {products.map((product: any) => (
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
                    {product.name}
                  </label>
                </div>
              ))}
            </ScrollArea>
            <Button type="button" onClick={handleAddVariant}>
              Add Product Variant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {value?.length > 0 && (
        <div className="mt-4">
          <Label className="text-gray-600 text-[12px]">Product Variants</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {value.map((variant) => (
              <Badge
                key={variant.variantId}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {variant.name}
                <X
                  size={14}
                  className="cursor-pointer"
                  onClick={() => handleRemoveVariant(variant.variantId)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
