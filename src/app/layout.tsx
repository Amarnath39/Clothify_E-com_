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

export const metadata: Metadata = {
  title: {
    default: "Udayaada",
    template: "%s | Udayaada",
  },
  description:
    "Udayaada is almost here to redefine your wardrobe with timeless elegance and effortless style.",
  icons: {
    // ✅ use absolute URLs for consistency (CDN / SEO / caching)
    icon: [
      {
        url: "https://www.udayaada.in/assets/static/logo/favicon-1.ico",
        sizes: "any",
      },
      {
        url: "https://www.udayaada.in/assets/static/logo/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "https://www.udayaada.in/assets/static/logo/favicon-16x16.png",
        type: "image/png",
        sizes: "16x16",
      },
    ],
    apple: "https://www.udayaada.in/assets/static/logo/apple-touch-icon.png",
    other: [
      {
        rel: "android-chrome",
        url: "https://www.udayaada.in/assets/static/logo/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome",
        url: "https://www.udayaada.in/assets/static/logo/android-chrome-512x512.png",
      },
    ],
  },
  keywords:
    "Udayaada is almost here to redefine your wardrobe with timeless elegance and effortless style.",
  authors: [{ name: "Webgeon Results " }],

  openGraph: {
    title: "Udayaada",
    description:
      "Udayaada is almost here to redefine your wardrobe with timeless elegance and effortless style",
    url: "https://www.udayaada.in/",
    siteName: "Udayaada",
    images: [
      {
        url: "https://www.udayaada.in/assets/static/logo/og-image.png",
        width: 1200,
        height: 630,
        alt: "Udayaada OpenGraph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Udayaada",
    description:
      "Udayaada is almost here to redefine your wardrobe with timeless elegance and effortless style",
    images: ["https://www.udayaada.in/assets/static/logo/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
