import { useEffect, useState } from 'react';

/**
 * `true` cuando la página se ha desplazado más de `fraction` de la altura de la
 * ventana (por defecto 75%, ~cuando el hero deja de verse). Sirve para mostrar
 * los botones flotantes solo después del hero.
 */
export const useScrolledPast = (fraction = 0.75): boolean => {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * fraction);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [fraction]);

  return past;
};
