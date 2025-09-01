import React, { useState, useEffect, useRef } from "react";
import { FaRupeeSign } from "react-icons/fa";

export const TwoThumbSlider = ({ min, max, step, value, onChange }) => {
  const [leftThumbPosition, setLeftThumbPosition] = useState(0);
  const [rightThumbPosition, setRightThumbPosition] = useState(100);
  const sliderRef = useRef<any>(null);

  useEffect(() => {
    const leftPosition = ((value[0] - min) / (max - min)) * 100;
    const rightPosition = ((value[1] - min) / (max - min)) * 100;
    setLeftThumbPosition(leftPosition);
    setRightThumbPosition(rightPosition);
  }, [value, min, max]);

  const handleMouseDown = (e, isLeft) => {
    e.preventDefault();
    const handleMouseMove = (event) => {
      const sliderRect = sliderRef.current.getBoundingClientRect();
      const position =
        ((event.clientX - sliderRect.left) / sliderRect.width) * 100;
      const newValue =
        Math.round(((position / 100) * (max - min) + min) / step) * step;

      if (isLeft) {
        if (newValue < value[1] && newValue >= min) {
          onChange([newValue, value[1]]);
        }
      } else {
        if (newValue > value[0] && newValue <= max) {
          onChange([value[0], newValue]);
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className="relative w-full h-2 bg-gray-200 rounded-full"
      ref={sliderRef}
    >
      <div
        className="absolute h-full bg-blue-500 rounded-full"
        style={{
          left: `${leftThumbPosition}%`,
          right: `${100 - rightThumbPosition}%`,
        }}
      ></div>
      <div
        className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-pointer"
        style={{ left: `${leftThumbPosition}%`, top: "-6px" }}
        onMouseDown={(e) => handleMouseDown(e, true)}
      ></div>
      <div
        className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-pointer"
        style={{ left: `${rightThumbPosition}%`, top: "-6px" }}
        onMouseDown={(e) => handleMouseDown(e, false)}
      ></div>
    </div>
  );
};
