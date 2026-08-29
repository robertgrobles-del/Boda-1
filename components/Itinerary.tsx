import React from 'react';
import { motion } from 'framer-motion';
import { Church, Wine, Utensils, PartyPopper, Sparkles, LucideIcon } from 'lucide-react';
import { ITINERARY } from '../constants';
import { SectionHeader } from './SectionHeader';

const ICONS: Record<string, LucideIcon> = {
  church: Church,
  cocktail: Wine,
  dinner: Utensils,
  party: PartyPopper,
  'send-off': Sparkles,
};

export const Itinerary: React.FC = () => (
  <section className="relative overflow-hidden bg-cream px-6 py-20 md:py-28">
    <div className="mx-auto w-full max-w-2xl">
      <SectionHeader
        eyebrow="El día"
        title={
          <>
            <span className="font-signature text-olive">Itinerario</span> del gran día
          </>
        }
        className="mb-14 md:mb-20"
      />

      <ol className="relative">
        {/* Línea vertical */}
        <span className="absolute left-[22px] top-2 bottom-2 w-px bg-olive/25 md:left-1/2" aria-hidden />

        {ITINERARY.map((item, i) => {
          const Icon = ICONS[item.icon] ?? Sparkles;
          const flip = i % 2 === 1;
          return (
            <motion.li
              key={item.time}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`relative mb-10 flex items-start gap-5 pl-14 last:mb-0 md:pl-0 ${
                flip ? 'md:flex-row-reverse md:text-right' : 'md:text-left'
              }`}
            >
              {/* Nodo con ícono */}
              <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-olive/20 bg-white shadow-sm md:static md:mx-8">
                <Icon size={18} className="text-olive" />
              </span>

              <div className="md:w-[calc(50%-3.75rem)]">
                <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-olive">{item.time}</span>
                <h3 className="mt-1 font-serif text-lg italic text-ink md:text-xl">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">{item.detail}</p>
              </div>

              {/* Espaciador para el lado opuesto en desktop */}
              <div className="hidden md:block md:w-[calc(50%-3.75rem)]" aria-hidden />
            </motion.li>
          );
        })}
      </ol>
    </div>
  </section>
);
