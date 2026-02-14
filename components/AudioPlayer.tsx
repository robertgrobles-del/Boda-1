
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Browsers block autoplay unless there's interaction.
    // We try but handle the error gracefully.
    const attemptPlay = async () => {
      try {
        if (audioRef.current) {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.log("Autoplay blocked. User interaction required for audio.");
      }
    };
    
    // Some users might have interacted before this mount
    attemptPlay();
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 md:bottom-6 md:left-6">
      <audio ref={audioRef} src={src} loop />
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200 text-stone-800 hover:scale-110 transition-transform focus:outline-none"
        title={isPlaying ? "Pausar música" : "Reproducir música"}
      >
        {isPlaying ? (
          <Volume2 size={24} className="animate-pulse text-amber-600" />
        ) : (
          <VolumeX size={24} className="text-stone-400" />
        )}
      </button>
      {isPlaying && (
        <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
          <div className="flex space-x-0.5 items-end h-8 overflow-hidden">
             {[...Array(4)].map((_, i) => (
               <div 
                 key={i} 
                 className="w-1 bg-amber-400/50 rounded-t-full" 
                 style={{ 
                   height: `${Math.random() * 100}%`,
                   animation: `audioWave 1.2s ease-in-out infinite alternate`,
                   animationDelay: `${i * 0.2}s`
                 }}
               />
             ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes audioWave {
          from { height: 10%; }
          to { height: 100%; }
        }
      `}</style>
    </div>
  );
};
