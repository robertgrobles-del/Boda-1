import { useEffect, useState } from 'react';
import { API_CONFIG } from '../constants';

export interface BankAccount {
  bank: string;
  type: string;
  number: string;
  holder: string;
  cedula: string;
}

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
  lockMode: 'off' | 'link' | 'list' | 'password';
  dressFormalTitle: string;
  dressFormalText: string;
  dressColorsTitle: string;
  dressColorsText: string;
  registryIntro: string;
  registryCasaNote: string;
  registryCasaListNumber: string;
  registryCasaUrl: string;
  registryBanks: BankAccount[];
  galleryUrls: string[];
  /** slot -> versión (ms) de la imagen sobreescrita desde el panel */
  images: Record<string, number>;
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
  lockMode: 'off',
  dressFormalTitle: 'Formal / Elegante',
  dressFormalText: 'Te esperamos elegante para la ocasión.',
  dressColorsTitle: 'Colores',
  dressColorsText: 'Inspírate en la paleta de otoño. Reservado el blanco y el beige para la novia.',
  registryIntro: '"Su presencia es nuestro mayor regalo. Si además desean tener un detalle con nosotros, aquí están nuestras opciones."',
  registryCasaNote: 'Disponible de forma digital y física',
  registryCasaListNumber: '194090',
  registryCasaUrl: 'https://listaderegalos.casacuesta.com/Event/Stephanie-DalvinDaniel?utm_source=share',
  registryBanks: [],
  galleryUrls: [],
  images: {},
};

// Cache a nivel de módulo: una sola petición por carga de página.
let cache: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

/** Devuelve el src de una imagen: el override del panel si existe, o el fallback local. */
export function siteImageSrc(slot: string, fallback: string): string {
  const v = cache?.images?.[slot];
  if (!v) return fallback;
  return `${API_CONFIG.backendUrl}/api/img/${slot}?v=${v}`;
}

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

/** Hook: src de una imagen del sitio, reactivo a la carga de ajustes. */
export function useSiteImage(slot: string, fallback: string): string {
  const s = useSiteSettings();
  const v = s.images?.[slot];
  return v ? `${API_CONFIG.backendUrl}/api/img/${slot}?v=${v}` : fallback;
}

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
