
import React from 'react';
import { motion } from 'framer-motion';

const steps = [
    {
        number: "01",
        title: "The First Spark",
        text: "It started with a shared umbrella during an unexpected April shower in the city. A coffee date turned into a five-hour conversation.",
        color: "#fef9c3"
    },
    {
        number: "02",
        title: "Growing Roots",
        text: "Three years of hiking, hundreds of shared meals, and one semi-successful sourdough starter later, we knew this was forever.",
        color: "#fef9c3"
    },
    {
        number: "03",
        title: "The Proposal",
        text: "Atop the Blue Ridge Mountains, amidst the golden hour glow, Daniel finally popped the question. (He almost dropped the ring, but that's a story for another time!)",
        color: "#fef9c3"
    }
];

export const StoryCards: React.FC = () => {
    return (
        <section className="relative py-24 md:py-40 bg-[#c5d0a6] overflow-hidden min-h-[80vh] flex items-center">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-6xl md:text-8xl font-signature text-stone-800 italic">Our Journey</h2>
                    <div className="w-20 h-1 bg-[#b35a44] mx-auto mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            whileHover={{ y: -15 }}
                            className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-2xl relative group"
                        >
                            {/* Number Badge */}
                            <div
                                className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-lg mb-10 transition-transform group-hover:scale-110"
                                style={{ backgroundColor: step.color }}
                            >
                                {step.number}
                            </div>

                            <h3 className="text-3xl md:text-4xl font-serif italic text-stone-800 mb-6">{step.title}</h3>
                            <p className="text-stone-500 text-lg leading-relaxed font-light">
                                {step.text}
                            </p>

                            {/* Subtle accent corner */}
                            <div className="absolute bottom-10 right-10 w-4 h-4 rounded-full bg-[#fef9c3] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
