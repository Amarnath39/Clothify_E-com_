"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ZapanInput, ZapanTextarea, PageHeader, Card as ZapanCard } from "@/theme/components";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FiUpload, FiPlus, FiTrash2, FiTag, FiLayers, FiImage, FiGrid, FiCheckCircle } from "react-icons/fi";
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
const UpdateProduct = ({ params }: any) => {
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
  const [editingSizeIndex, setEditingSizeIndex] = useState<number | null>(null);
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Update Prototype"
        description={`Refining specifications for protocol ${product.sku || 'PENDING'}`}
      />

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Specifications Card */}
          <div className="lg:col-span-2 space-y-8">
            <ZapanCard className="p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                  <FiLayers size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Primary Specifications</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <ZapanInput
                    label="Prototype Identity"
                    id="name"
                    name="name"
                    value={product.name}
                    onChange={handleInputChange}
                    placeholder="Enter product title..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <ZapanTextarea
                    label="Design Narrative"
                    id="description"
                    name="description"
                    value={product.description}
                    onChange={handleInputChange}
                    placeholder="Describe the product aesthetics and details..."
                    required
                  />
                </div>

                <ZapanInput
                  label="SKU Protocol"
                  id="sku"
                  name="sku"
                  value={product.sku}
                  onChange={handleInputChange}
                  placeholder="SW-PRD-001"
                  required
                />

                <ZapanInput
                  label="Market Value (Actual Price)"
                  id="actualPrice"
                  name="actualPrice"
                  type="number"
                  value={product.actualPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </ZapanCard>

            {/* Aesthetics & Media Card */}
            <ZapanCard className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                    <FiImage size={20} />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Visual Assets</h3>
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{existingImages.length + newImages.length} Objects Loaded</span>
              </div>

              <div className="space-y-8">
                {/* Existing Assets Section */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Legacy Assets (Stored)</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {existingImages.map((img, index) => (
                      <div key={index} className="relative aspect-square group">
                        <img
                          src={img}
                          alt={`Asset ${index}`}
                          className="w-full h-full object-cover rounded-2xl border border-gray-100 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-red-50 hover:bg-red-50"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-50"></div>

                {/* Upload Section */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ingest New Visuals</p>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-100 rounded-[2rem] cursor-pointer bg-gray-50/50 hover:bg-white hover:border-[#7C1D3E]/30 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-4 group-hover:scale-110 transition-transform">
                          <FiUpload className="text-[#7C1D3E]" size={24} />
                        </div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Select New Objects</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">SVG, PNG, JPG or WEBP</p>
                      </div>
                      <input id="newImages" type="file" multiple onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>

                  {newImages?.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-6">
                      {newImages.map((file, index) => (
                        <div key={index} className="relative aspect-square group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New ${index}`}
                            className="w-full h-full object-cover rounded-2xl border border-gray-100 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-red-50 hover:bg-red-50"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ZapanCard>

            {/* Logistics & Taxonomy Card */}
            <ZapanCard className="p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                  <FiGrid size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Inventory & Taxonomy</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CategorySelector
                  categories={categories}
                  selectedCategories={product.categories}
                  onChange={handleCategoryChange}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ZapanInput
                    label="Width"
                    id="width"
                    name="width"
                    value={product.width}
                    onChange={handleInputChange}
                    placeholder="0cm"
                  />
                  <ZapanInput
                    label="Length"
                    id="height"
                    name="height"
                    value={product.height}
                    onChange={handleInputChange}
                    placeholder="0cm"
                  />
                </div>

                <div className="md:col-span-2">
                  <ZapanInput
                    label="Material Composition"
                    id="material"
                    name="material"
                    value={product.material.join(",")}
                    onChange={handleMaterialChange}
                    placeholder="e.g. Silk, Cotton (Comma separated)"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <ZapanTextarea
                    label="Wash Care Protocol"
                    id="washCare"
                    name="washCare"
                    value={product.washCare}
                    onChange={handleInputChange}
                    placeholder="Dry clean only..."
                  />
                </div>

                <div className="md:col-span-2">
                  <ZapanTextarea
                    label="Admin Internal Note"
                    id="note"
                    name="note"
                    value={product.note}
                    onChange={handleInputChange}
                    placeholder="Internal reference only..."
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Color Palette</label>
                  <ColorVariantSelector
                    onChange={handleColorVariantsChange}
                    value={product.colors}
                    currentProductId={product._id}
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Logistics Protocol (Rules)</label>
                  <RulesSelector
                    rules={rules}
                    selectedRules={product.returnRules}
                    onChange={(selectedRules) =>
                      setProduct({ ...product, returnRules: selectedRules })
                    }
                  />
                </div>
              </div>
            </ZapanCard>
          </div>


          {/* Sidebar Actions */}
          <div className="space-y-8">
            <ZapanCard className="p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                  <FiTag size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Performance Metas</h3>
              </div>

              <div className="space-y-6">
                <ZapanInput
                  label="Star Rating"
                  id="rating"
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={handleRatingChange}
                  placeholder="0.0"
                  required
                />

                <ZapanInput
                  label="Verified By (Count)"
                  id="ratedBy"
                  name="ratedBy"
                  type="number"
                  value={ratedBy}
                  onChange={handleRatedByChange}
                  placeholder="0"
                  required
                />

                <ZapanInput
                  label="Primary Colorway"
                  id="color"
                  name="color"
                  value={product.color}
                  onChange={handleInputChange}
                  placeholder="e.g. Crimson"
                  required
                />

                <div className="h-px bg-gray-50 my-4"></div>

                <div className="space-y-3">
                  {[
                    { id: "featureProduct", label: "Feature Protocol" },
                    { id: "bestsellerProduct", label: "Bestseller Flag" },
                    { id: "latestProduct", label: "New Arrival Tag" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">{item.label}</span>
                      <Checkbox
                        id={item.id}
                        checked={product[item.id]}
                        onCheckedChange={() => handleCheckboxChange(item.id)}
                        className="border-gray-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </ZapanCard>

            <ZapanCard className="p-8 bg-gradient-to-br from-[#7C1D3E] to-[#E91E7B] text-white border-none shadow-xl shadow-brand/20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-6">Master Action</h3>
              <button
                type="submit"
                className="w-full h-14 bg-white text-[#7C1D3E] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Commit Update
              </button>
              <p className="text-[9px] font-bold uppercase tracking-wider mt-4 opacity-60 text-center">Protocol V1.2.4 Deployment</p>
            </ZapanCard>
          </div>
        </div>

        {/* Extended Settings Sections (Sizes, Additional Fields) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

          {/* Sizes Configuration Card */}
          <ZapanCard className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                  <FiPlus size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Size Configuration</h3>
              </div>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                    Register Size
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-xl border-gray-100 rounded-[2.5rem] p-10 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                      {editingSizeIndex !== null ? "Modify Size Unit" : "Register Size Unit"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Universal Size</label>
                      <Select
                        onValueChange={(value) => {
                          setNewSize({ ...newSize, size: value });
                          setSizeError("");
                        }}
                        value={newSize.size}
                      >
                        <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl px-6 focus:ring-2 focus:ring-[#7C1D3E]/20 transition-all">
                          <SelectValue placeholder="Select Metric" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] rounded-2xl border-gray-100 shadow-xl p-2">
                          {["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "Others", "Freesize"].map((size) => (
                            <SelectItem key={size} value={size} className="rounded-xl font-bold text-gray-700 py-3">
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sizeError && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-widest ml-1">{sizeError}</p>}
                    </div>

                    <ZapanInput
                      id="stock"
                      type="number"
                      label="Available Stock"
                      placeholder="0"
                      value={newSize.stock}
                      onChange={(e) => setNewSize({ ...newSize, stock: e.target.value })}
                    />

                    <ZapanInput
                      id="offerPrice"
                      type="number"
                      label="Deployment Price (Offer)"
                      placeholder="0.00"
                      value={newSize.offerPrice}
                      onChange={(e) => setNewSize({ ...newSize, offerPrice: e.target.value })}
                    />

                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="w-full h-14 bg-[#7C1D3E] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#7C1D3E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                    >
                      {editingSizeIndex !== null ? "Update Size" : "Authenticate Size"}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {(product?.sizes || []).length === 0 ? (
                <div className="py-12 border-2 border-dashed border-gray-50 rounded-[2rem] flex flex-col items-center justify-center text-gray-300">
                  <FiPlus size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Units Registered</p>
                </div>
              ) : (
                (product.sizes || []).map((size: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                    <div>
                      <span className="px-3 py-1 bg-white text-[#7C1D3E] text-[10px] font-black rounded-lg shadow-sm border border-gray-100 mr-3">{size.size}</span>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">STOCK: <span className="text-gray-900">{size.stock}</span> • PRICE: <span className="text-gray-900">₹{size.offerPrice}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewSize(size);
                          setEditingSizeIndex(index);
                          setIsModalOpen(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <FiTag size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ZapanCard>

          {/* Additional Metas Card */}
          <ZapanCard className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
                  <FiPlus size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Extended Metas</h3>
              </div>
              <Dialog open={isAdditionalFieldModalOpen} onOpenChange={setIsAdditionalFieldModalOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="px-5 py-2.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-gray-900/10 hover:scale-105 active:scale-95 transition-all">
                    Insert Field
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-xl border-gray-100 rounded-[2.5rem] p-10 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">Insert Meta Field</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <ZapanInput
                      id="fieldKey"
                      label="Protocol Key"
                      placeholder="e.g. Origin"
                      value={newField.key}
                      onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                    />
                    <ZapanInput
                      id="fieldValue"
                      label="Identity Value"
                      placeholder="e.g. Varanasi"
                      value={newField.value}
                      onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={handleAddAdditionalField}
                      className="w-full h-14 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                    >
                      Commit Meta
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {!product.additionalFields || Object.keys(product.additionalFields).length === 0 ? (
                <div className="py-12 border-2 border-dashed border-gray-50 rounded-[2rem] flex flex-col items-center justify-center text-gray-300">
                  <FiPlus size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Metas Ingested</p>
                </div>
              ) : (
                Object.entries(product.additionalFields).map(([key, value]: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                    <div>
                      <span className="text-[10px] font-black text-[#7C1D3E] uppercase tracking-widest mr-2">{key}:</span>
                      <span className="text-[11px] font-bold text-gray-700">{value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalField(key)}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ZapanCard>
        </div>

        {/* Pre-booking Protocol */}
        <ZapanCard className="p-10 mt-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
              <FiCheckCircle size={20} />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Pre-booking Protocol</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Enable Reservations</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Allow customers to secure stock before official release</span>
            </div>
            <Checkbox
              id="is_prebooking"
              checked={product.is_prebooking}
              onCheckedChange={() => handleCheckboxChange("is_prebooking")}
              className="border-gray-300"
            />
          </div>

          {product.is_prebooking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
              <ZapanInput
                id="prebooking_start_at"
                name="prebooking_start_at"
                type="datetime-local"
                label="Launch Window (Start)"
                value={product.prebooking_start_at}
                onChange={handleInputChange}
                className="bg-white"
              />
              <ZapanInput
                id="prebooking_end_at"
                name="prebooking_end_at"
                type="datetime-local"
                label="Closure Window (End)"
                value={product.prebooking_end_at}
                onChange={handleInputChange}
                required={product.is_prebooking}
                min={new Date().toISOString().slice(0, 16)}
                className="bg-white"
              />
            </div>
          )}
        </ZapanCard>
      </form>
    </div>
  );
};

export default UpdateProduct;

