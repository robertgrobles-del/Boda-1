import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PHOTOS } from '../constants';
import { getInviteeName } from '../utils/invitee';

interface GatewayProps {
  onEnter: () => void;
}

/** Esquina decorativa (marco tipo passe-partout) — visible en pantallas grandes. */
const Corner: React.FC<{ className: string }> = ({ className }) => (
  <span className={`pointer-events-none absolute h-10 w-10 border-white/40 ${className}`} />
);

export const Gateway: React.FC<GatewayProps> = ({ onEnter }) => {
  const reduceMotion = useReducedMotion();
  const btnRef = useRef<HTMLButtonElement>(null);
  const invitee = getInviteeName();

  useEffect(() => {
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onEnter();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onEnter]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
      transition={{ duration: 1.1, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-stone-900 px-0 py-6 text-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida a la invitación"
    >
      {/* Foto de fondo */}
      <div className="absolute inset-0 z-0">
        <img src={PHOTOS.gateway} alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/45 md:bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      {/* Marco decorativo (desktop) */}
      <div className="pointer-events-none absolute inset-5 z-10 hidden border border-white/20 md:block lg:inset-8">
        <Corner className="-left-px -top-px border-l-2 border-t-2" />
        <Corner className="-right-px -top-px border-r-2 border-t-2" />
        <Corner className="-bottom-px -left-px border-b-2 border-l-2" />
        <Corner className="-bottom-px -right-px border-b-2 border-r-2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="relative z-20 flex max-w-xl flex-col items-center px-[25px] md:px-4"
      >
        {invitee && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="mb-4 block font-signature text-4xl text-white md:mb-5 md:text-4xl md:text-cream"
          >
            ¡Hola, {invitee}!
          </motion.span>
        )}

        <span className="mb-5 block text-[10px] font-bold uppercase tracking-[0.55em] text-white md:mb-7 md:text-xs md:text-cream/70">
          {invitee ? 'Con cariño te invitamos a la boda de' : 'Estás invitado a la boda de'}
        </span>

        <h1 className="font-signature text-6xl leading-[1.05] text-white sm:text-7xl md:text-8xl lg:text-[7.5rem] max-[380px]:text-5xl">
          Stephanie
          <span className="mx-3 font-serif text-3xl italic text-white md:text-5xl md:text-cream/80">&amp;</span>
          Dalvin
        </h1>

        <div className="my-8 flex items-center gap-2 text-white md:my-10 md:gap-4 md:text-white/60">
          <span className="h-px w-5 shrink-0 bg-white/25 md:w-16" />
          <span className="whitespace-nowrap text-[14px] font-bold uppercase tracking-[0.25em] md:text-xs md:font-normal md:tracking-[0.45em]">07 · Noviembre · 2026</span>
          <span className="h-px w-5 shrink-0 bg-white/25 md:w-16" />
        </div>

        <p className="mb-9 max-w-md font-serif text-base italic leading-relaxed text-white md:mb-11 md:text-lg md:text-cream/80">
          «Mejor son dos que uno… si caen, el uno levantará a su compañero» — Eclesiastés 4,9
        </p>

        <motion.button
          ref={btnRef}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onEnter}
          className="group relative overflow-hidden rounded-full border border-white/70 px-11 py-4 text-[11px] font-bold uppercase tracking-[0.4em] text-white transition-colors duration-300 hover:text-olive md:px-14 md:py-5"
        >
          <span className="relative z-10">Entrar a la invitación</span>
          <span className="absolute inset-0 -z-0 origin-left scale-x-0 bg-cream transition-transform duration-300 group-hover:scale-x-100" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
