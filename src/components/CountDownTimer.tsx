import React, { useState, useEffect } from "react";

const CountDownTimer = ({ targetDate }: { targetDate: string }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            return null;
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState<any>(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    if (!timeLeft) {
        return <span className="text-red-600 font-bold">Pre-Booking Closed</span>;
    }

    return (
        <div className="flex gap-4 text-center my-4">
            {Object.keys(timeLeft).map((interval) => (
                <div key={interval} className="flex flex-col p-2 bg-gray-100 rounded-lg min-w-[60px]">
                    <span className="text-2xl font-bold text-primaryRed">
                        {timeLeft[interval] < 10 ? `0${timeLeft[interval]}` : timeLeft[interval]}
                    </span>
                    <span className="text-xs uppercase text-gray-500">{interval}</span>
                </div>
            ))}
        </div>
    );
};

export default CountDownTimer;
