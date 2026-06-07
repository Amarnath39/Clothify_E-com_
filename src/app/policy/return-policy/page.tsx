import React from "react";

const ReturnRefundPolicy = () => {
  const sections = [
    {
      title: "Effective Date",
      content: "Effective Date: 07 OCTOBER 2025",
    },
    {
      title: "No Cancellation",
      content:
        "Once an order is placed, it cannot be cancelled for any reason. Please ensure all details are correct before confirming your purchase.",
    },
    {
      title: "No Return or Exchange",
      content: "All sales are final. We do not accept returns or exchanges for reasons such as change of mind, size issues, or color preference.",
    },
    {
      title: "No Refunds",
      content: "Refunds are not provided once the order has been confirmed and processed.",
    },
    {
      title: "Exceptions – Damaged, Defective, or Incorrect Items",
      content:
        "Refunds or replacements will only be considered if the product received is damaged, defective, or incorrect.\n- A mandatory unboxing (opening) video must be recorded clearly from start to finish without any cuts or edits\n- The video should show the package being opened and the issue clearly visible\n- Claims without a proper opening video will not be accepted \n-You must report the issue within 24 hours of delivery by emailing swethasarin2@gmail.com with your order number, description of the problem, and the unboxing video attached \nOnce verified, a replacement or appropriate resolution will be provided.",
    },
    {
      title: "Contact Support",
      content:
        "📧 hello@clothify.com | 📞 +91 9876543210",
    },
  ];

  return (
    <div className="min-h-screen mt-16 bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-appPrimary-600 mb-8 mt-4">
          Cancellations, Returns & Refunds
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h2 className="text-xl font-semibold text-appPrimary-600">
                {section.title}
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>
            For any questions regarding our Cancellations, Returns & Refunds
            Policy, please contact our customer support. at
            <a href="" className="text-blue-500">
              {" "}
              hello@clothify.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReturnRefundPolicy;
