"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Image as ImageIcon, Link as LinkIcon, Type } from "lucide-react";
import { Button, ZapanInput, ZapanTextarea, PageHeader, Card as ZapanCard, Badge } from "@/theme/components";
// removed "@/components/ui/textarea" import
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
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redux: Get Admin ID
  const user = useSelector((state: any) => state.auth.user);
  const adminId = user?._id;

  useEffect(() => {
    fetchImageTexts();
  }, []);

  const fetchImageTexts = async () => {
    try {
      const response = await axios.get("/api/imageText");
      setImageTexts(response.data.itemDataList);
    } catch (error) {
      toast.error("Failed to fetch ImageTexts");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminId) {
      toast.error("Admin ID not found. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("url", url);
    files.forEach((file, index) => formData.append(`files[${index}]`, file));

    if (editingId) {
      formData.append("id", editingId);
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-admin-id": adminId
        },
      };

      if (editingId) {
        await axios.put(`/api/admin/imageText/${editingId}`, formData, config);
        toast.success("ImageText updated successfully");
      } else {
        await axios.post("/api/admin/imageText", formData, config);
        toast.success("ImageText created successfully");
      }
      fetchImageTexts();
      resetForm();
      setIsDialogOpen(false);
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.msg || "Failed to save ImageText");
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminId) {
      toast.error("Unauthorized: Admin ID missing");
      return;
    }

    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`/api/admin/imageText/${id}`, {
        headers: { "x-admin-id": adminId }
      });
      toast.success("ImageText deleted successfully");
      fetchImageTexts();
    } catch (error) {
      toast.error("Failed to delete ImageText");
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
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <PageHeader
        title="Image & Text Content"
        description="Manage enriched content blocks with images and text descriptions."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B] text-white shadow-lg shadow-[#7C1D3E]/20 hover:scale-105 transition-all font-black uppercase tracking-widest text-xs"
              >
                <Plus className="mr-2" size={16} /> Add Content Block
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8 border-gray-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 text-center">
                  {editingId ? "Edit Content Block" : "New Content Block"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <ZapanInput
                  label="Title"
                  icon={Type}
                  placeholder="Enter title (e.g., Summer Collection)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <ZapanTextarea
                    label="Description"
                    placeholder="Enter detailed description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <ZapanInput
                  label="Target URL"
                  icon={LinkIcon}
                  placeholder="e.g., /collections/summer"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Upload Images (Max 2)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const selectedFiles = Array.from(e.target.files || []);
                        setFiles(selectedFiles.slice(0, 2));
                      }}
                      required={!editingId}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-[#7C1D3E] file:text-white hover:file:bg-[#9d254f] cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    />
                  </div>
                  {files.length > 0 && (
                    <p className="text-xs text-green-600 font-medium pl-1">
                      {files.length} file(s) selected: {files.map((f) => f.name).join(", ")}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 pl-1">Select high-quality images for best display.</p>
                </div>

                <Button
                  className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Saving..." : (editingId ? "Update Content" : "Create Content")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <ZapanCard className="overflow-hidden border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Content Blocks</h3>
          <Badge variant="neutral" className="bg-white">{imageTexts.length} Items</Badge>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Preview</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Content Details</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Link Target</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imageTexts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No content blocks found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                imageTexts.map((imageText) => (
                  <TableRow key={imageText._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                    <TableCell className="py-4 px-6">
                      <div className="flex -space-x-4 hover:space-x-1 transition-all">
                        {imageText.img.map((imgSrc, index) => (
                          <img
                            key={index}
                            src={imgSrc}
                            alt={`Content ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md"
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div>
                        <p className="font-bold text-gray-900">{imageText.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs">{imageText.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge variant="neutral" className="font-mono text-[10px]">
                        {imageText.url}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(imageText)}
                          className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-[#7C1D3E] hover:bg-[#7C1D3E]/10"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(imageText._id)}
                          className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ZapanCard>
    </div>
  );
};

export default ImageTextManagement;
