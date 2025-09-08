// @ts-nocheck

import Banner from "@/Main/home/Banner";
import CategoryList from "@/Main/home/categoryList";
import ResizableProducts from "@/Main/home/ResizableProducts";
import BestSelling from "@/Main/home/BestSelling";
import InstagramPage from "@/Main/home/Instagram";
import Featured from "@/Main/home/Featured";
import InstaVideo from "@/Main/home/InstaVideo";
import ImageComparisonSlider from "@/components/afterImage";
import OptionStrap from "@/components/OptionStrap";
import AnimatedSearchInput from "@/components/AnimateSearchInput";
import MainCategoryList from "@/components/MainCategoryList";
import MainProducts from "@/Main/home/MainProducts";
import VideoList from '@/Main/home/video';
import CategoryCarousel from "@/Main/home/CategoryCarousel";

export const metadata = {
  title: "Home | Udayaada",
  icons:{
    icon:"/favicon.ico",
  }
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* <div className="md:hidden flex justify-center mx-auto">
        <AnimatedSearchInput />
      </div> */}
      <Banner />
      <MainCategoryList />
      <BestSelling />
      <Featured />
      <OptionStrap />
      {/* <CategoryCarousel /> */}
      {/* <ImageComparisonSlider /> */}
      <MainProducts />
       <VideoList />
      <InstagramPage />
      {/* <InstaVideo /> */}
    </main>
  );
}
