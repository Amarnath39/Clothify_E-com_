"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { FaTrash } from "react-icons/fa";

interface BeforeAfterItem {
  _id: string;
  title: string;
  beforeImg: string;
  afterImg: string;
}

export default function BeforeAfterForm() {
  const [title, setTitle] = useState("");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforeAfterItems, setBeforeAfterItems] = useState<BeforeAfterItem[]>(
    []
  );

  useEffect(() => {
    fetchBeforeAfterItems();
  }, []);

  const fetchBeforeAfterItems = async () => {
    try {
      const response = await fetch("/api/beforeafter");
      const data = await response.json();
      if (data.success) {
        console.log(data, "data");
        setBeforeAfterItems(data?.beforeAfter);
      } else {
        toast.error(data.msg || "Failed to fetch before/after items");
      }
    } catch (error) {
      console.error("Error fetching before/after items:", error);
      toast.error("An error occurred while fetching items");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !beforeFile || !afterFile) {
      toast.error("Please fill in all fields");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("beforefile", beforeFile);
    formData.append("afterfile", afterFile);

    try {
      const response = await fetch("/api/beforeafter", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Before/After images uploaded successfully");
        setTitle("");
        setBeforeFile(null);
        setAfterFile(null);
        fetchBeforeAfterItems(); // Refresh the list
      } else {
        toast.error(data.msg || "An error occurred");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while uploading");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/beforeafter/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Item deleted successfully");
        fetchBeforeAfterItems(); // Refresh the list
      } else {
        toast.error(data.msg || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("An error occurred while deleting the item");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Before/After Image Upload</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-1 font-medium">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label htmlFor="beforeFile" className="block mb-1 font-medium">
            After Image
          </label>
          <input
            type="file"
            id="beforeFile"
            onChange={(e: any) => setBeforeFile(e?.target.files[0])}
            className="w-full"
            accept="image/*"
            required
          />
        </div>
        <div>
          <label htmlFor="afterFile" className="block mb-1 font-medium">
            Before Image
          </label>
          <input
            type="file"
            id="afterFile"
            onChange={(e: any) => setAfterFile(e?.target.files[0])}
            className="w-full"
            accept="image/*"
            required
          />
        </div>
        <Button
        
          type="submit"
          className=" text-white px-4 py-2 rounded-md  transition-colors"
        >
          Upload
        </Button>
      </form>
      <h2 className="text-xl font-bold mb-4">Before/After Items</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Title</th>
            <th className="border border-gray-300 p-2">After Image</th>
            <th className="border border-gray-300 p-2">Before Image</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {beforeAfterItems?.map((item) => (
            <tr key={item._id}>
              <td className="border border-gray-300 p-2">{item.title}</td>
              <td className="border border-gray-300 p-2">
                <img
                  src={item.beforeImg}
                  alt="Before"
                  className="w-20 h-20 object-cover"
                />
              </td>
              <td className="border border-gray-300 p-2">
                <img
                  src={item.afterImg}
                  alt="After"
                  className="w-20 h-20 object-cover"
                />
              </td>
              <td className="border border-gray-300 p-2">
                <button
                  onClick={() => handleDelete(item._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
