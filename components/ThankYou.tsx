
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

export const ThankYou: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center py-12 md:py-20 px-6"
    >
      <div className="relative inline-block mb-8">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 md:w-32 md:h-32 hexagon bg-olive/10 flex items-center justify-center mx-auto"
        >
          <Heart className="text-terracotta" size={48} fill="currentColor" />
        </motion.div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-4 -right-4 text-olive"
        >
          <Sparkles size={32} />
        </motion.div>
      </div>

      <h2 className="font-serif text-5xl md:text-6xl text-ink mb-6">¡Gracias por confirmar!</h2>
      <p className="text-stone-600 text-lg md:text-xl max-w-md mx-auto leading-relaxed mb-10 italic">
        "Tu presencia es el mejor regalo que podríamos recibir. Estamos ansiosos por compartir este día tan especial contigo."
      </p>

      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-px bg-olive/30"></div>
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-terracotta">NOS VEMOS PRONTO</p>
        <div className="w-12 h-px bg-olive/30"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12"
      >
        <button 
          onClick={() => window.location.reload()}
          className="text-olive text-xs font-bold uppercase tracking-widest hover:underline"
        >
          Volver a ver la invitación
        </button>
      </motion.div>
    </motion.div>
  );
};
