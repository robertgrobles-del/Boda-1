import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image, Check, ChevronLeft, Upload, Smartphone, Sparkles, FolderHeart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  coverImage: string;
}

const CATEGORIES: Category[] = [
  { 
    id: 'preparativos', 
    name: 'Preparación', 
    icon: '💄', 
    description: 'Maquillaje, vestimenta y momentos previos',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600'
  },
  { 
    id: 'civil', 
    name: 'Boda Civil', 
    icon: '✍️', 
    description: 'Firma de actas y momentos íntimos',
    coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600'
  },
  { 
    id: 'ceremonia', 
    name: 'Ceremonia', 
    icon: '⛪', 
    description: 'Intercambio de votos y anillos',
    coverImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=600'
  },
  { 
    id: 'recepcion', 
    name: 'Recepción', 
    icon: '🍷', 
    description: 'Cena, brindis y momentos especiales',
    coverImage: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=600'
  },
  { 
    id: 'afterparty', 
    name: 'After Party', 
    icon: '🕺', 
    description: 'Bailes, música y la hora loca',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600'
  },
  { 
    id: 'lunademiel', 
    name: 'Luna de Miel', 
    icon: '✈️', 
    description: 'Viajes y aventuras post-boda',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600'
  }
];

export const MemoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobile(mobileRegex.test(ua));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setUploadSuccess(false);
    }
  };

  const handleUpload = async (filesToUpload: File[]) => {
    if (!filesToUpload.length || !selectedCategory) return;
    setUploading(true);
    setUploadProgress(5);

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const base64 = await compressAndGetBase64(file);

        const res = await fetch(`${API_CONFIG.backendUrl}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            base64,
            folder: selectedCategory.id
          })
        });

        if (!res.ok) throw new Error('Upload failed');

        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      setUploadSuccess(true);
      setSelectedFiles([]);
      toast('¡Recuerdo guardado con éxito!', 'success');
    } catch (err) {
      console.error(err);
      toast('Error al subir los recuerdos.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const compressAndGetBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        return;
      }

      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = error => reject(error);
    });
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleGoBack = () => {
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6 text-stone-800">
        <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] border border-stone-200/50 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-olive-light rounded-full flex items-center justify-center mx-auto text-olive">
            <Smartphone size={32} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Experiencia Móvil</h1>
            <p className="text-sm text-stone-500 mt-2">
              Esta sección está diseñada como una cámara instantánea para capturar recuerdos en tiempo real desde tu celular.
            </p>
          </div>
          
          <div className="border border-stone-100 bg-cream p-6 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-olive mb-4">Escanea para acceder</span>
            <div className="w-36 h-36 bg-stone-800 rounded-2xl flex items-center justify-center p-3 shadow-md relative">
              <div className="absolute inset-2 border border-white/20 rounded-lg"></div>
              <FolderHeart size={48} className="text-white" />
            </div>
            <span className="text-[11px] text-stone-400 mt-4 font-serif italic">Escanea con tu cámara móvil para abrir memories</span>
          </div>

          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 mx-auto transition-colors"
          >
            <ChevronLeft size={16} /> Volver a la Invitación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col text-stone-800 pb-10">
      
      {/* Mobile Top Header */}
      <header className="sticky top-0 bg-cream/90 backdrop-blur-md border-b border-stone-200/30 z-30 px-6 py-4 flex items-center justify-between">
        <button onClick={handleGoBack} className="text-stone-600 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center flex-grow pr-6">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-olive">Stephanie & Dalvin</span>
          <h1 className="font-serif text-lg font-bold text-stone-800 leading-tight">Dots Memories</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 pt-6 flex flex-col justify-between space-y-6">
        
        {/* Step Indicator */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-olive-light text-olive flex items-center justify-center font-serif text-xs font-bold">1</span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">Desliza y selecciona un Álbum</h2>
          </div>
          <p className="text-[11px] text-stone-400 italic">Desliza horizontalmente para ver todos los momentos</p>
        </div>

        {/* Swipeable Albums Carousel (80vh Card list) */}
        <div className="w-screen -mx-6 overflow-x-auto flex gap-4 px-6 snap-x snap-mandatory no-scrollbar py-2">
          {CATEGORIES.map((c) => (
            <motion.div
              key={c.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedCategory(c);
                setUploadSuccess(false);
              }}
              className="w-[80vw] h-[65vh] md:h-[70vh] rounded-[2.5rem] overflow-hidden flex-shrink-0 relative snap-center shadow-xl border-2 border-white/50 cursor-pointer"
            >
              {/* Cover Image */}
              <img 
                src={c.coverImage} 
                alt={c.name}
                className="w-full h-full object-cover" 
              />
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 flex flex-col justify-end p-6 text-white">
                <span className="text-3xl mb-2 block">{c.icon}</span>
                <h3 className="font-serif text-2xl font-bold">{c.name}</h3>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">{c.description}</p>
                
                <span className="mt-4 inline-flex items-center justify-center w-full py-3 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                  Subir a este álbum
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Accent */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 tracking-wider">
          <Sparkles size={12} className="text-terracotta" />
          <span>Dots Memories de Stephanie & Dalvin</span>
        </div>
      </main>

      {/* Slide-up Upload Module Drawer */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end"
          >
            {/* Backdrop Dismiss */}
            <div className="absolute inset-0" onClick={() => setSelectedCategory(null)}></div>

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[2.5rem] p-8 shadow-2xl relative z-50 border-t border-stone-100 max-h-[85vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedCategory(null)}
                className="absolute right-6 top-6 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 active:scale-90 transition-transform"
              >
                <X size={16} />
              </button>

              {/* Album Context Header */}
              <div className="text-center mb-6">
                <span className="text-3xl mb-1 block">{selectedCategory.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-olive">Álbum de Fotos</span>
                <h3 className="font-serif text-xl font-bold text-stone-800 mt-1">{selectedCategory.name}</h3>
                <p className="text-xs text-stone-500 italic mt-0.5">{selectedCategory.description}</p>
              </div>

              {/* Input triggers */}
              {/* To make it open the native camera app immediately on iOS/Android, we set accept exclusively to image/* */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    setSelectedFiles(files);
                    handleUpload(files); // Auto upload instant pictures
                  }
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {uploading ? (
                <div className="w-full text-center py-10 space-y-4">
                  <div className="w-14 h-14 border-4 border-olive border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <span className="text-xs font-bold text-stone-600 block">Guardando recuerdos...</span>
                    <span className="text-xs text-stone-400 font-mono mt-1">{uploadProgress}%</span>
                  </div>
                  <div className="w-full max-w-xs bg-stone-100 h-1.5 rounded-full overflow-hidden mx-auto">
                    <div className="bg-olive h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : uploadSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-olive">
                    <Check size={32} />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-stone-800">¡Recuerdo Guardado!</h4>
                  <p className="text-xs text-stone-500">Tu foto ha sido cargada directamente a la carpeta de **{selectedCategory.name}** en Google Drive.</p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={triggerCamera}
                      className="flex-1 py-3 bg-olive text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                    >
                      Tomar otra
                    </button>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Big Camera trigger ring */}
                  <div className="flex flex-col items-center space-y-4">
                    <button
                      onClick={triggerCamera}
                      className="w-28 h-28 rounded-full border-4 border-olive-light bg-olive text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform relative"
                    >
                      <Camera size={38} />
                      <span className="absolute -bottom-2 bg-[#b35a44] text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white shadow">
                        Tomar Foto
                      </span>
                    </button>
                    <p className="text-xs text-stone-500 text-center font-medium">Pulsa el botón para abrir la cámara de tu celular</p>
                  </div>

                  <div className="border-t border-stone-100 pt-4 flex flex-col items-center space-y-3">
                    <button
                      onClick={triggerGallery}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-600 active:scale-95 transition-all"
                    >
                      <Image size={14} /> Seleccionar de Galería
                    </button>

                    {selectedFiles.length > 0 && (
                      <div className="w-full pt-3 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-stone-500 mb-3">{selectedFiles.length} archivo(s) listo(s)</span>
                        <button
                          onClick={() => handleUpload(selectedFiles)}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-olive hover:bg-olive-dark text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98]"
                        >
                          <Upload size={14} /> Subir Selección
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
