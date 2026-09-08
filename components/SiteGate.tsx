import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useSiteSettings } from './useSiteSettings';
import { useInvitee } from './InviteeContext';

const readUnlocked = () => {
  try {
    return sessionStorage.getItem('sd_site_unlocked') === '1';
  } catch {
    return false;
  }
};

/**
 * Bloqueo del sitio de invitados según `lockMode` de Configuración:
 *  - 'off'      → entra todo el mundo
 *  - 'link'     → hace falta cualquier enlace ?invitado=
 *  - 'list'     → el ?invitado= debe coincidir con la lista de invitados
 *  - 'password' → contraseña única (o un enlace válido de la lista)
 */
export const SiteGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lockMode } = useSiteSettings();
  const { loaded, hasParam, found } = useInvitee();
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [pass, setPass] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  if (lockMode === 'off') return <>{children}</>;

  const needsInviteeLookup = lockMode === 'list' || lockMode === 'password';
  if (needsInviteeLookup && hasParam && !loaded) {
    // Esperando a resolver el ?invitado= — evita el parpadeo de la pantalla de bloqueo.
    return <div className="min-h-screen bg-cream" />;
  }

  const allowed =
    lockMode === 'link'
      ? hasParam
      : lockMode === 'list'
      ? loaded && found
      : /* password */ unlocked || (loaded && found);

  if (allowed) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass.trim() || checking) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/site/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass.trim() }),
      });
      const d = await res.json();
      if (d.ok) {
        try {
          sessionStorage.setItem('sd_site_unlocked', '1');
        } catch { /* noop */ }
        setUnlocked(true);
      } else {
        setError('Contraseña incorrecta.');
      }
    } catch {
      setError('No se pudo verificar. Intenta de nuevo.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-900 px-6 text-center text-white">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5">
        <Lock size={22} className="text-white/80" />
      </div>
      <h1 className="mt-6 font-signature text-4xl text-white/95">Stephanie &amp; Dalvin</h1>

      {lockMode === 'password' ? (
        <>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/60">
            Esta invitación es privada. Ingresa la contraseña o abre el enlace personalizado que te enviamos.
          </p>
          <form onSubmit={submit} className="mt-6 flex w-full max-w-xs flex-col gap-3">
            <input
              type="password"
              autoFocus
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Contraseña"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={checking}
              className="rounded-xl bg-olive px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-olive-dark disabled:opacity-50"
            >
              {checking ? 'Verificando…' : 'Entrar'}
            </button>
            {error && <span className="text-[11px] text-terracotta">{error}</span>}
          </form>
        </>
      ) : (
        <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/60">
          Esta invitación es privada. Por favor abre el enlace personalizado que te enviamos por WhatsApp.
        </p>
      )}
    </div>
  );
};
