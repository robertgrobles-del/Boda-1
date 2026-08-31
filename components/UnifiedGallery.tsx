import React, { useState } from 'react';
import { Upload, Instagram, X, Check } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Lightbox } from './Lightbox';
import { EVENT_DATA, API_CONFIG, PHOTOS } from '../constants';
import { responsiveImg } from '../utils/images';

import { Skeleton } from './Skeleton';

const galleryImages = PHOTOS.gallery;
const fullSize = (u: string) => (u.startsWith('http') ? `${u}?auto=format&fit=crop&q=80&w=1600` : u);

// Foto que se muestra partida en dos mitades en el encabezado ("Captura los momentos")
const splitImage = '/images/preboda/imagen_2.webp';

// Anchos de tarjeta: ~80vw en móvil, 360px en escritorio
const CARD_SIZES = '(min-width: 768px) 360px, 80vw';

const GalleryImage: React.FC<{ src: string; alt: string; sizes?: string; className?: string }> = ({ src, alt, sizes = CARD_SIZES, className }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <div className={`relative h-full w-full bg-stone-100 ${className || ''}`}>
            {!isLoaded && <Skeleton className="absolute inset-0 z-10 w-full h-full" />}
            <img
                {...responsiveImg(src, sizes, [480, 768, 1024])}
                alt={alt}
                className={`h-full w-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
            />
        </div>
    );
};

export const UnifiedGallery: React.FC<{ id: string }> = ({ id }) => {
    const reduceMotion = useReducedMotion();
    const [paused, setPaused] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // States for inline file uploader
    const [uploadOpen, setUploadOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Duplicamos la lista para el bucle continuo del marquee
    const marqueeItems = [...galleryImages, ...galleryImages];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
            setUploadSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFiles.length) return;
        setUploading(true);
        setUploadProgress(5);
        
        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const base64 = await compressAndGetBase64(file);
                
                const res = await fetch(`${API_CONFIG.backendUrl}/api/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: file.name,
                        type: file.type,
                        base64
                    })
                });

                if (!res.ok) throw new Error('Upload failed');
                
                setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
            }
            
            setUploadSuccess(true);
            setSelectedFiles([]);
        } catch (err) {
            console.error(err);
            alert('Hubo un error al subir los archivos.');
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

    return (
        <section id={id} className="relative min-h-screen overflow-hidden bg-cream py-20">
            {/* Encabezado */}
            <div className="mx-auto mb-12 w-full max-w-7xl px-6 text-center md:mb-20 lg:px-32 lg:text-left">
                <div className="grid grid-cols-1 items-center gap-10 md:gap-16 lg:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6 md:space-y-8"
                    >
                        <div className="space-y-3 md:space-y-4">
                            <span className="block text-[8px] font-bold uppercase tracking-[0.4em] text-olive md:text-[10px]">
                                Nuestra historia en fotos
                            </span>
                            <h2 className="text-4xl leading-none md:text-7xl lg:text-8xl">
                                <span className="block font-signature text-olive">Captura los momentos</span>
                            </h2>
                            <p className="mx-auto max-w-lg font-serif text-sm italic leading-relaxed text-stone-600 md:text-xl lg:mx-0">
                                "Ayúdanos a coleccionar cada sonrisa. Comparte tus fotos usando nuestro hashtag oficial o envíanoslas directamente."
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row md:gap-6 lg:justify-start">
                            <div className="inline-block rounded-full border border-olive px-6 py-2.5">
                                <span className="font-serif text-sm font-bold text-olive md:text-xl">
                                    {EVENT_DATA.hashtag}
                                </span>
                            </div>
                            <motion.button
                                onClick={() => {
                                    window.history.pushState(null, '', '/memories');
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-3 rounded-full bg-olive px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg cursor-pointer"
                            >
                                <Upload size={14} />
                                Compartir mis fotos
                            </motion.button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative hidden h-[420px] lg:block"
                    >
                        {/* Una sola foto (imagen_2) partida por la mitad: cada tarjeta muestra su mitad */}
                        <div className="grid h-full grid-cols-2 overflow-hidden rounded-3xl border-4 border-white shadow-xl">
                            <button
                                onClick={() => setLightboxIndex(0)}
                                className="relative overflow-hidden"
                                aria-label="Ampliar foto"
                            >
                                <img
                                    src={splitImage}
                                    alt="Stephanie y Dalvin"
                                    loading="lazy"
                                    className="absolute left-0 top-0 h-full w-[200%] max-w-none object-cover"
                                />
                            </button>
                            <button
                                onClick={() => setLightboxIndex(0)}
                                className="relative overflow-hidden"
                                aria-label="Ampliar foto"
                            >
                                <img
                                    src={splitImage}
                                    alt="Stephanie y Dalvin"
                                    loading="lazy"
                                    className="absolute right-0 top-0 h-full w-[200%] max-w-none object-cover"
                                />
                            </button>
                        </div>
                        <div className="absolute left-1/2 top-1/2 z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl">
                            <Instagram className="text-terracotta" size={20} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Carrusel */}
            <div className="gallery-marquee relative w-full overflow-hidden py-10">
                <div
                    className="gallery-marquee-track flex w-max gap-6"
                    data-paused={paused ? 'true' : 'false'}
                >
                    {marqueeItems.map((img, i) => (
                        <motion.button
                            key={i}
                            whileHover={reduceMotion ? undefined : { y: -10 }}
                            onClick={() => setLightboxIndex(i % galleryImages.length)}
                            onFocus={() => setPaused(true)}
                            onBlur={() => setPaused(false)}
                            className="group relative aspect-[4/5] w-[80vw] flex-shrink-0 overflow-hidden rounded-[2.5rem] border-4 border-white shadow-xl md:w-[360px]"
                            aria-label={`Ampliar foto ${(i % galleryImages.length) + 1}`}
                        >
                            <GalleryImage src={img} alt={`Foto de la boda ${(i % galleryImages.length) + 1}`} />
                            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                        </motion.button>
                    ))}
                </div>
            </div>

            <Lightbox
                images={galleryImages.map(fullSize)}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onNavigate={setLightboxIndex}
            />

            {/* Modal de subida de fotos */}
            <AnimatePresence>
                {uploadOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-stone-100"
                        >
                            <button
                                onClick={() => {
                                    setUploadOpen(false);
                                    setUploadSuccess(false);
                                    setSelectedFiles([]);
                                }}
                                className="absolute right-6 top-6 text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-olive mb-2 block">Álbum Compartido</span>
                                <h3 className="font-serif text-2xl font-bold text-stone-800">Sube tus fotos</h3>
                                <p className="text-xs text-stone-500 italic mt-1">Comparte tus recuerdos de este gran día</p>
                            </div>

                            {uploadSuccess ? (
                                <div className="text-center py-8 space-y-4">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-[#4a5d23]">
                                        <Check size={32} />
                                    </div>
                                    <h4 className="font-serif text-lg font-bold text-stone-800">¡Muchas gracias!</h4>
                                    <p className="text-sm text-stone-500">Tus fotos han sido cargadas exitosamente al álbum de la boda.</p>
                                    <button
                                        onClick={() => setUploadSuccess(false)}
                                        className="mt-4 px-6 py-2.5 bg-olive text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-olive-dark transition-all"
                                    >
                                        Subir más
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors relative cursor-pointer group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                        />
                                        <Upload className="mx-auto text-stone-400 group-hover:text-olive transition-colors mb-3" size={32} />
                                        <span className="text-xs font-bold text-stone-600 block">
                                            {selectedFiles.length > 0 
                                                ? `${selectedFiles.length} archivo(s) seleccionado(s)` 
                                                : "Seleccionar Fotos o Videos"
                                            }
                                        </span>
                                        <span className="text-[10px] text-stone-400 mt-1 block">Puedes seleccionar varios archivos</span>
                                    </div>

                                    {selectedFiles.length > 0 && !uploading && (
                                        <button
                                            onClick={handleUpload}
                                            className="w-full py-4 bg-olive text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-olive-dark transition-all shadow-md"
                                        >
                                            Empezar a subir
                                        </button>
                                    )}

                                    {uploading && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-bold text-stone-600">
                                                <span>Subiendo archivos...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-olive h-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
