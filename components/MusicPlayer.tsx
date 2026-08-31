import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, SkipBack, Repeat, Music, ChevronDown } from 'lucide-react';
import { SONG } from '../constants';
import { useScrolledPast } from '../utils/useScrolledPast';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

/**
 * Reproductor de la canción de los novios (flotante).
 * - `SONG.audioUrl`   → mp3 en /public.
 * - `SONG.externalUrl` de YouTube → suena dentro de la página.
 * - Otro enlace → botón que abre el enlace en otra pestaña.
 */
export const MusicPlayer: React.FC = () => {
  const scrolledPast = useScrolledPast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hint, setHint] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const ytId = SONG.externalUrl ? youTubeId(SONG.externalUrl) : null;
  const mode: 'audio' | 'youtube' | 'link' | 'none' = SONG.audioUrl
    ? 'audio'
    : ytId
    ? 'youtube'
    : SONG.externalUrl
    ? 'link'
    : 'none';

  const label = [SONG.title, SONG.artist].filter(Boolean).join(' · ') || 'Nuestra canción';

  useEffect(() => {
    if (mode === 'none' || !scrolledPast) return;
    const t1 = setTimeout(() => setHint(true), 1200);
    const t2 = setTimeout(() => setHint(false), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mode, scrolledPast]);

  // YouTube (oculto)
  useEffect(() => {
    if (mode !== 'youtube' || !ytId) return;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !ytHostRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(ytHostRef.current, {
        videoId: ytId,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, loop: 1, playlist: ytId },
        events: {
          onReady: (e: any) => {
            setReady(true);
            setDur(e.target.getDuration?.() ?? 0);
            // Reproducción automática al entrar a la invitación (el clic en "Entrar" cuenta como gesto del usuario)
            try { e.target.playVideo?.(); } catch { /* si el navegador lo bloquea, queda el botón */ }
          },
          onStateChange: (e: any) => {
            const S = (window as any).YT.PlayerState;
            if (e.data === S.PLAYING) {
              setPlaying(true);
              setDur(e.target.getDuration?.() ?? 0);
            }
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

  // Progreso de YouTube
  useEffect(() => {
    if (mode !== 'youtube' || !playing) return;
    const id = window.setInterval(() => {
      const p = ytPlayerRef.current;
      if (p?.getCurrentTime) setCur(p.getCurrentTime());
    }, 500);
    return () => window.clearInterval(id);
  }, [mode, playing]);

  if (mode === 'none') return null;

  const toggle = () => {
    setHint(false);
    setExpanded(true);
    if (mode === 'audio') {
      const el = audioRef.current;
      if (!el) return;
      playing ? el.pause() : el.play().catch(() => setPlaying(false));
    } else if (mode === 'youtube') {
      const p = ytPlayerRef.current;
      if (!p) return;
      playing ? p.pauseVideo() : p.playVideo();
    }
  };

  const restart = () => {
    if (mode === 'audio' && audioRef.current) audioRef.current.currentTime = 0;
    if (mode === 'youtube') ytPlayerRef.current?.seekTo?.(0, true);
    setCur(0);
  };

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dur) return;
      const r = e.currentTarget.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const to = pct * dur;
      if (mode === 'audio' && audioRef.current) audioRef.current.currentTime = to;
      if (mode === 'youtube') ytPlayerRef.current?.seekTo?.(to, true);
      setCur(to);
    },
    [dur, mode],
  );

  const pct = dur ? Math.min(100, (cur / dur) * 100) : 0;
  const isPlayable = mode === 'audio' || mode === 'youtube';
  const disabled = mode === 'youtube' && !ready;

  const btn = 'flex items-center justify-center rounded-full bg-olive text-white shadow-2xl transition-colors hover:bg-olive-dark disabled:opacity-60';

  const shown = scrolledPast || playing;

  return (
    <div
      className={`fixed bottom-24 right-5 z-[50] flex flex-col items-end gap-3 transition-all duration-300 md:bottom-6 md:left-6 md:right-auto md:items-start ${
        shown ? '' : 'pointer-events-none translate-y-8 opacity-0'
      }`}
    >
      {mode === 'audio' && (
        <audio
          ref={audioRef}
          src={SONG.audioUrl}
          loop
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        />
      )}
      {mode === 'youtube' && (
        <div className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0" aria-hidden>
          <div ref={ytHostRef} />
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {isPlayable && (expanded || playing) ? (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="w-[min(80vw,17rem)] rounded-2xl border border-stone-100 bg-white/95 p-4 shadow-2xl backdrop-blur"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-olive">Nuestra canción</p>
                <p className="truncate font-serif text-xs italic text-stone-500">{label}</p>
              </div>
              <button onClick={() => setExpanded(false)} aria-label="Minimizar" className="-mr-1 -mt-1 shrink-0 text-stone-300 hover:text-stone-500">
                <ChevronDown size={16} />
              </button>
            </div>

            <div
              onClick={seek}
              className="group mt-3 h-2 cursor-pointer rounded-full bg-stone-200"
              role="slider"
              aria-label="Progreso"
              aria-valuemin={0}
              aria-valuemax={Math.round(dur)}
              aria-valuenow={Math.round(cur)}
            >
              <div className="relative h-full rounded-full bg-olive" style={{ width: `${pct}%` }}>
                <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-olive opacity-0 shadow transition-opacity group-hover:opacity-100" />
              </div>
            </div>
            <div className="mt-1 flex justify-between text-[10px] tabular-nums text-stone-400">
              <span>{fmt(cur)}</span>
              <span>{dur ? fmt(dur) : '--:--'}</span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-5">
              <button onClick={restart} aria-label="Volver al inicio" className="text-stone-500 transition-colors hover:text-olive">
                <SkipBack size={18} />
              </button>
              <button onClick={toggle} disabled={disabled} aria-label={playing ? 'Pausar' : 'Reproducir'} aria-pressed={playing} className={`${btn} h-12 w-12`}>
                {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <span aria-label="Repetición activada" title="En repetición" className="text-terracotta">
                <Repeat size={18} />
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => (mode === 'link' ? window.open(SONG.externalUrl, '_blank', 'noopener') : (setExpanded(true), toggle()))}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            aria-label={mode === 'link' ? `Escuchar ${label}` : `Reproducir ${label}`}
            className={`${btn} h-14 w-14`}
          >
            {mode === 'link' ? <Music size={20} /> : <Play size={20} className="ml-0.5" />}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hint && !expanded && !playing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full right-0 mb-3 w-max max-w-[70vw] rounded-2xl border border-stone-100 bg-white px-4 py-2 shadow-xl md:left-0 md:right-auto"
          >
            <span className="block text-[10px] font-bold uppercase tracking-widest text-olive">Nuestra canción</span>
            <span className="block font-serif text-xs italic text-stone-500">Presiona para escucharla ♥</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
