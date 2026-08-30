
import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, MapPin, Calendar } from 'lucide-react';
import { responsiveImg } from '../utils/images';
import { PHOTOS } from '../constants';

interface HeroProps {
  onRSVPClick?: () => void;
}

const images = PHOTOS.heroCluster;

// 3 posiciones orbitales del cluster de hexágonos
const positions = [
  { x: 0, y: 0, scale: 1, zIndex: 30, opacity: 1 },
  { x: -140, y: 100, scale: 0.75, zIndex: 10, opacity: 0.7 },
  { x: 140, y: -100, scale: 0.75, zIndex: 10, opacity: 0.7 },
];

export const Hero: React.FC<HeroProps> = ({ onRSVPClick }) => {
  const reduceMotion = useReducedMotion();
  const [rotationIndex, setRotationIndex] = React.useState(0);

  React.useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-stone-900"
    >
      {/* Foto de fondo (LCP) - Desplazada hacia arriba (70%) para mejor encuadre */}
      <div className="absolute inset-0 z-0">
        <img
          {...responsiveImg(PHOTOS.heroBackground, '100vw')}
          alt=""
          fetchPriority="high"
          className="h-full w-full object-cover object-[center_80%]"
        />
        {/* Scrim para legibilidad del texto (más marcado en móvil) */}
        <div className="absolute inset-0 bg-black/35 md:bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/70 via-black/30 to-transparent md:h-1/2 md:from-black/45" />
      </div>

      {/* Círculos decorativos (desktop) */}
      <div className="pointer-events-none absolute right-[-10%] top-1/2 z-10 hidden h-[900px] w-[900px] -translate-y-1/2 lg:block">
        <div className="absolute inset-0 scale-[1.1] rounded-full border border-white opacity-[0.05]" />
        <div className="absolute inset-0 scale-100 rounded-full border border-white opacity-[0.08]" />
        <div className="absolute inset-0 scale-[0.85] rounded-full border border-white opacity-[0.1]" />
      </div>

      <div className="relative flex h-full flex-grow flex-col items-center overflow-hidden lg:flex-row">
        {/* Texto */}
        <div className="relative z-20 flex h-full w-full flex-grow flex-col items-center justify-center px-6 pb-12 pt-24 text-center lg:w-1/2 lg:items-start lg:pl-32 lg:pr-12 lg:pb-0 lg:pt-24 lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full"
          >
            <div className="mb-4 flex justify-center md:mb-8 lg:justify-start">
              <span className="max-w-[13rem] text-center font-serif text-[9px] font-bold uppercase leading-relaxed tracking-[0.2em] text-white/90 sm:max-w-xs sm:text-[10px] sm:tracking-[0.25em] md:text-[11px] lg:text-left">
                Aquí comienza el resto de nuestras vidas
              </span>
            </div>

            <h2 className="mb-1 w-full px-2 font-signature text-[15vw] leading-[1.1] text-white sm:text-7xl md:mb-5 md:text-8xl lg:text-[100px] xl:text-[120px] max-[480px]:text-[18vw]">
              Stephanie <br />
              <span className="font-serif text-[10vw] text-cream/90 sm:text-5xl lg:text-7xl max-[480px]:text-[12vw]">&amp;</span> Daniel
            </h2>

            {/* Foto de novios en formato arco, visible solo en dispositivos móviles (rota automáticamente entre las fotos) */}
            <div className="mx-auto mb-4 -mt-4 block h-40 w-32 overflow-hidden rounded-t-full border-4 border-white/30 shadow-2xl md:h-60 md:w-48 md:mt-0 lg:hidden relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={images[rotationIndex]}
                  src={images[rotationIndex]}
                  alt="Stephanie y Daniel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              </AnimatePresence>
            </div>

            <div className="mb-4 flex flex-col items-center space-y-2 md:mb-6 md:flex-row md:space-x-8 md:space-y-0 lg:items-start max-[480px]:space-y-2">
              <div className="flex items-center space-x-3 text-cream/80 max-[480px]:space-x-2">
                <Calendar size={16} className="text-olive" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] md:text-sm max-[480px]:tracking-[0.2em]">07 . 11 . 2026</span>
              </div>
              <div className="hidden h-6 w-px bg-white/20 md:block" />
              <div className="flex items-center space-x-3 text-cream/80 max-[480px]:space-x-2">
                <MapPin size={16} className="text-olive" />
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] md:text-sm max-[480px]:tracking-[0.1em]">Santo Domingo, R.D.</span>
              </div>
            </div>

            <p className="mx-auto mb-6 max-w-lg px-4 font-serif text-xs italic leading-relaxed text-cream/75 md:mb-12 md:text-base lg:mx-0 max-[480px]:text-[11px]">
              «Mejor son dos que uno, porque sacan más provecho de su esfuerzo. Pues si caen, el uno levantará a su compañero; pero ¡ay del que está solo!, porque cuando caiga no habrá otro que lo levante» Eclesiastés 4,9-10.
            </p>

            <motion.button
              onClick={onRSVPClick}
              whileHover={{ scale: 1.05, backgroundColor: "#3b4c1b" }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-4 rounded-full bg-olive px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all duration-500 md:px-14 md:py-6 md:text-xs max-[480px]:px-8 max-[480px]:py-4 mb-4"
            >
              Confirmar Asistencia
              <ChevronRight size={14} className="ml-1" />
            </motion.button>
          </motion.div>
        </div>

        {/* Cluster orbitante (desktop) */}
        <div className="pointer-events-auto z-10 hidden h-full items-center justify-center lg:relative lg:flex lg:w-1/2">
          <div className="relative flex h-full w-full scale-110 items-center justify-center p-20">
            <div className="pointer-events-none absolute inset-0 z-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`h-[500px] w-[500px] rounded-full border border-white opacity-[0.05] ${reduceMotion ? '' : 'animate-pulse'}`} />
                <div className="h-[650px] w-[650px] rounded-full border border-white opacity-[0.03]" />
              </div>

              {!reduceMotion && (
                <>
                  <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="hexagon-mask absolute left-[10%] top-[15%] h-32 w-32 border border-white opacity-[0.1]"
                  />
                  <motion.div
                    animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="hexagon-mask absolute bottom-[20%] right-[5%] h-48 w-48 border border-terracotta opacity-[0.08]"
                  />
                  <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`line-${i}`}
                        animate={{ x: [-40, 40, -40], opacity: [0.05, 0.15, 0.05] }}
                        transition={{ duration: 18 + i * 5, repeat: Infinity, ease: "easeInOut", delay: i * 2 }}
                        className="absolute left-1/2 top-1/2 h-[2px] w-[130%] -translate-x-1/2 -translate-y-1/2"
                        style={{
                          transform: `rotate(${i * 30 - 45}deg)`,
                          background: `linear-gradient(to right, transparent, ${i % 2 === 0 ? '#b35a44' : '#ffffff'}55, transparent)`,
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.map((src, index) => {
              const pos = positions[(index + rotationIndex) % 3];
              return (
                <motion.div
                  key={src}
                  layout
                  animate={{ x: pos.x, y: pos.y, scale: pos.scale, opacity: pos.opacity }}
                  transition={{ duration: reduceMotion ? 0 : 1.5, ease: "easeInOut" }}
                  className="hexagon-mask absolute h-[360px] w-[360px] overflow-hidden border-8 border-white bg-white shadow-2xl xl:h-[420px] xl:w-[420px]"
                  style={{ zIndex: pos.zIndex }}
                >
                  <img alt={`Stephanie y Daniel ${index + 1}`} className="h-full w-full object-cover" src={src} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
