import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Store, Landmark, ExternalLink } from 'lucide-react';
import { CASA_CUESTA, BANK_ACCOUNTS } from '../constants';
import { useToast } from './Toast';
import { SectionHeader } from './SectionHeader';

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

/** Enmascara todos los dígitos menos los últimos 4, conservando los guiones. */
const maskCedula = (c: string) => c.replace(/\d(?=(?:\D*\d){4})/g, '•');

const CopyRow: React.FC<{ label: string; display: string; copyValue: string }> = ({ label, display, copyValue }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      toast(`${label} · copiado completo`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('No se pudo copiar. Cópialo manualmente.', 'error');
    }
  };

  return (
    <button
      onClick={copy}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-100 bg-cream px-4 py-3 text-left transition-colors hover:border-olive/30"
    >
      <span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-stone-400">{label}</span>
        <span className="font-mono text-sm tracking-tight text-stone-700">{display}</span>
      </span>
      {copied ? <Check size={15} className="shrink-0 text-olive" /> : <Copy size={15} className="shrink-0 text-stone-400" />}
    </button>
  );
};

export const GiftRegistry: React.FC<{ id: string }> = ({ id }) => {
  return (
    <section id={id} className="relative flex min-h-screen items-center overflow-hidden bg-cream py-24 md:py-32">
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-olive/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-olive/5 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center">
        <SectionHeader
          eyebrow="Generosidad"
          title={
            <>
              <span className="font-signature text-olive">Mesa de</span> <span className="italic">Regalos</span>
            </>
          }
          description={'"Su presencia es nuestro mayor regalo. Si además desean tener un detalle con nosotros, aquí están nuestras opciones."'}
          className="mb-14 md:mb-16"
        />

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
          {/* 1 · Casa Cuesta */}
          <motion.a
            variants={cardVariants}
            href={CASA_CUESTA.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-5 rounded-[2rem] border border-stone-100 bg-white p-8 text-center shadow-[0_15px_40px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(0,0,0,0.07)] sm:flex-row sm:text-left md:p-10"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#f1f4ea] text-olive">
              <Store size={26} />
            </div>
            <div className="flex-grow">
              <h3 className="font-serif text-xl text-stone-800">Lista de regalos · Casa Cuesta</h3>
              <p className="mt-1 text-sm text-stone-500">{CASA_CUESTA.note}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-olive">Lista No. {CASA_CUESTA.listNumber}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-olive px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors group-hover:bg-olive-dark">
              Ver lista <ExternalLink size={13} />
            </span>
          </motion.a>

          {/* 2 · Cuentas de banco */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {BANK_ACCOUNTS.map((acc) => (
              <motion.div
                key={acc.bank}
                variants={cardVariants}
                className="flex flex-col rounded-[2rem] border border-stone-100 bg-white p-7 text-left shadow-[0_15px_40px_rgba(0,0,0,0.03)] md:p-8"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f4ea] text-olive">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-stone-800">{acc.bank}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-olive">{acc.type}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <CopyRow label="No. de cuenta" display={acc.number} copyValue={acc.number} />
                  <CopyRow label="Cédula" display={maskCedula(acc.cedula)} copyValue={acc.cedula} />
                  <p className="pl-1 pt-1 text-xs italic text-stone-500">A nombre de {acc.holder}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
