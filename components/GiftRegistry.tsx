
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Check, ShoppingBag, Gift } from 'lucide-react';

export const GiftRegistry: React.FC<{ id: string }> = ({ id }) => {
  const [copied, setCopied] = useState(false);
  const clabe = "0123 4567 8901 2345";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clabe.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <section id={id} className="min-h-screen py-24 md:py-40 bg-[#fdfaf6] flex items-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#4a5d23]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#b35a44]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-5xl mx-auto px-6 text-center w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-20"
        >
          <span className="text-[#b35a44] text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">GENEROCIDAD</span>
          <h2 className="text-4xl md:text-6xl leading-tight mb-8 font-serif text-[#1a1a1a]">
            <span className="font-signature text-[#4a5d23] mr-4 text-5xl md:text-7xl">Mesa de</span>
            <span className="italic">Regalos</span>
          </h2>
          <p className="text-stone-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed italic font-serif opacity-80">
            "Su presencia es nuestro mayor regalo. Sin embargo, si desean tener un detalle con nosotros, estas son nuestras opciones preferidas."
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
        >

          {/* Transfer Card (Banco Popular) */}
          <motion.div
            variants={cardVariants}
            className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-stone-100 flex flex-col items-center group transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1.5"
          >
            <div className="w-24 h-16 mb-8 flex items-center justify-center overflow-hidden">
              <img
                src="https://impulsapopular.com/wp-content/uploads/2020/08/banco_popular-01.png"
                alt="Banco Popular"
                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-1">Transferencia</h3>
            <p className="text-[#b35a44] text-[9px] mb-6 uppercase tracking-[0.2em] font-bold">Banco Popular</p>

            <div className="bg-[#fdfaf6] w-full py-4 px-2 rounded-xl mb-6 text-stone-600 font-mono text-xs tracking-tight border border-stone-100/50">
              {clabe}
            </div>

            <motion.button
              onClick={copyToClipboard}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-full border border-[#4a5d23] text-[#4a5d23] text-[9px] font-bold uppercase tracking-widest hover:bg-[#4a5d23] hover:text-white flex items-center justify-center gap-2 transition-all"
            >
              {copied ? <Check size={12} /> : <Gift size={12} />}
              <span>{copied ? '¡Copiado!' : 'Copiar cuenta'}</span>
            </motion.button>
          </motion.div>

          {/* Amazon Card */}
          <motion.div
            variants={cardVariants}
            className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-stone-100 flex flex-col items-center group transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1.5"
          >
            <div className="w-24 h-16 mb-8 flex items-center justify-center overflow-hidden">
              <img
                src="https://guiaimpresion.com/wp-content/uploads/2020/06/Logotipo-Amazon-768x432.jpg"
                alt="Amazon"
                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-1">Amazon</h3>
            <p className="text-[#b35a44] text-[9px] mb-6 uppercase tracking-[0.2em] font-bold">Mesa de Regalos</p>

            <div className="flex-grow flex flex-col justify-center mb-8">
              <p className="text-stone-500 text-xs leading-relaxed italic font-serif">
                Artículos seleccionados para nuestro nuevo hogar.
              </p>
            </div>

            <motion.a
              href="#"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-[#4a5d23] text-white text-[9px] font-bold rounded-full uppercase tracking-widest hover:bg-[#3a4a1c] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>Ver Mesa Online</span>
            </motion.a>
          </motion.div>

          {/* Casa Cuesta Card */}
          <motion.div
            variants={cardVariants}
            className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-stone-100 flex flex-col items-center group transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1.5"
          >
            <div className="w-24 h-16 mb-8 flex items-center justify-center overflow-hidden">
              <img
                src="https://agora.com.do/wp-content/uploads/2025/04/casa_cuesta.jpg"
                alt="Casa Cuesta"
                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-1">Casa Cuesta</h3>
            <p className="text-[#b35a44] text-[9px] mb-6 uppercase tracking-[0.2em] font-bold">Evento: 382910</p>

            <div className="flex-grow flex flex-col justify-center mb-8">
              <p className="text-stone-500 text-xs leading-relaxed italic font-serif">
                También disponible en cualquier sucursal física.
              </p>
            </div>

            <motion.a
              href="#"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 border border-stone-200 text-stone-800 text-[9px] font-bold rounded-full uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
            >
              <span>Ir a la tienda</span>
            </motion.a>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};
