
import React from 'react';
import { motion } from 'framer-motion';

export const OurStory: React.FC = () => {
  return (
    <section className="relative py-16 md:py-32 bg-white overflow-hidden min-h-screen flex items-center">

      {/* IMAGEN DE FONDO (Solo en Móvil) / IMAGEN LATERAL (Desktop) */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 lg:relative lg:inset-auto lg:w-1/2 lg:h-auto z-0 lg:z-10 flex justify-center lg:justify-start"
      >
        <div className="relative w-full h-full lg:w-full lg:max-w-[85%] lg:transform lg:rotate-[8deg] lg:px-6">
          {/* Marco decorativo - Solo visible en Desktop */}
          <div className="hidden lg:block absolute -top-4 -left-4 w-full h-full border border-[#b35a44]/20 rounded-2xl z-0"></div>

          <div className="relative z-10 w-full h-full lg:rounded-2xl overflow-hidden shadow-2xl lg:aspect-[4/5]">
            <img
              src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000"
              alt="Nuestra Historia"
              className="w-full h-full object-cover lg:object-center"
            />
            {/* Overlay para legibilidad en móvil */}
            <div className="absolute inset-0 bg-white/70 lg:bg-gradient-to-t lg:from-black/20 lg:to-transparent backdrop-blur-[2px] lg:backdrop-blur-0"></div>
          </div>
        </div>
      </motion.div>

      {/* CONTENIDO DE TEXTO */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-20 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

          {/* Espaciador para Desktop (ocupa el lugar de la imagen lateral) */}
          <div className="hidden lg:block lg:w-1/2"></div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-full lg:w-1/2 text-center lg:text-left"
          >
            <div className="space-y-6 md:space-y-10">
              <div className="flex flex-col items-center lg:items-start">
                <h2 className="font-serif text-5xl md:text-7xl text-[#1a1a1a] mb-4 md:mb-8 italic">Nuestra Historia</h2>
                <div className="w-16 h-1 bg-[#b35a44] rounded-full mb-6 md:mb-10"></div>
              </div>

              <div className="space-y-4 md:space-y-8 text-stone-700 lg:text-stone-500 text-base md:text-2xl leading-relaxed font-medium lg:font-light">
                <p>
                  Todo comenzó con un amor compartido por la naturaleza y las mañanas tranquilas de domingo. Lo que empezó como una simple cita para tomar café se convirtió en una vida de aventuras.
                </p>
                <p>
                  Los invitamos a acompañarnos donde nuestras raíces son más profundas, rodeados de las personas que nos han ayudado a crecer.
                </p>
                <p className="italic text-[#4a5d23] lg:text-stone-400 font-semibold lg:font-normal">
                  Nuestra boda será una celebración del amor orgánico, la elegancia moderna y los colores vibrantes de nuestra vida juntos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-12 pt-8 border-t border-[#b35a44]/20 lg:border-stone-100">
                <div className="space-y-1">
                  <span className="text-4xl md:text-6xl font-serif text-[#b35a44] block">1,406</span>
                  <span className="text-[9px] md:text-xs uppercase tracking-[0.3em] font-bold text-stone-600 lg:text-stone-400">Días Juntos</span>
                </div>
                <div className="space-y-1">
                  <span className="text-4xl md:text-6xl font-serif italic text-[#b35a44] block">Infinitos</span>
                  <span className="text-[9px] md:text-xs uppercase tracking-[0.3em] font-bold text-stone-600 lg:text-stone-400">Recuerdos</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Líneas decorativas de fondo (Desktop) */}
      <div className="hidden lg:block absolute top-0 right-0 w-full h-full pointer-events-none opacity-[0.03] z-0">
        <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M0,500 C200,300 400,700 600,500 C800,300 1000,700 1200,500" fill="none" stroke="#1a1a1a" strokeWidth="2" />
          <path d="M-200,600 C0,400 200,800 400,600 C600,400 800,800 1000,600" fill="none" stroke="#1a1a1a" strokeWidth="2" />
        </svg>
      </div>
    </section>
  );
};
