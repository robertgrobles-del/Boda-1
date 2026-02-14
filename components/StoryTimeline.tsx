
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, MapPin, Stars } from 'lucide-react';

const timelineEvents = [
    {
        year: "2023",
        date: "April 12",
        title: "The First Hello",
        description: "A chance meeting at a local bookstore that changed everything. Coffee followed, and the rest is history.",
        icon: <Heart className="text-pink-500" size={24} />,
        side: "left"
    },
    {
        year: "2024",
        date: "July 22",
        title: "The First Big Adventure",
        description: "Our first trip together to the mountains. Hiking, stargazing, and discovering our shared love for the wild.",
        icon: <MapPin className="text-blue-500" size={24} />,
        side: "right"
    },
    {
        year: "2025",
        date: "November 11",
        title: "She Said Yes!",
        description: "Under the golden autumn leaves of Central Park, we promised forever to each other.",
        icon: <Stars className="text-yellow-500" size={24} />,
        side: "left"
    },
    {
        year: "2026",
        date: "November 11",
        title: "The Big Day",
        description: "Where our new chapter officially begins, surrounded by the people we love most.",
        icon: <Calendar className="text-[#b35a44]" size={24} />,
        side: "right"
    }
];

export const StoryTimeline: React.FC = () => {
    return (
        <section className="relative py-24 md:py-40 bg-[#fdfaf6] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="text-center mb-24">
                    <h2 className="text-6xl md:text-8xl font-signature text-[#4a5d23] italic">Our Timeline</h2>
                    <div className="w-20 h-1 bg-[#b35a44] mx-auto mt-6"></div>
                </div>

                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-stone-200 hidden md:block"></div>

                    <div className="space-y-24">
                        {timelineEvents.map((event, index) => (
                            <div key={index} className="relative">
                                {/* Desktop Layout */}
                                <div className={`flex flex-col md:flex-row items-center gap-12 md:gap-0 ${event.side === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'
                                    }`}>

                                    {/* Content side */}
                                    <motion.div
                                        initial={{ opacity: 0, x: event.side === 'left' ? -50 : 50 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8 }}
                                        className={`w-full md:w-[45%] ${event.side === 'left' ? 'md:text-right' : 'md:text-left'
                                            }`}
                                    >
                                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-stone-50 hover:shadow-2xl transition-shadow">
                                            <span className="text-[#b35a44] font-bold text-sm tracking-widest uppercase block mb-2">
                                                {event.date}, {event.year}
                                            </span>
                                            <h3 className="text-3xl font-serif text-stone-800 mb-4">{event.title}</h3>
                                            <p className="text-stone-500 text-lg font-light leading-relaxed italic">
                                                "{event.description}"
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Dot / Icon in the center */}
                                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-10 hidden md:flex">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            whileInView={{ scale: 1 }}
                                            viewport={{ once: true }}
                                            className="w-16 h-16 bg-white rounded-full shadow-lg border-4 border-[#fdfaf6] flex items-center justify-center"
                                        >
                                            {event.icon}
                                        </motion.div>
                                    </div>

                                    {/* Empty side for layout */}
                                    <div className="hidden md:block w-[45%]"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
