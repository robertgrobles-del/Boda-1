import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Camera } from 'lucide-react';
import { API_CONFIG, EVENT_DATA } from '../constants';
import { FallingLeaves } from './FallingLeaves';
import { Lightbox } from './Lightbox';
import { Skeleton } from './Skeleton';

const goHome = () => {
  window.history.pushState(null, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const GalleryImg: React.FC<{ src: string; alt: string; onClick: () => void }> = ({ src, alt, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      onClick={onClick}
      className="group relative mb-3 block w-full overflow-hidden rounded-2xl bg-stone-100 shadow-sm break-inside-avoid"
      aria-label="Ampliar foto"
    >
      {!loaded && <Skeleton className="aspect-[3/4] w-full" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full object-cover transition-all duration-700 group-hover:scale-[1.03] ${loaded ? 'opacity-100' : 'absolute inset-0 opacity-0'}`}
      />
    </button>
  );
};

export const GraciasPage: React.FC = () => {
  const [items, setItems] = useState<{ id: string; name: string }[] | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    document.title = `Gracias · ${EVENT_DATA.hashtag.replace('#', '')}`;
    window.scrollTo(0, 0);
    fetch(`${API_CONFIG.backendUrl}/api/gallery`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  const urls = (items || []).map((it) => `${API_CONFIG.backendUrl}/api/gallery/img/${it.id}`);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cream text-stone-800">
      <FallingLeaves count={10} />

      {/* Hero de agradecimiento */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex max-w-2xl flex-col items-center"
        >
          <span className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-olive">
            <Heart size={12} className="text-terracotta" /> {EVENT_DATA.displayDate}
          </span>
          <h1 className="font-signature text-6xl leading-none text-olive sm:text-7xl md:text-8xl">Gracias</h1>
          <div className="my-8 h-px w-16 bg-olive/30" />
          <p className="font-serif text-base italic leading-relaxed text-stone-600 md:text-lg">
            Gracias por acompañarnos en el día más importante de nuestras vidas. Cada abrazo, cada
            sonrisa y cada baile quedarán con nosotros para siempre. No pudimos haber pedido mejores
            personas con quienes celebrar este comienzo.
          </p>
          <p className="mt-6 font-signature text-3xl text-olive md:text-4xl">Stephanie &amp; Dalvin</p>
        </motion.div>
      </section>

      {/* Galería post-boda */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 md:px-8">
        <div className="mb-10 text-center">
          <span className="mb-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-olive">
            <Camera size={13} className="text-terracotta" /> Los momentos que capturaron ustedes
          </span>
          <h2 className="font-serif text-3xl italic text-ink md:text-4xl">Nuestra boda, en sus fotos</h2>
        </div>

        {items === null ? (
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 aspect-[3/4] w-full rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-stone-200/60 bg-white py-16 text-center">
            <p className="text-sm italic text-stone-400">
              Las fotos que compartieron los invitados aparecerán aquí muy pronto.
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
            {items.map((it, i) => (
              <GalleryImg
                key={it.id}
                src={urls[i]}
                alt={it.name || `Foto ${i + 1}`}
                onClick={() => setLightbox(i)}
              />
            ))}
          </div>
        )}
      </section>

      <Lightbox images={urls} index={lightbox} onClose={() => setLightbox(null)} onNavigate={setLightbox} />

      <footer className="relative z-10 border-t border-stone-100 bg-white py-10 text-center">
        <span className="font-signature text-4xl text-olive">S&amp;D</span>
        <div className="mt-3">
          <button onClick={goHome} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600">
            Volver a la invitación
          </button>
        </div>
      </footer>
    </div>
  );
};
