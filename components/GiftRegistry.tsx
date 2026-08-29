
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Gift } from 'lucide-react';
import { REGISTRY_URLS, GIFT } from '../constants';
import { useToast } from './Toast';
import { SectionHeader } from './SectionHeader';

const RegistryLink: React.FC<{ url: string; label: string; className: string }> = ({ url, label, className }) => {
  if (!url || url === '#') {
    return (
      <span className="w-full py-3.5 rounded-full bg-stone-100 text-stone-400 text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-default">
        Enlace próximamente
      </span>
    );
  }
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full py-3.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${className}`}
    >
      {label}
    </motion.a>
  );
};

export const GiftRegistry: React.FC<{ id: string }> = ({ id }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'bank' | 'amazon' | 'cuesta'>('bank');
  const accountNumber = GIFT.accountNumber;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber.replace(/\s/g, ''));
      setCopied(true);
      toast('Número de cuenta copiado.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('No se pudo copiar. Cópialo manualmente.', 'error');
    }
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
    <section id={id} className="min-h-screen py-24 md:py-40 bg-cream flex items-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-olive/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-olive/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-5xl mx-auto px-6 text-center w-full relative z-10">
        <SectionHeader
          eyebrow="Generosidad"
          title={
            <>
              <span className="font-signature text-olive">Mesa de</span>{' '}
              <span className="italic">Regalos</span>
            </>
          }
          description={'"Su presencia es nuestro mayor regalo. Sin embargo, si desean tener un detalle con nosotros, estas son nuestras opciones preferidas."'}
          className="mb-16 md:mb-20"
        />

        {/* Selector de pestañas visible únicamente en móviles */}
        <div className="flex md:hidden justify-center bg-stone-100 p-1 rounded-full max-w-xs mx-auto mb-10 border border-stone-200/50 shadow-inner">
          <button
            onClick={() => setActiveTab('bank')}
            className={`flex-1 py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${
              activeTab === 'bank' ? 'bg-olive text-white shadow-md' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Banco
          </button>
          <button
            onClick={() => setActiveTab('amazon')}
            className={`flex-1 py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${
              activeTab === 'amazon' ? 'bg-olive text-white shadow-md' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Amazon
          </button>
          <button
            onClick={() => setActiveTab('cuesta')}
            className={`flex-1 py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${
              activeTab === 'cuesta' ? 'bg-olive text-white shadow-md' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Cuesta
          </button>
        </div>

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
            className={`bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-stone-100 flex flex-col items-center group transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 ${
              activeTab === 'bank' ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div className="w-24 h-16 mb-8 flex items-center justify-center overflow-hidden">
              <img
                src="https://impulsapopular.com/wp-content/uploads/2020/08/banco_popular-01.png"
                alt="Banco Popular"
                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-1">Transferencia</h3>
            <p className="text-olive text-[9px] mb-6 uppercase tracking-[0.2em] font-bold">Banco Popular</p>

            <div className="bg-cream w-full py-4 px-2 rounded-xl mb-6 text-stone-600 font-mono text-xs tracking-tight border border-stone-100/50">
              {accountNumber}
            </div>

            <motion.button
              onClick={copyToClipboard}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-full border border-olive text-olive text-[9px] font-bold uppercase tracking-widest hover:bg-olive hover:text-white flex items-center justify-center gap-2 transition-all"
            >
              {copied ? <Check size={12} /> : <Gift size={12} />}
              <span>{copied ? '¡Copiado!' : 'Copiar cuenta'}</span>
            </motion.button>
          </motion.div>

          {/* Amazon Card */}
          <motion.div
            variants={cardVariants}
            className={`bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-stone-100 flex flex-col items-center group transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 ${
              activeTab === 'amazon' ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div className="w-24 h-16 mb-8 flex items-center justify-center overflow-hidden">
              <img
                src="https://guiaimpresion.com/wp-content/uploads/2020/06/Logotipo-Amazon-768x432.jpg"
                alt="Amazon"
                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-1">Amazon</h3>
            <p className="text-olive text-[9px] mb-6 uppercase tracking-[0.2em] font-bold">Mesa de Regalos</p>

            <div className="flex-grow flex flex-col justify-center mb-8">
              <p className="text-stone-500 text-xs leading-relaxed italic font-serif">
                Artículos seleccionados para nuestro nuevo hogar.
              </p>
            </div>

            <RegistryLink
              url={REGISTRY_URLS.amazon}
              label="Ver Mesa Online"
              className="bg-olive text-white hover:bg-olive-dark shadow-md"
            />
          </motion.div>

          {/* Casa Cuesta Card */}
          <motion.div
            variants={cardVariants}
            className={`bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-stone-100 flex flex-col items-center group transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 ${
              activeTab === 'cuesta' ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div className="w-24 h-16 mb-8 flex items-center justify-center overflow-hidden">
              <img
                src="https://agora.com.do/wp-content/uploads/2025/04/casa_cuesta.jpg"
                alt="Casa Cuesta"
                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-1">Casa Cuesta</h3>
            <p className="text-olive text-[9px] mb-6 uppercase tracking-[0.2em] font-bold">Evento: 382910</p>

            <div className="flex-grow flex flex-col justify-center mb-8">
              <p className="text-stone-500 text-xs leading-relaxed italic font-serif">
                También disponible en cualquier sucursal física.
              </p>
            </div>

            <RegistryLink
              url={REGISTRY_URLS.casaCuesta}
              label="Ir a la tienda"
              className="border border-stone-200 text-stone-800 hover:bg-stone-50"
            />
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};
