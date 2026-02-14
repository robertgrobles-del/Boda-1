
import React from 'react';
import { Upload, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

const images = [
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1000&fm=webp", // Header 1
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1000&fm=webp", // Header 2 (Bride focus)
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=1000&fm=webp",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000&fm=webp",
    "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=1000&fm=webp",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1000&fm=webp",
    "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=1000&fm=webp",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1000&fm=webp"
];

const GalleryImage: React.FC<{ src: string, alt: string, className?: string }> = ({ src, alt, className }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    return (
        <div className={`relative w-full h-full bg-stone-100 ${className || ''}`}>
            {!isLoaded && <div className="absolute inset-0 bg-stone-200 animate-pulse z-10" />}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
            />
        </div>
    );
};

export const UnifiedGallery: React.FC<{ id: string }> = ({ id }) => {
    const [isPaused, setIsPaused] = React.useState(false);

    return (
        <section id={id} className="relative min-h-screen bg-[#fdfaf6] py-20 overflow-hidden">
            {/* 1. Header Section (Social/Intro) */}
            <div className="max-w-7xl mx-auto w-full px-6 lg:px-32 mb-12 md:mb-20 text-center lg:text-left">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6 md:space-y-8"
                    >
                        <div className="space-y-3 md:space-y-4">
                            <span className="text-[#b35a44] text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] block">NUESTRA HISTORIA EN FOTOS</span>
                            <h2 className="text-4xl md:text-7xl lg:text-8xl leading-none">
                                <span className="font-signature text-[#4a5d23] block">Capture the Moments</span>
                            </h2>
                            <p className="text-stone-500 text-sm md:text-xl font-serif italic max-w-lg leading-relaxed mx-auto lg:mx-0">
                                "Ayúdanos a coleccionar cada sonrisa. Comparte tus fotos usando nuestro hashtag oficial o súbelas directamente."
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 md:gap-6">
                            <div className="inline-block px-6 py-2.5 border border-[#b35a44] rounded-full max-[480px]:bg-transparent">
                                <span className="text-sm md:text-xl font-serif font-bold text-[#b35a44]">
                                    #StephanieDanielTwilight
                                </span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-3 px-6 py-3 bg-[#4a5d23] text-white text-[10px] uppercase font-bold tracking-[0.2em] rounded-full shadow-lg"
                            >
                                <Upload size={14} />
                                SUBIR O COMPÁRTENOS TUS FOTOS
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Mobile Grid (<= 480px) - Hidden to prioritize carousel */}
                    <motion.div
                        className="max-[480px]:hidden grid-cols-2 gap-3 h-auto hidden"
                    >
                        <div className="rounded-2xl overflow-hidden aspect-[3/4] shadow-md">
                            <GalleryImage src={images[0]} alt="Gallery 1" />
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-square shadow-md">
                            <GalleryImage src={images[2]} alt="Gallery 2" />
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-square shadow-md -mt-10">
                            <GalleryImage src={images[3]} alt="Gallery 3" />
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-video shadow-md mt-1">
                            <GalleryImage src={images[4]} alt="Gallery 4" />
                        </div>
                    </motion.div>

                    {/* Intro Mini-Grid (Desktop) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="hidden lg:grid grid-cols-2 gap-4 h-[400px] relative"
                    >
                        <div className="rounded-3xl overflow-hidden shadow-xl transform -rotate-3 border-4 border-white">
                            <GalleryImage src={images[0]} alt="Novios 1" />
                        </div>
                        <div className="rounded-3xl overflow-hidden shadow-xl transform rotate-3 mt-12 border-4 border-white">
                            <GalleryImage src={images[1]} alt="Novios 2" className="object-right scale-[1.4]" />
                        </div>
                        {/* Overlay Icon */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl z-20">
                            <Instagram className="text-[#4a5d23]" size={20} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* 2. Main Gallery Carousel (Infinite Marquee) */}
            <div className="w-full relative overflow-hidden py-10">
                <motion.div
                    className="flex gap-6 whitespace-nowrap"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    animate={isPaused ? { x: undefined } : { x: ["0%", "-50%"] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 40,
                            ease: "linear",
                        },
                    }}
                    style={{ width: "fit-content" }}
                >
                    {/* First Set of Slides + Second Set (for seamless loop) */}
                    {[...Array(2)].map((_, setIndex) => (
                        <div key={`set-${setIndex}`} className="flex gap-6 pr-6">
                            {images.slice(2).map((img, i) => (
                                <motion.div
                                    key={`slide-${setIndex}-${i}`}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className="flex-shrink-0 w-[80vw] md:w-[400px] aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white relative group"
                                >
                                    <GalleryImage
                                        src={img}
                                        alt={`Galería ${i}`}
                                        className="group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                                </motion.div>
                            ))}

                            {/* Magic Box Slide */}
                            <motion.div
                                key={`magic-${setIndex}`}
                                whileHover={{ scale: 1.05, rotate: 2 }}
                                className="flex-shrink-0 w-[80vw] md:w-[400px] aspect-[4/5] rounded-[2.5rem] bg-[#fdf148] flex flex-col items-center justify-center p-10 text-center shadow-xl border-4 border-white transition-transform"
                            >
                                <p className="font-signature text-[#4a5d23] text-5xl md:text-6xl rotate-[-5deg] mb-4 whitespace-normal">Add your magic!</p>
                                <p className="text-[#4a5d23]/60 font-serif italic text-base whitespace-normal">Tus fotos aparecerán en nuestro muro en vivo</p>
                            </motion.div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </section>
    );
};
