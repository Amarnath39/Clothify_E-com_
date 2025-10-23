// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Navigation, Pagination, Autoplay } from "swiper/modules";
// import { FaInstagram, FaPlay, FaPause } from "react-icons/fa";
// import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";
// import { useDispatch } from "react-redux";
// import { getInstaPosts } from "@/lib/features/insta";
// import toast from "react-hot-toast";
// import { Quicksand } from "next/font/google";

// interface Post {
//   _id: string;
//   url: string;
//   fileType: string;
//   fileLink: string;
// }

// const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });
// const InstagramPage: React.FC = () => {
//   const [hoveredPost, setHoveredPost] = useState<string | null>(null);
//   const [playingVideo, setPlayingVideo] = useState<string | null>(null);
//   const [showPlayButton, setShowPlayButton] = useState<{
//     [key: string]: boolean;
//   }>({});
//   const swiperRef = useRef<any>(null);
//   const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

//   const dispatch = useDispatch<any>();
//   const [instaData, setInstaData] = useState<Post[]>([]);

//   const callGetInstaContentApi = async () => {
//     try {
//       const { payload }: any = await dispatch(getInstaPosts());

//       if (payload?.success === true) {
//         setInstaData(payload.instagramDetails);
//         const initialPlayButtons = payload.instagramDetails.reduce(
//           (acc: any, post: Post) => {
//             acc[post._id] = post.fileType === "video";
//             return acc;
//           },
//           {}
//         );
//         setShowPlayButton(initialPlayButtons);
//       } else {
//         toast.error(payload.msg);
//       }
//     } catch (error) {
//       toast.error("Something went wrong");
//     }
//   };

//   useEffect(() => {
//     callGetInstaContentApi();
//   }, []);

//   const handleMouseEnter = (postId: string) => {
//     setHoveredPost(postId);
//   };

//   const handleMouseLeave = (postId: string) => {
//     setHoveredPost(null);
//     if (videoRefs.current[postId] && playingVideo !== postId) {
//       videoRefs.current[postId].pause();
//       videoRefs.current[postId].currentTime = 0;
//     }
//   };

//   const handlePostClick = (post: Post, event: React.MouseEvent) => {
//     event.preventDefault();
//     if (post.fileType === "video") {
//       const video = videoRefs.current[post._id];
//       if (video) {
//         if (video.paused) {
//           video
//             .play()
//             .then(() => {
//               setPlayingVideo(post._id);
//               setShowPlayButton({ ...showPlayButton, [post._id]: false });
//             })
//             .catch((error) => {
//               setShowPlayButton({ ...showPlayButton, [post._id]: true });
//             });
//         } else {
//           video.pause();
//           setPlayingVideo(null);
//           setShowPlayButton({ ...showPlayButton, [post._id]: true });
//         }
//       }
//     } else {
//       window.open(post.url, "_blank");
//     }
//   };

//   return (
//     <div className="relative z-20 lg:py-12 py-4 sm:py-6 md:py-10">
//       <div className="text-center mb-4 sm:mb-8">
//         <h1
//           className={`${quicksand.className} text-2xl sm:text-3xl md:text-4xl  text-black inline-block relative tracking-wide`}
//         >
//           Follow Us On Instagram
//           <div className="absolute -bottom-2 left-1/2 w-24 h-0.5 bg-red transform -translate-x-1/2"></div>
//         </h1>
//       </div>

//       <style>
//         {`
//           .swiper-slide {
//             height: 500px !important;
//           }

//           .swiper-pagination-bullet {
//             width: 12px;
//             height: 12px;
//             background-color: gray;
//             opacity: 1;
//             transition: all 0.3s ease;
//           }

//           .swiper-pagination-bullet-active {
//             background-color: red;
//             width: 30px;
//             border-radius: 10px;
//           }
//         `}
//       </style>

//       <div className="max-w-8xl mx-auto px-6">
//         <Swiper
//           modules={[Navigation, Pagination, Autoplay]}
//           spaceBetween={20}
//           slidesPerView={1}
//           pagination={{
//             clickable: true,
//             dynamicBullets: true,
//           }}
//           autoplay={{ delay: 4000, disableOnInteraction: true }}
//           breakpoints={{
//             640: { slidesPerView: 3 },
//             1024: { slidesPerView: 4 },
//             1536: { slidesPerView: 6 },
//           }}
//           className="instagram-swiper mb-8"
//           onSwiper={(swiper) => {
//             swiperRef.current = swiper;
//           }}
//         >
//           {instaData?.map((post, index) => (
//             <SwiperSlide key={post._id}>
//               <div
//                 data-aos="fade-right"
//                 data-aos-delay={index * 150}
//                 data-aos-duration="1000"
//                 data-aos-easing="ease-out"
//               className="block relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105"
//                 onMouseEnter={() => handleMouseEnter(post._id)}
//                 onMouseLeave={() => handleMouseLeave(post._id)}
//                 onClick={(e) => handlePostClick(post, e)}
//               >
//                 {post.fileType === "video" ? (
//                   <video
//                     ref={(el: any) => el && (videoRefs.current[post._id] = el)}
//                     autoPlay
//                     className="w-full h-[500px] object-cover"
//                     loop
//                     muted
//                     playsInline
//                     preload="none"
//                   >
//                     <source src={post.fileLink} type="video/mp4" />
//                     <source
//                       src={post.fileLink.replace(".mp4", ".webm")}
//                       type="video/webm"
//                     />
//                     Your browser does not support the video tag.
//                   </video>
//                 ) : (
//                   <img
//                     loading="lazy"
//                     src={post.fileLink}
//                     alt="Instagram post"
//                     className="w-full h-[500px] object-cover"
//                   />
//                 )}
//                 <div
//                   className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 ${
//                     hoveredPost === post._id ? "opacity-100" : "opacity-0"
//                   }`}
//                 >
//                   {post.fileType === "video" ? (
//                     playingVideo === post._id ? (
//                       <FaPause className="text-white text-6xl" />
//                     ) : (
//                       <FaPlay className="text-white text-6xl" />
//                     )
//                   ) : (
//                     <FaInstagram className="text-white text-6xl" />
//                   )}
//                 </div>
//                 {showPlayButton[post._id] && post.fileType === "video" && (
//                   <button
//                     className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handlePostClick(post, e);
//                     }}
//                   >
//                     <FaPlay className="text-white text-6xl" />
//                   </button>
//                 )}
//               </div>
//             </SwiperSlide>
//           ))}
//         </Swiper>

//         {/* Custom navigation buttons */}
// {/*         <div className="flex justify-center items-center lg:mt-8 mt-2 sm:mt-3 space-x-8">
//           <button
//             onClick={() => swiperRef.current?.slidePrev()}
//             className="bg-red text-white rounded-full p-4 hover:bg-pink-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
//           >
//             <IoIosArrowBack size={28} />
//           </button>
//           <button
//             onClick={() => swiperRef.current?.slideNext()}
//             className="bg-red text-white rounded-full p-4 hover:bg-pink-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
//           >
//             <IoIosArrowForward size={28} />
//           </button>
//         </div> */}
//       </div>

//       <div className="text-center lg:mt-10 md:mt-7 mt-3 sm:mt-5">
//         <a
//           href="https://www.instagram.com/Udayaada/"
//           target="_blank"
//           rel="noopener noreferrer"
//           className="inline-block bg-gradient-to-r bg-secondaryRed text-white font-bold text-lg py-4 px-10 rounded-full hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
//         >
//           Follow Us
//         </a>
//       </div>
//     </div>
//   );



"use client";

import React, { useState, useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { FaInstagram, FaPlay, FaPause } from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useDispatch } from "react-redux";
import { getInstaPosts } from "@/lib/features/insta";
import toast from "react-hot-toast";
import { Quicksand } from "next/font/google";

interface Post {
  _id: string;
  url: string;
  fileType: string;
  fileLink: string;
}

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });
const InstagramPage: React.FC = () => {
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showPlayButton, setShowPlayButton] = useState<{
    [key: string]: boolean;
  }>({});
  const swiperRef = useRef<any>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const dispatch = useDispatch<any>();
  const [instaData, setInstaData] = useState<Post[]>([]);

  const callGetInstaContentApi = async () => {
    try {
      const { payload }: any = await dispatch(getInstaPosts());

      if (payload?.success === true) {
        setInstaData(payload.instagramDetails);
        const initialPlayButtons = payload.instagramDetails.reduce(
          (acc: any, post: Post) => {
            acc[post._id] = post.fileType === "video";
            return acc;
          },
          {}
        );
        setShowPlayButton(initialPlayButtons);
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    callGetInstaContentApi();
  }, []);

  const handleMouseEnter = (postId: string) => {
    setHoveredPost(postId);
  };

  const handleMouseLeave = (postId: string) => {
    setHoveredPost(null);
    if (videoRefs.current[postId] && playingVideo !== postId) {
      videoRefs.current[postId].pause();
      videoRefs.current[postId].currentTime = 0;
    }
  };

  const handlePostClick = (post: Post, event: React.MouseEvent) => {
    event.preventDefault();
    if (post.fileType === "video") {
      const video = videoRefs.current[post._id];
      if (video) {
        if (video.paused) {
          video
            .play()
            .then(() => {
              setPlayingVideo(post._id);
              setShowPlayButton({ ...showPlayButton, [post._id]: false });
            })
            .catch((error) => {
              setShowPlayButton({ ...showPlayButton, [post._id]: true });
            });
        } else {
          video.pause();
          setPlayingVideo(null);
          setShowPlayButton({ ...showPlayButton, [post._id]: true });
        }
      }
    } else {
      window.open(post.url, "_blank");
    }
  };

  return (
    <div className="relative z-20 lg:py-2 py-4 sm:py-2 md:py-2">
      <div className="text-center mb-4 sm:mb-8">
       <h1
  className={`${quicksand.className} text-2xl  mt-12 sm:text-3xl md:text-4xl text-black inline-block relative tracking-wide mb-8 animated-underline`}
>
  FOLLOW US ON INSTAGRAM
</h1>
      </div>

      <style>
        {`
          .swiper-slide {
            height: 500px !important;
          }

          .swiper-pagination-bullet {
            width: 12px;
            height: 12px;
            background-color: gray;
            opacity: 1;
            transition: all 0.3s ease;
          }

          .swiper-pagination-bullet-active {
            background-color: red;
            width: 30px;
            border-radius: 10px;
          }
        `}
      </style>

      <div className="max-w-8xl mx-auto px-6">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          autoplay={{ delay: 4000, disableOnInteraction: true }}
          breakpoints={{
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1536: { slidesPerView: 6 },
          }}
          className="instagram-swiper mb-8"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {instaData?.map((post, index) => (
            <SwiperSlide key={post._id}>
              <div
                data-aos="fade-right"
                data-aos-delay={index * 150}
                data-aos-duration="1000"
                data-aos-easing="ease-out"
              className="block relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105"
                onMouseEnter={() => handleMouseEnter(post._id)}
                onMouseLeave={() => handleMouseLeave(post._id)}
                onClick={(e) => handlePostClick(post, e)}
              >
                {post.fileType === "video" ? (
                  <video
                    ref={(el: any) => el && (videoRefs.current[post._id] = el)}
                    autoPlay
                    className="w-full h-[500px] object-cover"
                    loop
                    muted
                    playsInline
                    preload="none"
                  >
                    <source src={post.fileLink} type="video/mp4" />
                    <source
                      src={post.fileLink.replace(".mp4", ".webm")}
                      type="video/webm"
                    />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    loading="lazy"
                    src={post.fileLink}
                    alt="Instagram post"
                    className="w-full h-[500px] object-cover"
                  />
                )}
                <div
                  className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredPost === post._id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {post.fileType === "video" ? (
                    playingVideo === post._id ? (
                      <FaPause className="text-white text-6xl" />
                    ) : (
                      <FaPlay className="text-white text-6xl" />
                    )
                  ) : (
                    <FaInstagram className="text-white text-6xl" />
                  )}
                </div>
                {showPlayButton[post._id] && post.fileType === "video" && (
                  <button
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePostClick(post, e);
                    }}
                  >
                    <FaPlay className="text-white text-6xl" />
                  </button>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom navigation buttons */}
        {/* <div className="flex justify-center items-center lg:mt-8 mt-2 sm:mt-3 space-x-8">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="bg-red text-white rounded-full p-4 hover:bg-pink-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <IoIosArrowBack size={28} />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="bg-red text-white rounded-full p-4 hover:bg-pink-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <IoIosArrowForward size={28} />
          </button>
        </div> */}
      </div>

      <div className="text-center lg:mt-10 md:mt-7 mt-3 sm:mt-5">
        <a
          href="https://www.instagram.com/sis_by_mp/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gradient-to-r bg-black text-white font-bold text-lg py-2 px-10 rounded-full hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Follow Us
        </a>
      </div>
    </div>
  );
};

export default InstagramPage;

// };

// export default InstagramPage;
