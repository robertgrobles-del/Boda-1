
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';

export const PlaylistSection: React.FC = () => {
  const { toast } = useToast();
  const [song, setSong] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song.trim() || status === 'sending') return;

    setStatus('sending');
    try {
      const response = await fetch(`${API_CONFIG.backendUrl}/api/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song }),
      });
      if (!response.ok) throw new Error('bad response');

      setStatus('sent');
      toast('¡Sugerencia enviada! La buscaremos para la playlist.', 'success');
      setTimeout(() => {
        setStatus('idle');
        setSong('');
      }, 2500);
    } catch (error) {
      console.error('Error sending song:', error);
      setStatus('idle');
      toast('No pudimos enviar la canción. Intenta de nuevo.', 'error');
    }
  };

  return (
    <section className="relative flex h-full min-h-[60vh] items-start justify-center border-b border-l border-stone-100 bg-white pb-16 pt-16 text-center min-[481px]:pb-32 min-[481px]:pt-32">
      <div className="mx-auto w-full max-w-xl px-6">
        <div className="mb-8 text-center min-[481px]:mb-10">
          <h2 className="font-serif text-2xl text-olive md:text-4xl lg:text-5xl">¿Qué canción no puede faltar?</h2>
        </div>
        <p className="mb-8 px-2 font-serif text-xs italic text-stone-600 min-[481px]:mb-10 md:text-lg">
          Ayúdanos a armar la playlist perfecta para la fiesta. ¡Dinos qué canción te hará saltar a la pista!
        </p>

        <form onSubmit={handleSubmit} className="relative">
          <label htmlFor="song-input" className="sr-only">Canción sugerida</label>
          <input
            id="song-input"
            type="text"
            placeholder="Artista - Nombre de la canción"
            className="w-full rounded-full border border-stone-200 bg-white px-6 py-4 pr-20 font-serif text-[11px] italic shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-olive/30 md:text-sm md:pr-28"
            value={song}
            onChange={(e) => setSong(e.target.value)}
            disabled={status === 'sent'}
          />
          <button
            type="submit"
            disabled={status !== 'idle' || !song.trim()}
            className={`absolute bottom-1.5 right-1.5 top-1.5 flex items-center justify-center rounded-full px-5 text-[9px] font-bold uppercase tracking-widest transition-all md:px-6 md:text-[10px] ${
              status === 'sent'
                ? 'bg-olive text-white'
                : 'bg-olive text-white shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100'
            }`}
          >
            {status === 'sent' ? '¡Listo!' : status === 'sending' ? '...' : <Send size={14} />}
          </button>
        </form>
      </div>
    </section>
  );
};
