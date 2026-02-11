"use client";
import React, { useEffect } from "react";
import "../hooks/style.css";
import { useDispatch, useSelector } from "react-redux";
import { getMarqueeText } from "@/lib/features/marquee";
import { Sparkles } from 'lucide-react';

const MarqueeStrip = () => {
    const dispatch = useDispatch<any>();
    const { entries } = useSelector((state: any) => state.marquee);

    useEffect(() => {
        dispatch(getMarqueeText());
    }, [dispatch]);

    const marqueeEntries = entries && entries.length > 0
        ? entries
        : [{ text: "Free Shipping charges inside Kerala and Outside Kerala around 175. " }, { text: "Use Code: SANSKARA20 for 20% Off" }];

    // We repeat the content multiple times for seamless scrolling
    const renderEntries = (keyPrefix: string) => (
        <div className="flex items-center space-x-12">
            {[...Array(4)].map((_, groupIdx) => (
                <React.Fragment key={`${keyPrefix}-${groupIdx}`}>
                    {marqueeEntries.map((entry: any, idx: number) => (
                        <div
                            key={`${keyPrefix}-${groupIdx}-${idx}`}
                            className="inline-flex items-center space-x-2 text-sm md:text-base font-medium"
                        >
                            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                            <span>{entry.text}</span>
                        </div>
                    ))}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="bg-burgundy text-white py-3 overflow-hidden border-b border-white/5 relative">
            <div className="flex w-fit animate-marquee-continuous whitespace-nowrap space-x-12">
                {renderEntries("block1")}
                {renderEntries("block2")}
            </div>
        </div>
    );
};

export default MarqueeStrip;
