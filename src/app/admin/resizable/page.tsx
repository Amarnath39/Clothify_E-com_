"use client";
// components/ZoomDataManager.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiPlus, FiEdit, FiUpload } from "react-icons/fi";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface ZoomDataItem {
  _id: string;
  img: string;
  title: string;
}

const ZoomDataManager: React.FC = () => {
  const [zoomDataList, setZoomDataList] = useState<ZoomDataItem[]>([]);
  const [newItems, setNewItems] = useState<any>(
    Array(4).fill({ file: null, title: "", preview: "" })
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editPreview, setEditPreview] = useState<any>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dialogRef = useRef<any>(null);

  useEffect(() => {
    fetchZoomData();
  }, []);

  const fetchZoomData = async () => {
    try {
      const response = await fetch("/api/zoomData");
      const data = await response.json();
    

      if (data.success) {
        setZoomDataList(data.zoomDataList);
      }
    } catch (error) {
      console.error("Error fetching zoom data:", error);
    }
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedItems = [...newItems];
        updatedItems[index] = {
          ...updatedItems[index],
          file,
          preview: reader.result as string,
        };
        setNewItems(updatedItems);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItems = async () => {
    if (newItems.some((item) => !item.file || !item.title)) {
      toast.error("Please provide both image and title for all items.");
      return;
    }

    try {
      const formData = new FormData();
      newItems.forEach((item, index) => {
        if (item.file) {
          formData.append(`image${index}`, item.file);
        }
        formData.append(`title${index}`, item.title);
      });

      const response = await fetch("/api/admin/addZoomdata", {
        method: "POST",
        headers: {},
        body: formData,
      });

      const data = await response.json();

      

      if (data.success) {
        toast.success("Zoom data added successfully.");
        setNewItems(Array(4).fill({ file: null, title: "", preview: "" }));
        fetchZoomData();
      } else {
        throw new Error(data.msg);
      }
    } catch (error) {
      console.error("Error adding zoom data:", error);
    }
  };

  const handleUpdateItem = async () => {
    if (!editItem) return;

    if (!editItem.title || (!editItem.img && !(editItem.img instanceof File))) {
      toast.error("Please provide both image and title for the item.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", editItem.title);
      formData.append("id", editItem._id);
      if (editItem.img instanceof File) {
        formData.append("file", editItem.img);
      }

      const response = await fetch(`/api/admin/addZoomdata/${editItem._id}`, {
        method: "PATCH",
        headers: {},
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Zoom data updated successfully.");
        setEditItem(null);
        setEditPreview(null);
        fetchZoomData();
        setIsModalOpen(false); //
        // Close the dialog
        if (dialogRef.current) {
          dialogRef.current.close();
        }
      } else {
        throw new Error(data.msg);
      }
    } catch (error) {
      console.error("Error updating zoom data:", error);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        Resizable Manager
      </h1>

      <Card className="mb-12 shadow-lg">
        <CardHeader className="bg-slate-200">
          <CardTitle className="text-2xl font-semibold text-black">
            Add New Zoom Data (4 Items)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newItems.map((item, index) => (
              <div key={index} className="space-y-4">
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(index, e.target.files?.[0] || null)
                    }
                    className="hidden"
                    ref={(el:any) => (fileInputRefs.current[index] = el)}
                  />
                  {item.preview ? (
                    <img
                      src={item.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <FiUpload className="text-4xl text-gray-400" />
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="absolute bottom-2 right-2"
                  >
                    Upload Image
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="Enter title"
                  value={item.title}
                  onChange={(e) => {
                    const updatedItems = [...newItems];
                    updatedItems[index].title = e.target.value;
                    setNewItems(updatedItems);
                  }}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          <Button onClick={handleAddItems} className="mt-6 w-full text-white">
            <FiPlus className="mr-2" /> Add Items
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {zoomDataList.map((item) => (
          <Card
            key={item._id}
            className="overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl"
          >
            <CardContent className="p-0">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  {item.title}
                </h3>
                <div className="flex space-x-2">
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditItem(item);
                          setEditPreview(item.img);
                        }}
                        className="flex-1"
                      >
                        <FiEdit className="mr-2" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogOverlay className="bg-transparent"></DialogOverlay>
                    <DialogContent ref={dialogRef}>
                      <DialogHeader>
                        <DialogTitle>Edit Zoom Data</DialogTitle>
                      </DialogHeader>
                      {editItem && (
                        <div className="space-y-4">
                          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={editPreview || editItem.img}
                              alt={editItem.title}
                              className="w-full h-full object-cover"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditPreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                  setEditItem({
                                    ...editItem,
                                    img: file,
                                  });
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Button
                              variant="secondary"
                              className="absolute bottom-2 right-2 -z-10"
                            >
                              Change Image
                            </Button>
                          </div>
                          <Input
                            type="text"
                            placeholder="Title"
                            value={editItem.title}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                title: e.target.value,
                              })
                            }
                          />
                          <Button
                            onClick={handleUpdateItem}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          >
                            Update
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ZoomDataManager;
