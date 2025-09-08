'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Video {
  videoId: string;
  filename: string;
}

export default function VideoUploadPage() {
  const [video, setVideo] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/api/videos/list');
      setVideos(res.data.videos);
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
  };

  const handleUpload = async () => {
    if (!video) return;

    const formData = new FormData();
    formData.append('video', video);

    try {
      const res = await axios.post('/api/videos/upload', formData);
      setMessage(`Uploaded: ${res.data.videoId}`);
      setVideo(null);
      fetchVideos(); // Refresh the list
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Upload failed');
    }
  };

  const handleDelete = async (videoId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this video?');

    if (!confirmed) return;

    try {
      await axios.delete(`/api/videos/delete?videoId=${videoId}`);
      setMessage('Video deleted successfully');
      fetchVideos(); // Refresh the list
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Delete failed');
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Logo added above Admin Hero Banner heading */}
      <div className="flex flex-col items-start space-y-2 mb-2">
        <img
          src="/assets/static/logo/2_4__1_-removebg-preview (1).png"
          alt="Logo"
          className="w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 object-contain"
          style={{ marginTop: 0, marginBottom: 0 }}
        />
      </div>
      <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Upload Video
      </button>

      {message && <p className="mt-4 text-green-600">{message}</p>}

      <h3 className="text-lg font-medium mt-8 mb-2">Uploaded Videos</h3>
      <ul className="space-y-4">
        {videos.map((video) => (
          <li key={video.videoId} className="border p-3 rounded flex justify-between items-center">
            <video controls width={250} className="rounded">
              <source src={`/uploads/${video.filename}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button
              onClick={() => handleDelete(video.videoId)}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
