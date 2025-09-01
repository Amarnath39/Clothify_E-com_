import React from "react";

const BloodRedButton = ({
  children,
  onClick,
  className,
  type = "button",
  loading = false,
  disabled = false,
  ...props
}: any) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-red text-white border border-red-400 border-b-4 font-medium overflow-hidden relative px-6 py-2 rounded-md hover:brightness-150 hover:border-t-4 hover:border-b active:opacity-75 outline-none duration-300 group ${className} ${
        loading ? "loading" : ""
      } ${disabled ? "opacity-70" : ""}`}
      disabled={loading || disabled}
      {...props}
    >
      <span className="bg-red shadow-red absolute -top-[150%] left-0 inline-flex w-80 h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]"></span>

      {loading /* From Uiverse.io by TamaniPhiri */ ? (
        <div className="flex-col gap-4 w-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 text-blue-400 text-4xl animate-spin border-gray-300 flex items-center justify-center border-t-blue-400 rounded-full"></div>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default BloodRedButton;
