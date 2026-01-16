import type { Metadata } from "next";
import { Lato, Roboto, Tangerine, Quicksand, Mulish, Urbanist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import StoreProvider from "@/lib/storeProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import CustomeLayout from "./CustomeLayout";
import { Toaster as Toast2 } from "@/components/ui/toaster";
import BottomNavbar from "@/components/BottomNavigation";
// import useWindowSize from "@/hooks/useWindowSize";
// import { SearchProvider } from "@/contexts/SearchContext";
import CountryProvider from "@/lib/CountryProvider";
 
const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-urbanist",
});
 
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});
 
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-mulish",
});
 
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "700"],
});
 
export const metadata: Metadata = {
  title: {
    default: "Swaarasya – Sarees & Jewellery by Swetha",
    template: "%s | Swaarasya",
  },
  description:
    "Swaarasya is an online store offering premium sarees and jewellery for women. Explore ethnic, traditional, and designer sarees along with handcrafted jewellery collections.",
  keywords: [
    "Swaarasya",
    "Swaarasya ecommerce",
    "Swaarasya sarees",
    "Swaarasya jewellery",
    "women’s sarees online",
    "designer sarees online",
    "latest saree collection",
    "traditional sarees online",
    "ethnic sarees for women",
    "party wear sarees online",
    "bridal sarees online",
    "Indian jewellery online",
    "women’s jewellery online",
    "traditional jewellery for women",
    "ethnic jewellery online",
    "silk sarees online",
    "cotton sarees online",
    "handloom sarees online",
    "chiffon sarees online",
    "georgette sarees online",
    "embroidered sarees online",
    "festive sarees for women",
    "wedding sarees online",
    "temple jewellery online",
    "gold-plated jewellery online",
    "bridal jewellery sets",
    "ethnic earrings online",
    "necklace sets for women",
    "affordable sarees online shopping",
    "online jewellery store for women",
    "handcrafted jewellery for women",
    "Swaarasya sarees collection",
    "Swaarasya jewellery collection",
    "Swaarasya ethnic wear",
    "Swaarasya online store",
  ],
  icons: {
    icon: "/assets/static/logo/favicon.ico",
    apple: "/assets/static/logo/apple-touch-icon.png",
  },
  authors: [{ name: "Webgeon Results" }],

  openGraph: {
    title: "Swaarasya – Sarees & Jewellery Online Store",
    description:
      "Shop premium sarees and handcrafted jewellery at Swaarasya. Discover ethnic, festive, and designer collections for women.",
    url: "https://swaarasya.com",
    siteName: "Swaarasya",
    images: [
      {
        url: "/assets/static/logo/ogimage.png",
        width: 1200,
        height: 630,
        alt: "Swaarasya OpenGraph Image",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Swaarasya – Sarees & Jewellery Online Store",
    description:
      "Explore premium sarees and jewellery collections at Swaarasya. Ethnic, bridal, festive, and designer styles for women.",
    images: ["/assets/static/logo/ogimage.png"],
  },
};

 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/assets/static/logo/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/assets/static/logo/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/assets/static/logo/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/assets/static/logo/apple-touch-icon.png"
        />
      </head>
      <body className={urbanist.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            {/* <SearchProvider> */}
            <CountryProvider>
              <Toaster />
              <Toast2 />
              <CustomeLayout>{children}</CustomeLayout>
              <BottomNavbar />
            </CountryProvider>
            {/* </SearchProvider> */}
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
 
 