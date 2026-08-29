import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  /** Etiqueta pequeña en mayúsculas (opcional) */
  eyebrow?: string;
  /** Título de la sección: texto o JSX para mezclar tipografías */
  title: React.ReactNode;
  /** Párrafo introductorio (opcional) */
  description?: React.ReactNode;
  align?: 'center' | 'left';
  /** Muestra la línea decorativa terracota bajo el título */
  divider?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  divider = true,
  className = '',
}) => {
  const isCenter = align === 'center';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`${isCenter ? 'text-center' : 'text-left'} ${className}`}
    >
      {eyebrow && (
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.4em] text-olive">
          {eyebrow}
        </span>
      )}

      <h2 className="font-serif text-4xl leading-tight text-ink md:text-6xl lg:text-7xl">
        {title}
      </h2>

      {divider && (
        <div className={`mt-6 h-1 w-20 rounded-full bg-olive ${isCenter ? 'mx-auto' : ''}`} />
      )}

      {description && (
        <p
          className={`mt-6 max-w-2xl font-serif text-base italic leading-relaxed text-stone-600 md:text-lg ${
            isCenter ? 'mx-auto' : ''
          }`}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
};
