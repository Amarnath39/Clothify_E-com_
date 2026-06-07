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
    <div className="min-h-screen bg-background pt-32 pb-16 px-4 sm:px-6 lg:px-8 font-roboto">
      <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className={`${quicksand.className} text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight`}>
            Get in Touch
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Whether you have a question about our collections or need assistance with an order, our team is here to help you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {[
                { icon: FaPhone, title: "Phone", content: "+91 8943525333", desc: "Mon-Sat (10AM – 11PM)" },
                { icon: FaEnvelope, title: "Email", content: "clothify.shop@gmail.com", desc: "Expected response: 24h" },
                { icon: FaMapMarkerAlt, title: "Location", content: "Kerala, India", desc: "Crafted with passion" },
                { icon: FaClock, title: "Business Hours", content: "10 AM – 11 PM", desc: "Sunday to Saturday" },
              ].map((info, i) => (
                <Card key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-3 bg-brand/5 rounded-xl text-brand shrink-0">
                      <info.icon size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 font-quicksand">{info.title}</h3>
                      <p className="text-slate-700 font-medium">{info.content}</p>
                      <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">{info.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm h-full">
              <CardContent className="p-6 sm:p-10 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900 font-quicksand">Send us a message</h2>
                  <p className="text-slate-500">Fields marked with * are required.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">FullName *</label>
                      <Input
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-brand focus:border-brand transition-all"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address *</label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="john@example.com"
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-brand focus:border-brand transition-all"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone Number *</label>
                    <Input
                      type="tel"
                      name="mobile"
                      placeholder="+91 XXX XXX XXXX"
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-brand focus:border-brand transition-all"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Message *</label>
                    <Textarea
                      name="description"
                      placeholder="How can we help you today?"
                      className="min-h-[160px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-brand focus:border-brand transition-all resize-none p-4"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group text-lg"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                    {!isSubmitting && <FaEnvelope className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
