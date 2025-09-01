"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function CategoryCarousel() {
  const router = useRouter();

  const line1 = [
    { name: "FANCY SAREES", slug: "fancy-sarees" },
    { name: "WORK SAREES", slug: "work-sarees" },
  ];

  const line2 = [
    { name: "HANDLOOM SAREES", slug: "handloom-sarees" },
    { name: "SILK SAREES", slug: "silk-sarees" },
  ];

  return (
    <div className="marquee-wrapper">
      {/* First Row */}
      <div className="marquee">
        {line1.map((cat, i) => (
          <span
            key={i}
            className="category-text"
            onClick={() => router.push(`/categories/${cat.slug}`)}
          >
            {cat.name}
          </span>
        ))}
      </div>
      {/* Second Row */}
      <div className="marquee reverse">
        {line2.map((cat, i) => (
          <span
            key={i}
            className="category-text"
            onClick={() => router.push(`/categories/${cat.slug}`)}
          >
            {cat.name}
          </span>
        ))}
      </div>
    </div>
  );
}
