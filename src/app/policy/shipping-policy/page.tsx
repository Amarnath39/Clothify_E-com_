import React from "react";

const ShippingPolicy = () => {
  const sections = [
    {
    title: "Effective Date",
    content: "Effective Date: 07 OCTOBER 2025",
  },
  {
    title: "Shipping Locations",
    content:
      "We currently ship only within India. Orders placed for addresses outside India will be cancelled.",
  },
  {
    title: "Dispatch Time",
    content:
      "Orders are processed within 1–3 business days. Business days exclude weekends and national holidays.",
  },
  {
    title: "Delivery Time",
    content:
      "Standard delivery takes 3–7 business days post dispatch, depending on the location. Remote areas may experience longer delivery times.",
  },
  {
    title: "Shipping Charges",
    content:
      "Free Shipping charges inside Kerala and Outside Kerala around 175. Final shipping costs are displayed at checkout.",
  },
  {
    title: "Tracking Orders",
    content:
      "Once your order is shipped, a tracking link is shared via email or SMS. You can monitor real-time delivery status using this link.",
  },
  {
    title: "Delays & Issues",
    content:
      "If your order is delayed or arrives damaged: Email us at hello@clothify.com or Call us at +91 9876543210. We will work with our courier partners to resolve it as quickly as possible.",
  },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-appPrimary-600 mb-8 mt-4">
          Shipping and Delivery Policy
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
          <p className="text-gray-700 leading-relaxed">
            At clothify, we are committed to delivering high-quality sarees
            to your doorstep efficiently and reliably. Our shipping and delivery
            services ensure that your orders reach you in perfect condition and
            within the stipulated timeframe.
          </p>

          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-md p-4 transition-all duration-300 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-appPrimary-500 mb-3">
                {section.title}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}

          <div className="mt-6 text-center">
            <p className="text-gray-700">
              For any issues with delivery, please contact us within 24 hours
              at:
            </p>
            <p className="font-semibold text-appPrimary-600">
              Email: hello@clothify.com | Phone: +91 9876543210
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
