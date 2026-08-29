/**
 * Utilidades para servir imágenes de Unsplash de forma responsiva.
 * Unsplash acepta `?w=` y `&q=` en la URL, así que generamos un `srcSet`
 * con varios anchos y dejamos que el navegador elija el más adecuado.
 */

const DEFAULT_WIDTHS = [480, 768, 1024, 1600, 2000];

const withWidth = (url: string, w: number): string => {
  const [base, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  params.set('w', String(w));
  if (!params.has('auto')) params.set('auto', 'format');
  if (!params.has('fit')) params.set('fit', 'crop');
  if (!params.has('q')) params.set('q', '70');
  return `${base}?${params.toString()}`;
};

/** true si la URL es remota y admite parámetros ?w= (Unsplash). */
const isRemote = (url: string) => /^https?:\/\//.test(url);

export const srcSet = (url: string, widths: number[] = DEFAULT_WIDTHS): string =>
  isRemote(url) ? widths.map((w) => `${withWidth(url, w)} ${w}w`).join(', ') : url;

/**
 * Props listas para pasar a un <img>: `src` (fallback), `srcSet` y `sizes`.
 * @param sizes descripción CSS de cuánto espacio ocupa la imagen (por defecto, ancho completo).
 */
export const responsiveImg = (
  url: string,
  sizes = '100vw',
  widths: number[] = DEFAULT_WIDTHS,
) => {
  if (!isRemote(url)) return { src: url };
  return {
    src: withWidth(url, widths[Math.floor(widths.length / 2)]),
    srcSet: srcSet(url, widths),
    sizes,
  };
};
