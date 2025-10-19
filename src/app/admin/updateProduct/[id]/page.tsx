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
    actualPrice: { IND: "", UAE: "" },
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
    rating: 0,
    ratedBy: 0,
    categories: [],
    colors: [],
    returnRules: [],
    sizes: [],
    additionalFields: [],
  });

  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [rules, setRules] = useState<any>([]);
  const [rating, setRating] = useState(0);
  const [ratedBy, setRatedBy] = useState(0);
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
  const isDuplicate = searchParams.get("duplicate") === "true";

  const [editingSizeIndex, setEditingSizeIndex] = useState<number | null>(
    null
  );
  const [sizeError, setSizeError] = useState("");
  const [newSize, setNewSize] = useState<any>({
    size: "",
    stock: "",
    offerPrice: { IND: "", UAE: "" },
  });

  useEffect(() => {
    // Handle duplicate product
    if (isDuplicate) {
      const duplicateProduct = JSON.parse(
        localStorage.getItem("editDuplicateProduct") || "{}"
      );
      if (duplicateProduct && duplicateProduct._id) {
        const { _id, isDuplicate, ...productData } = duplicateProduct;
        setProduct(productData);
        localStorage.removeItem("editDuplicateProduct");
      }
    }
  }, [isDuplicate]);

  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          ...(prev.offers || []),
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

  const removeOffer = (index: number) => {
    setProduct((prev) => ({
      ...prev,
      offers: prev.offers.filter((_, i) => i !== index),
    }));
  };

  const toggleOfferStatus = (index: number) => {
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

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRating(Number(e.target.value));
  };

  const handleRatedByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          });
          setRating(fetchedProduct.rating?.star || 0);
          setRatedBy(fetchedProduct.rating?.ratedBy || 0);
          setExistingImages(fetchedProduct.img);

          // Ensure actualPrice is an object
          if (typeof fetchedProduct.actualPrice !== "object") {
            setProduct((prev) => ({
              ...prev,
              actualPrice: { IND: fetchedProduct.actualPrice, UAE: 0 },
            }));
          }

          // Ensure sizes offerPrice is an object
          setProduct((prev) => ({
            ...prev,
            sizes: prev.sizes.map((size: any) => ({
              ...size,
              offerPrice:
                typeof size.offerPrice === "object"
                  ? size.offerPrice
                  : { IND: size.offerPrice, UAE: 0 },
            })),
          }));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Handle multi-currency actualPrice
    if (name === "actualPriceIND") {
      setProduct((prev) => ({
        ...prev,
        actualPrice: { ...prev.actualPrice, IND: value },
      }));
    } else if (name === "actualPriceUAE") {
      setProduct((prev) => ({
        ...prev,
        actualPrice: { ...prev.actualPrice, UAE: value },
      }));
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleCheckboxChange = (name: string) => {
    setProduct({ ...product, [name]: !product[name] });
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct({ ...product, material: e.target.value.split(",") });
  };

  const handleCategoryChange = (selectedCategories: string[]) => {
    setProduct({ ...product, categories: selectedCategories });
  };

   const handleColorVariantsChange = (newVariants: string[]) => {
    setProduct((prev) => ({ ...prev, colors: newVariants }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
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

  const handleAddSize = () => {
    if (
      newSize.size &&
      newSize.stock &&
      newSize.offerPrice.IND &&
      newSize.offerPrice.UAE
    ) {
      if (editingSizeIndex !== null) {
        // Editing existing size
        setProduct((prevProduct) => ({
          ...prevProduct,
          sizes: prevProduct.sizes.map((size, index) =>
            index === editingSizeIndex
              ? { ...newSize, _id: prevProduct.sizes[editingSizeIndex]._id }
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
        setProduct((prevProduct) => ({
          ...prevProduct,
          sizes: [...prevProduct.sizes, newSize],
        }));
      }

      setNewSize({
        size: "",
        stock: "",
        offerPrice: { IND: "", UAE: "" },
      });
      setSizeError("");
      setIsModalOpen(false);
    } else {
      toast.error("Please fill all size details with both IND and UAE prices");
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

  const removeAdditionalField = (keyToRemove: string) => {
    setProduct((prevProduct) => {
      const updatedFields = { ...prevProduct.additionalFields };
      delete updatedFields[keyToRemove];
      return { ...prevProduct, additionalFields: updatedFields };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    Object.keys(product).forEach((key) => {
      if (
        key === "categories" ||
        key === "sizes" ||
        key === "additionalFields" ||
        Array.isArray(product[key])
      ) {
        formData.append(key, JSON.stringify(product[key]));
      } else {
        formData.append(key, product[key]);
      }
    });

    // formData.append("rating", rating);
    // formData.append("ratedBy", ratedBy);
    formData.append("existingImages", JSON.stringify(existingImages));
    newImages.forEach((file) => formData.append("file", file));

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        body: formData,
        headers: {
          "x-admin-id": "your-admin-id-here",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        toast.success("Product updated successfully");
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
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
        {/* Images, Name, Description, SKU, Prices, Rating */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Existing Images & Upload */}
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

            <Label className="mt-4">Actual Price (IND & UAE)</Label>
            <div className="flex gap-2">
              <Input
                name="actualPriceIND"
                value={product.actualPrice.IND}
                onChange={handleInputChange}
                placeholder="IND"
              />
              <Input
                name="actualPriceUAE"
                value={product.actualPrice.UAE}
                onChange={handleInputChange}
                placeholder="UAE"
              />
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
                onClick={() => document.getElementById("newImages")?.click()}
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

          {/* Other Inputs */}
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
              // onChange={handleInputChange}
              required
            />
          </div>

          {/* SKU, Rating, Color */}
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
        </div>

        {/* Submit Button */}
        <Button type="submit">Update Product</Button>
      </form>
    </div>
  );
};

export default UpdateProduct;