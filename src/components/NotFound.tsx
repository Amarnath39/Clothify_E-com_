import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const NotFound = ({ height = "70vh", text = "Data" }) => {
  return (
    <div style={{height:height}} className={`flex flex-col items-center  justify-center `}>
      <div className={` rounded-lg flex flex-col justify-center items-center p-4`}>
        <FaExclamationTriangle className="text-pink-600 text-6xl mb-4" />
        <h2 className="text-gray-700 text-xl font-semibold">No {text} Found</h2>
      </div>
    </div>
  );
};

export default NotFound;
