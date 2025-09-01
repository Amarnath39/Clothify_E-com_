"use client";
import { Quicksand } from "next/font/google";
import React, { useRef, useState, useEffect } from "react";
import { FaGripLinesVertical } from "react-icons/fa";
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600"] });
const AfterImage = ({ beforeAfterData }: any) => {
  return (
    <div className="w-full h-full">
      <img
        src={beforeAfterData?.afterImg}
        alt="after"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const BeforeImage = ({ beforeAfterData }: any) => {
  return (
    <div className="w-full h-full">
      <img
        src={beforeAfterData?.beforeImg}
        alt="before"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const ImageComparisonSlider = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragPosition, setDragPosition] = useState(50);
  const isDraggingRef = useRef(false);
  const [beforeAfterData, setBeforeAfterData] = useState<any>(null);

  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);

    return () => {
      window.removeEventListener("resize", updateContainerWidth);
    };
  }, []);

  const handleStart = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    isDraggingRef.current = true;
  };

  const handleEnd = () => {
    isDraggingRef.current = false;
  };

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const clientX =
      "touches" in event
        ? event.touches[0].clientX
        : (event as React.MouseEvent).clientX;
    const newDragPosition =
      ((clientX - containerRect.left) / containerWidth) * 100;
    setDragPosition(Math.min(Math.max(newDragPosition, 0), 100));
  };

  useEffect(() => {
    const handleGlobalEnd = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener("mouseup", handleGlobalEnd);
    document.addEventListener("touchend", handleGlobalEnd);

    return () => {
      document.removeEventListener("mouseup", handleGlobalEnd);
      document.removeEventListener("touchend", handleGlobalEnd);
    };
  }, []);

  useEffect(() => {
    fetchBeforeAfterData();
  }, []);

  const fetchBeforeAfterData = async () => {
    try {
      const response = await fetch("/api/beforeafter");
      const data = await response.json();
      if (data.success) {
        console.log(data?.beforeAfter[0].afterImage, "before");
        setBeforeAfterData(data?.beforeAfter[0]);
      } else {
        // toast.error(data.msg || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // toast.error("An error occurred while fetching data");
    }
  };

  return (
    <div className="px-4 pb-8  py-2">
      <h1
        className={`${quicksand.className} text-4xl text-center font-semibold text-black mb-8 tracking-wider`}
      >
        Before/After
      </h1>
      <p className="text-xl lg:text-2xl text-center text-appPrimary-100 mb-8 tracking-wider">
        {beforeAfterData?.title}
      </p>
      <div className="relative h-[24rem] sm:h-[32rem] mx-auto flex justify-center">
        <div
          className="relative w-[70rem] h-full overflow-hidden"
          ref={containerRef}
          onMouseMove={handleMove}
          onTouchMove={handleMove}
          onMouseLeave={handleEnd}
          onTouchEnd={handleEnd}
        >
          {/* Before Image */}
          <div className="absolute inset-0">
            <BeforeImage beforeAfterData={beforeAfterData} />
          </div>

          {/* After Image */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - dragPosition}% 0 0)` }}
          >
            <AfterImage beforeAfterData={beforeAfterData} />
          </div>

          {/* Divider */}
          <div
            className="absolute inset-y-0 w-1 bg-white cursor-ew-resize flex items-center justify-center"
            style={{ left: `calc(${dragPosition}% - 1px)` }}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            onMouseUp={handleEnd}
            onTouchEnd={handleEnd}
          >
            <div className="absolute bg-white rounded-full p-1 shadow-md">
              <FaGripLinesVertical className="text-gray-600 text-xl" />
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-white">
            <span
              className={`bg-black bg-opacity-50 px-4 py-1 transition-opacity duration-300 ${
                dragPosition <= 10 ? "opacity-0" : "opacity-100"
              }`}
            >
              Before
            </span>
            <span
              className={`bg-black bg-opacity-50 px-4 py-1 z-0 transition-opacity duration-300 ${
                dragPosition >= 90 ? "opacity-0" : "opacity-100"
              }`}
            >
              After
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageComparisonSlider;
