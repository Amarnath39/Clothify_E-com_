"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronRight,
  FiHash,
  FiImage,
} from "react-icons/fi";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  ZapanInput,
  ZapanTextarea,
} from "@/theme/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import toast from "react-hot-toast";
import { LuLoader } from "react-icons/lu";

/**
 * MultiSelect component
 */

const MultiSelect = ({ options, selected, onChange, label }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 relative" ref={ref}>
      {label && <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 h-12 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold transition-all hover:border-[#7C1D3E]/30"
      >
        <span className={selected?.length > 0 ? "text-gray-900" : "text-gray-300"}>
          {selected?.length > 0 ? `${selected?.length} selected` : "Select parent categories"}
        </span>
        <FiChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-auto p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {options.length === 0 ? (
            <p className="p-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">No other categories available</p>
          ) : options.map((option: any) => (
            <label
              key={option.value}
              className="flex items-center px-4 py-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
            >
              <Checkbox
                className="rounded-md border-gray-200 text-[#7C1D3E] focus:ring-[#7C1D3E]/20"
                checked={selected?.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selected, option.value]);
                  } else {
                    onChange(selected?.filter((item: string) => item !== option.value));
                  }
                }}
              />
              <span className="ml-3 text-sm font-bold text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryItem = ({
  category,
  categories,
  onEdit,
  onDelete,
  depth = 0,
}: any) => {
  const childCategories = categories.filter(
    (cat: any) =>
      cat.parentCategory &&
      cat.parentCategory.some((parent: any) => parent._id === category._id)
  );

  return (
    <AccordionItem value={category._id} className="border-none mb-2">
      <div className={`flex items-center group/item hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 rounded-2xl border border-transparent hover:border-gray-100 transition-all ${depth > 0 ? 'ml-8' : ''}`}>
        <AccordionTrigger className={`flex-1 hover:no-underline px-4 py-4 font-black text-gray-900 ${childCategories.length === 0 ? '[&>svg]:hidden' : ''}`}>
          <div className="flex items-center gap-4">
            {childCategories.length > 0 ? (
              <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-50 group-data-[state=open]/item:bg-[#7C1D3E] group-data-[state=open]/item:text-white transition-all transform group-data-[state=open]/item:scale-110">
                <FiChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/item:rotate-90" />
              </div>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-gray-200">
                <FiHash size={14} />
              </div>
            )}
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-white">
              <img src={category.img} alt={category.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <span className="group-hover/item:text-[#7C1D3E] transition-colors text-sm">{category.name}</span>
              {childCategories.length > 0 && (
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{childCategories.length} Sub-categories</span>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <div className="flex items-center gap-2 pr-4 opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-2 group-hover/item:translate-x-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(category)} className="h-9 w-9 p-0 rounded-xl bg-gray-50 hover:bg-[#7C1D3E]/10 hover:text-[#7C1D3E]">
            <FiEdit size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(category._id)} className="h-9 w-9 p-0 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-600">
            <FiTrash2 size={16} />
          </Button>
        </div>
      </div>

      <AccordionContent className="pb-4">
        <div className={`mt-3 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 ml-12 mr-4 space-y-6 shadow-inner`}>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 opacity-60">Description</label>
            <p className="text-sm font-bold text-gray-600 leading-relaxed italic">{category.description || "No description provided."}</p>
          </div>

          {childCategories.length > 0 && (
            <div className="pt-6 border-t border-gray-200/50">
              <label className="text-[10px] font-black text-[#7C1D3E] uppercase tracking-[0.2em] block mb-4">Hierarchical Sub-levels</label>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {childCategories.map((childCat: any) => (
                  <CategoryItem
                    key={childCat._id}
                    category={childCat}
                    categories={categories}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    depth={depth + 1}
                  />
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    categories: [] as string[],
    file: null as File | null,
  });
  const [editCategory, setEditCategory] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/category");
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newCategory.name);
      formData.append("description", newCategory.description);
      formData.append("categories", JSON.stringify(newCategory.categories));
      if (newCategory.file) {
        formData.append("file", newCategory.file);
      }

      await axios.post("/api/admin/category", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchCategories();
      setNewCategory({ name: "", description: "", categories: [], file: null });
      setIsDialogOpen(false);
      toast.success("Category created successfully");
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleEdit = async () => {
    try {
      const formData = new FormData();
      formData.append("name", editCategory?.name);
      formData.append("description", editCategory.description);
      formData.append("categories", JSON.stringify(editCategory.parentCategory));
      if (editCategory.file) {
        formData.append("file", editCategory.file);
      }

      await axios.patch(`/api/admin/category/${editCategory._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchCategories();
      setEditCategory(null);
      setIsDialogOpen(false);
      toast.success("Category updated successfully");
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await axios.delete(`/api/admin/category/${id}`);
        fetchCategories();
        toast.success("Category deleted successfully");
      } catch (error) {
        toast.error("Failed to delete category");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0] || null;
    if (isEdit) {
      setEditCategory((prev: any) => ({ ...prev, file }));
    } else {
      setNewCategory((prev) => ({ ...prev, file }));
    }
  };

  const parentOptions = categories
    .filter((cat: any) => !editCategory || cat._id !== editCategory._id)
    .map((cat: any) => ({
      value: cat._id,
      label: cat.name,
    }));

  const topLevelCategories = categories.filter(
    (cat: any) => !cat.parentCategory || cat.parentCategory.length === 0
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Categories"
        description="Organize your product catalog into hierarchical levels for better browsing."
        action={
          <Button
            variant="primary"
            className="h-11 px-6 rounded-xl shadow-lg shadow-[#7C1D3E]/20"
            onClick={() => {
              setEditCategory(null);
              setIsDialogOpen(true);
            }}
          >
            <FiPlus className="mr-2" size={18} /> Add New Tier
          </Button>
        }
      />

      <Card className="p-4 overflow-hidden border-gray-100 shadow-xl shadow-gray-200/50 min-h-[400px]">
        {loading && categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40">
            <LuLoader className="w-10 h-10 animate-spin text-[#7C1D3E]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6">Mapping Hierarchy...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-32 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-8 text-gray-200">
              <FiHash size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 leading-tight">Catalog is Empty</h3>
            <p className="text-sm font-bold text-gray-400 mt-2 max-w-xs leading-relaxed">Your store currently has no categories. Create a tiered structure to help users find products.</p>
            <Button variant="outline" className="mt-8 rounded-xl h-12" onClick={() => setIsDialogOpen(true)}>Create First Category</Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {topLevelCategories.map((category: any) => (
              <CategoryItem
                key={category._id}
                category={category}
                categories={categories}
                onEdit={(cat: any) => {
                  setEditCategory({
                    ...cat,
                    parentCategory: cat.parentCategory
                      ? cat.parentCategory.map((parent: any) => parent._id)
                      : [],
                  });
                  setIsDialogOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </Accordion>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#7C1D3E] p-8 text-white relative">
            <DialogTitle className="text-2xl font-black">{editCategory ? "Refine Tier" : "Add Category"}</DialogTitle>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-1">{editCategory ? "Update hierarchical details" : "Start your catalog structure"}</p>
            <div className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <FiPlus className={`transform transition-transform duration-500 ${editCategory ? 'rotate-45' : ''}`} size={24} />
            </div>
          </div>

          <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[70vh] scrollbar-thin">
            <ZapanInput
              label="Tier Name"
              placeholder="E.g. Men's Wear, Bridal Collection..."
              value={editCategory ? editCategory.name : newCategory.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                editCategory
                  ? setEditCategory({ ...editCategory, name: e.target.value })
                  : setNewCategory({ ...newCategory, name: e.target.value })
              }
              className="text-lg"
              required
            />
            <ZapanTextarea
              label="Public Description"
              placeholder="Provide a brief overview for customers and SEO..."
              value={editCategory ? editCategory.description : newCategory.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                editCategory
                  ? setEditCategory({ ...editCategory, description: e.target.value })
                  : setNewCategory({ ...newCategory, description: e.target.value })
              }
            />
            <MultiSelect
              label="Hierarchical Parents"
              options={parentOptions}
              selected={editCategory ? editCategory.parentCategory : newCategory.categories}
              onChange={(value: string[]) =>
                editCategory
                  ? setEditCategory({ ...editCategory, parentCategory: value })
                  : setNewCategory({ ...newCategory, categories: value })
              }
            />

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Cover Aesthetic</label>
              <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:border-[#7C1D3E]/20">
                <div className="w-20 h-20 rounded-xl border border-gray-100 flex-shrink-0 overflow-hidden shadow-lg bg-white relative">
                  {((editCategory?.img && !editCategory.file) || (editCategory?.file || newCategory.file)) ? (
                    <img
                      src={editCategory?.file ? URL.createObjectURL(editCategory.file) : newCategory.file ? URL.createObjectURL(newCategory.file) : editCategory?.img}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
                      <FiImage size={24} />
                      <span className="text-[8px] font-black uppercase">Preview</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-bold text-gray-900">Upload Category Graphic</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">Use high-res square images for the best visual appeal on your store.</p>
                  <input
                    type="file"
                    id="cat-upload"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, !!editCategory)}
                  />
                  <label
                    htmlFor="cat-upload"
                    className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7C1D3E] cursor-pointer hover:bg-[#7C1D3E] hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    Select Image
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black text-gray-400 hover:text-gray-900 border border-gray-100" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button variant="primary" className="flex-[2] h-14 rounded-2xl font-black text-lg shadow-xl shadow-[#7C1D3E]/20" onClick={editCategory ? handleEdit : handleCreate}>
                {editCategory ? "Save Changes" : "Create Tier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;
