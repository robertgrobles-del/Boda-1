import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Church, Utensils, CircleParking } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { MAPS_URLS } from '../constants';
import { useInvitee } from './InviteeContext';
import { useSiteSettings, useSiteImage } from './useSiteSettings';

export const EventDetails: React.FC<{ id: string }> = ({ id }) => {
  const { isCeremonyOnly, isReceptionOnly } = useInvitee();
  const settings = useSiteSettings();
  const showReception = !isCeremonyOnly;
  const showCeremony = !isReceptionOnly;
  const twoCards = showReception && showCeremony;

  const ceremonyImg = useSiteImage('ceremonyPhoto', settings.ceremonyPhoto || '/images/Iglesia_Santa_Barbara.webp');
  const receptionImg = useSiteImage('receptionPhoto', settings.receptionPhoto || '/images/club_naco.webp');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const ceremonyTitle = settings.ceremonyTitle || 'Ceremonia';
  const ceremonyTime = settings.ceremonyTime || '5:00 PM';
  const ceremonyPlace = settings.ceremonyPlace || 'Catedral Castrense de Santa Bárbara';
  const ceremonyAddress = settings.ceremonyAddress || 'C. General Gabino Puello, Ciudad Colonial, Santo Domingo';
  const ceremonyMapsUrl = settings.ceremonyMapsUrl || MAPS_URLS.ceremony;
  const ceremonyParkingUrl = settings.ceremonyParkingUrl || MAPS_URLS.ceremonyParking;
  const ceremonyParkingNote = settings.ceremonyParkingNote || 'Opción de parqueo recomendada, cerca de la iglesia';

  const receptionTitle = settings.receptionTitle || 'Recepción';
  const receptionTime = settings.receptionTime || '7:30 PM';
  const receptionPlace = settings.receptionPlace || 'Club Deportivo Naco · Salón Montás';
  const receptionAddress = settings.receptionAddress || 'C. Salvador Sturla, Santo Domingo';
  const receptionMapsUrl = settings.receptionMapsUrl || MAPS_URLS.reception;
  const receptionParkingUrl = settings.receptionParkingUrl || '';
  const receptionParkingNote = settings.receptionParkingNote || '⚠️ Nota: El salón no cuenta con parqueo';

  return (
    <section id={id} className="min-h-screen py-20 md:py-32 px-6 bg-white relative overflow-hidden flex flex-col justify-center">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 opacity-[0.2] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <SectionHeader
          eyebrow="El gran día"
          title={<span className="font-signature text-olive">Cuándo &amp; Dónde</span>}
          className="mb-16 md:mb-24"
        />

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={`grid gap-8 md:gap-12 mx-auto ${twoCards ? 'md:grid-cols-2 max-w-5xl' : 'max-w-md'}`}
        >
          {/* Ceremony Card */}
          {showCeremony && (
          <motion.div
            variants={itemVariants}
            className="bg-[#f9fafb] rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col items-center text-center group h-full"
          >
            {/* Decorative Blooms */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d9a58f] rounded-bl-full opacity-40 -mr-8 -mt-8"></div>

            {/* Icon Container */}
            <div className="relative z-10 mb-8">
              <div className="w-16 h-16 bg-cream border border-olive/20 rounded-full flex items-center justify-center shadow-sm">
                <Church size={28} className="text-terracotta" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 mb-6 flex-grow">
              <h3 className="text-2xl md:text-4xl font-serif italic text-ink">{ceremonyTitle}</h3>
              {ceremonyTime && <p className="text-olive font-bold text-[10px] uppercase tracking-[0.2em]">{ceremonyTime}</p>}
            </div>

            <div className="relative z-10 w-full pt-8 border-t border-gray-200">
              <div className="flex items-start justify-center gap-2 mb-3">
                <MapPin size={18} className="text-terracotta mt-1 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[#1f2937] font-serif font-bold text-sm md:text-base">{ceremonyPlace}</p>
                  {ceremonyAddress && (
                    <p className="text-[#6b7280] text-xs md:text-sm">
                      {ceremonyAddress}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {ceremonyMapsUrl && (
                  <a
                    href={ceremonyMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-terracotta px-5 py-2 text-[9px] font-bold uppercase tracking-widest text-white transition-all shadow-sm hover:bg-terracotta/90 active:scale-95"
                  >
                    <MapPin size={13} />
                    Ver Ubicación
                  </a>
                )}

                {ceremonyParkingUrl && (
                  <a
                    href={ceremonyParkingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-olive/30 bg-olive/5 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-olive transition-all hover:bg-olive hover:text-white active:scale-95"
                    title={ceremonyParkingNote || 'Opción de parqueo recomendada'}
                  >
                    <CircleParking size={13} />
                    {ceremonyParkingNote || 'Opción de parqueo recomendada'}
                  </a>
                )}
              </div>

              {/* Nota de parqueo (si aplica) */}
              {ceremonyParkingNote && !ceremonyParkingUrl && (
                <div className="mt-3">
                  <span className="inline-block text-[11px] text-amber-900 font-medium bg-amber-50 border border-amber-200/70 rounded-full py-1 px-3">
                    {ceremonyParkingNote}
                  </span>
                </div>
              )}
            </div>

            {/* Image */}
            <div className="mt-8 w-full h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              <img
                src={ceremonyImg}
                alt={ceremonyPlace}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          </motion.div>
          )}

          {/* Reception Card */}
          {showReception && (
          <motion.div
            variants={itemVariants}
            className="bg-[#f9fafb] rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col items-center text-center group h-full"
          >
            {/* Decorative Blooms */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d9a58f] rounded-bl-full opacity-40 -mr-8 -mt-8"></div>

            {/* Icon Container */}
            <div className="relative z-10 mb-8">
              <div className="w-16 h-16 bg-cream border border-olive/20 rounded-full flex items-center justify-center shadow-sm">
                <Utensils size={28} className="text-terracotta" />
              </div>
            </div>

            <div className="relative z-10 space-y-2 mb-6 flex-grow">
              <h3 className="text-2xl md:text-4xl font-serif italic text-ink">{receptionTitle}</h3>
              {receptionTime && <p className="text-olive font-bold text-[10px] uppercase tracking-[0.2em]">{receptionTime}</p>}
            </div>

            <div className="relative z-10 w-full pt-8 border-t border-gray-200">
              <div className="flex items-start justify-center gap-2 mb-2">
                <MapPin size={18} className="text-terracotta mt-1 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[#1f2937] font-serif font-bold text-sm md:text-base">{receptionPlace}</p>
                  {receptionAddress && (
                    <p className="text-[#6b7280] text-xs md:text-sm">
                      {receptionAddress}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {receptionMapsUrl && (
                  <a
                    href={receptionMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-terracotta px-5 py-2 text-[9px] font-bold uppercase tracking-widest text-white transition-all shadow-sm hover:bg-terracotta/90 active:scale-95"
                  >
                    <MapPin size={13} />
                    Ver Ubicación
                  </a>
                )}

                {receptionParkingUrl && (
                  <a
                    href={receptionParkingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-olive/30 bg-olive/5 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-olive transition-all hover:bg-olive hover:text-white active:scale-95"
                    title={receptionParkingNote || 'Opción de parqueo'}
                  >
                    <CircleParking size={13} />
                    {receptionParkingNote || 'Opción de parqueo'}
                  </a>
                )}
              </div>

              {/* Nota de parqueo */}
              {receptionParkingNote && !receptionParkingUrl && (
                <div className="mt-3">
                  <span className="inline-block text-[11px] text-amber-900 font-medium bg-amber-50 border border-amber-200/70 rounded-full py-1 px-3">
                    {receptionParkingNote}
                  </span>
                </div>
              )}
            </div>

            {/* Map Placeholder Image */}
            <div className="mt-8 w-full h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              <img
                src={receptionImg}
                alt={receptionPlace}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
