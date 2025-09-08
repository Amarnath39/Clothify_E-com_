import type { Metadata } from "next";
import { Lato, Roboto, Tangerine, Quicksand, Mulish } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import StoreProvider from "@/lib/storeProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import CustomeLayout from "./CustomeLayout";
import { Toaster as Toast2 } from "@/components/ui/toaster";
import BottomNavbar from "@/components/BottomNavigation";
import useWindowSize from "@/hooks/useWindowSize";
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: {
    default: "Udayaada",
    template: "%s | Udayaada",
  },
  keywords:
    "Udayada is almost here to redefine your wardrobe with timeless elegance and effortless style",

  description:
    "Udayada is almost here to redefine your wardrobe with timeless elegance and effortless style",

  image: "/images/bg-removed.png",
  url: "https://www.udayaada.in/",

  author: "UdayadaTeam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/SAMAN___.TTF"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/assets/static/logo/Bgremoved_1.png" sizes="any" />
      </head>
      <body className={` ${mulish.className} `}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <Toaster />
            <Toast2 />

            <CustomeLayout>{children}</CustomeLayout>
            <BottomNavbar />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
