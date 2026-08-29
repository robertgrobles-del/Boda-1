import React from 'react';
import { motion } from 'framer-motion';
import { FAMILY } from '../constants';

const Group: React.FC<{ label: string; names: string[] }> = ({ label, names }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-olive/70">{label}</p>
    {names.map((n) => (
      <p key={n} className="font-serif text-lg italic text-stone-700 md:text-xl">
        {n}
      </p>
    ))}
  </div>
);

/**
 * "Con la bendición de Dios y de nuestros padres".
 * Sección sobria con los nombres de padres y padrinos.
 */
export const Parents: React.FC = () => (
  <section className="relative overflow-hidden bg-white px-6 py-20 md:py-28">
    <div className="pointer-events-none absolute inset-0 opacity-[0.15]">
      <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1.4px,transparent_1.4px)] [background-size:26px_26px]" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative z-10 mx-auto max-w-3xl text-center"
    >
      <svg viewBox="0 0 64 40" className="mx-auto mb-6 h-9 w-16 text-olive/60" fill="none" aria-hidden>
        <circle cx="25" cy="22" r="13" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="39" cy="22" r="13" stroke="currentColor" strokeWidth="1.4" />
        <path d="M22 6l3 5 3-5-3-4-3 4Z" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-olive">Con la bendición de Dios</span>
      <h2 className="mt-2 font-signature text-4xl text-olive md:text-6xl">y de nuestros padres</h2>
      <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-olive/70" />

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <Group label="Padres de la novia" names={FAMILY.brideParents} />
        <Group label="Padres del novio" names={FAMILY.groomParents} />
      </div>

      {FAMILY.padrinos.length > 0 && (
        <div className="mt-12">
          <Group label="Padrinos" names={FAMILY.padrinos} />
        </div>
      )}
    </motion.div>
  </section>
);
