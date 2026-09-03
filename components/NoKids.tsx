import React from 'react';
import { motion } from 'framer-motion';
import { useInvitee } from './InviteeContext';

/**
 * Aviso "Solo adultos" — banda a todo el ancho, centrada.
 * No se muestra a los invitados que son "solo ceremonia".
 */
export const NoKids: React.FC = () => {
  const { isCeremonyOnly } = useInvitee();
  if (isCeremonyOnly) return null;

  return (
  <section className="border-y border-stone-100 bg-white px-6 py-14 md:py-20">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-olive">Solo adultos en la recepción</span>
      <div className="h-px w-10 bg-olive/30" />
      <p className="text-xs italic leading-relaxed text-stone-500 md:text-sm">
        Los niños son bienvenidos a la ceremonia. La recepción, en cambio, será
        solo para adultos. Agradecemos que lo tomen en cuenta al organizarse.
      </p>
    </motion.div>
  </section>
  );
};
