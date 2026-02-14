
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const moments = [
    {
        id: 1,
        title: "How We Met",
        text: "A rainy afternoon in a small bookstore, sharing the last copy of an autumnal poetry collection. It was fate in its warmest form.",
        image: "https://images.unsplash.com/photo-1522673607200-1648832cee98?auto=format&fit=crop&q=80&w=1000",
        color: "#fdf148"
    },
    {
        id: 2,
        title: "Our Adventures",
        text: "From hiking the Adirondacks to cozy coffee shop dates, every moment has been a leaf in our growing tree.",
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000",
        color: "#e8f5e9"
    },
    {
        id: 3,
        title: "The Proposal",
        text: "Under the golden canopy of Central Park, Daniel asked the biggest question of our lives as the leaves fell around us.",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000",
        color: "#fce4ec"
    },
    {
        id: 4,
        title: "To Forever",
        text: "We can't wait to start this next chapter with all of you by our side in the glow of the autumn sun.",
        image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1000",
        color: "#fff"
    }
];

export const StoryInteractive: React.FC = () => {
    const [activeMoment, setActiveMoment] = useState(moments[0]);

    return (
        <section className="relative py-24 md:py-40 bg-[#c5d0a6] overflow-hidden min-h-screen flex items-center justify-center">
            {/* Background Split */}
            <div className="absolute inset-0 flex">
                <div className="w-1/3 h-full bg-[#fdfaf6]/10 backdrop-blur-sm border-r border-white/10"></div>
                <div className="w-1/3 h-full bg-transparent"></div>
                <div className="w-1/3 h-full bg-[#fdfaf6]/10 backdrop-blur-sm border-l border-white/10"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-6xl md:text-8xl font-signature text-[#b35a44] italic">Our Journey</h2>
                    <div className="w-24 h-1 bg-[#fdf148] mx-auto mt-4"></div>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

                    {/* Left Column Cards */}
                    <div className="flex flex-col gap-8 w-full lg:w-1/4">
                        {moments.slice(0, 2).map((moment) => (
                            <motion.div
                                key={moment.id}
                                onMouseEnter={() => setActiveMoment(moment)}
                                className={`p-8 rounded-[2rem] cursor-pointer transition-all duration-500 shadow-xl ${activeMoment.id === moment.id ? 'bg-white scale-105' : 'bg-white/40 hover:bg-white/60'
                                    }`}
                            >
                                <h3 className="text-[#b35a44] font-bold text-xl mb-3">{moment.title}</h3>
                                <p className="text-stone-600 font-serif italic text-sm leading-relaxed">
                                    {moment.text}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Center Portrait Frame */}
                    <div className="relative w-full lg:w-[450px] aspect-[4/5]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeMoment.id}
                                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.6, ease: "anticipate" }}
                                className="w-full h-full rounded-[10rem] overflow-hidden border-[15px] border-white shadow-2xl relative"
                            >
                                <img
                                    src={activeMoment.image}
                                    alt={activeMoment.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </motion.div>
                        </AnimatePresence>
                        {/* Decorative background circle */}
                        <div className="absolute -inset-10 bg-white/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                    </div>

                    {/* Right Column Cards */}
                    <div className="flex flex-col gap-8 w-full lg:w-1/4">
                        {moments.slice(2, 4).map((moment) => (
                            <motion.div
                                key={moment.id}
                                onMouseEnter={() => setActiveMoment(moment)}
                                className={`p-8 rounded-[2rem] cursor-pointer transition-all duration-500 shadow-xl ${activeMoment.id === moment.id ? 'bg-white scale-105' : 'bg-white/40 hover:bg-white/60'
                                    }`}
                            >
                                <h3 className="text-[#b35a44] font-bold text-xl mb-3">{moment.title}</h3>
                                <p className="text-stone-600 font-serif italic text-sm leading-relaxed">
                                    {moment.text}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};
