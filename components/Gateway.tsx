
import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PHOTOS } from '../constants';

interface GatewayProps {
  onEnter: () => void;
}

export const Gateway: React.FC<GatewayProps> = ({ onEnter }) => {
  const reduceMotion = useReducedMotion();
  const btnRef = useRef<HTMLButtonElement>(null);

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
      exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.05 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-stone-900 p-8 text-center"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida a la invitación"
    >
      <div className="absolute inset-0 z-0">
        <img
          src={PHOTOS.gateway}
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="relative z-20 max-w-lg space-y-10 md:space-y-12"
      >
        <div className="space-y-4">
          <span className="block text-[10px] font-bold uppercase tracking-[0.6em] text-cream/70 md:text-sm">
            Nuestra aventura comienza
          </span>
          <h1 className="font-signature text-5xl sm:text-7xl md:text-[9rem] leading-tight max-[380px]:text-4xl text-white">
            Stephanie &amp; Daniel
          </h1>
        </div>

        <p className="font-serif text-lg italic leading-relaxed text-cream/85 md:text-xl">
          "Prepárate para una celebración donde el tiempo se detiene y el amor florece."
        </p>

        <div className="flex flex-col items-center space-y-8">
          <div className="flex items-center justify-center space-x-6 text-white/60">
            <div className="h-px w-12 bg-white/20" />
            <span className="text-[10px] uppercase tracking-[0.4em] md:text-xs">07 . NOV . 26</span>
            <div className="h-px w-12 bg-white/20" />
          </div>

          <motion.button
            ref={btnRef}
            whileHover={{ scale: 1.05, backgroundColor: '#fdfaf6', color: '#4a5d23' }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            className="rounded-full bg-white px-12 py-5 text-[11px] font-bold uppercase tracking-[0.4em] text-olive shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300"
          >
            Entrar a la Invitación
          </motion.button>
        </div>
      </motion.div>

      <div className={`hexagon-mask absolute right-[-5%] top-[-5%] h-64 w-64 border border-white/10 opacity-20 ${reduceMotion ? '' : 'animate-spin-slow'}`} />
      <div
        className={`hexagon-mask absolute bottom-[-5%] left-[-5%] h-80 w-80 border border-white/10 opacity-20 ${reduceMotion ? '' : 'animate-spin-slow'}`}
        style={{ animationDirection: 'reverse' }}
      />
    </motion.div>
  );
};
