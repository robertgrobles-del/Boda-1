import React, { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

const LeafShape: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden>
    <path
      d="M12 2C6.5 5.5 3 10.5 3 15.5 3 20 6 22 9.5 22 16 22 21 14.5 21 6c0-2-.8-4-2-4-1.8 0-4.2 1-7 0Z"
      fill={color}
    />
    <path d="M11 4c-.8 5.5-3.5 11-7 15.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
  </svg>
);

/**
 * Hojas/pétalos cayendo con deriva suave. Capa fija tras el contenido.
 * Se desactiva por completo con `prefers-reduced-motion`.
 */
export const FallingLeaves: React.FC<{ count?: number }> = ({ count = 14 }) => {
  const reduceMotion = useReducedMotion();

  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 9 + Math.random() * 15,
        duration: 13 + Math.random() * 13,
        delay: -Math.random() * 26,
        drift: `${(Math.random() * 2 - 1) * 44}px`,
        spin: `${(Math.random() > 0.5 ? 1 : -1) * (240 + Math.random() * 260)}deg`,
        opacity: 0.1 + Math.random() * 0.22,
        color: ['#4a5d23', '#6b7c3a', '#8a9a5b', '#b35a44'][i % 4],
      })),
    [count],
  );

  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[45] overflow-hidden" aria-hidden>
      {leaves.map((l) => (
        <span
          key={l.id}
          className="leaf-fall absolute -top-12 block"
          style={{
            left: `${l.left}%`,
            width: l.size,
            height: l.size,
            opacity: l.opacity,
            animationDuration: `${l.duration}s`,
            animationDelay: `${l.delay}s`,
            // @ts-expect-error CSS custom properties
            '--leaf-drift': l.drift,
            '--leaf-spin': l.spin,
          }}
        >
          <LeafShape color={l.color} />
        </span>
      ))}
    </div>
  );
};
