import React from "react";

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8 mt-24 bg-white mb-12">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">
        ABOUT US
      </h1>

      <div className="md:flex md:gap-8 items-center justify-center">
        <div className="max-w-3xl mx-auto">

          <p className="mb-6 text-md sm:text-lg leading-relaxed text-gray-700">
            <strong className="text-xl sm:text-2xl block mb-2 text-gray-900">
              Welcome to Swarasya!
            </strong>
          </p>

          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              Who We Are
            </h2>
            <p className="text-md sm:text-lg text-gray-700 leading-relaxed">
              <strong>Swarasya</strong> is your destination for timeless elegance,
              curated by Swetha with a passion for style, tradition, and authentic craftsmanship.
              We bring together a premium range of 
              <strong> handpicked sarees</strong> and 
              <strong> exquisite jewellery</strong> 
              designed to celebrate the beauty of every woman.  
              At Swarasya, fashion is more than just clothing—it's an expression of culture, grace, and individuality.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              What You’ll Discover at Swarasya
            </h2>
            <ul className="list-disc list-inside text-md sm:text-lg text-gray-700 space-y-1">
              <li>Premium Sarees – modern, elegant, and beautifully curated</li>
              <li>Silk & Pattu Sarees – luxurious weaves for festive and special occasions</li>
              <li>Handloom & Traditional Sarees – crafted by skilled weavers</li>
              <li>Designer Jewellery – contemporary, ethnic, and wedding collections</li>
              <li>Bridal Sets – complete saree & jewellery combinations</li>
              <li>Exclusive Combos – thoughtfully paired outfits and accessories</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              Why Choose Us?
            </h2>
            <ul className="list-disc list-inside text-md sm:text-lg text-gray-700 space-y-1">
              <li>Handpicked and quality-assured pieces</li>
              <li>Authentic craftsmanship from trusted artisans</li>
              <li>Unique collections blending tradition and modern style</li>
              <li>Affordable luxury with transparent pricing</li>
              <li>Friendly and dedicated customer support</li>
            </ul>
          </div>

          <p className="mb-4 text-md sm:text-lg leading-relaxed text-gray-700">
            Whether you're looking for a festive saree, an elegant daily wear piece,
            stunning jewellery, or a complete bridal look, 
            <strong> Swarasya</strong> is here to bring you style that feels personal and timeless.
          </p>

          <p className="mb-6 text-md sm:text-lg leading-relaxed text-gray-700">
            Explore our collections today and experience the elegance, heritage,
            and charm that define Swarasya.
          </p>

        </div>
      </div>
    </div>
  );
};

export default About;

