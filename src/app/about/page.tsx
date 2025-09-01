import React from "react";

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8  mt-24 bg-white mb-12">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">
        ABOUT US
      </h1>

      <div className="md:flex md:gap-8 items-center justify-center">
        {/* <img
          src="/assets/server/about.JPG"
          alt="about us"
          className="w-96 h-full rounded-xl mb-8 md:mb-0 mx-auto object-contain"
        /> */}
        <div className="max-w-3xl mx-auto">
          <p className="mb-6 text-md sm:text-lg leading-relaxed text-gray-700">
            <strong className="text-xl sm:text-2xl block mb-2 text-gray-900">Welcome to Udayaada !</strong>
          
          </p>

          {/* <p className="mb-4 text-md sm:text-lg leading-relaxed text-gray-700">
            We are proud to be the official retail outlet of <strong>Rajlaxmi Textiles (India) Pvt. Ltd.</strong>, a prestigious and trusted name in the Indian saree industry for over <strong>31 glorious years</strong>.
            With decades of experience, excellence, and a deep-rooted love for tradition, we have now evolved into a full-fledged family shopping mall, offering an extensive range of products to cater to every age group and style preference.
          </p> */}

          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">What You’ll Find at Udayaada</h2>
            <ul className="list-disc list-inside text-md sm:text-lg text-gray-700 space-y-1">
              <li>Sarees – From casual drapes to grand traditional weaves</li>
              {/* <li>Kanchipuram Sarees – Pure silk masterpieces steeped in heritage</li> */}
              <li>Pattu Sarees – Rich, vibrant and perfect for every grand occasion</li>
              {/* <li>Dress Materials – Unstitched and semi-stitched collections for custom styling</li>
              <li>Tops & Leggings – Modern everyday wear for women of all ages</li> */}
              <li>Bridal Wear – Curated collections for the most special day of your life</li>
              {/* <li>Traditional Wear – Festive ensembles for men, women, and kids</li> */}
              <li>And much more!</li>
            </ul>
          </div>

          {/* <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Why Udayaada?</h2>
            <ul className="list-disc list-inside text-md sm:text-lg text-gray-700 space-y-1">
              <li>A legacy of over 3 decades in the textile and fashion industry</li>
              <li>Quality you can trust, prices you'll love</li>
              <li>A wide variety of options under one roof – ideal for the whole family</li>
              <li>Friendly and knowledgeable staff to help you make the perfect choice</li>
              <li>A shopping experience that combines elegance, tradition, and convenience</li>
            </ul>
          </div> */}

          <p className="mb-4 text-md sm:text-lg leading-relaxed text-gray-700">
            Whether you're searching for an iconic bridal saree, a stylish new outfit, or timeless traditional wear, <strong>Udayaada</strong> is your go-to destination for fashion that speaks to your heart.
          </p>

          <p className="mb-6 text-md sm:text-lg leading-relaxed text-gray-700">
            Visit us today and immerse yourself in a world of colors, textures, and styles that celebrate the beauty of Indian fashion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
