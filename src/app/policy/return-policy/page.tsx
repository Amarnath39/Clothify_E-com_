import React from "react";

const ReturnRefundPolicy = () => {
  const sections = [
    {
    title: "Effective Date",
    content: "Effective Date: 22 July 2025",
  },
  {
    title: "Order Cancellation",
    content:
      "You may cancel your order within 7 hours of placing it, provided it hasn’t been shipped. To cancel, contact us immediately via email or phone.",
  },
  {
    title: "Return Conditions",
    content:
      "Returns are accepted under the following conditions:\n- Request is made within 7 days of delivery\n- Product is unused, unwashed, and in original packaging\n- Tags and invoices are intact\n\nNon-returnable items include:\n- Innerwear or hygiene-sensitive products\n- Items marked as “Final Sale” or “Non-Returnable”",
  },
  {
    title: "Return Process",
    content:
      "Email your return request to info@roopsagarshoppingmall.com with your order number and reason. Wait for confirmation and return instructions. Pack the item securely and ship it to our address.\n\nNote: Customers are responsible for return shipping charges unless the product was defective or incorrect.",
  },
  {
    title: "Refund Process",
    content:
      "Refunds are initiated only after the item is received and passes quality inspection. It may take 7 business days for the amount to credited in your original payment method.\nReplacement should be raised within 24 hours and the replaced product will be delivered within 5-7  days.",
  },
  {
    title: "Contact Support",
    content:
      "📧 info@roopsagarshoppingmall.com | 📞 +91 8712636775",
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
              info@roopsagarshoppingmall.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReturnRefundPolicy;
