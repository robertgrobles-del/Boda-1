import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, Music } from 'lucide-react';
import { SONG } from '../constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Extrae el ID de un enlace de YouTube (watch, youtu.be, embed, shorts, music). */
const youTubeId = (url: string): string | null => {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
  );
  return m ? m[1] : null;
};

let ytApiPromise: Promise<void> | null = null;
const loadYouTubeApi = (): Promise<void> => {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    if ((window as any).YT?.Player) return resolve();
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return ytApiPromise;
};

/**
 * Reproductor flotante de la canción de los novios.
 * - `SONG.audioUrl`  → archivo mp3 en /public (reproducción directa).
 * - `SONG.externalUrl` con enlace de YouTube → suena dentro de la página (sin abrir YouTube).
 * - Otro enlace (Spotify, etc.) → botón que abre el enlace en otra pestaña.
 * - Si todo está vacío, no se muestra.
 */
export const MusicPlayer: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState(false);
  const [ready, setReady] = useState(false);

  const ytId = SONG.externalUrl ? youTubeId(SONG.externalUrl) : null;
  const mode: 'audio' | 'youtube' | 'link' | 'none' = SONG.audioUrl
    ? 'audio'
    : ytId
    ? 'youtube'
    : SONG.externalUrl
    ? 'link'
    : 'none';

  const label = [SONG.title, SONG.artist].filter(Boolean).join(' · ') || 'Nuestra canción';

  // Nota flotante de aviso al cargar
  useEffect(() => {
    if (mode === 'none') return;
    const show = setTimeout(() => setHint(true), 3000);
    const hide = setTimeout(() => setHint(false), 10000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [mode]);

  // Inicializa el reproductor de YouTube (oculto)
  useEffect(() => {
    if (mode !== 'youtube' || !ytId) return;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !ytHostRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(ytHostRef.current, {
        videoId: ytId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          loop: 1,
          playlist: ytId,
        },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            const S = (window as any).YT.PlayerState;
            if (e.data === S.PLAYING) setPlaying(true);
            if (e.data === S.PAUSED || e.data === S.ENDED) setPlaying(false);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      ytPlayerRef.current = null;
    };
  }, [mode, ytId]);

  if (mode === 'none') return null;

  const toggle = () => {
    setHint(false);
    if (mode === 'audio') {
      const el = audioRef.current;
      if (!el) return;
      if (playing) {
        el.pause();
        setPlaying(false);
      } else {
        el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
      return;
    }
    if (mode === 'youtube') {
      const p = ytPlayerRef.current;
      if (!p) return;
      playing ? p.pauseVideo() : p.playVideo();
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
    'flex h-14 w-14 items-center justify-center rounded-full bg-olive text-white shadow-2xl transition-colors hover:bg-olive-dark disabled:opacity-60';

  return (
    <div className="fixed bottom-24 right-5 z-[50] flex items-center gap-3 md:bottom-6 md:left-6 md:right-auto">
      {mode === 'audio' && (
        <audio ref={audioRef} src={SONG.audioUrl} loop preload="none" onEnded={() => setPlaying(false)} />
      )}
      {mode === 'youtube' && (
        <div className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0" aria-hidden>
          <div ref={ytHostRef} />
        </div>
      )}

      {mode === 'link' ? (
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
      ) : (
        <motion.button
          onClick={toggle}
          disabled={mode === 'youtube' && !ready}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          aria-label={playing ? `Pausar ${label}` : `Reproducir ${label}`}
          aria-pressed={playing}
          className={btnClass}
        >
          {playing ? <Bars /> : <Play size={20} className="ml-0.5" />}
        </motion.button>
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
