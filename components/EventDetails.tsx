
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Church, Utensils, CircleParking } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { MAPS_URLS } from '../constants';

export const EventDetails: React.FC<{ id: string }> = ({ id }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section id={id} className="min-h-screen py-20 md:py-32 px-6 bg-white relative overflow-hidden flex flex-col justify-center">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 opacity-[0.2] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <SectionHeader
          eyebrow="El gran día"
          title={<span className="font-signature text-olive">Cuándo &amp; Dónde</span>}
          className="mb-16 md:mb-24"
        />

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto"
        >
          {/* Ceremony Card */}
          <motion.div
            variants={itemVariants}
            className="bg-[#f9fafb] rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col items-center text-center group h-full"
          >
            {/* Decorative Blooms */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d9a58f] rounded-bl-full opacity-40 -mr-8 -mt-8"></div>

            {/* Icon Container */}
            <div className="relative z-10 mb-8">
              <div className="w-16 h-16 bg-cream border border-olive/20 rounded-full flex items-center justify-center shadow-sm">
                <Church size={28} className="text-terracotta" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 mb-6 flex-grow">
              <h3 className="text-2xl md:text-4xl font-serif italic text-ink">Ceremonia</h3>
              <p className="text-olive font-bold text-[10px] uppercase tracking-[0.2em]">5:00 PM</p>
            </div>

            <div className="relative z-10 w-full pt-8 border-t border-gray-200">
              <div className="flex items-start justify-center gap-2 mb-3">
                <MapPin size={18} className="text-terracotta mt-1 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[#1f2937] font-serif font-bold text-sm md:text-base">Catedral Castrense de Santa Bárbara</p>
                  <p className="text-[#6b7280] text-xs md:text-sm">
                    C. General Gabino Puello, Ciudad Colonial, Santo Domingo
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <a
                  href={MAPS_URLS.ceremony}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-terracotta px-5 py-2 text-[9px] font-bold uppercase tracking-widest text-white transition-all shadow-sm hover:bg-terracotta/90 active:scale-95"
                >
                  <MapPin size={13} />
                  Ver Ubicación
                </a>

                <a
                  href={MAPS_URLS.ceremonyParking}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-olive/30 bg-olive/5 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-olive transition-all hover:bg-olive hover:text-white active:scale-95"
                  title="Opción de parqueo recomendada, cerca de la iglesia"
                >
                  <CircleParking size={13} />
                  Opción de parqueo recomendada
                </a>
              </div>
            </div>

            {/* Image */}
            <div className="mt-8 w-full h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              <img
                src="/images/Iglesia_Santa_Barbara.webp"
                alt="Catedral Castrense de Santa Bárbara"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Reception Card */}
          <motion.div
            variants={itemVariants}
            className="bg-[#f9fafb] rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col items-center text-center group h-full"
          >
            {/* Decorative Blooms */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d9a58f] rounded-bl-full opacity-40 -mr-8 -mt-8"></div>

            {/* Icon Container */}
            <div className="relative z-10 mb-8">
              <div className="w-16 h-16 bg-cream border border-olive/20 rounded-full flex items-center justify-center shadow-sm">
                <Utensils size={28} className="text-terracotta" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 mb-6 flex-grow">
              <h3 className="text-2xl md:text-4xl font-serif italic text-ink">Recepción</h3>
              <p className="text-olive font-bold text-[10px] uppercase tracking-[0.2em]">6:30 PM – Tarde</p>
            </div>

            <div className="relative z-10 w-full pt-8 border-t border-gray-200">
              <div className="flex items-start justify-center gap-2 mb-2">
                <MapPin size={18} className="text-terracotta mt-1 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[#1f2937] font-serif font-bold text-sm md:text-base">Club Deportivo Naco · Salón Montás</p>
                  <p className="text-[#6b7280] text-xs md:text-sm">
                    C. Salvador Sturla, Santo Domingo
                  </p>
                </div>
              </div>

              {/* Nota de parqueo */}
              <div className="mt-3 mb-1">
                <span className="inline-block text-[11px] text-amber-900 font-medium bg-amber-50 border border-amber-200/70 rounded-full py-1 px-3">
                  ⚠️ Nota: El salón no cuenta con parqueo
                </span>
              </div>

              <div className="mt-3">
                <a
                  href={MAPS_URLS.reception}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border border-olive/30 px-5 py-2 text-[9px] font-bold uppercase tracking-widest text-olive transition-all hover:bg-olive hover:text-white active:scale-95"
                >
                  Ver Mapa
                </a>
              </div>
            </div>

            {/* Map Placeholder Image */}
            <div className="mt-8 w-full h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              <img
                src="/images/club_naco.webp"
                alt="Club Deportivo Naco - Salón Montás"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
