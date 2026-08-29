import React from 'react';
import { motion } from 'framer-motion';
import { responsiveImg } from '../utils/images';

interface PhotoBandProps {
  src: string;
  quote?: string;
  align?: 'center' | 'bottom';
}

/**
 * Banda de foto a todo lo ancho con bordes de papel rasgado (arriba y abajo).
 * Inspirada en las invitaciones de referencia.
 */
export const PhotoBand: React.FC<PhotoBandProps> = ({ src, quote, align = 'center' }) => (
  <section className="relative -my-6 overflow-hidden">
    <div className="paper-edge-y relative h-[46vh] min-h-[280px] w-full md:h-[56vh]">
      <img
        {...responsiveImg(src, '100vw')}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" />
      {quote && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`absolute inset-x-0 mx-auto max-w-2xl px-8 text-center font-serif text-lg italic leading-relaxed text-white drop-shadow md:text-2xl ${
            align === 'bottom' ? 'bottom-14' : 'top-1/2 -translate-y-1/2'
          }`}
        >
          “{quote}”
        </motion.p>
      )}
    </div>
  </section>
);
