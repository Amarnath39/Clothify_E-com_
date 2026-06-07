import React from "react";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "Introduction",
      content: `At Clothify, we are committed to protecting your privacy and ensuring that your personal information is handled with the highest level of security and transparency. This Privacy Policy explains what data we collect, how we use it, and the rights you have regarding your information.`,
    },
    {
      title: "Information We Collect",
      content: `We collect personal information when you:
          • Browse our website
          • Create an account or register
          • Place an order
          • Subscribe to our newsletter
          • Contact us for assistance or support

        Information collected may include:
          • Full name
          • Contact details (email, phone number, address)
          • Payment and billing information
          • Order history
          • Browsing preferences and activity (via cookies)`,
    },
    {
      title: "How We Use Your Information",
      content: `We use your information to:
          • Process and deliver your orders
          • Send order confirmations and shipping updates
          • Provide customer service and support
          • Share promotional offers (only if you opt-in)
          • Enhance your website experience and improve our services
          • Comply with legal and regulatory obligations`,
    },
    {
      title: "Information Sharing",
      content: `Your information is shared only with trusted third parties who help us operate our business, including:
          • Payment service providers
          • Delivery and logistics partners
          • IT, hosting, and software support teams

        We do NOT sell or trade your personal information with any third party.`,
    },
    {
      title: "Data Security",
      content: `We maintain strong security measures to protect your information, including:
          • SSL encryption for secure transactions
          • Protected hosting infrastructure
          • Strict access control and authorization systems

        While we take every step to secure your data, no method of digital transfer is 100% risk-free.`,
    },
    {
      title: "Your Rights",
      content: `As a user, you have the right to:
          • Access, update, or delete your personal information
          • Opt out of marketing or promotional emails anytime
          • Request correction of inaccurate data
          • Ask for data portability
          • Raise concerns or complaints regarding your privacy`,
    },
    {
      title: "Changes to This Privacy Policy",
      content: `Clothify may update this Privacy Policy as needed to reflect changes in our practices or legal requirements. Updated versions will be posted on this page. Please review periodically to stay informed.`,
    },
    {
      title: "Contact Us",
      content: `For any privacy-related questions, concerns, or requests, reach out to us at:

          📧 Email: clothify.shop@gmail.com
          📞 Phone: 9876543210`,
    },
  ];

  return (
    <div className="bg-gradient-to-b from-purple-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:py-24 sm:px-6 mt-4">
        <h1 className="text-4xl font-extrabold text-black text-center mb-12">
          Privacy Policy
        </h1>

        <div className="space-y-12">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl"
            >
              <h2 className="text-2xl font-bold text-black mb-4">
                {section.title}
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-xl font-medium text-black">
            Thank you for trusting Clothify with your information!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

