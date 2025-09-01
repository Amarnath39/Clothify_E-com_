"use client";

import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useDispatch } from "react-redux";
import { resizableProducts } from "@/lib/features/products";
import toast from "react-hot-toast";
import useWindowSize from "@/hooks/useWindowSize";

const CustomResizableHandle = ({ ...props }) => (
  <ResizableHandle withHandle className={`custom-handle `} {...props}>
    <div className="handle-grip">
      <div className="handle-line"></div>
      <div className="handle-line"></div>
    </div>
  </ResizableHandle>
);

const ResizableProducts = () => {
  const { width } = useWindowSize();
  const isMobile = width < 720;
  const [resizableProduct, setResizableProduct] = useState([]);
  const dispatch = useDispatch<any>();

  const callGetResizableProducts = async () => {
    try {
      const { payload } = await dispatch(resizableProducts());

      if (payload.success) {
        setResizableProduct(payload.zoomDataList);
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    callGetResizableProducts();
  }, []);

  const ProductCard = ({ product, large = false }) => {
    if (!product) return null;
    // const { width } = useWindowSize();
    return (
      <div
        className={`h-full w-full overflow-hidden ${
          large ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        <div className="h-full w-full relative">
          <img
            loading="lazy"
            src={product.img}
            className={`absolute inset-0 w-full h-full object-cover ${
              width < 720 && "object-top"
            }`}
            alt={product.title}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
            <h3
              className={`font-semibold mb-2 text-white ${
                large ? "text-2xl" : "text-lg"
              }`}
            >
              {product.title}
            </h3>
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className=" bg-gray-100 p-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2 h-64">
            <ProductCard product={resizableProduct[0]} large />
          </div>
          <div className="h-48">
            <ProductCard product={resizableProduct[1]} />
          </div>
          <div className="h-48">
            <ProductCard product={resizableProduct[2]} />
          </div>
          <div className="col-span-2 h-64">
            <ProductCard product={resizableProduct[3]} large />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-100 p-2">
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[calc(100vh-2rem)] rounded-lg border bg-white shadow-lg"
      >
        <ResizablePanel defaultSize={33} minSize={20}>
          <ProductCard product={resizableProduct[0]} large />
        </ResizablePanel>
        <CustomResizableHandle />
        <ResizablePanel defaultSize={33} minSize={20}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <ProductCard product={resizableProduct[1]} />
            </ResizablePanel>
            <CustomResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <ProductCard product={resizableProduct[2]} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <CustomResizableHandle />
        <ResizablePanel defaultSize={33} minSize={20}>
          <ProductCard product={resizableProduct[3]} large />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ResizableProducts;
