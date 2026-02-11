"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, ZapanInput, PageHeader, Card as ZapanCard, Badge } from "@/theme/components";
import { FiUpload, FiTrash2, FiVideo, FiPlay } from "react-icons/fi";
import toast from "react-hot-toast";

interface Video {
  videoId: number;
  filename: string;
  url: string;
}

export default function VideoUploadPage() {
  const [video, setVideo] = useState<File | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/videos/list');
      setVideos(res.data.videos);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching videos:', err);
      toast.error('Failed to fetch videos');
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!video) {
      toast.error("Please select a video file");
      return;
    }

    const formData = new FormData();
    formData.append('video', video);

    try {
      setUploading(true);
      const res = await axios.post('/api/videos/upload', formData);
      toast.success(`Video uploaded successfully (ID: ${res.data.videoId})`);
      setVideo(null);
      // Reset file input if possible, or just rely on state
      const fileInput = document.getElementById('video-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchVideos();
      setUploading(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
      setUploading(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await axios.delete(`/api/videos/delete?videoId=${videoId}`);
      toast.success('Video deleted successfully');
      fetchVideos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <PageHeader
        title="Video Library"
        description="Upload and manage promotional videos for your store."
        action={
          <Badge variant="neutral">
            <FiVideo className="mr-2" /> Media Assets
          </Badge>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <ZapanCard className="p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#7C1D3E]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#7C1D3E]">
                <FiUpload size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Upload New Video</h3>
              <p className="text-sm text-gray-500 mt-1">Select a video file to add to your library.</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-[#7C1D3E] file:text-white hover:file:bg-[#9d254f] cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                />
              </div>

              <Button
                onClick={handleUpload}
                className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest"
                disabled={uploading || !video}
              >
                {uploading ? "Uploading..." : "Upload Video"}
              </Button>
            </div>
          </ZapanCard>
        </div>

        {/* Video List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            Library Content
            <span className="ml-3 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-mono">{videos.length} Videos</span>
          </h3>

          {videos.length === 0 && !loading ? (
            <ZapanCard className="p-12 text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <FiPlay size={32} />
              </div>
              <p className="text-gray-500">No videos in library.</p>
            </ZapanCard>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {videos.map((video) => (
                <ZapanCard key={video.videoId} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="aspect-video bg-black relative">
                    <video controls className="w-full h-full object-cover">
                      <source src={video.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <div className="p-4 bg-white flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-500 truncate" title={video.filename}>
                        {video.filename}
                      </p>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">ID: {video.videoId}</p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(video.videoId)}
                      className="shrink-0 rounded-lg p-2 h-auto"
                      aria-label="Delete video"
                    >
                      <FiTrash2 size={16} />
                    </Button>
                  </div>
                </ZapanCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
