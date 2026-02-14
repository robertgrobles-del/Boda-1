
import React from 'react';
import { motion } from 'framer-motion';

export const StoryImproved: React.FC = () => {
    const [isLoaded, setIsLoaded] = React.useState(false);

    return (
        <section className="relative pt-16 pb-24 md:py-40 bg-[#fdfaf6] overflow-hidden min-h-screen flex items-center">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        d="M0,50 Q25,30 50,50 T100,50"
                        fill="none"
                        stroke="#b35a44"
                        strokeWidth="0.1"
                    />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-32">

                    {/* Mobile-only Header (<= 480px) */}
                    <div className="w-full text-left max-[480px]:block hidden mb-4 px-2">
                        <span className="text-[#b35a44] text-[10px] font-bold uppercase tracking-[0.4em] block mb-2 opacity-80">CAPÍTULO I</span>
                        <h2 className="text-5xl leading-tight">
                            <span className="font-signature text-[#4a5d23] italic">Nuestra Historia</span>
                        </h2>
                    </div>

                    {/* Image Side with Parallax */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="w-full lg:w-1/2 relative order-1 max-[480px]:order-2"
                    >
                        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl group max-[480px]:rounded-[2.5rem] bg-stone-100 z-10">
                            {/* Skeleton Screen */}
                            {!isLoaded && (
                                <div className="absolute inset-0 bg-stone-200 animate-pulse z-10"></div>
                            )}
                            <motion.img
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 1.5 }}
                                src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000&fm=webp"
                                alt="Nuestra Historia"
                                className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setIsLoaded(true)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#b35a44]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        </div>
                        {/* Decorative floating frame */}
                        <div className="absolute -top-4 -left-4 md:-top-6 md:-left-6 w-full h-full border-2 border-[#b35a44]/10 rounded-[2rem] -z-10 border-stone-200"></div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#4a5d23]/5 rounded-full blur-3xl -z-10"></div>

                        {/* Stats Section ONLY Mobile Overlay (<= 480px) */}
                        <div className="max-[480px]:flex hidden absolute -bottom-8 -right-4 z-20 justify-around bg-white/95 backdrop-blur-sm px-6 py-8 rounded-[2rem] shadow-2xl border border-stone-200/50 min-w-[240px]">
                            <div className="text-center px-4">
                                <span className="text-4xl font-serif text-[#4a5d23]">1,406</span>
                                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400 mt-2 leading-tight">DÍA DE<br />COMPLICIDAD</p>
                            </div>
                            <div className="w-px h-12 bg-stone-100"></div>
                            <div className="text-center px-4">
                                <span className="text-4xl font-serif text-[#4a5d23]">∞</span>
                                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400 mt-2 leading-tight">POR<br />ESCRIBIR</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="w-full lg:w-1/2 space-y-8 lg:space-y-10 order-2 max-[480px]:order-3"
                    >
                        <div className="space-y-4 max-[480px]:hidden text-center lg:text-left">
                            <span className="text-[#b35a44] text-[10px] font-bold uppercase tracking-[0.4em] block">CAPÍTULO I</span>
                            <h2 className="text-6xl md:text-8xl leading-tight">
                                <span className="font-signature text-[#4a5d23] block">Nuestra</span>
                                <span className="font-serif italic text-[#1a1a1a]">Historia</span>
                            </h2>
                            <div className="w-20 h-1 bg-[#b35a44] rounded-full mx-auto lg:mx-0"></div>
                        </div>

                        <div className="space-y-6 lg:space-y-8 text-stone-600 text-sm lg:text-xl font-serif italic leading-relaxed text-center lg:text-left">
                            <p>
                                Todo comenzó con un amor compartido por la naturaleza y las mañanas tranquilas de domingo. Lo que empezó como una simple cita para tomar café se convirtió en una vida de aventuras.
                            </p>
                            <p>
                                Los invitamos a acompañarnos donde nuestras raíces son más profundas, rodeados de las personas que nos han ayudado a crecer.
                            </p>
                        </div>

                        {/* Stats Section (Desktop/Tablet) */}
                        <div className="grid grid-cols-2 gap-12 max-[480px]:hidden">
                            <div className="space-y-2">
                                <span className="text-5xl md:text-7xl font-serif text-[#4a5d23]">1,406</span>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Días de complicidad</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-5xl md:text-7xl font-serif italic text-[#4a5d23]">∞</span>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Por escribir</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
