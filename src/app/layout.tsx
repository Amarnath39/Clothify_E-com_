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
import useWindowSize from "@/hooks/useWindowSize";
// import { SearchProvider } from "@/contexts/SearchContext";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-urbanist",
})

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
    default: "S.I.S BY MV PV",
    template: "%s | S.I.S BY MV PV",
  },
  description:
    "S.I.S – Strong, Independent, Stylish. A women’s online clothing store redefining fashion with timeless elegance, effortless style, and confidence in every look. It Kicks – Men’s online shoe store for premium sneakers & casuals. Shop stylish, comfortable footwear designed for quality and confidence.",
  icons: {
    icon: "/assets/static/logo/favicon.ico",
    apple: "/assets/static/logo/apple-touch-icon.png",
    
  },
  keywords:
    " S.I.S – Strong, Independent, Stylish. A women’s online clothing store redefining fashion with timeless elegance, effortless style, and confidence in every look. – Men’s online shoe store for premium sneakers & casuals. Shop stylish, comfortable footwear designed for quality and confidence.raa, jewellery, online jewellery store, gold jewellery, silver jewellery, diamond jewellery, bridal jewellery, necklaces, earrings, rings",
  authors: [{ name: "Webgeon Results" }],

  openGraph: {
    title: "S.I.S BY MV PV",
    description:
      "Shop stylish S.I.S – Strong, Independent, Stylish. A women’s online clothing store redefining fashion with timeless elegance, effortless style, and confidence in every look. and casual footwear at Grab it Kicks. Experience comfort and quality with every step.",
    url: "https://www.siskerala.com.com/",
    siteName: "SIS BY MV|PV",
    images: [
      {
        url: "https://www.siskerala.com.com/assets/static/logo/ogimage.png",
        width: 1200,
        height: 630,
        alt: "S.I.S BY MV PV OpenGraph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "S.I.S BY MV PV",
    description:
      "Shop stylish S.I.S – Strong, Independent, Stylish – is more than just a women’s clothing brand; it’s a celebration of confidence and individuality. Our online store brings you a curated collection of elegant, trendy, and comfortable outfits designed for the modern woman who knows her worth. and casual footwear at Grab it Kicks. Experience comfort and quality with every step.",
    images: ["https://www.siskerala.com.com/assets/static/logo/ogimage.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
      <body className={` ${urbanist.className} `}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            {/* <SearchProvider> */}
              <Toaster />
              <Toast2 />

              <CustomeLayout>{children}</CustomeLayout>
              <BottomNavbar />
            {/* </SearchProvider> */}
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
