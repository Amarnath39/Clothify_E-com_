"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaExclamationTriangle } from "react-icons/fa";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageText {
  _id: string;
  img: string[];
  title: string;
  description: string;
  url: string;
}

const ImageTextManagement: React.FC = () => {
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchImageTexts();
  }, []);

  const fetchImageTexts = async () => {
    try {
      const response = await axios.get("/api/imageText");
      setImageTexts(response.data.itemDataList);
    } catch (error) {
      setError("Failed to fetch ImageTexts");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("url", url);
    files.forEach((file, index) => formData.append(`files[${index}]`, file));

    // Add this line to include the ID when editing
    if (editingId) {
      formData.append("id", editingId);
    }

    try {
      if (editingId) {
        await axios.put(`/api/admin/imageText/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("/api/admin/imageText", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      fetchImageTexts();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      setError("Failed to save ImageText");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(`/api/admin/imageText/${id}`);
        fetchImageTexts();
      } catch (error) {
        setError("Failed to delete ImageText");
      }
    }
  };

  const handleEdit = (imageText: ImageText) => {
    setEditingId(imageText._id);
    setTitle(imageText.title);
    setDescription(imageText.description);
    setUrl(imageText.url);
    setFiles([]);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUrl("");
    setFiles([]);
    setEditingId(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ImageText Management</h1>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="mb-4"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New ImageText
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit ImageText" : "Add New ImageText"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Input
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Input
              type="file"
              multiple
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                setFiles(selectedFiles.slice(0, 2)); // Limit to 2 files
              }}
              required={!editingId}
            />
            {files.length > 0 && (
              <p>
                {files.length} file(s) selected:{" "}
                {files.map((f) => f.name).join(", ")}
              </p>
            )}
            <p className="my-2">Select two image</p>
            <Button type="submit">{editingId ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Images</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {imageTexts?.map((imageText) => (
            <TableRow key={imageText._id}>
              <TableCell>
                {imageText.img.map((imgSrc, index) => (
                  <img
                    key={index}
                    src={imgSrc}
                    alt={`Image ${index + 1}`}
                    className="w-16 h-16 object-cover mr-2 inline-block"
                  />
                ))}
              </TableCell>
              <TableCell>{imageText.title}</TableCell>
              <TableCell>{imageText.description}</TableCell>
              <TableCell>{imageText.url}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(imageText)}
                  className="mr-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                 
                  size="icon"
                  onClick={() => handleDelete(imageText._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ImageTextManagement;
