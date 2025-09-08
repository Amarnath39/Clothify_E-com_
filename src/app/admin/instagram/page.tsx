"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiLink,
  FiImage,
  FiVideo,
  FiUpload,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch Instagram posts",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create Instagram post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
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

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData((prev) => ({
        ...prev,
        file: files[0],
        fileType: files[0].type.startsWith("image/") ? "image" : "video",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
        Instagram Management
      </h1>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="mb-8 mx-auto block"
      >
        Add New Post
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post: any) => (
          <Card
            key={post._id}
            className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <CardContent className="p-4">
              <div className="aspect-square relative mb-4 rounded-lg overflow-hidden">
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
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  {post.fileType === "image" ? (
                    <FiImage className="text-blue-500" />
                  ) : (
                    <FiVideo className="text-green-500" />
                  )}
                  <span className="capitalize">{post.fileType}</span>
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 flex items-center"
                >
                  <FiLink className="mr-1" /> View on Instagram
                </a>
              </div>
              <Button
                
                size="sm"
                onClick={() => handleDelete(post._id)}
                className="w-full"
              >
                <FiTrash2 className="mr-2" /> Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Instagram Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="url" className="text-right">
                Instagram URL
              </Label>
              <Input
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://www.instagram.com/p/..."
                className="mt-1"
              />
              <p className="text-slate-300">
                eg. https://www.instagram.com/123fdadadad
              </p>
            </div>
            <div>
              <Label htmlFor="file" className="text-right">
                Upload File
              </Label>
              <div className="mt-1 flex items-center space-x-2">
                <Input
                  id="file"
                  name="file"
                  type="file"
                  onChange={handleInputChange}
                  accept="image/*,video/*"
                  className="flex-grow"
                />
                <FiUpload className="text-gray-400" />
              </div>
            </div>
            <div>
              <Label htmlFor="fileType" className="text-right">
                File Type
              </Label>
              <Select
                name="fileType"
                value={formData.fileType}
                onValueChange={(value) =>
                  handleInputChange({ target: { name: "fileType", value } })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Add Post
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Instagram;
