
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Church, Utensils } from 'lucide-react';

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
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-4xl md:text-7xl font-signature text-[#4a5d23] mb-4">
            Cuándo & Dónde
          </h2>
          <div className="w-20 h-1 bg-[#b35a44] mx-auto rounded-full"></div>
        </motion.div>

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
            className="bg-[#f9fafb] rounded-[2rem] p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col items-center text-center group h-full"
          >
            {/* Decorative Blooms */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#e5e7eb] rounded-bl-full opacity-40 -mr-8 -mt-8"></div>

            {/* Icon Container */}
            <div className="relative z-10 mb-8">
              <div className="w-16 h-16 bg-[#fdfaf6] border border-[#b35a44]/20 rounded-full flex items-center justify-center shadow-sm">
                <Church size={28} className="text-[#b35a44]" />
              </div>
            </div>

            <div className="relative z-10 space-y-4 mb-8 flex-grow">
              <h3 className="text-2xl md:text-4xl font-serif italic text-[#1a1a1a]">La Ceremonia</h3>
              <p className="text-[#4a5d23] font-bold text-[10px] uppercase tracking-[0.2em]">4:00 PM – 5:30 PM</p>
              <p className="text-[#4b5563] text-sm md:text-base leading-relaxed">
                Acompáñanos a intercambiar votos en la histórica Catedral de Santo Domingo. Por favor llegar 30 minutos antes.
              </p>
            </div>

            <div className="relative z-10 w-full pt-8 border-t border-gray-200">
              <div className="flex items-start justify-center gap-2 mb-2">
                <MapPin size={18} className="text-[#ef4444] mt-1 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[#1f2937] font-serif font-bold text-sm md:text-base">Catedral Primada de las Américas</p>
                  <p className="text-[#6b7280] text-xs md:text-sm">
                    C. Isabel La Católica, Santo Domingo 10210
                  </p>
                </div>
              </div>
              <a
                href="https://share.google/ui68HRiF4B5XvdeHw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b35a44] text-[10px] font-bold uppercase tracking-widest hover:text-[#a04d39] transition-colors"
              >
                Ver Mapa
              </a>
            </div>

            {/* Map Placeholder Image */}
            <div className="mt-8 w-full h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              <img
                src="https://images.visitarepublicadominicana.org/Catedral-Primada-de-America.jpg"
                alt="Catedral Primada de las Américas"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          </motion.div>

          {/* Reception Card */}
          <motion.div
            variants={itemVariants}
            className="bg-[#f9fafb] rounded-[2rem] p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col items-center text-center group h-full"
          >
            {/* Decorative Blooms */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fee2e2] rounded-bl-full opacity-40 -mr-8 -mt-8"></div>

            {/* Icon Container */}
            <div className="relative z-10 mb-8">
              <div className="w-16 h-16 bg-[#fdfaf6] border border-[#4a5d23]/20 rounded-full flex items-center justify-center shadow-sm">
                <Utensils size={28} className="text-[#4a5d23]" />
              </div>
            </div>

            <div className="relative z-10 space-y-4 mb-8 flex-grow">
              <h3 className="text-2xl md:text-4xl font-serif italic text-[#1a1a1a]">La Recepción</h3>
              <p className="text-[#4a5d23] font-bold text-[10px] uppercase tracking-[0.2em]">6:30 PM – Tarde</p>
              <p className="text-[#4b5563] text-sm md:text-base leading-relaxed">
                Cena, bebidas y baile bajo las estrellas. Se recomienda vestimenta de cóctel.
              </p>
            </div>

            <div className="relative z-10 w-full pt-8 border-t border-gray-200">
              <div className="flex items-start justify-center gap-2 mb-2">
                <MapPin size={18} className="text-[#f67c55] mt-1 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[#1f2937] font-serif font-bold text-sm md:text-base">Centro de Convenciones Sans Soucí</p>
                  <p className="text-[#6b7280] text-xs md:text-sm">
                    Av. España, Santo Domingo Este
                  </p>
                </div>
              </div>
              <a
                href="https://share.google/deL8oqlJXLx59l10F"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b35a44] text-[10px] font-bold uppercase tracking-widest hover:text-[#a04d39] transition-colors"
              >
                Ver Mapa
              </a>
            </div>

            {/* Map Placeholder Image */}
            <div className="mt-8 w-full h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              <img
                src="https://sansouci.com.do/wp-content/uploads/2020/12/img-euk-scaled.jpg"
                alt="Centro de Convenciones de Sans Soucí"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
