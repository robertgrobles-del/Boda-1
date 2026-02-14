
import React from 'react';
import { motion } from 'framer-motion';

const images = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1519225495810-7517c339ee0b?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1465495910483-0487495c977e?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000"
];

export const Gallery: React.FC<{ id: string }> = ({ id }) => {
  return (
    <section id={id} className="min-h-screen py-16 md:py-24 bg-[#fdfaf6] flex flex-col justify-center overflow-hidden">
      <div className="text-center mb-10 md:mb-16 px-6">
        <span className="text-[#b35a44] text-[10px] font-bold uppercase tracking-[0.4em] mb-3 block">MOMENTOS</span>
        <h2 className="font-serif text-4xl md:text-5xl text-stone-800 mb-3 md:mb-4">Nuestra Galería</h2>
        <p className="text-stone-500 italic text-sm md:text-base">Capturando instantes que durarán para siempre</p>
      </div>
      
      {/* Versión Móvil: Carrusel Horizontal */}
      <div className="md:hidden w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-6 pb-8">
        {images.map((img, i) => (
          <motion.div 
            key={`mobile-${i}`} 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-shrink-0 w-[85vw] aspect-[3/4] snap-center rounded-[2rem] overflow-hidden shadow-xl border-4 border-white"
          >
            <img 
              src={img} 
              alt={`Galería Móvil ${i}`} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
        {/* Espaciador final para el scroll en móvil */}
        <div className="flex-shrink-0 w-2 h-full"></div>
      </div>

      {/* Versión Escritorio: Cuadrícula Masonry */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {images.map((img, i) => (
          <motion.div 
            key={`desktop-${i}`} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-2xl shadow-sm break-inside-avoid group"
          >
            <img 
              src={img} 
              alt={`Galería Desktop ${i}`} 
              className="w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-700 cursor-zoom-in"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
          </motion.div>
        ))}
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
