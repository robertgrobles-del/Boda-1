import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { OurStory } from './components/OurStory';
import { StoryImproved } from './components/StoryImproved';
import { StoryInteractive } from './components/StoryInteractive';
import { StoryCards } from './components/StoryCards';
import { StoryTimeline } from './components/StoryTimeline';
import { Countdown } from './components/Countdown';
import { EventDetails } from './components/EventDetails';
import { RSVPForm } from './components/RSVPForm';
import { GiftRegistry } from './components/GiftRegistry';
import { UnifiedGallery } from './components/UnifiedGallery';
import { DressCode } from './components/DressCode';
import { WhatsAppButton } from './components/WhatsAppButton';
import { PlaylistSection } from './components/PlaylistSection';
import { Gateway } from './components/Gateway';
import { Calendar, Apple, X, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { EVENT_DATA, CALENDAR_URLS } from './constants';

const App: React.FC = () => {
  const [showGateway, setShowGateway] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return true;
  });

  const [showRSVPModal, setShowRSVPModal] = useState(false);


  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if ((showGateway && isMobile) || showRSVPModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [showGateway, showRSVPModal]);

  const [storyVariant, setStoryVariant] = useState('improved');
  const [showVariantMenu, setShowVariantMenu] = useState(false);

  return (
    <div className="relative min-h-screen selection:bg-[#4a5d23] selection:text-white bg-[#fdfaf6] overflow-x-hidden">
      {/* Variant Switcher (Developer Tool for Review) */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowVariantMenu(!showVariantMenu)}
          className="w-12 h-12 bg-white rounded-full shadow-2xl border border-stone-200 flex items-center justify-center text-[#b35a44]"
        >
          <Settings size={20} />
        </motion.button>

        <AnimatePresence>
          {showVariantMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-16 right-0 bg-white p-4 rounded-2xl shadow-2xl border border-stone-100 w-64 space-y-2"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-2 mb-2">Elegir Diseño Historia</p>
              {[
                { id: 'improved', label: '1. Mejorado' },
                { id: 'interactive', label: '2. Interactivo (Mockup 1)' },
                { id: 'cards', label: '3. Tarjetas (Mockup 2)' },
                { id: 'timeline', label: '4. Timeline' }
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setStoryVariant(v.id); setShowVariantMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors ${storyVariant === v.id ? 'bg-[#b35a44] text-white' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  {v.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showGateway && (
          <Gateway onEnter={() => setShowGateway(false)} />
        )}
      </AnimatePresence>

      {/* RSVP Modal */}
      <AnimatePresence>
        {showRSVPModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRSVPModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setShowRSVPModal(false)}
                className="absolute top-6 right-6 z-50 p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="max-h-[90vh] overflow-y-auto">
                <RSVPForm id="modal-rsvp" isModal onClose={() => setShowRSVPModal(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-[15%] -left-24 w-[450px] h-[450px] opacity-[0.03] grayscale bg-no-repeat bg-contain transition-transform duration-1000 ease-out"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200)' }}
        />
        <div
          className="absolute top-[45%] -right-40 w-[700px] h-[700px] opacity-[0.03] grayscale bg-no-repeat bg-contain rotate-12"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1522673607200-1648832cee98?auto=format&fit=crop&q=80&w=1200)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showGateway ? 0 : 1 }}
        transition={{ duration: 1 }}
      >
        <Hero onRSVPClick={() => setShowRSVPModal(true)} />

        <main className="relative z-10">
          {storyVariant === 'improved' && <StoryImproved />}
          {storyVariant === 'interactive' && <StoryInteractive />}
          {storyVariant === 'cards' && <StoryCards />}
          {storyVariant === 'timeline' && <StoryTimeline />}

          <Countdown targetDate={EVENT_DATA.date} />
          <EventDetails id="detalles" />
          <UnifiedGallery id="galeria" />
          <div className="lg:grid lg:grid-cols-2">
            <DressCode />
            <PlaylistSection />
          </div>
          <GiftRegistry id="regalos" />
          <RSVPForm id="confirmar" />
          <WhatsAppButton phoneNumber={EVENT_DATA.whatsapp} />
        </main>

        <footer className="bg-white py-12 md:py-16 border-t border-stone-100 flex flex-col items-center relative z-10">
          <span className="font-signature text-6xl text-[#4a5d23] mb-8">S&D</span>
          <p className="text-stone-500 text-center max-w-md px-6 italic mb-10 leading-relaxed text-sm">
            "No podemos esperar para celebrar nuestro día especial con todas nuestras personas favoritas."
          </p>
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <a href={CALENDAR_URLS.google} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 bg-white border border-stone-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50 transition-colors shadow-sm">
              <Calendar size={14} className="text-[#b35a44]" /> Google Calendar
            </a>
            <button className="flex items-center gap-3 px-6 py-4 bg-white border border-stone-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50 transition-colors shadow-sm">
              <Apple size={14} className="text-[#4a5d23]" /> iCloud Calendar
            </button>
          </div>
          <p className="text-[11px] text-stone-400 uppercase tracking-[0.5em] font-bold mb-4">{EVENT_DATA.displayDate}</p>
          <div className="text-[10px] text-stone-400 font-serif italic text-center px-4">
            {EVENT_DATA.hashtag} • Est. {EVENT_DATA.estYear} • All guests must bring good vibes.
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default App;
