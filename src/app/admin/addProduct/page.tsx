"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FiUpload } from "react-icons/fi";
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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isDuplicate ? "Create Duplicate Product" : "Add New Product"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:grid  md:grid-cols-2 gap-6">
          <div className="col-span-2">
            {/* <Label htmlFor="images">Product Images</Label> */}
            <div className="flex items-center flex-wrap space-x-2">
              <Input
                id="images"
                type="file"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button className="bg-black text-white hover:bg-black"
                type="button"
                // @ts-ignore
                onClick={() => document.getElementById("images").click()}
              >
                <FiUpload className="mr-2" /> Upload Images
              </Button>

              <span>{product.images.length} file(s) selected</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedImages?.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.preview}
                    alt={`Selected ${image.id}`}
                    className="w-24 h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    aria-label="Remove image"
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
            <Label htmlFor="Star">Stars</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              value={product.rating}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="rated">Rated By</Label>
            <Input
              id="ratedBy"
              name="ratedBy"
              type="number"
              value={product.ratedBy}
              onChange={handleInputChange}
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
              onChange={handleMaterialsChange}
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

        <div>
          <Label>Sizes (Required)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(product?.sizes || []).map((size, index) => (
              <div key={index} className="bg-gray-100 p-2 rounded">
                {size.size} - Stock: {size.stock}, Price: {size.offerPrice}
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
          {formErrors.sizes && (
            <p className="text-red-500 mt-1">{formErrors.sizes}</p>
          )}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="mt-2 bg-black text-white hover:bg-black">
                Add Size
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Add Size</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select
                    required
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
                  <Label htmlFor="Delivery Price">Delivery Price</Label>
                  <Input
                    id="deliveryPrice"
                    type="number"
                    value={newSize.deliveryPrice}
                    onChange={(e) =>
                      setNewSize({ ...newSize, deliveryPrice: e.target.value })
                    }
                  />
                </div> */}
                <Button className="bg-black text-white hover:bg-black" type="button" onClick={handleAddSize}>
                  Add Size
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <Label>Additional Fields</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {product?.additionalFields &&
              (Array.isArray(product.additionalFields)
                ? product.additionalFields.map((field, index) => (
                  <div key={index} className="bg-gray-100 p-2 rounded">
                    {field.key}: {field.value}
                    <button
                      type="button"
                      onClick={() => removeAdditionalField(index)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))
                : Object.entries(product.additionalFields).map(
                  ([key, value]: any, index) => (
                    <div key={index} className="bg-gray-100 p-2 rounded">
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
                ))}
          </div>
          <Dialog
            open={isAdditionalFieldModalOpen}
            onOpenChange={setIsAdditionalFieldModalOpen}
          >
            <DialogTrigger asChild>
              <Button type="button" className="mt-2 bg-black text-white hover:bg-black">
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
                <Button className="bg-black text-white hover:bg-black" type="button" onClick={handleAddAdditionalField}>
                  Add Field
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Button type="submit" className="w-full bg-black text-white hover:bg-black">
          {isDuplicate ? "Save Duplicate Product" : "Add Product"}
        </Button>
      </form>
    </div>
  );
};

export default AddProduct;
