"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FiUpload } from "react-icons/fi";
import {
  getAllCategories,
  getAllProducts,
  getProductsById,
} from "@/lib/features/catogary";

import toast from "react-hot-toast";
import { ColorVariantSelector } from "../../addProduct/Colorsvarianet";
import { CategorySelector } from "../../addProduct/Selector";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import axios from "axios";
import RulesSelector from "../RulesSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";

enum OfferStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}
const UpdateProduct = ({ params }) => {
  const { id } = params;
  const dispatch = useDispatch<any>();

  const [product, setProduct] = useState<any>({
    name: "",
    description: "",
    actualPrice: "",
    width: "",
    height: "",
    material: [],
    washCare: "",
    note: "",
    sku: "",
    featureProduct: false,
    bestsellerProduct: false,
    latestProduct: false,
    color: "",
    rating: "",
    ratedBy: "",
    categories: [],
    colors: [],
    returnRules: [],
    sizes: [],
    additionalFields: [],
    is_prebooking: false,
    prebooking_start_at: "",
    prebooking_end_at: "",
  });
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [rules, setRules] = useState<any>([]);
  const [rating, setRating] = useState(product.rating || 0);
  const [ratedBy, setRatedBy] = useState(product.ratedBy || 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [newOffer, setNewOffer] = useState<any>({
    purchaseQuantity: "",
    freeQuantity: "",
    status: OfferStatus.ACTIVE,
    freeProduct: [],
  });
  const [offerProducts, setOfferProducts] = useState<any>([]);
  const [isAdditionalFieldModalOpen, setIsAdditionalFieldModalOpen] =
    useState(false);
  const [newField, setNewField] = useState({ key: "", value: "" });
  const searchParams = useSearchParams();
  const isDuplicate = searchParams.get('duplicate') === 'true';

  const handleOfferChange = (e) => {
    const { name, value } = e.target;
    setNewOffer((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Check if we're editing a duplicate product
    if (isDuplicate) {
      const duplicateProduct = JSON.parse(localStorage.getItem('editDuplicateProduct') || '{}');

      if (duplicateProduct && duplicateProduct._id) {
        // Remove the temporary ID and isDuplicate flag
        const { _id, isDuplicate, ...productData } = duplicateProduct;

        // Set the form data with the duplicate product data
        setProduct(productData);

        // Clear the localStorage after using it
        localStorage.removeItem('editDuplicateProduct');
      }
    }
  }, [isDuplicate]);

  const fetchOfferProducts = async () => {
    if (product.categories.length === 0) {
      toast.error("Please select at least one category first");
      return;
    }

    try {
      const allProductsPromises = product.categories.map(async (categoryId) => {
        const queryParams = new URLSearchParams({ categoryId });
        const { payload } = await dispatch(getAllProducts(queryParams.toString()));
        return payload.success ? payload.products : [];
      });

      const allProductsArrays = await Promise.all(allProductsPromises);
      const allProducts = Array.from(new Set(allProductsArrays.flat())).filter(
        (p) => p._id !== product._id
      );

      setOfferProducts(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products. Please try again.");
    }
  };

  const handleProductSelection = (productId: any) => {
    setNewOffer((prev: any) => {
      const updatedProducts = prev.freeProduct.includes(productId)
        ? prev.freeProduct.filter((id) => id !== productId)
        : [...prev.freeProduct, productId];
      return { ...prev, freeProduct: updatedProducts };
    });
  };

  const handleAddOffer = () => {
    if (
      newOffer.purchaseQuantity &&
      newOffer.freeQuantity &&
      newOffer.freeProduct.length > 0
    ) {
      setProduct((prev) => ({
        ...prev,
        offers: [
          ...prev.offers,
          {
            purchaseQuantity: parseInt(newOffer.purchaseQuantity),
            freeQuantity: parseInt(newOffer.freeQuantity),
            status: newOffer.status,
            products: newOffer.freeProduct.map((id) =>
              offerProducts.find((p) => p._id === id)
            ),
          },
        ],
      }));
      setNewOffer({
        purchaseQuantity: "",
        freeQuantity: "",
        status: OfferStatus.ACTIVE,
        freeProduct: [],
      });
      setIsOfferModalOpen(false);
    } else {
      toast.error(
        "Please fill all offer details and select at least one product"
      );
    }
  };

  const removeOffer = (index) => {
    setProduct((prev) => ({
      ...prev,
      offers: prev.offers.filter((_, i) => i !== index),
    }));
  };

  const toggleOfferStatus = (index) => {
    setProduct((prev) => ({
      ...prev,
      offers: prev.offers.map((offer, i) =>
        i === index
          ? {
            ...offer,
            status:
              offer.status === OfferStatus.ACTIVE
                ? OfferStatus.INACTIVE
                : OfferStatus.ACTIVE,
          }
          : offer
      ),
    }));
  };

  const handleRatingChange = (e) => {
    setRating(Number(e.target.value));
  };

  const handleRatedByChange = (e) => {
    setRatedBy(Number(e.target.value));
  };

  useEffect(() => {
    const fetchProductAndCategories = async () => {
      try {
        const [productResponse, categoriesResponse] = await Promise.all([
          dispatch(getProductsById(id)),
          dispatch(getAllCategories()),
        ]);

        if (productResponse.payload.success) {
          const fetchedProduct = productResponse.payload.product;
          setProduct({
            ...fetchedProduct,
            categories: fetchedProduct.categories.map((cat) => cat._id),
            prebooking_start_at: fetchedProduct.prebooking_start_at ? new Date(fetchedProduct.prebooking_start_at).toISOString().slice(0, 16) : "",
            prebooking_end_at: fetchedProduct.prebooking_end_at ? new Date(fetchedProduct.prebooking_end_at).toISOString().slice(0, 16) : "",
          });
          setRating(fetchedProduct.rating.star);
          setRatedBy(fetchedProduct.rating.ratedBy);
          setExistingImages(fetchedProduct.img);
        } else {
          toast.error("Failed to fetch product");
        }

        if (categoriesResponse.payload.success) {
          setCategories(categoriesResponse.payload.categories);
        } else {
          toast.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data");
      }
    };

    fetchProductAndCategories();
  }, [id, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleCheckboxChange = (name) => {
    setProduct({ ...product, [name]: !product[name] });
  };

  const handleMaterialChange = (e) => {
    setProduct({ ...product, material: e.target.value.split(",") });
  };

  const handleCategoryChange = (selectedCategories) => {
    setProduct({ ...product, categories: selectedCategories });
  };

  const handleColorVariantsChange = (newVariants) => {
    setProduct((prev) => ({ ...prev, colors: newVariants }));
  };

  const handleImageUpload = (e: any) => {
    const files = Array.from(e.target.files) as File[];
    setNewImages((prevImages) => [...prevImages, ...files]);
  };

  const removeExistingImage = (imgPath: string) => {
    setExistingImages((prevImages) =>
      prevImages.filter((img) => img !== imgPath)
    );
  };

  const removeNewImage = (index: number) => {
    setNewImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };
  const [editingSizeIndex, setEditingSizeIndex] = useState(null);
  const [sizeError, setSizeError] = useState("");
  const [newSize, setNewSize] = useState({
    size: "",
    stock: "",
    offerPrice: "",
    _id: "",
    // deliveryPrice: "",
  });

  const handleAddSize = () => {
    if (
      newSize.size &&
      newSize.stock &&
      newSize.offerPrice
    ) {
      if (editingSizeIndex !== null) {
        // Editing existing size - preserve the original _id
        setProduct((prevProduct) => ({
          ...prevProduct,
          sizes: prevProduct.sizes.map((size, index) =>
            index === editingSizeIndex
              ? {
                // deliveryPrice: newSize.deliveryPrice,
                size: newSize.size,
                stock: newSize.stock,
                offerPrice: newSize.offerPrice,
                _id: prevProduct.sizes[editingSizeIndex]._id, // Keep original _id
              }
              : size
          ),
        }));
        setEditingSizeIndex(null);
      } else {
        // Check for duplicate size
        if (product.sizes.some((size) => size.size === newSize.size)) {
          setSizeError("This size is already present.");
          return;
        }

        // Adding new size - omit _id
        const { _id, ...sizeWithoutId } = newSize;
        setProduct((prevProduct) => ({
          ...prevProduct,
          sizes: [...prevProduct.sizes, sizeWithoutId],
        }));
      }

      // Reset form
      setNewSize({
        size: "",
        stock: "",
        offerPrice: "",
        _id: "",
        // deliveryPrice: "",
      });
      setSizeError(""); // Clear any previous error
      setIsModalOpen(false);
    } else {
      toast.error("Please fill all size details");
    }
  };

  const removeSize = (index: number) => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      sizes: prevProduct.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleAddAdditionalField = () => {
    if (newField.key && newField.value) {
      setProduct((prevProduct) => ({
        ...prevProduct,
        additionalFields: {
          ...prevProduct.additionalFields,
          [newField.key]: newField.value,
        },
      }));
      setNewField({ key: "", value: "" });
      setIsAdditionalFieldModalOpen(false);
    } else {
      toast.error("Please fill both key and value");
    }
  };

  const removeAdditionalField = (keyToRemove) => {
    setProduct((prevProduct) => {
      const updatedFields = { ...prevProduct.additionalFields };
      delete updatedFields[keyToRemove];
      return { ...prevProduct, additionalFields: updatedFields };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData: any = new FormData();

    // Append all fields to formData
    Object.keys(product).forEach((key) => {
      if (
        key === "categories" ||
        key === "sizes" ||
        key === "additionalFields" ||
        Array.isArray(product[key])
      ) {
        formData.append(key, JSON.stringify(product[key]));
      } else if (key !== "images") {
        // Skip 'images' as we'll handle them separately
        formData.append(key, product[key]);
      }
    });

    formData.delete("rating");
    // Append rating and ratedBy to the formData
    formData.append("rating", rating);
    formData.append("ratedBy", ratedBy);
    // Append existing images
    formData.append("existingImages", JSON.stringify(existingImages));

    // Append new images
    newImages.forEach((file) => {
      formData.append("file", file);
    });

    try {
      // Replace with actual product ID if dynamic
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH", // Use PUT for updates
        body: formData,
        headers: {
          "x-admin-id": "your-admin-id-here", // Replace with actual admin ID
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("updated successfully");
      } else {
        toast.error(data.msg);
      }

      // Handle success (e.g., show a success message, reset form, redirect, etc.)
      // For example:
      // showSuccessMessage("Product updated successfully!");
      // router.push('/admin/products');
    } catch (error) {
      console.error("Error updating product:", error);
      // Handle error (e.g., show error message)
      // For example:
      // showErrorMessage("Failed to update product. Please try again.");
    }
  };

  const fetchRules = async () => {
    try {
      const response = await axios.get("/api/rules");
      setRules(response.data.rules);
    } catch (error) {
      toast.error("Failed to fetch rules");
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Update Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <Label>Existing Images</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {existingImages.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`Product ${index}`}
                    className="w-24 h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Label className="mt-4">Add New Images</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                id="newImages"
                type="file"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                // @ts-ignore
                onClick={() => document.getElementById("newImages").click()}
              >
                <FiUpload className="mr-2" /> Upload New Images
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newImages.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index}`}
                    className="w-24 h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={product.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={product.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              value={product.sku}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="actualPrice">Actual Price</Label>
            <Input
              id="actualPrice"
              name="actualPrice"
              type="number"
              value={product.actualPrice}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="rating">Stars</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={rating}
              onChange={handleRatingChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="ratedBy">Rated By</Label>
            <Input
              id="ratedBy"
              name="ratedBy"
              type="number"
              value={ratedBy}
              onChange={handleRatedByChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              name="color"
              value={product.color}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label>Color Variants</Label>
            <ColorVariantSelector
              onChange={handleColorVariantsChange}
              value={product.colors}
              currentProductId={product._id}
            />
          </div>
          <div className="col-span-1">
            <Label htmlFor="rules">Return Rules</Label>
            <RulesSelector
              rules={rules}
              selectedRules={product.returnRules}
              onChange={(selectedRules) =>
                setProduct({ ...product, returnRules: selectedRules })
              }
            />
          </div>
          <div>
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              name="width"
              value={product.width}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="height">Length</Label>
            <Input
              id="height"
              name="height"
              value={product.height}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="material">Materials (comma-separated)</Label>
            <Input
              id="material"
              name="material"
              value={product.material.join(",")}
              onChange={handleMaterialChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="washCare">Wash Care</Label>
            <Input
              id="washCare"
              name="washCare"
              value={product.washCare}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              name="note"
              value={product.note}
              onChange={handleInputChange}
            />
          </div>
          <CategorySelector
            categories={categories}
            selectedCategories={product.categories}
            onChange={handleCategoryChange}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featureProduct"
              checked={product.featureProduct}
              onCheckedChange={() => handleCheckboxChange("featureProduct")}
            />
            <label htmlFor="featureProduct">Feature Product</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bestsellerProduct"
              checked={product.bestsellerProduct}
              onCheckedChange={() => handleCheckboxChange("bestsellerProduct")}
            />
            <label htmlFor="bestsellerProduct">Bestseller Product</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="latestProduct"
              checked={product.latestProduct}
              onCheckedChange={() => handleCheckboxChange("latestProduct")}
            />
            <label htmlFor="latestProduct">New Arrivals</label>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_prebooking"
            checked={product.is_prebooking}
            onCheckedChange={() => handleCheckboxChange("is_prebooking")}
          />
          <label htmlFor="is_prebooking">Enable Pre-booking</label>
        </div>
        {product.is_prebooking && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 border rounded">
            <div>
              <Label htmlFor="prebooking_start_at">Start Date (Optional)</Label>
              <Input
                id="prebooking_start_at"
                name="prebooking_start_at"
                type="datetime-local"
                value={product.prebooking_start_at}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="prebooking_end_at">End Date (Required)</Label>
              <Input
                id="prebooking_end_at"
                name="prebooking_end_at"
                type="datetime-local"
                value={product.prebooking_end_at}
                onChange={handleInputChange}
                required={product.is_prebooking}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
        )}

        {/* <div>
          <Label>Offers</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {product?.offers?.map((offer, index) => (
              <div
                key={index}
                className="bg-gray-100 p-2 rounded flex items-center"
              >
                <span
                  className={
                    offer.status === OfferStatus.ACTIVE
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  Buy {offer.purchaseQuantity}, Get {offer.freeQuantity} Free
                </span>
                <button
                  type="button"
                  onClick={() => toggleOfferStatus(index)}
                  className="ml-2 text-sm"
                >
                  {offer.status === OfferStatus.ACTIVE
                    ? "Deactivate"
                    : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => removeOffer(index)}
                  className="ml-2 text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div> */}

        <div>
          <Label>Sizes</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {product.sizes.map((size, index) => (
              <div key={index} className="bg-gray-100 p-2 rounded">
                {size.size} - Stock: {size.stock}, Price: {size.offerPrice}

                <button
                  type="button"
                  onClick={() => {
                    setNewSize(size);
                    setEditingSizeIndex(index);
                    setIsModalOpen(true);
                  }}
                  className="ml-2 text-blue-500"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="ml-2 text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="mt-2">
                {"Add Size"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>
                  {editingSizeIndex !== null ? "Edit Size" : "Add Size"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select
                    onValueChange={(value) => {
                      setNewSize({ ...newSize, size: value });
                      setSizeError(""); // Clear error when a new size is selected
                    }}
                    value={newSize.size}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {[
                        "S",
                        "M",
                        "L",
                        "XL",
                        "XXL",
                        "3XL",
                        "4XL",
                        "5XL",
                        "6XL",
                        "Others",
                        "Freesize",
                      ].map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sizeError && (
                    <p className="text-red-500 mt-1">{sizeError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newSize.stock}
                    onChange={(e) =>
                      setNewSize({ ...newSize, stock: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="offerPrice">Offer Price</Label>
                  <Input
                    id="offerPrice"
                    type="number"
                    value={newSize.offerPrice}
                    onChange={(e) =>
                      setNewSize({ ...newSize, offerPrice: e.target.value })
                    }
                  />
                </div>
                {/* <div>
                  <Label htmlFor="deliveryPrice">deliveryPrice</Label>
                  <Input
                    id="deliveryPrice"
                    type="number"
                    value={newSize.deliveryPrice}
                    onChange={(e) =>
                      setNewSize({ ...newSize, deliveryPrice: e.target.value })
                    }
                  />
                </div> */}
                <Button type="button" onClick={handleAddSize}>
                  {editingSizeIndex !== null ? "Update Size" : "Add Size"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div>
          <Label>Additional Fields</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {product?.additionalFields &&
              Object.entries(product.additionalFields).map(
                ([key, value]: any) => (
                  <div key={key} className="bg-gray-100 p-2 rounded">
                    {key}: {value}
                    <button
                      type="button"
                      onClick={() => removeAdditionalField(key)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
          </div>
          <Dialog
            open={isAdditionalFieldModalOpen}
            onOpenChange={setIsAdditionalFieldModalOpen}
          >
            <DialogTrigger asChild>
              <Button type="button" className="mt-2">
                Add Additional Field
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Add Additional Field</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fieldKey">Field Key</Label>
                  <Input
                    id="fieldKey"
                    value={newField.key}
                    onChange={(e) =>
                      setNewField({ ...newField, key: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="fieldValue">Field Value</Label>
                  <Input
                    id="fieldValue"
                    value={newField.value}
                    onChange={(e) =>
                      setNewField({ ...newField, value: e.target.value })
                    }
                  />
                </div>
                <Button

                  type="button"
                  onClick={handleAddAdditionalField}
                >
                  Add Field
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Button type="submit" className="w-full">
          Update Product
        </Button>
      </form >
    </div >
  );
};

export default UpdateProduct;

