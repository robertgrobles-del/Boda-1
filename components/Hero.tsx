
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MapPin, Calendar } from 'lucide-react';

interface HeroProps {
  onRSVPClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onRSVPClick }) => {
  const navLinks = [
    { name: 'Evento', href: '#detalles' },
    { name: 'Galería', href: '#galeria' },
    { name: 'Regalos', href: '#regalos' },
    {
      name: 'RSVP', href: '#confirmar', onClick: (e: React.MouseEvent) => {
        if (onRSVPClick) {
          e.preventDefault();
          onRSVPClick();
        }
      }
    },
  ];

  const [rotationIndex, setRotationIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % 3);
    }, 4000); // Cambia cada 4 segundos
    return () => clearInterval(timer);
  }, []);

  const images = [
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800"
  ];

  // Definición de las 3 posiciones orbitales
  const positions = [
    { x: 0, y: 0, scale: 1, zIndex: 30, opacity: 1 },         // Al frente
    { x: -140, y: 100, scale: 0.75, zIndex: 10, opacity: 0.7 }, // Atrás izquierda
    { x: 140, y: -100, scale: 0.75, zIndex: 10, opacity: 0.7 }, // Atrás derecha
  ];

  return (
    <section id="inicio" className="relative h-screen lg:min-h-screen w-full flex flex-col overflow-hidden bg-stone-900">
      {/* Background Photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000"
          alt="Hero Background"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
      </div>

      {/* Background Decorative Circles (Desktop) */}
      <div className="hidden lg:block absolute right-[-10%] top-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none z-10">
        <div className="absolute inset-0 border border-white rounded-full scale-[1.1] opacity-[0.05]"></div>
        <div className="absolute inset-0 border border-white rounded-full scale-[1] opacity-[0.08]"></div>
        <div className="absolute inset-0 border border-white rounded-full scale-[0.85] opacity-[0.1]"></div>
      </div>

      {/* Header: Visible SOLO en Desktop (md+) */}
      <header className="hidden md:flex absolute top-0 left-0 w-full z-[60] items-center justify-between px-12 lg:px-24 py-10 bg-transparent">
        <div className="flex-1">
          <span className="font-signature text-4xl text-white">S&D</span>
        </div>

        <nav className="flex gap-12 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 flex-1 justify-center">
          {navLinks.map((link) => (
            <a
              key={link.name}
              className="hover:text-white transition-colors"
              href={link.href}
              onClick={link.onClick}
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex-1 flex justify-end">
          <button
            onClick={onRSVPClick}
            className="px-6 py-2 border border-white/20 text-[10px] uppercase font-bold tracking-widest text-white hover:bg-white hover:text-[#4a5d23] transition-all rounded-full"
          >
            RSVP
          </button>
        </div>
      </header>

      <div className="relative flex-grow flex flex-col lg:flex-row items-center overflow-hidden h-full">

        {/* Contenedor de Texto */}
        <div className="relative z-20 w-full lg:w-1/2 flex flex-grow flex-col justify-center items-center lg:items-start text-center lg:text-left px-6 lg:pl-32 lg:pr-12 h-full pt-24 md:pt-20 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full"
          >
            <div className="absolute -left-20 top-4 w-16 h-[2px] bg-[#b35a44] hidden lg:block"></div>

            <span className="text-lg md:text-2xl font-serif italic mb-4 md:mb-6 block tracking-wide text-[#b35a44] opacity-90 max-[480px]:text-sm">Save the date</span>

            <h2 className="text-[15vw] sm:text-7xl md:text-8xl lg:text-[100px] xl:text-[120px] font-signature leading-[1.1] mb-8 md:mb-12 text-white w-full px-2 max-[480px]:text-[18vw]">
              Stephanie <br />
              <span className="text-[#fdfaf6]/90 font-serif text-[10vw] sm:text-5xl lg:text-7xl max-[480px]:text-[12vw]">&</span> Daniel
            </h2>

            <div className="flex flex-col md:flex-row items-center lg:items-start space-y-4 md:space-y-0 md:space-x-8 mb-10 md:mb-14 max-[480px]:space-y-2 max-[480px]:mb-8">
              <div className="flex items-center space-x-3 text-[#fdfaf6]/70 max-[480px]:space-x-2">
                <Calendar size={16} className="text-[#b35a44] opacity-90" />
                <span className="font-bold text-[10px] md:text-sm uppercase tracking-[0.4em] max-[480px]:tracking-[0.2em]">11 . 11 . 2026</span>
              </div>
              <div className="hidden md:block w-px h-6 bg-white/20"></div>
              <div className="flex items-center space-x-3 text-[#fdfaf6]/70 max-[480px]:space-x-2">
                <MapPin size={16} className="text-[#b35a44] opacity-90" />
                <span className="text-[10px] md:text-sm uppercase tracking-[0.2em] font-medium max-[480px]:tracking-[0.1em]">Santo Domingo, R.D.</span>
              </div>
            </div>

            <p className="max-w-md mx-auto lg:mx-0 text-[#fdfaf6]/60 text-sm md:text-lg leading-relaxed font-serif italic mb-10 md:mb-12 max-[480px]:text-xs max-[480px]:mb-8 px-4">
              "Donde el amor florece, la vida cobra sentido. Únete a nosotros en esta celebración de vida y compromiso."
            </p>

            <motion.button
              onClick={onRSVPClick}
              whileHover={{ scale: 1.05, backgroundColor: "#a04d39" }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-4 px-10 py-4 md:px-14 md:py-6 bg-[#b35a44] text-white text-[10px] md:text-xs uppercase font-black tracking-[0.3em] rounded-full shadow-2xl transition-all duration-500 max-[480px]:px-8 max-[480px]:py-4"
            >
              Confirmar Asistencia
              <ChevronRight size={14} className="ml-1" />
            </motion.button>
          </motion.div>
        </div>

        {/* Cluster Geométrico Orbitante: Derecha en Desktop */}
        <div className="hidden lg:flex lg:relative lg:w-1/2 h-full z-10 items-center justify-center pointer-events-auto">
          <div className="relative w-full h-full flex items-center justify-center p-20 scale-110">

            {/* FIGURAS GEOMÉTRICAS DE FONDO (Detrás de los hexágonos) */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {/* Círculos concéntricos principales (Ya existentes pero ajustados) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[500px] h-[500px] border border-white rounded-full opacity-[0.05] animate-pulse"></div>
                <div className="w-[650px] h-[650px] border border-white rounded-full opacity-[0.03]"></div>
              </div>

              {/* Hexágonos de fondo flotantes */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[15%] left-[10%] w-32 h-32 hexagon-mask border border-white opacity-[0.1]"
              ></motion.div>

              <motion.div
                animate={{
                  y: [0, 30, 0],
                  rotate: [0, -10, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[20%] right-[5%] w-48 h-48 hexagon-mask border border-[#b35a44] opacity-[0.08]"
              ></motion.div>

              <motion.div
                animate={{ opacity: [0.05, 0.1, 0.05] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-[30%] right-[15%] w-16 h-16 hexagon-mask bg-white opacity-[0.05]"
              ></motion.div>

              {/* Líneas decorativas abstractas (Múltiples y Asíncronas) - VISIBILIDAD MEJORADA */}
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`line-${i}`}
                    animate={{
                      x: [-40, 40, -40],
                      opacity: [0.05, 0.15, 0.05],
                      rotate: [i * 15, i * 15 + 5, i * 15]
                    }}
                    transition={{
                      duration: 18 + i * 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 2
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[2px]"
                    style={{
                      transform: `rotate(${i * 30 - 45}deg)`,
                      background: `linear-gradient(to right, transparent, ${i % 2 === 0 ? '#b35a44' : '#ffffff'}33, ${i % 2 === 0 ? '#b35a44' : '#ffffff'}66, ${i % 2 === 0 ? '#b35a44' : '#ffffff'}33, transparent)`
                    }}
                  ></motion.div>
                ))}
              </div>
            </div>

            {images.map((src, index) => {
              // Calcular la posición actual basada en el rotationIndex
              const posIndex = (index + rotationIndex) % 3;
              const pos = positions[posIndex];

              return (
                <motion.div
                  key={src}
                  layout
                  animate={{
                    x: pos.x,
                    y: pos.y,
                    scale: pos.scale,
                    zIndex: pos.zIndex,
                    opacity: pos.opacity,
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeInOut",
                    zIndex: { delay: pos.zIndex > 10 ? 0 : 0.7 } // Delay z-index para cuando se va hacia atrás
                  }}
                  className="absolute w-[360px] h-[360px] xl:w-[420px] xl:h-[420px] hexagon-mask shadow-2xl bg-white border-8 border-white overflow-hidden"
                  style={{ zIndex: pos.zIndex }}
                >
                  <img
                    alt={`Novios ${index + 1}`}
                    className="w-full h-full object-cover"
                    src={src}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
