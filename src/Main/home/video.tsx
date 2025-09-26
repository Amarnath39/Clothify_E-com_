"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Quicksand } from "next/font/google";
import { Eye } from "lucide-react";
import { Bodoni_Moda } from "next/font/google";

const bodoni_Moda = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-bodoni_moda",
});

interface Video {
  videoId: string;
  filename: string;
  url: string;
}
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });
export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [message, setMessage] = useState("");
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchVideos = async () => {
    try {
      const res = await axios.get("/api/videos/list");
      setVideos(res.data.videos);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setMessage("Failed to load videos");
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [videos]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 250;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="p-0 w-full">
      {/* Heading */}
      <div className="flex items-center justify-center mb-8 mt-12">
        <Eye className="w-8 h-8 text-gradient mr-3" />
        <h1
          className={`${bodoni_Moda.className} text-3xl font-semibold text-foreground`}
        >
          WATCH & SHOP
        </h1>
      </div>

      {/* Error message if any */}
      {message && <p className="text-red-600 px-4 py-2">{message}</p>}

      {/* Videos */}
      {videos.length === 0 ? (
        <p className="px-4 py-2">No videos uploaded yet.</p>
      ) : (
        <div className="relative w-full mt-8">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-70 rounded-full shadow p-2"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Scrollable video list */}
          <div className="w-full flex justify-center">
            <div
              ref={scrollContainerRef}
              className="inline-flex overflow-x-auto no-scrollbar space-x-6 px-10 min-w-fit"
            >
              {videos.map((video, index) => (
                <video
                  key={video.videoId}
                  ref={(el) => {
                    if (el) videoRefs.current[index] = el;
                  }}
                  muted
                  playsInline
                  autoPlay
                  loop={true}
                  className="w-[230px] h-[400px] object-cover rounded-xl flex-shrink-0"
                >
                  <source src={video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-70 rounded-full shadow p-2"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}