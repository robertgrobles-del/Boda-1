
import React from 'react';
import { motion } from 'framer-motion';

interface GatewayProps {
  onEnter: () => void;
}

export const Gateway: React.FC<GatewayProps> = ({ onEnter }) => {
  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-stone-900 flex flex-col items-center justify-center p-8 text-center lg:hidden overflow-hidden"
    >
      {/* Photo Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1600"
          alt="Gateway Background"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
      </div>

      {/* Textura de fondo sutil */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="space-y-12 max-w-lg relative z-20"
      >
        <div className="space-y-4">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-[#fdfaf6]/70 text-[10px] md:text-sm font-bold uppercase tracking-[0.6em] block"
          >
            NUESTRA AVENTURA COMIENZA
          </motion.span>
          <h1 className="font-signature text-7xl md:text-[11rem] text-white">Stephanie & Daniel</h1>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-[#fdfaf6]/80 font-serif italic text-lg md:text-xl leading-relaxed"
        >
          "Prepárate para una celebración <br /> donde el tiempo se detiene <br /> y el amor florece."
        </motion.p>

        <div className="flex flex-col items-center space-y-8">
          <div className="flex items-center justify-center space-x-6 text-white/30">
            <div className="w-12 h-px bg-white/20"></div>
            <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/60">11 . NOV . 26</span>
            <div className="w-12 h-px bg-white/20"></div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#fdfaf6", color: "#4a5d23" }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            className="px-12 py-5 bg-white text-[#4a5d23] text-[11px] font-bold uppercase tracking-[0.4em] rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300"
          >
            Entrar a la Invitación
          </motion.button>
        </div>
      </motion.div>

      {/* Elementos decorativos abstractos */}
      <div className="absolute top-[-5%] right-[-5%] w-64 h-64 border border-white/10 hexagon-mask animate-spin-slow opacity-20 z-10"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 border border-white/10 hexagon-mask animate-spin-slow opacity-20 z-10" style={{ animationDirection: 'reverse' }}></div>
    </motion.div>
  );
};
