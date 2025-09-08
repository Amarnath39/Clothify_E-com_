"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const MultiSelect = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected?.length > 0
          ? `${selected?.length} selected`
          : "Select Parent categories (not mandatory)"}
        <FiChevronDown
          className={`ml-2 h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-4 py-2 hover:bg-gray-100"
            >
              <Checkbox
                checked={selected?.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selected, option.value]);
                  } else {
                    onChange(selected?.filter((item) => item !== option.value));
                  }
                }}
              />
              <span className="ml-2">{option.label}</span>
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
}) => {
  const childCategories = categories.filter(
    (cat) =>
      cat.parentCategory &&
      cat.parentCategory.some((parent) => parent._id === category._id)
  );

  return (
    <AccordionItem value={category._id} className={`ml-${depth * 4}`}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {childCategories.length > 0 && (
              <FiChevronRight className="mr-2 h-4 w-4 transition-transform ui-open:rotate-90" />
            )}
            <span>{category.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
            >
              <FiEdit className="mr-2" /> Edit
            </Button>
            <Button
             
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category._id);
              }}
            >
              <FiTrash2 className="mr-2" /> Delete
            </Button>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-4 mt-2">
          <p>
            <strong>Description:</strong> {category.description}
          </p>
          <p>
            <strong>Image:</strong>
          </p>
          <img
            src={category.img}
            alt={category.name}
            className="w-16 h-16 object-cover rounded mt-2"
          />
          {childCategories.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-blue-600">
                Child Categories:
              </h4>
              <Accordion type="single" collapsible className="w-full">
                {childCategories.map((childCat) => (
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

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    categories: [],
    file: null,
  });
  const [editCategory, setEditCategory] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<any>(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/category");
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    try {
      const formData: any = new FormData();
      formData.append("name", editCategory?.name);
      formData.append("description", editCategory.description);
      formData.append(
        "categories",
        JSON.stringify(editCategory.parentCategory)
      );
      if (editCategory.file) {
        formData.append("file", editCategory.file);
      }

      await axios.patch(`/api/admin/category/${editCategory._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchCategories();
      setEditCategory(null);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(`/api/admin/category/${id}`);
        fetchCategories();
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting category:", error);
        toast({
          title: "Error",
          description: "Failed to delete category",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (isEdit) {
      setEditCategory((prev) => ({ ...prev, file }));
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
    <div className="container mx-auto p-6">
      {/* Logo added above Categories */}
      <div className="flex flex-col items-start space-y-2 mb-2">
        <img
          src="/assets/static/logo/2_4__1_-removebg-preview (1).png"
          alt="Logo"
          className="w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 object-contain"
          style={{ marginTop: 0, marginBottom: 0 }}
        />
      </div>
      <h1 className="text-3xl font-bold mb-6">Categories</h1>
      <Button
        onClick={() => {
          setEditCategory(null);
          setIsDialogOpen(true);
        }}
        className="mb-4"
      >
        <FiPlus className="mr-2" /> Add New Category
      </Button>

      <Accordion type="single" collapsible className="w-full">
        {topLevelCategories.map((category: any) => (
          <CategoryItem
            key={category._id}
            category={category}
            categories={categories}
            onEdit={(cat) => {
              setEditCategory({
                ...cat,
                parentCategory: cat.parentCategory
                  ? cat.parentCategory.map((parent) => parent._id)
                  : [],
              });
              setIsDialogOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
      </Accordion>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Category Name"
              value={editCategory ? editCategory.name : newCategory.name}
              onChange={(e) =>
                editCategory
                  ? setEditCategory({ ...editCategory, name: e.target.value })
                  : setNewCategory({ ...newCategory, name: e.target.value })
              }
            />
            <Input
              placeholder="Category Description"
              value={
                editCategory
                  ? editCategory.description
                  : newCategory.description
              }
              onChange={(e) =>
                editCategory
                  ? setEditCategory({
                      ...editCategory,
                      description: e.target.value,
                    })
                  : setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
              }
            />
            <MultiSelect
              options={parentOptions}
              selected={
                editCategory
                  ? editCategory.parentCategory
                  : newCategory.categories
              }
              onChange={(value) =>
                editCategory
                  ? setEditCategory({ ...editCategory, parentCategory: value })
                  : setNewCategory({ ...newCategory, categories: value })
              }
            />
            <Input
              type="file"
              onChange={(e) => handleFileChange(e, !!editCategory)}
            />
            <Button onClick={editCategory ? handleEdit : handleCreate}>
              {editCategory ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
