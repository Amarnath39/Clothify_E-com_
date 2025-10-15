"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import toast from "react-hot-toast";
import { Quicksand } from "next/font/google";
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Contact form submitted successfully!");
        setFormData({ name: "", email: "", mobile: "", description: "" });
      } else {
        toast.error(data.msg || "Failed to submit form");
      }
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error submitting form:", error);
      toast.error("An error occurred. Please try again.");
    }
  };
  return (
    <div className="container mx-auto px-4 py-12 my-16">
      <h1
        className={`${quicksand.className} text-4xl font-bold text-center mb-12`}
      >
        Contact Us
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <FaPhone className="text-2xl text-primary" />
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p>+91 6282667959</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <FaEnvelope className="text-2xl text-primary" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p>sisbymridhulaparvathy@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <FaMapMarkerAlt className="text-2xl text-primary" />
              <div>
                <h3 className="font-semibold">Location</h3>
                <p>
                  Trivandrum, Kerala, Pin: 670102
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <FaClock className="text-2xl text-primary" />
              <div>
                <h3 className="font-semibold">Business Hours</h3>
                <p>Sunday to Saturday (10 AM – 11 PM)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Send us a message</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  className="w-full"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  className="w-full"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Input
                  type="number"
                  name="mobile"
                  placeholder="Your Phone"
                  className="w-full"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Textarea
                  name="description"
                  placeholder="Your Query"
                  className="w-full min-h-[120px]"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button
                type="submit"
                // variant="blood"
                className="w-full bg-black text-white hover:bg-gray-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;
