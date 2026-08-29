import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Play, Music } from 'lucide-react';
import { SONG } from '../constants';

/**
 * Reproductor flotante de la canción de los novios.
 * - Móvil: botón sobre el de WhatsApp (abajo a la derecha), nota encima.
 * - Escritorio: botón abajo a la izquierda, nota a la derecha.
 * - Si SONG.audioUrl está vacío usa SONG.externalUrl (Spotify/YouTube).
 *   Si ambos están vacíos, no se renderiza.
 */
export const MusicPlayer: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState(false);

  const hasAudio = Boolean(SONG.audioUrl);
  const hasLink = !hasAudio && Boolean(SONG.externalUrl);
  const label = [SONG.title, SONG.artist].filter(Boolean).join(' · ') || 'Nuestra canción';

  useEffect(() => {
    if (!hasAudio && !hasLink) return;
    const show = setTimeout(() => setHint(true), 3000);
    const hide = setTimeout(() => setHint(false), 10000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [hasAudio, hasLink]);

  if (!hasAudio && !hasLink) return null;

  const toggle = () => {
    setHint(false);
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const Bars = () => (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-white"
          animate={reduceMotion ? { height: 6 } : { height: [4, 15, 7, 13, 5] }}
          transition={reduceMotion ? undefined : { duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );

  const btnClass =
    'flex h-14 w-14 items-center justify-center rounded-full bg-olive text-white shadow-2xl transition-colors hover:bg-olive-dark';

  return (
    <div className="fixed bottom-24 right-5 z-[50] flex items-center gap-3 md:bottom-6 md:left-6 md:right-auto">
      {hasAudio && <audio ref={audioRef} src={SONG.audioUrl} loop preload="none" onEnded={() => setPlaying(false)} />}

      {hasAudio ? (
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          aria-label={playing ? `Pausar ${label}` : `Reproducir ${label}`}
          aria-pressed={playing}
          className={btnClass}
        >
          {playing ? <Bars /> : <Play size={20} className="ml-0.5" />}
        </motion.button>
      ) : (
        <motion.a
          href={SONG.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          aria-label={`Escuchar ${label}`}
          className={btnClass}
        >
          <Music size={20} />
        </motion.a>
      )}

      <AnimatePresence>
        {(hint || playing) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full right-0 mb-3 w-max max-w-[70vw] rounded-2xl border border-stone-100 bg-white px-4 py-2 shadow-xl md:static md:bottom-auto md:right-auto md:mb-0 md:max-w-xs"
          >
            <span className="block text-[10px] font-bold uppercase tracking-widest text-olive">
              {playing ? 'Sonando' : 'Nuestra canción'}
            </span>
            <span className="block truncate font-serif text-xs italic text-stone-500">
              {playing ? label : 'Presiona para escucharla ♥'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
