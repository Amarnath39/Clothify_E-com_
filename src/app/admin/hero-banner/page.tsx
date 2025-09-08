"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
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

interface HeroBanner {
  id: string;
  _id: string;
  file: File | null;
  title: string;
  description: string;
  url: string;
  position: number;
  img: string;
  type: "image" | "video";
}

const AdminHeroBanner: React.FC = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<HeroBanner | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await axios.get("/api/banner");
      setBanners(response.data.banners);
    } catch (error) {
      toast("Failed to fetch hero banners");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Helper function to check if a file is selected
    const isFileSelected = (input: HTMLInputElement) =>
      input.files && input.files.length > 0;

    try {
      if (isEditing && selectedBanner) {
        // If editing, only include the file if a new one is selected
        const fileInput = event.currentTarget.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        if (!isFileSelected(fileInput)) {
          formData.delete("file");
        }

        await axios.patch(`/api/admin/banner/${selectedBanner._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast("Hero banner updated successfully");
      } else {
        await axios.post("/api/admin/banner", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast("Hero banner created successfully");
      }
      fetchBanners();
      setIsEditing(false);
      setSelectedBanner(null);
      setIsModalOpen(false);
    } catch (error) {
      toast("Failed to save hero banner");
    }
  };

  const handleEdit = (banner: HeroBanner) => {
    setSelectedBanner(banner);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(`/api/admin/banner/${id}`);
        toast("Hero banner deleted successfully");
        fetchBanners();
      } catch (error) {
        toast("Failed to delete hero banner");
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBanner(null);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Logo added above Admin Hero Banner heading */}
      <div className="flex flex-col items-start space-y-2 mb-2">
        <img
          src="/assets/static/logo/2_4__1_-removebg-preview (1).png"
          alt="Logo"
          className="w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 object-contain"
          style={{ marginTop: 0, marginBottom: 0 }}
        />
      </div>
      <h1 className="text-2xl font-bold mb-4">Admin Hero Banner</h1>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsEditing(false)}>
            <FiPlus className="mr-2" /> Add New Banner
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Hero Banner" : "Create Hero Banner"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Select
                name="type"
                defaultValue={selectedBanner?.type || "image"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="file"
                name="file"
                accept={
                  selectedBanner?.type === "video" ? "video/*" : "image/*"
                }
              />
              {isEditing && selectedBanner && (
                <p className="text-sm text-gray-500">
                  Current file: {selectedBanner.img.split("/").pop()}
                </p>
              )}
              <Input
                type="text"
                name="title"
                placeholder="Title"
                defaultValue={selectedBanner?.title || ""}
              />
              <Textarea
                name="description"
                placeholder="Description"
                defaultValue={selectedBanner?.description || ""}
              />
              <Input
                type="url"
                name="url"
                placeholder="URL"
                defaultValue={selectedBanner?.url || ""}
              />
              <Input
                type="number"
                name="position"
                placeholder="Position"
                defaultValue={selectedBanner?.position || 0}
              />
              <Button type="submit">
                {isEditing ? "Update" : "Create"} Banner
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardHeader>
              <CardTitle>{banner.title}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="mb-4">
                {banner.type === "image" ? (
                  <img
                    src={banner.img}
                    alt={banner.title}
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <video
                    src={banner.img}
                    className="w-full h-48 object-cover rounded-md"
                    controls
                  />
                )}
              </div>
              <p className="mb-2">{banner.description}</p>
              <p className="mb-2">URL: {banner.url}</p>
              <p className="mb-2">Type: {banner.type}</p>
              <p>Position: {banner.position}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => handleEdit(banner)}>
                <FiEdit2 className="mr-2" /> Edit
              </Button>
              <Button
                onClick={() => handleDelete(banner._id)}
              >
                <FiTrash2 className="mr-2" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminHeroBanner;
