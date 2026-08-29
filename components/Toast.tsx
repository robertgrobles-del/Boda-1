import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
};

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <Check size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
};

const ACCENT: Record<ToastKind, string> = {
  success: 'text-olive',
  error: 'text-terracotta',
  info: 'text-stone-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed inset-x-0 bottom-6 z-[80] flex flex-col items-center gap-2 px-4 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
              role="status"
            >
              <span className={ACCENT[t.kind]}>{ICONS[t.kind]}</span>
              <span className="text-sm text-stone-700">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Cerrar aviso"
                className="ml-1 text-stone-300 transition-colors hover:text-stone-500"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
