"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Instagram } from "lucide-react";
import toast from "react-hot-toast";
import { getInstaPosts } from "@/lib/features/insta";

interface Post {
  _id: string;
  url: string;
  fileType: string;
  fileLink: string;
}

const PLACEHOLDER_COUNT = 8;

export default function InstagramFeed() {
  const dispatch = useDispatch<any>();

  const [instaData, setInstaData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstagramPosts = async () => {
    try {
      const { payload }: any = await dispatch(getInstaPosts());

      if (payload?.success && Array.isArray(payload.instagramDetails)) {
        setInstaData(payload.instagramDetails);
      } else {
        toast.error(payload?.msg || "Failed to load Instagram posts");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstagramPosts();
  }, []);

  return (
    <section className="py-20 bg-sand">
      <div className="container-custom px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-4">
            Follow Us on Instagram
          </h2>
          <a
            href="clothify"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-burgundy hover:text-burgundy-dark transition-colors font-medium"
          >
            <Instagram className="w-5 h-5" />
            <span>clothify</span>
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => {
            const post = instaData[index];

            return (
              <div
                key={index}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-200"
              >
                {/* Real content */}
                {!loading && post ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {post.fileType === "video" ? (
                      <video
                        src={post.fileLink}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={post.fileLink}
                        alt="Instagram post"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                  </a>
                ) : (
                  /* Placeholder */
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 animate-pulse">
                    <Instagram className="w-10 h-10 text-gray-500" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-burgundy/0 group-hover:bg-burgundy/20 transition-colors flex items-center justify-center pointer-events-none">
                  <Instagram className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
