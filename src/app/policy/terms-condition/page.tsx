import React from "react";
import Link from "next/link";

const TermsAndConditions = () => {
  const sections = [
    {
      title: "Introduction",
      content:
        "These Terms & Conditions govern your use of the Udayaada and all purchases made through our platform.",
    },
    {
      title: "Effective Date and Modifications",
      content:
        "Effective Date: 1 September 2025. By accessing or using our site, you agree to comply with these terms. We may update the terms at any time, and it is your responsibility to review them periodically.",
    },
    {
      title: "Responsible Use and Conduct",
      content:[
        "To shop on our website:",
        "You must be at least 18 years old or under parental guidance.",
        "You are responsible for maintaining the confidentiality of your account.",
      ]
    },
    {
  title: "Product Availability & Pricing",
  content:
    "All products are subject to availability. Prices may change without prior notice. We reserve the right to refuse or cancel any order for any reason.",
},
{
  title: "Orders & Payments",
  content:
    "Orders are confirmed via email or SMS. Payments must be made in full at checkout. We accept credit/debit cards, UPI, and other secure payment methods.",
},
{
  title: "Shipping Policy",
  content:
    "We only ship within India. Orders are usually dispatched within 1–3 business days. Delivery may take 3–7 business days depending on location.",
},
{
  title: "Cancellation Policy",
  content:
    "Orders can be cancelled within 7 hours of placement if not yet shipped. You must notify us by email or phone.",
},
{
  title: "Returns & Refunds",
  content:
    "Returns must be requested within 7 days of delivery. Items must be unused, with tags and original packaging intact. Refunds are processed within 7 business days once returned items are inspected.",
},
{
  title: "Intellectual Property",
  content:
    "All website content—images, logos, product descriptions, and branding—are the property of Udayaada. Unauthorized use is strictly prohibited.",
},
{
  title: "Limitation of Liability",
  content:
    "Udayaada is not liable for delays or failures in performance due to external events or any indirect, incidental, or consequential damages.",
},
{
  title: "Governing Law",
  content:
    "These terms shall be governed and interpreted under the laws of the Republic of India.",
},
{
  title: "Contact Information",
  content:
    "📧 varnasuba755@gmail.com  | 📞 +91 6238305477",
},

  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-appPrimary-600 mb-8">
          Terms of Use
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <p className="text-gray-700 text-center">
            By accessing{" "}
            <Link
              href="/"
              className="text-appPrimary-500 font-semibold hover:underline"
            >
              https://www.udayaada.in/
            </Link>
            , you agree to be bound by these terms and conditions.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold text-appPrimary-500 mb-3">
                {section.title}
              </h2>
              {Array.isArray(section.content) ? (
                <ul className="list-disc list-inside text-gray-700 leading-relaxed ">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 leading-relaxed ">
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-appPrimary-500">
            Thank you for using Udayada
          </h2>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
