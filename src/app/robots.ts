import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/login",
          "/login/*",
          "/dashboard",
          "/dashboard/*",
          "/api",
          "/api/*"
        ],
      },
    ],
    sitemap: "https://swaarasya.com/sitemap.xml",   // change domain if needed
    host: "https://swaarasya.com",
  };
}
