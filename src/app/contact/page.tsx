import React from "react";
import Contact from "./Contact";

export const metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Fancyvastra for any inquiries, assistance with your order, or more information about our saree collections. We're here to help you with all your needs.",
};

const page = () => {
  return (
    <div>
      <Contact />
    </div>
  );
};

export default page;
