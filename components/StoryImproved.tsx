
import React from 'react';
import { motion } from 'framer-motion';
import { PHOTOS } from '../constants';

export const StoryImproved: React.FC = () => {
    const [isLoaded, setIsLoaded] = React.useState(false);

    return (
        <section id="historia" className="relative pt-16 pb-24 md:py-40 bg-cream overflow-hidden min-h-screen flex items-center">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        d="M0,50 Q25,30 50,50 T100,50"
                        fill="none"
                        stroke="#4a5d23"
                        strokeWidth="0.1"
                    />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-32">

                    {/* Mobile-only Header (<= 480px) */}
                    <div className="w-full text-left max-[480px]:block hidden mb-4 px-2">
                        <h2 className="text-4xl sm:text-5xl leading-tight">
                            <span className="font-signature text-olive italic">La belleza del sacramento</span>
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
                        <div className="paper-edge-y relative aspect-[4/5] overflow-hidden group bg-stone-100 z-10">
                            {/* Skeleton Screen */}
                            {!isLoaded && (
                                <div className="absolute inset-0 bg-stone-200 animate-pulse z-10"></div>
                            )}
                            <motion.img
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 1.5 }}
                                src={PHOTOS.story}
                                alt="La belleza del sacramento"
                                className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setIsLoaded(true)}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-olive/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        </div>
                        {/* Decorative floating frame */}
                        <div className="absolute -top-4 -left-4 md:-top-6 md:-left-6 w-full h-full border-2 border-olive/10 -z-10 border-stone-200"></div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-olive/5 rounded-full blur-3xl -z-10"></div>

                        {/* Stats Section ONLY Mobile Overlay (<= 480px) */}
                        <div className="max-[480px]:flex hidden absolute left-1/2 -translate-x-1/2 -bottom-8 z-20 justify-around bg-white/95 backdrop-blur-sm px-6 py-8 rounded-[2rem] shadow-2xl border border-stone-200/50 min-w-[240px]">
                            <div className="text-center px-4">
                                <span className="text-4xl font-serif text-olive">1,406</span>
                                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400 mt-2 leading-tight">DÍA DE<br />COMPLICIDAD</p>
                            </div>
                            <div className="w-px h-12 bg-stone-100"></div>
                            <div className="text-center px-4">
                                <span className="text-4xl font-serif text-olive">∞</span>
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
                            <h2 className="text-5xl md:text-7xl leading-tight">
                                <span className="font-signature text-olive block">La belleza del</span>
                                <span className="font-serif italic text-ink">Sacramento</span>
                            </h2>
                            <div className="w-20 h-1 bg-olive rounded-full mx-auto lg:mx-0"></div>
                        </div>

                        <div className="space-y-4 lg:space-y-6 text-stone-600 text-xs md:text-base font-serif italic leading-relaxed text-center lg:text-left">
                            <p>
                                «Los esposos, ya no encadenados, sino adornados; ya no impedidos, sino confortados con el lazo de oro del sacramento, deben procurar resueltamente que su unión conyugal, no sólo por la fuerza y la significación del sacramento, sino también por su espíritu y por su conducta de vida, sea siempre imagen, y permanezca ésta viva, de aquella fecundísima unión de Cristo con su Iglesia, que es, en verdad, el misterio venerable de la perfecta caridad.
                            </p>
                            <p>
                                Si ponderamos atentamente y con viva fe, si ilustramos con la debida luz estos eximios bienes del matrimonio —la prole, la fe y el sacramento—, es imposible no admirar la sabiduría, la santidad y la benignidad divina, pues tan ampliamente proveyó no sólo a la dignidad y felicidad de los cónyuges, sino también a la conservación y propagación del género humano, susceptible tan sólo de procurarse con la casta y sagrada unión del vínculo nupcial.»
                            </p>
                            <p className="not-italic font-sans text-xs uppercase tracking-[0.2em] text-olive font-semibold pt-1">
                                — Papa Pío XI, <span className="italic font-serif">Casti Connubii</span>
                            </p>
                        </div>

                        {/* Stats Section (Desktop/Tablet) */}
                        <div className="grid grid-cols-2 gap-12 max-[480px]:hidden">
                            <div className="space-y-2">
                                <span className="text-5xl md:text-7xl font-serif text-olive">1,406</span>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Días de complicidad</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-5xl md:text-7xl font-serif italic text-olive">∞</span>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Por escribir</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
