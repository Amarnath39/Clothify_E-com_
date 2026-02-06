// src/components/ZoomableImage.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  zoomScale = 1.5 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchZooming, setIsTouchZooming] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (imgRef.current) {
        const { width, height } = imgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setPosition({ x, y });
  };

  const handleTouchPoint = (clientX: number, clientY: number) => {
    if (!imgRef.current) return;

    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;

    setPosition({ x, y });
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => {
        const t = e.touches?.[0];
        if (!t) return;
        setIsTouchZooming(true);
        handleTouchPoint(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        const t = e.touches?.[0];
        if (!t) return;
        e.preventDefault();
        handleTouchPoint(t.clientX, t.clientY);
      }}
      onTouchEnd={() => setIsTouchZooming(false)}
      onTouchCancel={() => setIsTouchZooming(false)}
      style={{ cursor: isHovered ? 'zoom-in' : 'default', touchAction: 'none' }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain transition-transform duration-300 ease-in-out"
        style={{
          transform: (isHovered || isTouchZooming)
            ? `scale(${zoomScale}) translate(${(position.x - 50) / 5}%, ${(position.y - 50) / 5}%)` 
            : 'scale(1)',
          transformOrigin: `${position.x}% ${position.y}%`
        }}
      />
      
      {/* Zoom indicator */}
      <AnimatePresence>
        {(isHovered || isTouchZooming) && (
          <motion.div
            className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            {isTouchZooming ? "Drag to zoom" : "Hover to zoom"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZoomableImage;