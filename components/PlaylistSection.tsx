
import React, { useState } from 'react';
import { Music, Send } from 'lucide-react';
import { API_CONFIG } from '../constants';

export const PlaylistSection: React.FC = () => {
  const [song, setSong] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song.trim()) return;

    try {
      const response = await fetch(`${API_CONFIG.backendUrl}/api/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song })
      });

      if (response.ok) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setSong('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending song:', error);
    }
  };

  return (
    <section className="min-h-[60vh] h-full flex items-start justify-center pt-16 pb-16 min-[481px]:pt-32 min-[481px]:pb-32 text-center bg-white relative border-b border-stone-100 border-l border-stone-50">
      <div className="max-w-xl mx-auto px-6 w-full">
        <div className="text-center mb-8 min-[481px]:mb-10">
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl text-[#4a5d23]">¿Qué canción no puede faltar?</h2>
        </div>
        <p className="text-stone-500 mb-8 min-[481px]:mb-10 font-serif italic text-xs md:text-lg px-2">
          Ayúdanos a armar la playlist perfecta para la fiesta. ¡Dinos qué canción te hará saltar a la pista!
        </p>

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            placeholder="Artista - Nombre de la canción"
            className="w-full px-6 py-4 bg-white border border-stone-100 rounded-full pr-16 focus:outline-none focus:ring-2 focus:ring-[#4a5d23]/20 transition-all shadow-sm italic font-serif text-[10px] md:text-sm"
            value={song}
            onChange={(e) => setSong(e.target.value)}
            disabled={sent}
          />
          <button
            type="submit"
            disabled={sent || !song.trim()}
            className={`absolute right-1.5 top-1.5 bottom-1.5 px-4 md:px-6 rounded-full transition-all flex items-center justify-center font-bold text-[9px] md:text-[10px] tracking-widest uppercase ${sent ? 'bg-[#b35a44] text-white' : 'bg-[#4a5d23] text-white hover:scale-105 shadow-md active:scale-95'
              }`}
          >
            {sent ? '¡Listo!' : <Send size={16} />}
          </button>
        </form>

        {sent && (
          <p className="mt-4 text-green-600 font-medium text-sm animate-pulse">
            ¡Sugerencia enviada! La buscaremos en Spotify.
          </p>
        )}
      </div>
    </section>
  );
};
