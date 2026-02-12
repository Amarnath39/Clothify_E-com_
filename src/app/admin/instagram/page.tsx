"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiTrash2,
  FiLink,
  FiImage,
  FiVideo,
  FiUpload,
  FiInstagram,
  FiPlus,
} from "react-icons/fi";
import { Button, ZapanInput, PageHeader, Card as ZapanCard, Badge } from "@/theme/components";
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
import { useToast } from "@/components/ui/use-toast";

const Instagram = () => {
  const [posts, setPosts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>({
    url: "",
    file: null,
    fileType: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/instagram");
      if (response.data.success) {
        setPosts(response.data.instagramDetails);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch Instagram posts",
          variant: "destructive",
        });
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch Instagram posts",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("url", formData.url);
    formDataToSend.append("file", formData.file);
    formDataToSend.append("fileType", formData.fileType);

    try {
      await axios.post("/api/admin/instagram", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast({
        title: "Success",
        description: "Instagram post created successfully",
      });
      setIsDialogOpen(false);
      fetchPosts();
      setFormData({ url: "", file: null, fileType: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create Instagram post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`/api/admin/instagram/${id}`);
      toast({
        title: "Success",
        description: "Instagram post deleted successfully",
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete Instagram post",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData((prev: any) => ({
        ...prev,
        file: files[0],
        fileType: files[0].type.startsWith("image/") ? "image" : "video",
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <PageHeader
        title="Instagram Feed"
        description="Manage your social media presence and showcase content."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#7C1D3E] to-[#E91E7B] text-white shadow-lg shadow-[#7C1D3E]/20 hover:scale-105 transition-all font-black uppercase tracking-widest text-xs">
                <FiPlus className="mr-2" size={16} /> Add Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8 border-gray-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-gray-900 text-center">New Instagram Post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-4">
                  <ZapanInput
                    label="Instagram URL"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/p/..."
                  />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Media File</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="file"
                        name="file"
                        onChange={handleInputChange}
                        accept="image/*,video/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#7C1D3E]/10 file:text-[#7C1D3E] hover:file:bg-[#7C1D3E]/20 cursor-pointer border border-gray-100 rounded-xl p-2 bg-gray-50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <FiUpload size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">File Type</label>
                    <Select
                      value={formData.fileType}
                      onValueChange={(value) =>
                        handleInputChange({ target: { name: "fileType", value } })
                      }
                    >
                      <SelectTrigger className="h-12 bg-gray-50 border-gray-100 rounded-xl px-4 focus:ring-2 focus:ring-[#7C1D3E]/20 transition-all">
                        <SelectValue placeholder="Auto-detected type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest">
                  Create Post
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {posts.length === 0 && !loading ? (
        <ZapanCard className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
            <FiInstagram size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Posts Yet</h3>
          <p className="text-gray-500 mb-8 max-w-xs">Start building your gallery by adding your first Instagram post.</p>
        </ZapanCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post: any) => (
            <div
              key={post._id}
              className="group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[4/5] relative bg-gray-100">
                {post.fileType === "image" ? (
                  <img
                    src={post.fileLink}
                    alt="Instagram post"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={post.fileLink}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div className="w-full flex items-center justify-between">
                    <Badge variant="neutral" className="bg-white/20 text-white border-white/20 backdrop-blur-md">
                      {post.fileType === "image" ? <FiImage className="mr-2" /> : <FiVideo className="mr-2" />}
                      <span className="capitalize">{post.fileType}</span>
                    </Badge>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white text-black rounded-full hover:bg-white/90 transition-colors"
                    >
                      <FiLink size={16} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(post._id)}
                  className="w-full rounded-xl opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"
                >
                  <FiTrash2 className="mr-2" /> Remove Post
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Instagram;
