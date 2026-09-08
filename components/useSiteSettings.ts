import { useEffect, useState } from 'react';
import { API_CONFIG } from '../constants';

export interface SiteSettings {
  showCounter: boolean;
  showGuestbook: boolean;
  rsvpOpen: boolean;
  rsvpDeadline: string;
  graciasAuto: boolean;
  graciasFrom: string;
  announceShow: boolean;
  announceText: string;
  showStory: boolean;
  showParents: boolean;
  showGallery: boolean;
  showDressCode: boolean;
  showGifts: boolean;
  eventDateTime: string;
}

const DEFAULTS: SiteSettings = {
  showCounter: true,
  showGuestbook: true,
  rsvpOpen: true,
  rsvpDeadline: '2026-10-07',
  graciasAuto: false,
  graciasFrom: '2026-11-08',
  announceShow: false,
  announceText: '',
  showStory: true,
  showParents: true,
  showGallery: true,
  showDressCode: true,
  showGifts: true,
  eventDateTime: '',
};

// Cache a nivel de módulo: una sola petición por carga de página.
let cache: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

const load = (): Promise<SiteSettings> => {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch(`${API_CONFIG.backendUrl}/api/settings`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((d) => {
      cache = { ...DEFAULTS, ...(d || {}) };
      listeners.forEach((fn) => fn(cache!));
      return cache;
    })
    .catch(() => {
      cache = { ...DEFAULTS };
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(cache || DEFAULTS);
  useEffect(() => {
    let alive = true;
    listeners.add(setSettings);
    load().then((s) => {
      if (alive) setSettings(s);
    });
    return () => {
      alive = false;
      listeners.delete(setSettings);
    };
  }, []);
  return settings;
}
