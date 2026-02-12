"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

interface Video {
  videoId: string;
  filename: string;
  url: string;
}

const PLACEHOLDER_COUNT = 6;

export default function WatchAndShop() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const res = await axios.get("/api/videos/list");
      setVideos(res.data.videos || []);
    } catch (error) {
      console.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-9xl mx-auto px-8 sm:px-8 lg:px-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">
            Watch & Shop
          </h2>
          <p className="text-gray-500 font-body">
            Discover styling tips and product stories
          </p>
        </div>

        {/* Carousel + Arrows */}
        <div className="flex items-center gap-6">
          {/* Left Arrow (desktop only) */}
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex shrink-0 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white transition"
          >
            <ChevronLeft className="w-6 h-6 text-charcoal" />
          </button>

          {/* 🔑 CLIPPING WRAPPER */}
          <div className="w-full overflow-hidden">
            {/* Scrollable Carousel */}
            <div
              ref={scrollRef}
              className="flex gap-0 md:gap-6 overflow-x-auto md:overflow-x-scroll scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => {
                const video = videos[index];

                return (
                  <div
                    key={index}
                    className="flex-shrink-0 w-full sm:w-64 group cursor-pointer"
                  >
                    <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-200">
                      {!loading && video ? (
                        <video
  autoPlay
  muted
  loop
  playsInline
  className="w-full h-full object-cover"
>
  <source src={video.url} type="video/mp4" />
</video>

                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 animate-pulse">
                          <Play className="w-12 h-12 text-gray-500 ml-1" />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play
                            className="w-8 h-8 text-burgundy ml-1"
                            fill="currentColor"
                          />
                        </div>
                      </div>

                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="font-serif text-sm">
                          {video?.filename || "Coming Soon"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Arrow (desktop only) */}
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex shrink-0 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white transition"
          >
            <ChevronRight className="w-6 h-6 text-charcoal" />
          </button>
        </div>
      </div>
    </section>
  );
}
