"use client";

import React, { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import {
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaChevronLeft,
  FaChevronRight,
  FaInstagram,
} from "react-icons/fa";
import Link from "next/link";
import "./swiper.css";

const InstaVideo = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [mutedStates, setMutedStates] = useState<any[]>([]);
  const [playingStates, setPlayingStates] = useState<any[]>([]);

  const videoRefs = useRef<any>([]);

  const videos: any[] = [
    {
      id: 1,
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      video:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      caption:
        "Exciting moments captured! this is not a funny memem bro what can i do to handle this",
      comments: 5600,
      likes: 2000,
    },
    {
      id: 2,
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      video:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      caption: "Exciting moments captured!",
      comments: 56,
      likes: 204500,
    },
    {
      id: 3,
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      video:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      caption: "Exciting moments captured!",
      comments: 56,
      likes: 6400,
    },
    {
      id: 4,
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      video:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      caption: "Exciting moments captured!",
      comments: 56,
      likes: 7567,
    },
    {
      id: 5,
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      video:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      caption: "Exciting moments captured!",
      comments: 56,
    },
    {
      id: 6,
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      video:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      caption: "Exciting moments captured!",
      comments: 56,
    },
    {
      id: 7,
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      video:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      caption: "Exciting moments captured!",
      comments: 56,
    },
    {
      id: 8,
      url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      video:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      caption: "Exciting moments captured!",
      comments: 56,
    },
  ];
  useEffect(() => {
    setMutedStates(new Array(videos.length).fill(true));
    setPlayingStates(new Array(videos.length).fill(true));
  }, []);

  const formatLikes = (likes) => {
    if (likes >= 1000000) {
      return (likes / 1000000).toFixed(1) + "M";
    } else if (likes >= 100000) {
      return (likes / 100000).toFixed(1) + "L";
    } else if (likes >= 1000) {
      return (likes / 1000).toFixed(1) + "k";
    } else {
      return likes.toString();
    }
  };

  const handleSlideChange = (swiper) => {
    setActiveIndex(swiper.activeIndex);
  };

  const togglePlay = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const newPlayingStates = [...playingStates];
    newPlayingStates[index] = !newPlayingStates[index];
    setPlayingStates(newPlayingStates);

    if (newPlayingStates[index]) {
      videoRefs.current[index].play();
    } else {
      videoRefs.current[index].pause();
    }
  };

  const toggleMute = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const newMutedStates = new Array(videos.length).fill(true);
    newMutedStates[index] = !mutedStates[index];
    setMutedStates(newMutedStates);

    videoRefs.current.forEach((video, idx) => {
      if (video) {
        video.muted = newMutedStates[idx];
      }
    });
  };

  return (
    <div className="insta-video-container w-full max-w-7xl mx-auto p-4">
      <Swiper
        slidesPerView={1}
        spaceBetween={20}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 30,
          },
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        modules={[Pagination, Navigation]}
        onSlideChange={handleSlideChange}
        className="rounded-lg overflow-hidden"
      >
        {videos.map((video, index) => (
          <SwiperSlide
            key={index}
            className="bg-black rounded-lg overflow-hidden"
          >
            <Link target="_blank" href={video.url} passHref>
              <div className="relative w-full h-[600px] cursor-pointer">
                <video
                  ref={(el: any) => (videoRefs.current[index] = el)}
                  src={video.video}
                  className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted={mutedStates[index]}
                  playsInline
                  autoPlay
                />
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <FaInstagram className="text-pink-600 text-6xl" />
                </div>
                <div className="absolute bottom-[100px] left-0 right-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent">
                  <p className="text-white text-sm mb-2 line-clamp-2">
                    {video.caption}
                  </p>
                  <div className="flex justify-between items-center">
                    {video.likes > 0 && (
                      <div className="flex space-x-4">
                        <span className="text-white text-sm">
                          ❤️ {formatLikes(video.likes)}
                        </span>
                        <span className="text-white text-sm">
                          💬 {formatLikes(video.comments)}
                        </span>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => togglePlay(e, index)}
                        className="text-white p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
                      >
                        {!playingStates[index] ? (
                          <FaPlay size={16} />
                        ) : (
                          <FaPause size={16} />
                        )}
                      </button>
                      <button
                        onClick={(e) => toggleMute(e, index)}
                        className="text-white p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
                      >
                        {mutedStates[index] ? (
                          <FaVolumeMute size={16} />
                        ) : (
                          <FaVolumeUp size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
        <div className="swiper-button-prev custom-swiper-button">{"<"}</div>
        <div className="swiper-button-next custom-swiper-button">{">"}</div>
      </Swiper>
    </div>
  );
};

export default InstaVideo;
