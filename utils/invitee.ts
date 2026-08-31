/**
 * Lee el nombre del invitado del parámetro `?invitado=` de la URL.
 * Ej: /?invitado=Familia%20Pérez  →  "Familia Pérez"
 * Devuelve null si no viene, está vacío o parece inválido.
 */
export const getInviteeName = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw =
      new URLSearchParams(window.location.search).get('invitado') ??
      new URLSearchParams(window.location.search).get('invitada');
    if (!raw) return null;

    // Limpia: quita caracteres raros, colapsa espacios, limita largo.
    const clean = raw
      .replace(/[<>{}[\]|\\/`~^*_=+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);

    if (clean.length < 2) return null;
    if (!/[a-záéíóúñü]/i.test(clean)) return null;

    // Capitaliza cada palabra (respeta partículas comunes en minúscula).
    const minus = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);
    return clean
      .toLowerCase()
      .split(' ')
      .map((w, i) =>
        i > 0 && minus.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
      )
      .join(' ');
  } catch {
    return null;
  }
};
