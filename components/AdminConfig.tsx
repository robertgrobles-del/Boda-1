import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, Trash2, Upload, Plus, Image as ImageIcon, Eye, Star, Wand2 } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { DEFAULT_WA_TEMPLATE } from './waTemplate';
import { generatePalette, paletteToVars, type Palette } from '../utils/palette';

type Toast = (msg: string, type?: 'success' | 'error') => void;

interface Props {
  apiKey: string;
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  patchSettings: (obj: Record<string, any>) => Promise<void>;
  loadSettings: (key?: string) => Promise<void>;
  onBack: () => void;
  toast: Toast;
}

const IMAGE_SLOTS: { slot: string; label: string; hint: string }[] = [
  { slot: 'heroBackground', label: 'Portada (fondo)', hint: 'Foto grande detrás del nombre en la pantalla de inicio.' },
  { slot: 'heroPortrait', label: 'Portada (retrato)', hint: 'Foto en arco/hexágono de los novios en la portada.' },
  { slot: 'gateway', label: 'Pantalla de bienvenida', hint: 'Fondo de la pantalla previa ("Entrar").' },
  { slot: 'story', label: 'Sección "Nuestra historia"', hint: 'Foto vertical de la sección del sacramento.' },
  { slot: 'band', label: 'Franja intermedia', hint: 'Foto ancha con la frase "No podemos esperar…".' },
  { slot: 'og', label: 'Vista previa (WhatsApp/OG)', hint: 'La imagen que se ve al compartir el enlace. Ideal 1200×630.' },
];

const THEMES = [
  { id: 'clasico', name: 'Clásico', c1: '#4a5d23', c2: '#b35a44', bg: '#fdfaf6', font: 'Playfair · Great Vibes' },
  { id: 'rosa', name: 'Romántico', c1: '#7a4e5c', c2: '#c07878', bg: '#fcf7f6', font: 'Cormorant · Parisienne' },
  { id: 'jardin', name: 'Jardín', c1: '#1e5f48', c2: '#e2725b', bg: '#f9faf6', font: 'Garamond · Tangerine' },
  { id: 'arena', name: 'Arena', c1: '#8a663d', c2: '#b05636', bg: '#faf5ee', font: 'Fraunces · Petit Script' },
];

const NAV: { id: string; label: string; scope: 'x' | 'p' | 'g' }[] = [
  { id: 'portales', label: 'Portales', scope: 'x' },
  { id: 'diseno', label: 'Diseño', scope: 'p' },
  { id: 'anuncio', label: 'Anuncio', scope: 'p' },
  { id: 'secciones', label: 'Secciones', scope: 'p' },
  { id: 'vestimenta', label: 'Vestimenta', scope: 'p' },
  { id: 'regalos', label: 'Mesa de regalos', scope: 'p' },
  { id: 'fotos', label: 'Fotos', scope: 'p' },
  { id: 'bloqueo', label: 'Bloqueo del sitio', scope: 'g' },
  { id: 'confirmaciones', label: 'Confirmaciones', scope: 'g' },
  { id: 'gracias', label: 'Página de gracias', scope: 'g' },
  { id: 'correo', label: 'Correo', scope: 'g' },
  { id: 'whatsapp', label: 'Plantilla WhatsApp', scope: 'g' },
];

// Comprime una imagen a JPEG para guardarla en la base de datos.
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 1800;
      let { width, height } = img;
      if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
      else if (height >= width && height > MAX) { width *= MAX / height; height = MAX; }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

const PRES_DEFAULTS: Record<string, any> = {
  announceShow: false, announceText: '',
  showStory: true, showParents: true, showGallery: true, showDressCode: true, showGifts: true,
  showCounter: true, showGuestbook: true, eventDateTime: '',
  dressFormalTitle: 'Formal / Elegante', dressFormalText: 'Te esperamos elegante para la ocasión.',
  dressColorsTitle: 'Colores', dressColorsText: 'Inspírate en la paleta de otoño. Reservado el blanco y el beige para la novia.',
  registryIntro: '"Su presencia es nuestro mayor regalo. Si además desean tener un detalle con nosotros, aquí están nuestras opciones."',
  registryCuestaOn: true,
  registryCasaNote: 'Disponible de forma digital y física', registryCasaListNumber: '194090',
  registryCasaUrl: 'https://listaderegalos.casacuesta.com/Event/Stephanie-DalvinDaniel?utm_source=share',
  registryAmazonOn: false, registryAmazonNote: 'Lista de bodas de Amazon', registryAmazonUrl: '',
  registryStores: [], registryBanksOn: true,
  registryBanks: [], galleryUrls: [], theme: 'clasico', paletteSeeds: [], palette: null,
};

export const AdminConfig: React.FC<Props> = ({ apiKey, settings, setSettings, patchSettings, loadSettings, onBack, toast }) => {
  const s = settings;
  const set = (obj: Record<string, any>) => setSettings((p: any) => ({ ...p, ...obj }));
  const [nav, setNav] = useState<string>('portales');

  useEffect(() => { if (!settings) loadSettings(); }, []); // eslint-disable-line

  // --- Portal en edición ---
  const [editPortal, setEditPortal] = useState<number>(() => settings?.activePortal || 1);
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && settings?.activePortal) { initRef.current = true; setEditPortal(settings.activePortal); }
  }, [settings?.activePortal]);
  const activePortal: number = s?.activePortal || 1;
  const portalNames: Record<string, string> = s?.portalNames || {};
  const portalData: Record<string, any> = s?.portals?.[editPortal] || {};
  const pv = (key: string) => (key in portalData ? portalData[key] : PRES_DEFAULTS[key]);
  const pset = (obj: Record<string, any>) =>
    setSettings((p: any) => ({
      ...p,
      portals: { ...(p.portals || {}), [editPortal]: { ...(p.portals?.[editPortal] || {}), ...obj } },
    }));
  const patchPortal = async (obj: Record<string, any>) => {
    pset(obj);
    try {
      const r = await fetch(`${API_CONFIG.backendUrl}/api/admin/portals/${editPortal}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(obj),
      });
      if (r.ok) {
        const d = await r.json();
        setSettings((p: any) => ({
          ...p,
          portals: { ...(p.portals || {}), [editPortal]: d.presentation },
          portalNames: d.portalNames || p.portalNames,
        }));
      } else toast('No se pudo guardar.', 'error');
    } catch { toast('Error de conexión.', 'error'); }
  };
  const activate = async () => {
    await patchSettings({ activePortal: editPortal });
    toast(`Portal ${editPortal} activado — es el que ven los invitados.`, 'success');
  };
  const preview = () => window.open(`/?portalPreview=${editPortal}`, '_blank');

  // --- Plantilla de WhatsApp (global) ---
  const [wa, setWa] = useState('');
  useEffect(() => { setWa((settings?.waTemplate && String(settings.waTemplate)) || DEFAULT_WA_TEMPLATE); }, [settings?.waTemplate]);

  // --- Mesa de regalos (por portal) ---
  const banks: any[] = Array.isArray(pv('registryBanks')) ? pv('registryBanks') : [];
  const setBanks = (b: any[]) => pset({ registryBanks: b });
  const stores: any[] = Array.isArray(pv('registryStores')) ? pv('registryStores') : [];
  const setStores = (x: any[]) => pset({ registryStores: x });

  // --- Diseño personalizado (por portal) ---
  const [seeds, setSeeds] = useState<string[]>(['#4a5d23']);
  useEffect(() => {
    const ps = portalData.paletteSeeds;
    setSeeds(Array.isArray(ps) && ps.length ? ps : ['#4a5d23']);
    // eslint-disable-next-line
  }, [editPortal]);
  const curPalette: Palette = (pv('palette') as Palette) || generatePalette(seeds);
  const genPalette = () => {
    const p = generatePalette(seeds);
    patchPortal({ theme: 'custom', paletteSeeds: seeds, palette: p });
    toast('Paleta generada.', 'success');
  };
  const setPaletteColor = (k: keyof Palette, hex: string) =>
    patchPortal({ theme: 'custom', palette: { ...curPalette, [k]: hex } });

  // --- Imágenes (por portal) ---
  const [assets, setAssets] = useState<Record<string, any>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const loadAssets = async () => {
    try {
      const r = await fetch(`${API_CONFIG.backendUrl}/api/admin/assets?portal=${editPortal}`, { headers: { 'x-api-key': apiKey } });
      if (r.ok) {
        const list = await r.json();
        setAssets(Object.fromEntries(list.map((a: any) => [a.slot, a])));
      }
    } catch { /* noop */ }
  };
  useEffect(() => { loadAssets(); }, [editPortal]); // eslint-disable-line

  const saveAsset = async (slot: string, body: any) => {
    try {
      const r = await fetch(`${API_CONFIG.backendUrl}/api/admin/assets/${slot}?portal=${editPortal}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { toast('Imagen actualizada.', 'success'); await loadAssets(); await loadSettings(); }
      else toast(d.error || 'No se pudo guardar la imagen.', 'error');
    } catch { toast('Error de conexión.', 'error'); }
  };
  const deleteAsset = async (slot: string) => {
    try {
      await fetch(`${API_CONFIG.backendUrl}/api/admin/assets/${slot}?portal=${editPortal}`, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
      toast('Imagen restablecida a la original.', 'success');
      await loadAssets(); await loadSettings();
    } catch { toast('Error de conexión.', 'error'); }
  };
  const onPickFile = async (slot: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Selecciona una imagen.', 'error'); return; }
    try {
      const dataUrl = await fileToDataUrl(file);
      await saveAsset(slot, { dataUrl });
    } catch { toast('No se pudo procesar la imagen.', 'error'); }
  };

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500"><ArrowLeft size={14} /> Volver</button>
        <p className="py-16 text-center text-sm italic text-stone-400">Cargando configuración…</p>
      </div>
    );
  }

  // --- helpers de campo ---
  const card = (children: React.ReactNode) => (
    <div className="admin-card p-5 sm:p-7 space-y-4">{children}</div>
  );
  const heading = (title: string, sub?: string) => (
    <div className="mb-3 border-b border-stone-100 pb-4">
      <h2 className="admin-title text-2xl text-stone-800">{title}</h2>
      {sub && <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{sub}</p>}
    </div>
  );
  const row = (label: string, val: boolean, on: (v: boolean) => void, hint?: string) => (
    <label className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3.5 cursor-pointer hover:border-stone-300">
      <span className="text-sm">
        <span className="font-bold text-stone-700">{label}</span>
        {hint && <span className="mt-0.5 block text-xs font-normal text-stone-400">{hint}</span>}
      </span>
      <input type="checkbox" checked={!!val} onChange={(e) => on(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#4a5d23]" />
    </label>
  );
  const textField = (
    label: string, value: string,
    onLocal: (v: string) => void, onCommit: (v: string) => void,
    opts: { area?: boolean; placeholder?: string },
  ) => (
    <div className="rounded-xl border border-stone-200 px-4 py-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-400">{label}</label>
      {opts.area ? (
        <textarea rows={2} value={value} placeholder={opts.placeholder}
          onChange={(e) => onLocal(e.target.value)} onBlur={(e) => onCommit(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-lg border border-stone-200 px-3 py-2 text-sm" />
      ) : (
        <input type="text" value={value} placeholder={opts.placeholder}
          onChange={(e) => onLocal(e.target.value)} onBlur={(e) => onCommit(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
      )}
    </div>
  );
  const gText = (label: string, key: string, opts: { area?: boolean; placeholder?: string } = {}) =>
    textField(label, s[key] ?? '', (v) => set({ [key]: v }), (v) => patchSettings({ [key]: v }), opts);
  const pText = (label: string, key: string, opts: { area?: boolean; placeholder?: string } = {}) =>
    textField(label, pv(key) ?? '', (v) => pset({ [key]: v }), (v) => patchPortal({ [key]: v }), opts);

  const portalLabel = portalNames[editPortal] || `Portal ${editPortal}`;

  // --- contenido por sección ---
  const content = () => {
    switch (nav) {
      case 'portales':
        return card(<>
          {heading('Portales de invitados', 'Hasta 5 versiones de la invitación. Editas una y los invitados siguen viendo la que está activa.')}
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setEditPortal(n)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  editPortal === n ? 'bg-[#4a5d23] text-white' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}>
                {activePortal === n && <Star size={12} className={editPortal === n ? 'text-amber-300' : 'text-amber-500'} fill="currentColor" />}
                {portalNames[n] || `Portal ${n}`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
            <input type="text" value={portalNames[editPortal] ?? ''} placeholder={`Nombre del portal ${editPortal}`}
              onChange={(e) => setSettings((p: any) => ({ ...p, portalNames: { ...(p.portalNames || {}), [editPortal]: e.target.value } }))}
              onBlur={(e) => patchPortal({ name: e.target.value })}
              className="min-w-[9rem] flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-xs" />
            <button onClick={preview} className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">
              <Eye size={12} /> Vista previa
            </button>
            {activePortal === editPortal ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-[#4a5d23] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <Star size={12} fill="currentColor" /> Activo
              </span>
            ) : (
              <button onClick={activate} className="flex items-center gap-1.5 rounded-lg bg-[#4a5d23] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#3b4c1b]">
                <Star size={12} /> Activar este portal
              </button>
            )}
          </div>
          <p className="text-[11px] text-stone-400">
            Entre portales solo cambia la <b>presentación</b> (diseño, textos, fotos, secciones, anuncio, fecha, galería).
            Correo, aforo, mesas, bloqueo, RSVP y la plantilla de WhatsApp son comunes a todos.
          </p>
        </>);

      case 'diseno': {
        const themeId = pv('theme') || 'clasico';
        const isCustom = themeId === 'custom';
        const vars = paletteToVars(curPalette);
        return card(<>
          {heading(`Diseño · ${portalLabel}`, 'Paleta de color y tipografías del portal (mismo layout).')}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {THEMES.map((t) => {
              const on = themeId === t.id;
              return (
                <button key={t.id} onClick={() => patchPortal({ theme: t.id })}
                  className={`rounded-xl border-2 p-2 text-left transition-all ${on ? 'border-[#4a5d23]' : 'border-stone-200 hover:border-stone-300'}`}>
                  <div className="mb-2 flex h-12 items-center justify-center gap-1.5 rounded-lg" style={{ background: t.bg }}>
                    <span className="h-5 w-5 rounded-full" style={{ background: t.c1 }} />
                    <span className="h-5 w-5 rounded-full" style={{ background: t.c2 }} />
                  </div>
                  <p className="text-xs font-bold text-stone-700">{t.name}{on && ' ✓'}</p>
                  <p className="text-[9px] text-stone-400">{t.font}</p>
                </button>
              );
            })}
            <button onClick={() => patchPortal({ theme: 'custom', paletteSeeds: seeds, palette: curPalette })}
              className={`rounded-xl border-2 p-2 text-left transition-all ${isCustom ? 'border-[#4a5d23]' : 'border-stone-200 hover:border-stone-300'}`}>
              <div className="mb-2 flex h-12 items-center justify-center gap-1.5 rounded-lg" style={{ background: curPalette.bg }}>
                <span className="h-5 w-5 rounded-full" style={{ background: curPalette.primary }} />
                <span className="h-5 w-5 rounded-full" style={{ background: curPalette.accent }} />
              </div>
              <p className="text-xs font-bold text-stone-700">Personalizado{isCustom && ' ✓'}</p>
              <p className="text-[9px] text-stone-400">Tus colores</p>
            </button>
          </div>

          {isCustom && (
            <div className="rounded-xl border border-stone-200 p-3 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Colores base (1 a 3)</p>
              {seeds.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(c) ? c : '#4a5d23'}
                    onChange={(e) => setSeeds(seeds.map((x, j) => (j === i ? e.target.value : x)))}
                    className="h-8 w-10 shrink-0 rounded border border-stone-200" />
                  <input type="text" value={c} placeholder="#4a5d23"
                    onChange={(e) => setSeeds(seeds.map((x, j) => (j === i ? e.target.value : x)))}
                    className="w-28 rounded border border-stone-200 px-2 py-1 font-mono text-xs" />
                  {seeds.length > 1 && (
                    <button onClick={() => setSeeds(seeds.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                {seeds.length < 3 && (
                  <button onClick={() => setSeeds([...seeds, '#b35a44'])} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50"><Plus size={11} /> Color</button>
                )}
                <button onClick={genPalette} className="flex items-center gap-1.5 rounded-lg bg-[#4a5d23] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#3b4c1b]"><Wand2 size={12} /> Generar paleta</button>
              </div>

              <p className="pt-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">Paleta — puedes ajustar cada color</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['primary', 'accent', 'bg', 'ink'] as const).map((k) => (
                  <label key={k} className="flex items-center gap-2 rounded-lg border border-stone-200 p-1.5">
                    <input type="color" value={curPalette[k]} onChange={(e) => setPaletteColor(k, e.target.value)} className="h-7 w-8 shrink-0 rounded" />
                    <span className="text-[10px] font-bold text-stone-600">{{ primary: 'Principal', accent: 'Acento', bg: 'Fondo', ink: 'Texto' }[k]}</span>
                  </label>
                ))}
              </div>

              <div className="flex overflow-hidden rounded-lg border border-stone-200">
                {Object.values(vars).map((v, i) => (
                  <span key={i} className="h-8 flex-1" style={{ background: `rgb(${v})` }} />
                ))}
              </div>
            </div>
          )}

          <button onClick={preview} className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">
            <Eye size={12} /> Ver este portal
          </button>
        </>);
      }

      case 'anuncio':
        return card(<>
          {heading(`Anuncio · ${portalLabel}`, 'Barra en la parte superior del sitio.')}
          {row('Mostrar el anuncio', pv('announceShow'), (v) => patchPortal({ announceShow: v }))}
          {pText('Texto del anuncio', 'announceText', { placeholder: 'Ej: La ceremonia inicia a las 5:00 PM' })}
        </>);

      case 'secciones':
        return card(<>
          {heading(`Secciones y contenido · ${portalLabel}`)}
          {row('Mostrar contador "X confirmaron"', pv('showCounter'), (v) => patchPortal({ showCounter: v }))}
          {row('Mostrar el libro de mensajes', pv('showGuestbook'), (v) => patchPortal({ showGuestbook: v }))}
          {row('Sección "Nuestra historia"', pv('showStory'), (v) => patchPortal({ showStory: v }))}
          {row('Sección "Padres / padrinos"', pv('showParents'), (v) => patchPortal({ showParents: v }))}
          {row('Sección "Galería"', pv('showGallery'), (v) => patchPortal({ showGallery: v }))}
          {row('Sección "Código de vestimenta"', pv('showDressCode'), (v) => patchPortal({ showDressCode: v }))}
          {row('Sección "Mesa de regalos"', pv('showGifts'), (v) => patchPortal({ showGifts: v }))}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-stone-700">Fecha y hora del evento<span className="mt-0.5 block text-[10px] font-normal text-stone-400">Para la cuenta regresiva. Vacío = predeterminada.</span></span>
            <input type="datetime-local" value={pv('eventDateTime') || ''} onChange={(e) => patchPortal({ eventDateTime: e.target.value })} className="rounded-lg border border-stone-200 px-2 py-1 text-xs" />
          </div>
        </>);

      case 'vestimenta':
        return card(<>
          {heading(`Código de vestimenta · ${portalLabel}`)}
          {pText('Título 1', 'dressFormalTitle')}
          {pText('Texto 1', 'dressFormalText', { area: true })}
          {pText('Título 2', 'dressColorsTitle')}
          {pText('Texto 2', 'dressColorsText', { area: true })}
        </>);

      case 'regalos':
        return card(<>
          {heading(`Mesa de regalos · ${portalLabel}`, 'Activa cada bloque que quieras mostrar.')}
          {pText('Introducción', 'registryIntro', { area: true })}

          {/* Casa Cuesta */}
          <div className="rounded-xl border border-stone-200 p-3 space-y-2">
            {row('Lista de bodas · Casa Cuesta', pv('registryCuestaOn'), (v) => patchPortal({ registryCuestaOn: v }))}
            {pv('registryCuestaOn') && (<>
              {pText('Nota', 'registryCasaNote')}
              {pText('Número de lista', 'registryCasaListNumber')}
              {pText('Enlace', 'registryCasaUrl')}
            </>)}
          </div>

          {/* Amazon */}
          <div className="rounded-xl border border-stone-200 p-3 space-y-2">
            {row('Lista de bodas · Amazon', pv('registryAmazonOn'), (v) => patchPortal({ registryAmazonOn: v }))}
            {pv('registryAmazonOn') && (<>
              {pText('Nota', 'registryAmazonNote')}
              {pText('Enlace de la lista de Amazon', 'registryAmazonUrl')}
            </>)}
          </div>

          {/* Otras tiendas */}
          <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Otras tiendas (Alis, Ikea, etc.)</span>
              <button type="button" onClick={() => setStores([...stores, { name: '', note: '', url: '' }])} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#4a5d23]"><Plus size={12} /> Agregar</button>
            </div>
            {stores.length === 0 && <p className="mt-2 text-[10px] italic text-stone-400">Ninguna tienda adicional.</p>}
            <div className="mt-2 space-y-3">
              {stores.map((st, i) => (
                <div key={i} className="rounded-lg bg-stone-50 p-2.5 space-y-1.5">
                  <input placeholder="Nombre de la tienda" value={st.name || ''}
                    onChange={(e) => setStores(stores.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm" />
                  <input placeholder="Nota (opcional)" value={st.note || ''}
                    onChange={(e) => setStores(stores.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm" />
                  <input placeholder="https://…" value={st.url || ''}
                    onChange={(e) => setStores(stores.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm" />
                  <button type="button" onClick={() => setStores(stores.filter((_, j) => j !== i))} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-600"><Trash2 size={11} /> Quitar</button>
                </div>
              ))}
            </div>
            {stores.length > 0 && (
              <button type="button" onClick={() => patchPortal({ registryStores: stores }).then(() => toast('Tiendas guardadas.', 'success'))} className="mt-3 flex items-center gap-2 rounded-lg bg-[#4a5d23] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#3b4c1b]">
                <Check size={12} /> Guardar tiendas
              </button>
            )}
          </div>

          {/* Cuentas de banco */}
          <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Cuentas de banco (hasta 3)</span>
              {banks.length < 3 && (
                <button type="button" onClick={() => setBanks([...banks, { bank: '', type: 'Cuenta de Ahorro', number: '', holder: '', cedula: '' }])} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#4a5d23]"><Plus size={12} /> Agregar</button>
              )}
            </div>
            {row('Mostrar las cuentas de banco', pv('registryBanksOn'), (v) => patchPortal({ registryBanksOn: v }))}
            {banks.length === 0 && <p className="mt-2 text-[10px] italic text-stone-400">Sin cuentas configuradas — el sitio usa las de por defecto.</p>}
            <div className="mt-2 space-y-3">
              {banks.map((b, i) => (
                <div key={i} className="rounded-lg bg-stone-50 p-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['bank', 'type', 'number', 'holder', 'cedula'] as const).map((f) => (
                      <input key={f}
                        placeholder={{ bank: 'Banco', type: 'Tipo de cuenta', number: 'No. de cuenta', holder: 'A nombre de', cedula: 'Cédula' }[f]}
                        value={b[f] || ''}
                        onChange={(e) => setBanks(banks.map((x, j) => (j === i ? { ...x, [f]: e.target.value } : x)))}
                        className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm" />
                    ))}
                  </div>
                  <button type="button" onClick={() => setBanks(banks.filter((_, j) => j !== i))} className="mt-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-600"><Trash2 size={11} /> Quitar</button>
                </div>
              ))}
            </div>
            {banks.length > 0 && (
              <button type="button" onClick={() => patchPortal({ registryBanks: banks }).then(() => toast('Cuentas guardadas.', 'success'))} className="mt-3 flex items-center gap-2 rounded-lg bg-[#4a5d23] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#3b4c1b]">
                <Check size={12} /> Guardar cuentas
              </button>
            )}
          </div>
        </>);

      case 'fotos':
        return card(<>
          {heading(`Fotos · ${portalLabel}`, 'Sube una imagen (se guarda en la base de datos) o pega una URL pública. Vacío = foto original. Cada portal tiene sus propias fotos.')}
          {IMAGE_SLOTS.map(({ slot, label, hint }) => {
            const a = assets[slot];
            const previewUrl = a ? `${API_CONFIG.backendUrl}/api/img/${slot}?portal=${editPortal}&t=${new Date(a.updatedAt).getTime()}` : '';
            return (
              <div key={slot} className="rounded-xl border border-stone-200 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100 text-stone-300">
                    {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-700">{label}</p>
                    <p className="text-[10px] text-stone-400">{hint}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="file" accept="image/*" ref={(el) => { fileRefs.current[slot] = el; }}
                        onChange={(e) => onPickFile(slot, e.target.files?.[0])} className="hidden" />
                      <button type="button" onClick={() => fileRefs.current[slot]?.click()} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">
                        <Upload size={11} /> Subir
                      </button>
                      {a && (
                        <button type="button" onClick={() => deleteAsset(slot)} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-50">
                          <Trash2 size={11} /> Quitar
                        </button>
                      )}
                      {a && <span className="text-[10px] text-stone-400">{a.kind === 'url' ? 'enlace' : 'archivo'}</span>}
                    </div>
                    <input key={`${slot}-${editPortal}`} type="url" placeholder="…o pega una URL pública y presiona Enter"
                      defaultValue={a?.kind === 'url' ? a.url || '' : ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = (e.target as HTMLInputElement).value.trim();
                          if (/^https?:\/\//.test(v)) saveAsset(slot, { url: v });
                          else toast('La URL debe empezar con http.', 'error');
                        }
                      }}
                      className="mt-2 w-full rounded-lg border border-stone-200 px-2 py-1 text-[11px]" />
                  </div>
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Galería — una URL por línea (vacío = fotos originales)</label>
            <textarea rows={4}
              value={(Array.isArray(pv('galleryUrls')) ? pv('galleryUrls') : []).join('\n')}
              onChange={(e) => pset({ galleryUrls: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })}
              onBlur={(e) => patchPortal({ galleryUrls: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })}
              className="mt-1 w-full resize-y rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-[11px]"
              placeholder="https://…/foto1.jpg&#10;https://…/foto2.jpg" />
          </div>
        </>);

      case 'bloqueo':
        return card(<>
          {heading('Bloqueo del sitio', 'Común a todos los portales.')}
          <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Quién puede entrar</label>
            <select value={s.lockMode || 'off'} onChange={(e) => patchSettings({ lockMode: e.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-2 text-xs">
              <option value="off">Abierto — entra cualquiera</option>
              <option value="link">Solo con enlace — hace falta un enlace ?invitado= (cualquiera)</option>
              <option value="list">Solo lista — el enlace debe ser de un invitado registrado</option>
              <option value="password">Con contraseña — o un enlace de un invitado registrado</option>
            </select>
          </div>
          {s.lockMode === 'password' && (
            <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Contraseña del sitio</label>
              <input type="text" value={s.sitePassword ?? ''} onChange={(e) => set({ sitePassword: e.target.value })}
                onBlur={(e) => patchSettings({ sitePassword: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs font-mono" placeholder="p. ej. amor2026" />
            </div>
          )}
        </>);

      case 'confirmaciones':
        return card(<>
          {heading('Confirmaciones', 'Común a todos los portales.')}
          {row('Aceptar nuevas confirmaciones', s.rsvpOpen, (v) => patchSettings({ rsvpOpen: v }), 'Al desactivar, el formulario RSVP queda cerrado.')}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-stone-700">Fecha límite (texto del formulario)</span>
            <input type="date" value={s.rsvpDeadline || ''} onChange={(e) => patchSettings({ rsvpDeadline: e.target.value })} className="rounded-lg border border-stone-200 px-2 py-1 text-xs" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-stone-700">Aforo total</span>
            <input type="number" min={0} value={s.aforo || 0} onChange={(e) => set({ aforo: parseInt(e.target.value, 10) || 0 })} onBlur={(e) => patchSettings({ aforo: parseInt(e.target.value, 10) || 0 })} className="w-20 rounded-lg border border-stone-200 px-2 py-1 text-center text-xs" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-stone-700">Personas por mesa (por defecto)</span>
            <input type="number" min={1} max={20} value={s.tableSizeDefault || 8} onChange={(e) => patchSettings({ tableSizeDefault: parseInt(e.target.value, 10) || 8 })} className="w-16 rounded-lg border border-stone-200 px-2 py-1 text-center text-xs" />
          </div>
        </>);

      case 'gracias':
        return card(<>
          {heading('Página de gracias', 'Común a todos los portales.')}
          {row('Mostrar /gracias automáticamente', s.graciasAuto, (v) => patchSettings({ graciasAuto: v }), 'El sitio muestra la pantalla de agradecimiento en vez de la invitación.')}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-stone-700">Desde el día</span>
            <input type="date" value={s.graciasFrom || ''} onChange={(e) => patchSettings({ graciasFrom: e.target.value })} className="rounded-lg border border-stone-200 px-2 py-1 text-xs" />
          </div>
        </>);

      case 'correo':
        return card(<>
          {heading('Notificaciones por correo', 'Común a todos los portales.')}
          {row('Avisarme al confirmar un invitado', s.emailNotify, (v) => patchSettings({ emailNotify: v }))}
          {row('Enviar correo de confirmación al invitado', s.emailGuest, (v) => patchSettings({ emailGuest: v }))}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select value={s.emailProvider} onChange={(e) => patchSettings({ emailProvider: e.target.value })} className="rounded-lg border border-stone-200 px-2 py-2">
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook / Hotmail</option>
            </select>
            <input type="email" placeholder="correo remitente" value={s.emailFrom || ''} onChange={(e) => set({ emailFrom: e.target.value })} onBlur={(e) => patchSettings({ emailFrom: e.target.value })} className="rounded-lg border border-stone-200 px-2 py-2" />
          </div>
          <input type="email" placeholder="correo de los novios (destino del aviso)" value={s.emailTo || ''} onChange={(e) => set({ emailTo: e.target.value })} onBlur={(e) => patchSettings({ emailTo: e.target.value })} className="w-full rounded-lg border border-stone-200 px-2 py-2 text-xs" />
          <p className="text-[10px] text-stone-400">
            {s.emailPassSet ? '✓ Contraseña configurada (EMAIL_PASS).' : '⚠ Falta la contraseña: añade la variable EMAIL_PASS en Vercel.'}
          </p>
          <button type="button"
            onClick={async () => {
              const r = await fetch(`${API_CONFIG.backendUrl}/api/admin/settings/test-email`, { method: 'POST', headers: { 'x-api-key': apiKey } });
              const d = await r.json().catch(() => ({}));
              toast(r.ok ? 'Correo de prueba enviado.' : (d.error || 'No se pudo enviar.'), r.ok ? 'success' : 'error');
            }}
            className="rounded-full border border-stone-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">
            Enviar correo de prueba
          </button>
        </>);

      case 'whatsapp':
        return card(<>
          {heading('Plantilla de WhatsApp', 'Común a todos los portales. Etiquetas: {SALUDO} {NOMBRE} {TELEFONO} {PIN} {PASES} {ENLACE} {ACCESO} {NOTA_ACCESO}')}
          <div className="flex flex-wrap gap-1.5">
            {['{SALUDO}', '{NOMBRE}', '{TELEFONO}', '{PIN}', '{PASES}', '{ENLACE}', '{ACCESO}', '{NOTA_ACCESO}'].map((t) => (
              <button key={t} type="button" onClick={() => setWa((p) => `${p} ${t} `)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[10px] font-bold text-emerald-800 hover:bg-emerald-100">+ {t}</button>
            ))}
          </div>
          <textarea rows={12} value={wa} onChange={(e) => setWa(e.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 font-mono text-xs leading-relaxed focus:border-[#4a5d23] focus:outline-none" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => patchSettings({ waTemplate: wa }).then(() => toast('Plantilla guardada.', 'success'))} className="flex items-center gap-2 rounded-xl bg-[#4a5d23] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3b4c1b]">
              <Check size={14} /> Guardar plantilla
            </button>
            <button type="button" onClick={() => { setWa(DEFAULT_WA_TEMPLATE); patchSettings({ waTemplate: '' }); toast('Plantilla restablecida.', 'success'); }} className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50">
              <RefreshCw size={13} /> Restablecer
            </button>
          </div>
        </>);
    }
  };

  const navBtn = (item: { id: string; label: string; scope: string }, mobile = false) => (
    <button
      key={item.id}
      onClick={() => setNav(item.id)}
      className={`whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-bold transition-colors ${
        nav === item.id
          ? 'bg-[#f1f4ea] text-[#4a5d23] md:border-l-2 md:border-[#4a5d23] md:rounded-l-none'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
      } ${mobile ? '' : 'w-full'}`}
    >
      {item.label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 pb-14">
      <div className="sticky top-0 z-20 -mx-4 mb-5 flex items-center justify-between border-b border-stone-200/80 bg-[#fdfaf6]/90 px-4 py-3.5 backdrop-blur">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800">
          <ArrowLeft size={14} /> Volver al panel
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] font-bold uppercase tracking-wider text-stone-400 sm:inline">Editando</span>
          <span className="rounded-md bg-[#f1f4ea] px-2 py-0.5 text-[11px] font-bold text-[#4a5d23]">{portalLabel}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="admin-eyebrow">Configuración</p>
        <h1 className="admin-title mt-0.5 text-2xl text-stone-800">Ajustes del sitio</h1>
      </div>

      {/* nav horizontal (móvil) */}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1 md:hidden">
        {NAV.map((i) => navBtn(i, true))}
      </div>

      <div className="flex gap-7">
        {/* sidebar (escritorio) */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20 space-y-5">
            <div className="space-y-1">
              <p className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">Portal · {portalLabel}</p>
              {NAV.filter((i) => i.scope === 'x' || i.scope === 'p').map((i) => navBtn(i))}
            </div>
            <div className="space-y-1">
              <p className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">General</p>
              {NAV.filter((i) => i.scope === 'g').map((i) => navBtn(i))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{content()}</div>
      </div>
    </div>
  );
};
