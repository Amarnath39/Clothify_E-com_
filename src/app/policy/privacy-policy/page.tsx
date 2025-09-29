import React from "react";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "Introduction",
      content: `At Udayada, we are committed to protecting your privacy and ensuring that your personal information is handled securely and responsibly. This Privacy Policy outlines the types of data we collect, how it is used, and the rights you have regarding your information.`,
    },
    {
      title: "Information We Collect",
      content:
        `We collect personal information when you:
          Browse our website
          Register or create an account
          Place an order
          Subscribe to our newsletter or updates
          Contact us for support or inquiries
        Information collected may include:
          Full name
          Contact details (address, email, phone number)
          Billing and payment information
          Order history
          Preferences and browsing behavior (via cookies)`
    },
    {
      title: "How We Use Your Information",
      content:
        `We use the data we collect to:
          Process and fulfill your orders
          Communicate order status, confirmations, and shipping updates
          Respond to customer service inquiries
          Send promotional messages (only if opted-in)
          Improve our website and user experience
          Comply with legal obligations`,
    },
    {
      title: "Information Sharing",
      content:
        `Your information is shared only with trusted third parties who help us operate our business:
          Payment gateways
          Delivery partners and logistics providers
          IT and software service providers
        We never sell your personal data.`,
    },
    {
      title: "Data Security",
      content:
        `We implement multiple layers of protection:
          Secure socket layer (SSL) encryption
          Firewalled hosting environment
          Access controls and authorization`,
    },
    {
      title: "Your Rights",
      content:
        `You have the right to:
          Access, update, or delete your data
          Opt out of marketing communications at any time
          Request data portability or lodge a complaint`,
    },
    {
      title: "Changes to This Privacy Policy",
      content:
        "We reserve the right to update or change this Privacy Policy at any time. Any changes will be effective immediately upon posting the updated policy on our website. We encourage you to review this policy periodically for any updates.",
    },
    {
      title: "Contact Us",
      content:
        `For all privacy-related questions or concerns, please contact:
          📧 Varnasuba755@gmail.com
          📞 +91 7306372906`,
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
              <p className="text-gray-600 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-xl font-medium text-black">
            Thank you for trusting Udayaada with your information!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
