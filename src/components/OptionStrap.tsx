"use client"

import React from 'react'
import { Shield, Truck, Gift, RotateCcw, CreditCard } from 'lucide-react'
export default function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'Safe & Secure Checkout',
      description:
        'Your payment is 100% safe with industry-standard encryption for a worry-free shopping experience.',
    },
    {
      icon: Truck,
      title: 'Free & Fast Shipping',
      description:
        'Free Shipping charges inside Kerala and Outside Kerala around 175',
    },
    {
      icon: Gift,
      title: 'Free Premium Box',
      description:
        'Every jewellery order includes a premium box (worth ₹100), making your unboxing truly special.',
    },
    {
      icon: RotateCcw,
      title: 'Hassle-Free Returns',
      description:
        'Not happy with your purchase? Return or exchange within 3 days – hassle-free.',
    },
    {
      icon: CreditCard,
      title: 'Flexible Payments',
      description:
        'Pay easily with UPI, Debit/Credit Cards, Net Banking, Wallets & EMI options.',
    },
  ]
  return (
    <section className="py-12 md:py-16 bg-white border-y border-gray-100">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div key={index} className="text-center space-y-2 md:space-y-3">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-2 md:mb-4 flex items-center justify-center">
                  <Icon
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-burgundy"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-xs md:text-sm lg:text-base font-serif font-medium text-charcoal leading-tight">
                  {badge.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed hidden lg:block">
                  {badge.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
