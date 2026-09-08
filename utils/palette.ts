/**
 * Utilidades de color para el "tema personalizado" de cada portal.
 * Genera una paleta de boda armónica a partir de 1–3 colores base.
 */

export interface Palette {
  primary: string; // color principal (títulos, botones)
  accent: string;  // color de acento
  bg: string;      // fondo del sitio (casi blanco, con un toque del tono)
  ink: string;     // color de texto (casi negro)
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

export const hexToRgb = (hex: string): [number, number, number] => {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const to = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
};

export const rgbTriplet = (hex: string): string => hexToRgb(hex).join(' ');

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
};

const hslToHex = (h: number, s: number, l: number): string => {
  h = ((h % 360) + 360) % 360;
  s = clamp(s); l = clamp(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};

const hsl = (hex: string) => rgbToHsl(...hexToRgb(hex));

/** Aclara u oscurece manteniendo tono; delta en puntos de luminosidad (-1..1). */
export const shift = (hex: string, dl: number, ds = 0): string => {
  const [h, s, l] = hsl(hex);
  return hslToHex(h, clamp(s + ds), clamp(l + dl));
};

/** Mezcla dos colores (t = 0 → a, t = 1 → b). */
export const mix = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
};

/**
 * Genera una paleta a partir de 1–3 colores base.
 *  - 1 color: se deriva un acento complementario suave + fondo y texto del mismo tono.
 *  - 2 colores: principal + acento; fondo/texto derivados del principal.
 *  - 3 colores: principal + acento + el 3.º como semilla del fondo.
 */
export const generatePalette = (seedsRaw: string[]): Palette => {
  const seeds = seedsRaw.map((c) => c.trim()).filter((c) => /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(c)).map((c) => (c[0] === '#' ? c : `#${c}`));
  const primary = seeds[0] || '#4a5d23';
  const [ph] = hsl(primary);

  let accent: string;
  if (seeds[1]) {
    const [ah, as, al] = hsl(seeds[1]);
    accent = hslToHex(ah, clamp(as, 0.32, 0.62), clamp(al, 0.42, 0.6));
  } else {
    // Acento armónico: terracota suave, salvo que el principal ya sea cálido → verde salvia.
    const warm = ph <= 55 || ph >= 330;
    accent = warm ? hslToHex(150, 0.26, 0.42) : hslToHex(22, 0.48, 0.53);
  }

  const bgSeedHue = seeds[2] ? hsl(seeds[2])[0] : ph;
  const bg = hslToHex(bgSeedHue, 0.30, 0.975);
  const ink = hslToHex(ph, 0.22, 0.13);

  return { primary, accent, bg, ink };
};

/** Convierte la paleta en las 7 variables CSS que usa el sitio (valores "r g b"). */
export const paletteToVars = (p: Palette): Record<string, string> => ({
  '--c-olive': rgbTriplet(p.primary),
  '--c-olive-dark': rgbTriplet(shift(p.primary, -0.1)),
  '--c-olive-light': rgbTriplet(mix(p.primary, '#ffffff', 0.86)),
  '--c-terracotta': rgbTriplet(p.accent),
  '--c-terracotta-dark': rgbTriplet(shift(p.accent, -0.08)),
  '--c-cream': rgbTriplet(p.bg),
  '--c-ink': rgbTriplet(p.ink),
});

export const CUSTOM_VAR_NAMES = [
  '--c-olive', '--c-olive-dark', '--c-olive-light',
  '--c-terracotta', '--c-terracotta-dark', '--c-cream', '--c-ink',
];
