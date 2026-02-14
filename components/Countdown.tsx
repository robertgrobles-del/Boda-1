
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountdownTime } from '../types';

interface CountdownProps {
  targetDate: string;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBox = ({ value, label, className = "" }: { value: number, label: string, className?: string }) => (
    <div className={`flex flex-col items-center group ${className}`}>
      <div className="relative mb-3 min-[481px]:mb-6">
        <div className="w-16 h-16 min-[481px]:w-24 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-[#f4ece1] relative z-10 overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
          <span className="text-xl min-[481px]:text-3xl md:text-6xl font-serif text-[#b35a44] tabular-nums">
            {value.toString().padStart(2, '0')}
          </span>
        </div>
        {/* Subtle inner shadow/gradient for depth */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-stone-50/50 to-transparent pointer-events-none z-20"></div>
      </div>
      <span className="text-[8px] min-[481px]:text-[10px] md:text-[12px] font-bold uppercase tracking-[0.2em] min-[481px]:tracking-[0.3em] text-[#6d5b6b] mt-1">
        {label === "SECONDS" ? "SEC" : label}
      </span>
    </div>
  );

  return (
    <section className="relative min-h-[40vh] min-[481px]:min-h-[60vh] flex items-center justify-center py-12 min-[481px]:py-24 overflow-hidden bg-[#fdfaf6]">
      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center">
        <div className="mb-10 min-[481px]:mb-16 md:mb-20">
          <h2 className="font-serif text-2xl min-[481px]:text-3xl md:text-5xl lg:text-6xl text-[#b35a44] italic font-medium tracking-tight px-4">
            Counting down the days until we say "I Do"
          </h2>
        </div>

        <div className="flex justify-center gap-2 min-[481px]:gap-6 md:gap-12 lg:gap-16">
          <TimeBox value={timeLeft.days} label="DAYS" />
          <TimeBox value={timeLeft.hours} label="HOURS" />
          <TimeBox value={timeLeft.minutes} label="MINUTES" />
          <TimeBox value={timeLeft.seconds} label="SECONDS" />
        </div>
      </div>
    </section>
  );
};
