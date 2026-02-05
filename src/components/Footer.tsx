"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const currentYear = new Date().getFullYear();

const Footer = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/category");
      const data = await res.json();
      if (data.msg === "Success") {
        setCategories(data.categories.slice(-5).reverse());
      }
    } catch (err) {
      console.error("Failed to fetch categories");
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscribed successfully!");
        setIsOpen(false);
        setEmail("");
      } else {
        toast.error(data.msg || "Subscription failed.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#3b2f2a] text-[#d6c6b2] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand Column - From Source */}
          <div className="space-y-6">
            <img
              src="/assets/static/logo/saw.svg"
              alt="Swaarasya"
              className="h-20"
            />
            <p className="text-xs uppercase tracking-widest text-[#c9a45c]">
              Heritage of Kerala
            </p>
            <p className="text-sm leading-relaxed text-[#cfc3b4]">
              Celebrating the timeless elegance of Kerala’s weaving traditions
              and temple artistry. Handcrafted with love, delivered with grace.
            </p>
            <div className="flex gap-4 text-[#c9a45c]">
              <Instagram className="w-5 h-5 hover:text-white cursor-pointer" />
              <Facebook className="w-5 h-5 hover:text-white cursor-pointer" />
              <Twitter className="w-5 h-5 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-lg font-serif mb-6 text-[#c9a45c]">Shop</h4>
            <ul className="space-y-4 text-sm">
              {categories.map((cat) => (
                <li key={cat._id}>
                  <Link
                    href={`/categories/${cat._id}`}
                    className="hover:text-white transition"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/collections" className="hover:text-white">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-serif mb-6 text-[#c9a45c]">
              Support
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/track-order" className="hover:text-white">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/policy/shipping-policy" className="hover:text-white">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/policy/return-policy" className="hover:text-white">
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link href="/care" className="hover:text-white">
                  Saree Care Guide
                </Link>
              </li>
              <li>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(true)}
                  className="mt-2 border-black text-black hover:bg-black hover:text-white"
                >
                  SUBSCRIBE NOW
                </Button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-serif mb-6 text-[#c9a45c]">
              Contact
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#c9a45c]" />
                <span>
                  Fort Kochi, Kerala, India – <br /> 682001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#c9a45c]" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#c9a45c]" />
                <span>hello@swaarasya.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#5a4a42] pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-[#b9ab9c]">
          <p>© {currentYear} Swaarasya. All rights reserved.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <Link href="/policy/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/policy/terms" className="hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Subscription Modal Logic retained from Target */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full relative shadow-2xl">
            <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-black">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-serif">Join Swaarasya</h2>
              <p className="text-gray-500 text-sm">Subscribe to receive updates on new collections and exclusive heritage offers.</p>
              <form onSubmit={submitEmail} className="space-y-4 pt-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-full border-gray-200"
                  required
                />
                <Button type="submit" className="w-full rounded-full bg-black text-white" disabled={loading}>
                  {loading ? "Subscribing..." : "SUBSCRIBE"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
