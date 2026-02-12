"use client";

import React, { useEffect, useState } from "react";
import { ZapanInput, ZapanTextarea, PageHeader, Card as ZapanCard } from "@/theme/components";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FiUpload, FiPlus, FiTrash2, FiTag, FiLayers, FiImage, FiGrid, FiCheckCircle } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { getAllCategories, getAllProducts } from "@/lib/features/catogary";
import { CategorySelector } from "./Selector";
import toast from "react-hot-toast";
import { ColorVariantSelector } from "./Colorsvarianet";
import axios from "axios";
import RulesSelector from "./RulesSelector";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
} from "@/components/ui/dialog";
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
const AddProduct = () => {
  const [product, setProduct] = useState<any>({
    name: "",
    description: "",
    actualPrice: "",
    width: "",
    height: "",
    material: [],

    sku: "",
    washCare: "",
    note: "",
    star: "",
    ratedBy: "",
    featureProduct: false,
    bestsellerProduct: false,
    latestProduct: false,
    color: "",
    images: [],
    categories: [],
    colors: [],
    returnRules: [],
    offers: [],
    sizes: [],
    additionalFields: [],
    is_prebooking: false,
    prebooking_start_at: "",
    prebooking_end_at: "",
  });

  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const dispatch = useDispatch<any>();
  const [search, setSearch] = useState("");
  const [rules, setRules] = useState<any>([]);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sizeError, setSizeError] = useState("");
  const [newSize, setNewSize] = useState({
    size: "",
    stock: "",
    offerPrice: "",
    // deliveryPrice: "",
  });
  const [isAdditionalFieldModalOpen, setIsAdditionalFieldModalOpen] =
    useState(false);
  const [newField, setNewField] = useState({ key: "", value: "" });
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const isDuplicate = searchParams.get("duplicate") === "true";

  useEffect(() => {
    // Check if we're handling a duplicated product
    if (isDuplicate) {
      const duplicateProductData = JSON.parse(
        localStorage.getItem("editDuplicateProduct") || "{}"
      );
      // Map the duplicated product data to our form structure
      const mappedProduct = {
        name: duplicateProductData.name || "",
        description: duplicateProductData.description || "",
        actualPrice: duplicateProductData.actualPrice || "",
        width: duplicateProductData.width || "",
        height: duplicateProductData.height || "",
        material: duplicateProductData.material || [],
        sku: `${duplicateProductData.sku}-copy` || "",
        washCare: duplicateProductData.washCare || "",
        note: duplicateProductData.note || "",
        rating: duplicateProductData?.rating?.star || "",
        ratedBy: duplicateProductData?.rating?.ratedBy || "",
        featureProduct: duplicateProductData.featureProduct || false,
        bestsellerProduct: duplicateProductData.bestsellerProduct || false,
        latestProduct: duplicateProductData.latestProduct || false,
        color: duplicateProductData.color || "",
        images: [], // Note: mapping img to images if field names differ
        categories: duplicateProductData.categories || [],
        colors: duplicateProductData.colors || [],
        returnRules: duplicateProductData.returnRules || [],
        offers: duplicateProductData.offers || [],
        sizes: duplicateProductData.sizes || [],
        additionalFields: duplicateProductData.additionalFields || [],
      };

      if (duplicateProductData.img && duplicateProductData.img.length) {
        // Function to convert image URL to File object
        const urlToFile = async (url, filename) => {
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
          } catch (error) {
            console.error("Error converting image URL to File:", error);
            return null;
          }
        };

        // Process all images and convert to File objects
        const processImages = async () => {
          const imagePromises = duplicateProductData.img.map(
            async (img, index) => {
              const imageUrl =
                typeof img === "string" ? img : img.url || img.preview;
              if (!imageUrl) return null;

              // Generate a filename
              const filename = `duplicated-image-${index}.jpg`;

              // Convert URL to File
              const file = await urlToFile(imageUrl, filename);
              if (!file) return null;

              // Return in the format your handleImageUpload creates
              return {
                file,
                preview: URL.createObjectURL(file),
                id: Date.now() + Math.random().toString(36).substring(7),
              };
            }
          );

          // Wait for all image conversions to complete
          const imageObjects = await Promise.all(imagePromises);
          const validImageObjects = imageObjects.filter((img) => img !== null);

          // Update product state with the converted images
          setProduct((prev) => ({
            ...prev,
            images: validImageObjects,
          }));

          // Update selected images
          setSelectedImages(validImageObjects);
        };
        processImages();

        // Update the product state with the duplicated data
        setProduct(mappedProduct);

        // Clear localStorage after using it
        localStorage.removeItem("editDuplicateProduct");
      }
    }
  }, [isDuplicate]);

  const [newOffer, setNewOffer] = useState<any>({
    purchaseQuantity: "",
    freeQuantity: "",
    status: OfferStatus.ACTIVE,
    freeProduct: [],
  });
  const [offerProducts, setOfferProducts] = useState<any>([]);

  // console.log(offerProducts, "offer Products");

  const handleOfferChange = (e) => {
    const { name, value } = e.target;
    setNewOffer((prev) => ({ ...prev, [name]: value }));
  };

  const fetchOfferProducts = async () => {
    if (product.categories.length === 0) {
      toast.error("Please select at least one category first");
      return;
    }

    try {
      const allProductsPromises = product.categories.map(async (categoryId) => {
        console.log(categoryId, "id");
        const queryParams = new URLSearchParams({ categoryId });
        const { payload } = await dispatch(getAllProducts(queryParams.toString()));
        return payload.success ? payload.products : [];
      });

      const allProductsArrays = await Promise.all(allProductsPromises);

      // Flatten the array of arrays and remove duplicates
      const allProducts = Array.from(new Set(allProductsArrays.flat())).filter(
        (p) => p._id !== product._id
      );

      setOfferProducts(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products. Please try again.");
    }
  };

  const callGetCategories = async () => {
    const { payload }: any = await dispatch(getAllCategories());

    if (payload.success) {
      setCategories(payload.categories);
    }
  };

  const callGetAllProducts = async () => {
    const queryParams = new URLSearchParams({
      search: search,
    });
    const { payload } = await dispatch(getAllProducts(queryParams.toString()));

    if (payload.success) {
      setAllProducts(payload.products);
    } else {
      toast.error(payload.msg);
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
    callGetCategories();
    callGetAllProducts();
    fetchRules();
  }, []);

  const handleCategoryChange = (selectedCategories) => {
    setProduct({ ...product, categories: selectedCategories });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleCheckboxChange = (name) => {
    setProduct({ ...product, [name]: !product[name] });
  };

  const handleMaterialsChange = (e) => {
    setProduct({ ...product, material: e.target.value.split(",") });
  };

  const handleImageUpload = (e: any) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file: any) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random().toString(36).substring(7),
    }));

    // IMPORTANT: Preserve existing images by combining them with new ones
    const updatedImages = [...product.images, ...newImages];

    // Update the product state with ALL images
    setProduct({ ...product, images: updatedImages });

    // Update selected images state with ALL images
    setSelectedImages((prevImages) => [...prevImages, ...newImages]);
  };
  const handleColorVariantsChange = (newVariants) => {
    setProduct((prev) => ({ ...prev, colors: newVariants }));
  };

  const removeImage = (id: string) => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      images: prevProduct.images.filter((img) => img.id !== id),
    }));
    setSelectedImages((prevImages) =>
      prevImages.filter((img) => img.id !== id)
    );
  };

  const validateForm = () => {
    const errors: any = {};
    if ((product.sizes || []).length === 0) {
      errors.sizes = "At least one size is required";
    }
    // Add other validations as needed
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSize = () => {
    if (newSize.size && newSize.stock && newSize.offerPrice) {
      // Check if the size already exists
      if ((product.sizes || []).some((size) => size.size === newSize.size)) {
        setSizeError("This size is already present.");
        return;
      }

      setProduct((prevProduct) => ({
        ...prevProduct,
        sizes: [...(prevProduct.sizes || []), newSize],
      }));
      setNewSize({ size: "", stock: "", offerPrice: "" });
      setSizeError(""); // Clear any previous error
      setIsModalOpen(false);
      setFormErrors((prev) => ({ ...prev, sizes: "" }));
    } else {
      toast.error("Please fill all size details");
    }
  };
  const removeSize = (index: number) => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      sizes: (prevProduct.sizes || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddAdditionalField = () => {
    if (newField.key && newField.value) {
      setProduct((prevProduct) => ({
        ...prevProduct,
        additionalFields: [...prevProduct.additionalFields, newField],
      }));
      setNewField({ key: "", value: "" });
      setIsAdditionalFieldModalOpen(false);
    } else {
      toast.error("Please fill both key and value");
    }
  };

  const removeAdditionalField = (index) => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      additionalFields: prevProduct.additionalFields.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }
    const formData = new FormData();

    // Track existing images separately
    const existingImages: any = [];

    Object.keys(product).forEach((key) => {
      if (key === "images") {
        product.images.forEach((imageObj, index) => {
          if (imageObj.file instanceof File) {
            // Handle new images with File objects
            formData.append(`file`, imageObj.file, imageObj.file.name);
          } else if (imageObj.originalImage || imageObj.isExisting) {
            // Handle existing/duplicated images
            // Store the image URL or data in the existingImages array
            existingImages.push(
              typeof imageObj.originalImage === "string"
                ? imageObj.originalImage
                : imageObj.preview || imageObj
            );
          } else {
            console.warn(
              `Image at index ${index} is neither a File object nor has originalImage:`,
              imageObj
            );
          }
        });

        // Add the existing images as a JSON string
        if (existingImages.length > 0) {
          formData.append("existingImages", JSON.stringify(existingImages));
        }
      } else if (key === "additionalFields") {
        // Rest of the code remains the same
        const obj = {};
        if (Array.isArray(product.additionalFields)) {
          product.additionalFields.forEach((value) => {
            obj[value.key] = value.value;
          });
        } else if (typeof product.additionalFields === "object") {
          Object.entries(product.additionalFields).forEach(([key, value]) => {
            obj[key] = value;
          });
        }

        formData.append("additionalFields", JSON.stringify(obj));
      } else if (key === "offers") {
        formData.append(key, JSON.stringify(product[key]));
      } else if (Array.isArray(product[key])) {
        formData.append(key, JSON.stringify(product[key]));
      } else {
        formData.append(key, product[key]);
      }
    });

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });

      // Rest of the function remains the same
      const data = await response.json();

      if (data.success) {
        toast.success("Product created successfully");
        // Reset form
        setProduct({
          name: "",
          description: "",
          actualPrice: "",
          offerPrice: "",
          stock: "",
          width: "",
          height: "",
          material: [],
          washCare: "",
          star: "",
          ratedBy: "",
          note: "",
          featureProduct: false,
          bestsellerProduct: false,
          latestProduct: false,
          color: "",
          images: [],
          categories: [],
          colors: [],
          returnRules: [],
          sku: "",
          offers: [],
        });
        setSelectedImages([]);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product. Please try again.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={isDuplicate ? "Duplicate Prototype" : "New Prototype"}
        description="Define product specifications, aesthetics, and inventory parameters."
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
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.images.length} Objects Loaded</span>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-100 rounded-[2rem] cursor-pointer bg-gray-50/50 hover:bg-white hover:border-[#7C1D3E]/30 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-4 group-hover:scale-110 transition-transform">
                        <FiUpload className="text-[#7C1D3E]" size={24} />
                      </div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Ingest Visuals</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">SVG, PNG, JPG or WEBP</p>
                    </div>
                    <input id="images" type="file" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {selectedImages?.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6">
                    {selectedImages.map((image) => (
                      <div key={image.id} className="relative aspect-square group">
                        <img
                          src={image.preview}
                          alt="asset"
                          className="w-full h-full object-cover rounded-2xl border border-gray-100 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-red-50 hover:bg-red-50"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    onChange={handleMaterialsChange}
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
                  id="star"
                  name="star"
                  type="number"
                  value={product.star}
                  onChange={handleInputChange}
                  placeholder="5"
                  required
                />

                <ZapanInput
                  label="Review Count"
                  id="ratedBy"
                  name="ratedBy"
                  type="number"
                  value={product.ratedBy}
                  onChange={handleInputChange}
                  placeholder="100"
                  required
                />

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility Protocol</h4>
                  {[
                    { id: "featureProduct", label: "Featured" },
                    { id: "bestsellerProduct", label: "Bestseller" },
                    { id: "latestProduct", label: "New Arrival" },
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
                {isDuplicate ? "Confirm Copy" : "Finalize Prototype"}
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
                    <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">Register Size Unit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Universal Size</label>
                      <Select
                        required
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
                          {["M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "Others", "Freesize"].map((size) => (
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
                      Authenticate Size
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
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))
              )}
              {formErrors.sizes && <p className="text-[10px] font-bold text-red-500 mt-2 uppercase tracking-widest ml-1">{formErrors.sizes}</p>}
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
              {!product.additionalFields || (Array.isArray(product.additionalFields) ? product.additionalFields.length === 0 : Object.keys(product.additionalFields).length === 0) ? (
                <div className="py-12 border-2 border-dashed border-gray-50 rounded-[2rem] flex flex-col items-center justify-center text-gray-300">
                  <FiPlus size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Metas Ingested</p>
                </div>
              ) : (
                (Array.isArray(product.additionalFields)
                  ? product.additionalFields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                      <div>
                        <span className="text-[10px] font-black text-[#7C1D3E] uppercase tracking-widest mr-2">{field.key}:</span>
                        <span className="text-[11px] font-bold text-gray-700">{field.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAdditionalField(index)}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))
                  : Object.entries(product.additionalFields).map(([key, value]: any, index) => (
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
                )
              )}
            </div>
          </ZapanCard>
        </div>

        {/* Final Global Checkbox Selection */}
        <ZapanCard className="p-10 mt-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#7C1D3E]/10 text-[#7C1D3E] flex items-center justify-center">
              <FiCheckCircle size={20} />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Pre-booking protocol</h3>
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

export default AddProduct;

