import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { NAV_SECTIONS } from '../constants';

/**
 * Barra de navegación única para todo el sitio.
 * - Transparente sobre el hero, sólida al hacer scroll.
 * - Resalta la sección visible (scrollspy con IntersectionObserver).
 * - Menú desplegable en móvil/tablet.
 */
export const Nav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>(NAV_SECTIONS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Fondo sólido tras salir del hero
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scrollspy
  useEffect(() => {
    const sections = NAV_SECTIONS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Cerrar menú móvil con Escape y bloquear scroll de fondo
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    firstLinkRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const linkColor = scrolled ? 'text-stone-500' : 'text-white/70';

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 z-[60] w-full transition-colors duration-500 ${
          scrolled
            ? 'bg-cream/90 backdrop-blur-md border-b border-stone-200/70'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <a
            href="#inicio"
            className={`font-signature text-3xl transition-colors ${
              scrolled ? 'text-olive' : 'text-white'
            }`}
            aria-label="Ir al inicio"
          >
            S&amp;D
          </a>

          {/* Desktop */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? 'true' : undefined}
                className={`relative text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:opacity-100 ${
                  active === s.id
                    ? scrolled
                      ? 'text-olive'
                      : 'text-white'
                    : `${linkColor} opacity-80`
                }`}
              >
                {s.label}
                {active === s.id && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 left-0 right-0 h-px bg-olive"
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            className={`md:hidden ${scrolled ? 'text-olive' : 'text-white'}`}
          >
            <Menu size={24} />
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col bg-cream/98 backdrop-blur-md md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navegación"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/50">
              <span className="font-signature text-3xl text-olive">S&amp;D</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="text-olive">
                <X size={26} />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
              <span className="font-signature text-5xl text-olive mb-8">S&amp;D</span>
              <nav className="flex flex-col items-center gap-6">
                {NAV_SECTIONS.map((s, i) => (
                  <a
                    key={s.id}
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={`#${s.id}`}
                    onClick={() => setMenuOpen(false)}
                    className={`font-serif text-2xl italic transition-colors py-1 ${
                      active === s.id ? 'text-olive font-bold border-b border-olive/30' : 'text-olive/80 hover:text-olive'
                    }`}
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
              <div className="mt-12 flex flex-col items-center space-y-2">
                <div className="h-px w-16 bg-olive/20" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-olive/80">11 . NOV . 26</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
