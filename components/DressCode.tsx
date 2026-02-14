
import React from 'react';
import { motion } from 'framer-motion';

export const DressCode: React.FC = () => {
  return (
    <section className="min-h-[60vh] h-full flex items-start justify-center pt-16 pb-16 min-[481px]:pt-32 min-[481px]:pb-32 bg-white relative border-b border-stone-100">
      <div className="max-w-4xl mx-auto px-6 w-full">
        <div className="text-center mb-8 min-[481px]:mb-10">
          <h2 className="font-serif text-3xl min-[481px]:text-4xl lg:text-5xl text-[#4a5d23]">Código de Vestimenta</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 relative">
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2/3 w-px bg-stone-100"></div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center p-6 min-[481px]:p-10"
          >
            <div className="w-16 h-16 min-[481px]:w-20 min-[481px]:h-20 bg-[#f1f4ea] rounded-full flex items-center justify-center mb-6 min-[481px]:mb-8">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 min-[481px]:w-10 min-[481px]:h-10 text-[#4a5d23]" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM12 2v2m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 6v7" strokeLinecap="round" />
                <path d="M4 11s2 6 8 6 8-6 8-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg min-[481px]:text-xl font-bold text-stone-800 mb-2 min-[481px]:mb-3">Formal / Elegante</h3>
            <p className="text-stone-400 text-[10px] min-[481px]:text-xs leading-relaxed max-w-[200px]">
              Ellas: Vestido Largo.<br />
              Ellos: Traje oscuro o Tuxedo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center p-6 min-[481px]:p-10"
          >
            <div className="w-16 h-16 min-[481px]:w-20 min-[481px]:h-20 bg-[#f1f4ea] rounded-full flex items-center justify-center mb-6 min-[481px]:mb-8">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 min-[481px]:w-10 min-[481px]:h-10 text-[#4a5d23]" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
                <circle cx="16.5" cy="10.5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <h3 className="text-lg min-[481px]:text-xl font-bold text-stone-800 mb-2 min-[481px]:mb-3">Colores</h3>
            <p className="text-stone-400 text-[10px] min-[481px]:text-xs leading-relaxed max-w-[200px]">
              Tonos neutros y pasteles. <br />
              Reservado el color blanco y beige para la novia.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
