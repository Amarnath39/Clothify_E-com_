"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, X } from "lucide-react";

const currentYear = new Date().getFullYear();

const Footer = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/category`, { method: "GET" });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      if (data.msg === "Success") {
        // Get the latest 5 categories for the 'Shop' column
        setCategories(data.categories.slice(-5).reverse());
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/subscribe`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setEmail("");
        toast.success("Thank you for subscribing!");
        setIsOpen(false);
      } else {
        toast.error(data?.msg || "Subscription failed");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-white text-black pt-16 pb-8 border-t border-gray-100 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column - From Source */}
          <div className="space-y-6">
            <div>
              <img
                src="/assets/static/logo/saw.svg"
                alt="SWAARASYA Logo"
                className="h-20 w-auto mb-4"
              />
              <p className="text-[10px] uppercase tracking-widest text-[#b48a3c] font-medium">
                Heritage of Kerala
              </p>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Celebrating the timeless elegance of Kerala's weaving traditions
              and temple artistry. Handcrafted with love, delivered with grace.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#b48a3c] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              {/* <a href="#" className="text-gray-400 hover:text-[#b48a3c] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#b48a3c] transition-colors">
                <Twitter className="h-5 w-5" />
              </a> */}
            </div>
          </div>

          {/* Shop Links - Dynamic from Target API */}
          <div>
            <h4 className="text-lg font-serif font-medium mb-6 text-black">Shop</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              {categories.map((cat) => (
                <li key={cat._id}>
                  <Link href={`/categories/${cat._id}`} className="hover:text-[#b48a3c] transition-colors uppercase tracking-tight">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li><Link href="/collections" className="hover:text-[#b48a3c]">NEW ARRIVALS</Link></li>
            </ul>
          </div>

          {/* Support/Information - Merged */}
          <div>
            <h4 className="text-lg font-serif font-medium mb-6 text-black">Information</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><Link href="/about" className="hover:text-[#b48a3c]">ABOUT US</Link></li>
              <li><Link href="/policy/return-policy" className="hover:text-[#b48a3c]">RETURNS & REFUNDS</Link></li>
              <li><Link href="/policy/shipping-policy" className="hover:text-[#b48a3c]">SHIPPING POLICY</Link></li>
              <li><Link href="/contact" className="hover:text-[#b48a3c]">CONTACT US</Link></li>
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

          {/* Contact Column - From Source */}
          <div>
            <h4 className="text-lg font-serif font-medium mb-6 text-black">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#b48a3c] shrink-0" />
                <span>Fort Kochi, Kerala, India - 682001</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#b48a3c] shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#b48a3c] shrink-0" />
                <span>hello@swaarasya.com</span>
              </li>
            </ul>
            <div className="mt-6">
              <h5 className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Accepted Payments</h5>
              <div className="flex gap-2 grayscale hover:grayscale-0 transition-all">
                <img src="/assets/static/logo/visa.png" alt="Visa" className="h-6 object-contain" />
                <img src="/assets/static/logo/card.png" alt="Mastercard" className="h-6 object-contain" />
                <img src="/assets/static/logo/rupay-logo-icon.png" alt="RuPay" className="h-6 object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p>&copy; {currentYear} Swaarasya. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="https://trackcourier.io/" target="_blank" className="hover:text-black">TRACK ORDER</Link>
            <Link href="/policy/privacy-policy" className="hover:text-black">PRIVACY</Link>
            <p>Crafted by <Link href="https://www.webgeon.com/" className="text-red-600 font-bold">Webgeon</Link></p>
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