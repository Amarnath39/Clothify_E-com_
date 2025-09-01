import React from "react";
import { toast } from "react-hot-toast";
import { X, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

const CustomToast = ({ t, message }) => {
    const router =useRouter()
  return (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blood hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => {
            router.push('/cart')
            // console.log("Go to Cart clicked");
            toast.dismiss(t.id);
          }}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <ShoppingCart size={20} />
        </button>
      </div>
    </div>
  );
};

export const showCustomToast = (message) => {
  toast.custom((t) => <CustomToast t={t} message={message} />, {
    position: "top-right",
    duration: 10000,
  });
};

export default CustomToast;
