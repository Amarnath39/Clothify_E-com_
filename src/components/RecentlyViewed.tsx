"use client";

import { useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import styles from "./RecentlyViewed.module.css";
import StandardProductCard from "./StandardProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
    _id: string;
    name: string;
    img: string[];
    actualPrice: number;
    offerPrice?: number;
    [key: string]: any;
}

const RecentlyViewed = () => {
    const recentlyViewed = useSelector(
        (state: any) => state.recentlyViewed?.items || []
    );

    if (!recentlyViewed || recentlyViewed.length === 0) return null;

    return (
        <section className="w-full py-8 md:py-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8 px-1">
                <h2 className="font-serif text-2xl md:text-3xl text-gray-900">Recently Viewed</h2>
            </div>

            <div className="relative group">
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={16}
                    slidesPerView={1.5}
                    navigation={{
                        nextEl: ".rv-next",
                        prevEl: ".rv-prev",
                    }}
                    breakpoints={{
                        480: { slidesPerView: 2, spaceBetween: 16 },
                        768: { slidesPerView: 3, spaceBetween: 24 },
                        1024: { slidesPerView: 4, spaceBetween: 24 },
                    }}
                    className={`${styles["recently-viewed-swiper"]}`}
                >
                    {recentlyViewed.map((product: Product) => (
                        <SwiperSlide key={product._id} className="pb-10">
                            <StandardProductCard product={product} />
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Custom Navigation */}
                <button className="rv-prev absolute left-0 top-1/2 -translate-y-[150%] z-10 w-10 h-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center text-gray-800 hover:bg-[#b48a3c] hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 -ml-4">
                    <ChevronLeft size={20} />
                </button>
                <button className="rv-next absolute right-0 top-1/2 -translate-y-[150%] z-10 w-10 h-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center text-gray-800 hover:bg-[#b48a3c] hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 -mr-4">
                    <ChevronRight size={20} />
                </button>
            </div>
        </section>
    );
};

export default RecentlyViewed;
