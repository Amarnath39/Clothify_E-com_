import { FaExchangeAlt } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import { MdSupportAgent } from "react-icons/md";

const features = [
  {
    id: 1,
    icon: <FaExchangeAlt className="text-5xl text-black" />,
    title: "Returns & exchanges",
    description:
      "We strive to make fashion accessible to everyone, no matter your budget.",
  },
  {
    id: 2,
    icon: <MdLocalShipping className="text-5xl text-black" />,
    title: "Fast Shipping",
    description:
      "We strive to make fashion accessible to everyone, no matter your budget.",
  },
  {
    id: 3,
    icon: <MdSupportAgent className="text-5xl text-black" />,
    title: "Support 24/7",
    description:
      "We strive to make fashion accessible to everyone, no matter your budget.",
  },
];

const Features = () => {
  return (
    <div className="bg-[#FAF9F6] py-10 px-5">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
        {features.map((feature) => (
          <div key={feature.id} className="flex flex-col items-center">
            {feature.icon}
            <h3 className="text-2xl font-semibold text-green-900 mt-4">
              {feature.title}
            </h3>
            <p className="text-gray-700 mt-2">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
