"use client";

import { useState } from "react";
import { IoMdClose } from "react-icons/io";

const ProductGalleryPage = ({
  productData,
  setIsModalOpen,
  isModalOpen,
}: any) => {
  // Open Modal
  // const openModal = () => setIsModalOpen(true);

  // Close Modal
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="flex flex-col items-center" style={{ zIndex: 9999 }}>
      {/* Full-Screen Image Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-[100vw] h-[100vh] bg-gray-200 p-6 rounded-lg overflow-y-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 w-full bg-gray-200 flex justify-between items-center px-6 py-4 border-b border-gray-400 z-50">
              {/* Product Name (Top Left) */}
              <h2 className="text-xl font-semibold text-black">
                {productData?.name}
              </h2>

              {/* Close Button (Top Right) */}
              <button className="text-black text-3xl" onClick={closeModal}>
                <IoMdClose />
              </button>
            </div>

            {/* Spacing to prevent content from being hidden under fixed header */}
            <div className="mt-20 flex flex-col items-center gap-6">
              {productData?.img.map((image, index) => (
                // <img
                //   key={index}
                //   src={image}
                //   alt={`Product ${index + 1}`}
                //   className="w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] max-w-4xl rounded-lg shadow-md object-cover"
                // />
                <img
                  key={index}
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="rounded-lg shadow-md mx-auto"
                  style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "90vh" }}
                />

              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGalleryPage;
