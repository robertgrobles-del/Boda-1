
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CountdownTime } from '../types';
import { API_CONFIG } from '../constants';

interface CountdownProps {
  targetDate: string;
}

const getRemaining = (targetDate: string): { time: CountdownTime; done: boolean } => {
  const difference = new Date(targetDate).getTime() - Date.now();
  if (difference <= 0) {
    return { time: { days: 0, hours: 0, minutes: 0, seconds: 0 }, done: true };
  }
  return {
    done: false,
    time: {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    },
  };
};

export const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const [{ time: timeLeft, done }, setState] = useState(() => getRemaining(targetDate));
  const [confirmed, setConfirmed] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_CONFIG.backendUrl}/api/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && typeof d.confirmedGuests === 'number') setConfirmed(d.confirmedGuests);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      const next = getRemaining(targetDate);
      setState(next);
      if (next.done) window.clearInterval(timer);
    };
    const timer = window.setInterval(tick, 1000);
    tick();
    return () => window.clearInterval(timer);
  }, [targetDate]);

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative mb-3 min-[481px]:mb-6">
        <div className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#f4ece1] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] min-[481px]:h-24 min-[481px]:w-24 md:h-40 md:w-40">
          <span className="font-serif text-2xl tabular-nums text-olive min-[481px]:text-3xl md:text-6xl">
            {value.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-0 z-20 rounded-full bg-gradient-to-tr from-stone-50/50 to-transparent" />
      </div>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#6d5b6b] min-[481px]:text-[10px] min-[481px]:tracking-[0.3em] md:text-[12px]">
        {label}
      </span>
    </div>
  );

  return (
    <section
      id="cuenta-regresiva"
      className="relative flex min-h-[40vh] items-center justify-center overflow-hidden bg-cream py-12 min-[481px]:min-h-[60vh] min-[481px]:py-24"
    >
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-olive">
              Hoy es el día
            </span>
            <h2 className="px-4 font-signature text-5xl text-olive md:text-8xl">
              ¡Hoy nos casamos!
            </h2>
            <p className="mx-auto max-w-md font-serif text-base italic text-stone-500 md:text-lg">
              Gracias por acompañarnos a celebrar este momento.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-10 min-[481px]:mb-16 md:mb-20">
              <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.5em] text-olive min-[481px]:mb-4 min-[481px]:text-xs">
                Cuenta regresiva
              </span>
              <h2 className="px-4 font-serif text-2xl font-medium italic tracking-tight text-olive min-[481px]:text-3xl md:text-5xl lg:text-6xl">
                para el "¡Sí, acepto!"
              </h2>
            </div>

            <div className="flex justify-center gap-2 min-[481px]:gap-6 md:gap-12 lg:gap-16">
              <TimeBox value={timeLeft.days} label="Días" />
              <TimeBox value={timeLeft.hours} label="Horas" />
              <TimeBox value={timeLeft.minutes} label="Min" />
              <TimeBox value={timeLeft.seconds} label="Seg" />
            </div>

            {confirmed !== null && confirmed > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-10 text-[11px] font-bold uppercase tracking-[0.3em] text-terracotta min-[481px]:mt-16 min-[481px]:text-xs"
              >
                {confirmed} {confirmed === 1 ? 'invitado ya confirmó' : 'invitados ya confirmaron'}
              </motion.p>
            )}
          </>
        )}
      </div>
    </section>
  );
};
