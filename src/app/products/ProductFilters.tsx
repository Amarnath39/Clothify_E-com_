import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FaFilter,
  FaSort,
  FaRupeeSign,
  FaPercent,
  FaPalette,
  FaTshirt,
  FaTimes,
  FaCheck,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProductFilters = ({ onFilterChange, isOpen, onClose, onfilterApply }) => {
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

  const allColors = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "pink",
    "black",
    "white",
    "orange",
    "brown",
    "gray",
    "cyan",
    "magenta",
    "lime",
    "teal",
    "indigo",
    "violet",
    "maroon",
    "navy",
    "olive",
    "silver",
    "gold",
    "beige",
    "turquoise",
    "coral",
    "crimson",
    "fuchsia",
    "khaki",
    "lavender",
    "plum",
    "salmon",
    "tan",
  ];

  const visibleColors = showAll ? allColors : allColors.slice(0, 20);
  const [selectedColors, setSelectedColors] = useState<any[]>([]);

  const [localFilters, setLocalFilters] = useState({});

  const handleFilterChange = (filterType, value) => {
    setLocalFilters((prev) => ({ ...prev, [filterType]: value }));
    onFilterChange(filterType, value);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onfilterApply({}); // Apply empty filters
    // Reset all filter-specific states (if any)
    setPriceRange([0, 10000]);
    setMinPrice(0);
    setMaxPrice(10000);
    setSelectedMaterials([]);
    setSelectedColors([]);
    // ... reset other filter-specific states
  };

  return (
    <div
      className={`
      min-h-[80vh] fixed md:sticky top-20 inset-y-0 left-0 z-40 
      w-full md:w-[420px] bg-white border-r border-gray-200
      md:max-h-[80vh] transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0 z-[9999]" : "-translate-x-full"}
      md:relative md:translate-x-0
    `}
>

      <div className="flex flex-col h-full md:max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <FaFilter className="text-gray-500" /> Filters
            </h2>
            <button onClick={onClose} className="text-gray-500 md:hidden">
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Filter Sections */}
        <div className="flex-grow overflow-y-auto px-4 py-6 space-y-8">
          {/* Sort Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Sort By</h3>
            <RadioGroup
              defaultValue="newlyArrived"
              onValueChange={(value) => handleFilterChange("sort", value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="newlyArrived" id="newlyArrived" />
                <Label htmlFor="newlyArrived" className="text-sm text-gray-600">
                  Newly Arrived
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="priceLowToHigh" id="priceLowToHigh" />
                <Label
                  htmlFor="priceLowToHigh"
                  className="text-sm text-gray-600"
                >
                  Price: Low to High
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="priceHighToLow" id="priceHighToLow" />
                <Label
                  htmlFor="priceHighToLow"
                  className="text-sm text-gray-600"
                >
                  Price: High to Low
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Price Range</h3>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMinPrice(value);
                  setPriceRange([value, priceRange[1]]);
                  handleFilterChange("price", [value, priceRange[1]]);
                }}
                className="w-1/2"
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMaxPrice(value);
                  setPriceRange([priceRange[0], value]);
                  handleFilterChange("price", [priceRange[0], value]);
                }}
                className="w-1/2"
              />
            </div>
          </div>

          {/* Colors */}
          {/* <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Colors</h3>
            <div className="grid grid-cols-5 gap-2">
              {visibleColors.map((color) => (
                <div
                  key={color}
                  className={`
                    w-8 h-8 rounded-full cursor-pointer border
                    ${
                      selectedColors.includes(color)
                        ? "border-gray-900"
                        : "border-gray-200"
                    }
                    hover:border-gray-400 transition-colors
                  `}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    const updatedColors = selectedColors.includes(color)
                      ? selectedColors.filter((c) => c !== color)
                      : [...selectedColors, color];
                    setSelectedColors(updatedColors);
                    handleFilterChange("color", updatedColors);
                  }}
                >
                  {selectedColors.includes(color) && (
                    <FaCheck
                      className={`
                      m-auto h-full
                      ${
                        color === "white" ||
                        color === "yellow" ||
                        color === "beige"
                          ? "text-gray-900"
                          : "text-white"
                      }
                    `}
                      size={12}
                    />
                  )}
                </div>
              ))}
            </div>
          </div> */}

          {/* Materials */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Material</h3>
            <div className="space-y-2">
              {["Cotton", "Silk", "Wool", "Polyester", "Linen"].map(
                (material) => (
                  <div key={material} className="flex items-center">
                    <Checkbox
                      id={`material-${material}`}
                      checked={selectedMaterials.includes(material)}
                      onCheckedChange={(checked) => {
                        const updatedMaterials = checked
                          ? [...selectedMaterials, material]
                          : selectedMaterials.filter((m) => m !== material);
                        setSelectedMaterials(updatedMaterials);
                        handleFilterChange("material", updatedMaterials);
                      }}
                    />
                    <label
                      htmlFor={`material-${material}`}
                      className="ml-2 text-sm text-gray-600"
                    >
                      {material}
                    </label>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t bg-white">
          <div className="space-y-2">
            <Button
              className="w-full bg-gray-900 text-white hover:bg-gray-700"
              onClick={() => {
                onfilterApply(localFilters);
                onClose();
              }}
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleClearFilters();
                onClose();
              }}
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
