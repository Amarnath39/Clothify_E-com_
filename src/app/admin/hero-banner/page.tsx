"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink, FiImage, FiVideo } from "react-icons/fi";
import toast from "react-hot-toast";
import { LuLoader } from "react-icons/lu";



interface HeroBanner {
  id: string;
  _id: string;
  file: File | null;
  mobileFile: File | null;
  title: string;
  description: string;
  url: string;
  position: number;
  img: string;
  mobileImg?: string;
  type: "image" | "video";
}

const AdminHeroBanner: React.FC = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<HeroBanner | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/banner");
      setBanners(response.data.banners || []);
    } catch (error) {
      toast.error("Failed to fetch hero banners");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const isFileSelected = (input: HTMLInputElement) =>
      input.files && input.files.length > 0;

    try {
      if (isEditing && selectedBanner) {
        const fileInput = event.currentTarget.querySelector('input[name="file"]') as HTMLInputElement;
        const mobileFileInput = event.currentTarget.querySelector('input[name="mobileFile"]') as HTMLInputElement;

        if (!isFileSelected(fileInput)) formData.delete("file");
        if (!isFileSelected(mobileFileInput)) formData.delete("mobileFile");

        await axios.patch(`/api/admin/banner/${selectedBanner._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Hero banner updated successfully");
      } else {
        await axios.post("/api/admin/banner", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Hero banner created successfully");
      }
      fetchBanners();
      handleModalClose();
    } catch (error) {
      toast.error("Failed to save hero banner");
    }
  };

  const handleEdit = (banner: HeroBanner) => {
    setSelectedBanner(banner);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        await axios.delete(`/api/admin/banner/${id}`);
        toast.success("Hero banner deleted successfully");
        fetchBanners();
      } catch (error) {
        toast.error("Failed to delete hero banner");
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBanner(null);
    setIsEditing(false);
  };

  if (loading && banners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Hero Banners"
        description="Manage the main sliders and promotional banners appearing on your homepage."
        action={
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" onClick={() => { setIsEditing(false); setSelectedBanner(null); }}>
                <FiPlus size={16} className="mr-2" /> Add New Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
                  {isEditing ? "Edit Hero Banner" : "Create Hero Banner"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="pt-4">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Media Type</label>
                    <Select name="type" defaultValue={selectedBanner?.type || "image"}>
                      <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-gray-50/50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desktop File</label>
                      <input type="file" name="file" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#7C1D3E]/10 file:text-[#7C1D3E] hover:file:bg-[#7C1D3E]/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile File (Opt)</label>
                      <input type="file" name="mobileFile" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#7C1D3E]/10 file:text-[#7C1D3E] hover:file:bg-[#7C1D3E]/20" />
                    </div>
                  </div>

                  <ZapanInput label="Banner Title" name="title" placeholder="Special Summer Collection" defaultValue={selectedBanner?.title || ""} required />
                  <ZapanTextarea label="Description" name="description" placeholder="Short description for the banner..." defaultValue={selectedBanner?.description || ""} />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <ZapanInput label="Redirect URL" name="url" placeholder="https://..." defaultValue={selectedBanner?.url || ""} />
                    </div>
                    <ZapanInput label="Position" type="number" name="position" defaultValue={selectedBanner?.position || 0} />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" type="button" onClick={handleModalClose}>Cancel</Button>
                    <Button variant="primary" className="flex-2 rounded-xl" type="submit">
                      {isEditing ? "Update Banner" : "Create Banner"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {banners.map((banner) => (
          <Card key={banner._id} className="overflow-hidden group flex flex-col">
            <div className="relative aspect-[21/9] bg-gray-100 overflow-hidden">
              {banner.type === "image" ? (
                <img src={banner.img} alt={banner.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <video src={banner.img} className="w-full h-full object-cover" />
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge variant="brand" className="shadow-sm backdrop-blur-md bg-white/80 border-none font-bold">Pos: {banner.position}</Badge>
                <Badge variant="neutral" className="shadow-sm backdrop-blur-md bg-white/80 border-none">
                  {banner.type === 'video' ? <FiVideo className="mr-1" /> : <FiImage className="mr-1" />}
                  {banner.type.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4 flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#7C1D3E] transition-colors line-clamp-1">{banner.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1 min-h-[40px]">{banner.description}</p>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <FiExternalLink className="flex-shrink-0" />
                    <span className="truncate">{banner.url || "No redirect link"}</span>
                  </div>
                  {banner.mobileImg && (
                    <Badge variant="neutral" className="w-fit text-[10px] h-5 bg-gray-50 border-gray-100 text-gray-500">
                      Mobile Version Available
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => handleEdit(banner)} className="flex-1 rounded-lg border-gray-100 text-gray-500 hover:text-[#7C1D3E] hover:border-[#7C1D3E]/20">
                  <FiEdit2 size={14} className="mr-2" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(banner._id)} className="rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50">
                  <FiTrash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {banners.length === 0 && !loading && (
        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 text-gray-300">
            <FiImage size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Start with your first banner</h3>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto">Create beautiful promotional banners to engage your website visitors.</p>
          <Button variant="primary" className="mt-8 px-8" onClick={() => setIsModalOpen(true)}>
            <FiPlus className="mr-2" size={18} /> Add Banner
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminHeroBanner;
