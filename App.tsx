import React, { useEffect, useState } from 'react';
import { Hero } from './components/Hero';
import { StoryImproved } from './components/StoryImproved';
import { Parents } from './components/Parents';
import { Countdown } from './components/Countdown';
import { EventDetails } from './components/EventDetails';
import { Itinerary } from './components/Itinerary';
import { PhotoBand } from './components/PhotoBand';
import { FallingLeaves } from './components/FallingLeaves';
import { RSVPForm } from './components/RSVPForm';
import { GiftRegistry } from './components/GiftRegistry';
import { Guestbook } from './components/Guestbook';
import { UnifiedGallery } from './components/UnifiedGallery';
import { DressCode } from './components/DressCode';
import { NoKids } from './components/NoKids';
import { WhatsAppButton } from './components/WhatsAppButton';
import { MusicPlayer } from './components/MusicPlayer';
import { Gateway } from './components/Gateway';
import { Nav } from './components/Nav';
import { ToastProvider } from './components/Toast';
import { AdminDashboard } from './components/AdminDashboard';
import { MemoriesPage } from './components/MemoriesPage';
import { Calendar, Apple } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EVENT_DATA, PHOTOS, CALENDAR_URLS, buildIcsDataUri } from './constants';

type Route = 'home' | 'admin' | 'memories';

const routeFromPath = (path: string): Route => {
  if (path === '/admin') return 'admin';
  if (path === '/memories') return 'memories';
  return 'home';
};

const App: React.FC = () => {
  const reduceMotion = useReducedMotion();

  const [currentRoute, setCurrentRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? 'home' : routeFromPath(window.location.pathname),
  );

  const [showGateway, setShowGateway] = useState(true);

  const closeGateway = () => {
    setShowGateway(false);
  };

  useEffect(() => {
    const handleLocationChange = () => setCurrentRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    if (currentRoute !== 'home') {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = showGateway ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showGateway, currentRoute]);

  const scrollToRSVP = () => {
    document.getElementById('confirmar')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  if (currentRoute === 'admin') {
    return (
      <ToastProvider>
        <AdminDashboard />
      </ToastProvider>
    );
  }

  if (currentRoute === 'memories') {
    return (
      <ToastProvider>
        <MemoriesPage />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-cream selection:bg-olive selection:text-white">
        <AnimatePresence>
          {showGateway && <Gateway onEnter={closeGateway} />}
        </AnimatePresence>

        {!showGateway && <MusicPlayer />}
        {!showGateway && <FallingLeaves />}

        {/* Fondo decorativo sutil */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute top-[15%] -left-24 h-[450px] w-[450px] bg-contain bg-no-repeat opacity-[0.03] grayscale"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200)' }}
          />
          <div
            className="absolute top-[45%] -right-40 h-[700px] w-[700px] rotate-12 bg-contain bg-no-repeat opacity-[0.03] grayscale"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1522673607200-1648832cee98?auto=format&fit=crop&q=80&w=1200)' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showGateway ? 0 : 1 }}
          transition={{ duration: reduceMotion ? 0 : 1 }}
        >
          <Nav />

          <Hero onRSVPClick={scrollToRSVP} />

          <main className="relative z-10">
            <StoryImproved />
            <Parents />
            <Countdown targetDate={EVENT_DATA.date} />
            <EventDetails id="detalles" />
            <Itinerary />
            <PhotoBand src={PHOTOS.band} quote="No podemos esperar para celebrar contigo" />
            <UnifiedGallery id="galeria" />
            <DressCode />
            <NoKids />
            <GiftRegistry id="regalos" />
            <RSVPForm id="confirmar" />
            <Guestbook id="mensajes" />
            <WhatsAppButton phoneNumber={EVENT_DATA.whatsapp} />
          </main>

          <footer className="relative z-10 flex flex-col items-center border-t border-stone-100 bg-white py-12 md:py-16">
            <span className="font-signature mb-8 text-6xl text-olive">S&amp;D</span>
            <p className="mb-10 max-w-md px-6 text-center text-sm italic leading-relaxed text-stone-500">
              "No podemos esperar para celebrar nuestro día especial con todas nuestras personas favoritas."
            </p>
            <div className="mb-12 flex flex-col gap-4 md:flex-row">
              <a
                href={CALENDAR_URLS.google}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-600 shadow-sm transition-colors hover:bg-stone-50"
              >
                <Calendar size={14} className="text-terracotta" /> Google Calendar
              </a>
              <a
                href={buildIcsDataUri()}
                download="boda-stephanie-daniel.ics"
                className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-600 shadow-sm transition-colors hover:bg-stone-50"
              >
                <Apple size={14} className="text-terracotta" /> Apple / Outlook
              </a>
            </div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.5em] text-stone-400">{EVENT_DATA.displayDate}</p>
            <div className="px-4 text-center text-[10px] font-serif italic text-stone-400">
              {EVENT_DATA.hashtag} · Nuestra historia empezó en {EVENT_DATA.estYear}
            </div>
          </footer>
        </motion.div>
      </div>
    </ToastProvider>
  );
};

export default App;
