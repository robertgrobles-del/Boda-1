import React from 'react';
import { motion } from 'framer-motion';

// Paleta de otoño sugerida para los invitados.
const AUTUMN_PALETTE: { name: string; hex: string }[] = [
  { name: 'Arena', hex: '#d8c6a1' },
  { name: 'Camel', hex: '#b98a53' },
  { name: 'Mostaza', hex: '#c9971f' },
  { name: 'Ocre', hex: '#b1791f' },
  { name: 'Cobre', hex: '#bd6a38' },
  { name: 'Terracota', hex: '#c56a45' },
  { name: 'Canela', hex: '#a0562b' },
  { name: 'Óxido', hex: '#8a3d29' },
  { name: 'Vino tinto', hex: '#7a2230' },
  { name: 'Borravino', hex: '#6b3a4b' },
  { name: 'Oliva', hex: '#6d7a3c' },
  { name: 'Musgo', hex: '#3f4420' },
];

export const DressCode: React.FC = () => {
  return (
    <section className="relative flex h-full min-h-[60vh] items-start justify-center border-b border-stone-100 bg-white pb-16 pt-16 min-[481px]:pb-32 min-[481px]:pt-32">
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="mb-8 text-center min-[481px]:mb-12">
          <h2 className="font-serif text-3xl text-olive min-[481px]:text-4xl lg:text-5xl">Código de Vestimenta</h2>
        </div>

        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-0">
          <div className="absolute left-1/2 top-1/2 hidden h-2/3 w-px -translate-x-1/2 -translate-y-1/2 bg-stone-100 md:block" />

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center p-6 text-center min-[481px]:p-10"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f4ea] min-[481px]:mb-8 min-[481px]:h-20 min-[481px]:w-20">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-olive min-[481px]:h-10 min-[481px]:w-10" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM12 2v2m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 6v7" strokeLinecap="round" />
                <path d="M4 11s2 6 8 6 8-6 8-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-stone-800 min-[481px]:mb-3 min-[481px]:text-xl">Formal / Elegante</h3>
            <p className="max-w-[220px] text-[11px] leading-relaxed text-stone-600 min-[481px]:text-xs">
              Ellas: Vestido Largo.<br />
              Ellos: Traje oscuro o Tuxedo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center p-6 text-center min-[481px]:p-10"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f4ea] min-[481px]:mb-8 min-[481px]:h-20 min-[481px]:w-20">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-olive min-[481px]:h-10 min-[481px]:w-10" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
                <circle cx="16.5" cy="10.5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-stone-800 min-[481px]:mb-3 min-[481px]:text-xl">Colores</h3>
            <p className="max-w-[220px] text-[11px] leading-relaxed text-stone-600 min-[481px]:text-xs">
              Inspírate en la <span className="font-semibold text-olive">paleta de otoño</span>.<br />
              Reservado el blanco y el beige para la novia.
            </p>
          </motion.div>
        </div>

        {/* Paleta sugerida */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-10 max-w-2xl border-t border-stone-100 pt-8 text-center min-[481px]:mt-14"
        >
          <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.35em] text-olive">Colores sugeridos · Otoño</span>
          <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6">
            {AUTUMN_PALETTE.map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-1.5">
                <span
                  className="h-9 w-9 rounded-full border border-black/5 shadow-sm min-[481px]:h-10 min-[481px]:w-10"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[9px] font-medium uppercase tracking-wide text-stone-500">{c.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
