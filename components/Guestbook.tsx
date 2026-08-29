import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Quote } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';
import { SectionHeader } from './SectionHeader';

interface Message {
  id: number;
  name: string;
  message: string;
  createdAt: string;
}

const timeAgo = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < day) return 'Hoy';
  if (diff < 2 * day) return 'Ayer';
  if (diff < 7 * day) return `Hace ${Math.floor(diff / day)} días`;
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'long' });
};

export const Guestbook: React.FC<{ id?: string }> = ({ id = 'mensajes' }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_CONFIG.backendUrl}/api/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (alive && Array.isArray(data)) setMessages(data);
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending' || !name.trim() || text.trim().length < 2) return;
    setStatus('sending');
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), message: text.trim(), honeypot }),
      });
      if (!res.ok) throw new Error('bad response');
      const body = await res.json();
      if (body?.data) setMessages((m) => [body.data, ...m]);
      setStatus('sent');
      setName('');
      setText('');
      toast('¡Gracias por tu mensaje!', 'success');
      setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('idle');
      toast('No pudimos enviar tu mensaje. Intenta de nuevo.', 'error');
    }
  };

  return (
    <section id={id} className="relative overflow-hidden bg-white px-6 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.15]">
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1.4px,transparent_1.4px)] [background-size:26px_26px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <SectionHeader
          eyebrow="Libro de mensajes"
          title={
            <>
              Deja tu <span className="font-signature text-olive">buen deseo</span>
            </>
          }
          description="Escríbenos unas líneas: las leeremos todas antes del gran día."
          className="mb-14"
        />

        {/* Formulario */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={submit}
          className="mx-auto mb-16 max-w-xl space-y-4 rounded-[2rem] border border-stone-100 bg-cream/60 p-6 shadow-sm md:p-8"
        >
          <div className="hidden">
            <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>
          <div>
            <label htmlFor="gb-name" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              Tu nombre
            </label>
            <input
              id="gb-name"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition-colors focus:border-olive focus:outline-none"
              placeholder="Nombre y apellido"
            />
          </div>
          <div>
            <label htmlFor="gb-msg" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              Tu mensaje
            </label>
            <textarea
              id="gb-msg"
              required
              rows={3}
              maxLength={600}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 font-serif text-sm italic text-stone-700 transition-colors focus:border-olive focus:outline-none"
              placeholder="Un consejo, un recuerdo o un buen deseo para Stephanie & Daniel…"
            />
          </div>
          <button
            type="submit"
            disabled={status !== 'idle' || !name.trim() || text.trim().length < 2}
            className="inline-flex items-center gap-2 rounded-full bg-olive px-7 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-md transition-all hover:bg-olive-dark active:scale-95 disabled:opacity-40"
          >
            {status === 'sent' ? <Heart size={13} className="fill-white" /> : <Send size={13} />}
            {status === 'sent' ? '¡Enviado!' : status === 'sending' ? 'Enviando…' : 'Firmar el libro'}
          </button>
        </motion.form>

        {/* Muro de mensajes */}
        {loaded && messages.length > 0 && (
          <div className="columns-1 gap-5 sm:columns-2 [&>*]:mb-5">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.figure
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="break-inside-avoid rounded-2xl border border-stone-100 bg-white p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]"
                >
                  <Quote size={16} className="mb-2 text-olive/40" />
                  <blockquote className="font-serif text-sm italic leading-relaxed text-stone-600">{m.message}</blockquote>
                  <figcaption className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-olive">{m.name}</span>
                    <span className="text-[10px] text-stone-400">{timeAgo(m.createdAt)}</span>
                  </figcaption>
                </motion.figure>
              ))}
            </AnimatePresence>
          </div>
        )}

        {loaded && messages.length === 0 && (
          <p className="text-center font-serif text-sm italic text-stone-400">
            Sé la primera persona en dejar un mensaje ♥
          </p>
        )}
      </div>
    </section>
  );
};
