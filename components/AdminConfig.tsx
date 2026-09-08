import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, Trash2, Upload, Plus, Image as ImageIcon, Eye, Star } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { DEFAULT_WA_TEMPLATE } from './waTemplate';

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

// Valores por defecto de la "presentación" de un portal (deben coincidir con el backend).
const PRES_DEFAULTS: Record<string, any> = {
  announceShow: false,
  announceText: '',
  showStory: true,
  showParents: true,
  showGallery: true,
  showDressCode: true,
  showGifts: true,
  showCounter: true,
  showGuestbook: true,
  eventDateTime: '',
  dressFormalTitle: 'Formal / Elegante',
  dressFormalText: 'Te esperamos elegante para la ocasión.',
  dressColorsTitle: 'Colores',
  dressColorsText: 'Inspírate en la paleta de otoño. Reservado el blanco y el beige para la novia.',
  registryIntro: '"Su presencia es nuestro mayor regalo. Si además desean tener un detalle con nosotros, aquí están nuestras opciones."',
  registryCasaNote: 'Disponible de forma digital y física',
  registryCasaListNumber: '194090',
  registryCasaUrl: 'https://listaderegalos.casacuesta.com/Event/Stephanie-DalvinDaniel?utm_source=share',
  registryBanks: [],
  galleryUrls: [],
};

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

export const AdminConfig: React.FC<Props> = ({ apiKey, settings, setSettings, patchSettings, loadSettings, onBack, toast }) => {
  const s = settings;
  const set = (obj: Record<string, any>) => setSettings((p: any) => ({ ...p, ...obj }));

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

  // --- Cuentas de banco (por portal) ---
  const banks: any[] = Array.isArray(pv('registryBanks')) ? pv('registryBanks') : [];
  const setBanks = (b: any[]) => pset({ registryBanks: b });

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

  const section = (title: string, children: React.ReactNode, desc?: string) => (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[#4a5d23]">{title}</h2>
      {desc && <p className="mt-1 text-xs text-stone-400">{desc}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
  const row = (label: string, val: boolean, on: (v: boolean) => void, hint?: string) => (
    <label className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 px-3.5 py-3 cursor-pointer">
      <span className="text-xs">
        <span className="font-bold text-stone-700">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] font-normal text-stone-400">{hint}</span>}
      </span>
      <input type="checkbox" checked={!!val} onChange={(e) => on(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a5d23]" />
    </label>
  );
  // Campo de texto global (settings.*)
  const gText = (label: string, key: string, opts: { area?: boolean; placeholder?: string } = {}) =>
    textField(label, s[key] ?? '', (v) => set({ [key]: v }), (v) => patchSettings({ [key]: v }), opts);
  // Campo de texto del portal en edición
  const pText = (label: string, key: string, opts: { area?: boolean; placeholder?: string } = {}) =>
    textField(label, pv(key) ?? '', (v) => pset({ [key]: v }), (v) => patchPortal({ [key]: v }), opts);
  const textField = (
    label: string,
    value: string,
    onLocal: (v: string) => void,
    onCommit: (v: string) => void,
    opts: { area?: boolean; placeholder?: string },
  ) => (
    <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</label>
      {opts.area ? (
        <textarea rows={2} value={value} placeholder={opts.placeholder}
          onChange={(e) => onLocal(e.target.value)} onBlur={(e) => onCommit(e.target.value)}
          className="mt-1 w-full resize-y rounded-lg border border-stone-200 px-2 py-1.5 text-xs" />
      ) : (
        <input type="text" value={value} placeholder={opts.placeholder}
          onChange={(e) => onLocal(e.target.value)} onBlur={(e) => onCommit(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs" />
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800">
          <ArrowLeft size={14} /> Volver al panel
        </button>
        <h1 className="text-lg font-bold text-stone-800">Configuración</h1>
      </div>

      <div className="space-y-5">
        {/* --- Portales --- */}
        <section className="rounded-3xl border-2 border-[#4a5d23]/20 bg-[#f1f4ea]/50 p-5 shadow-sm md:p-7">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#4a5d23]">Portales de invitados</h2>
          <p className="mt-1 text-xs text-stone-500">
            Hasta 5 versiones de la invitación. Editas una y los invitados siguen viendo la que está <b>activa</b>.
            Solo la presentación (textos, fotos, secciones, anuncio, fecha, galería) cambia entre portales; el resto es común.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setEditPortal(n)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  editPortal === n ? 'bg-[#4a5d23] text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {activePortal === n && <Star size={12} className={editPortal === n ? 'text-amber-300' : 'text-amber-500'} fill="currentColor" />}
                {portalNames[n] ? portalNames[n] : `Portal ${n}`}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={portalNames[editPortal] ?? ''}
              placeholder={`Nombre del portal ${editPortal}`}
              onChange={(e) => setSettings((p: any) => ({ ...p, portalNames: { ...(p.portalNames || {}), [editPortal]: e.target.value } }))}
              onBlur={(e) => patchPortal({ name: e.target.value })}
              className="min-w-[10rem] flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
            />
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
        </section>

        <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
          Presentación · {portalNames[editPortal] || `Portal ${editPortal}`}
        </p>

        {section('Anuncio (barra superior del sitio)', <>
          {row('Mostrar el anuncio', pv('announceShow'), (v) => patchPortal({ announceShow: v }))}
          {pText('Texto del anuncio', 'announceText', { placeholder: 'Ej: La ceremonia inicia a las 5:00 PM' })}
        </>)}

        {section('Secciones y contenido del sitio', <>
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
        </>)}

        {section('Textos · Código de vestimenta', <>
          {pText('Título 1', 'dressFormalTitle')}
          {pText('Texto 1', 'dressFormalText', { area: true })}
          {pText('Título 2', 'dressColorsTitle')}
          {pText('Texto 2', 'dressColorsText', { area: true })}
        </>)}

        {section('Textos · Mesa de regalos', <>
          {pText('Introducción', 'registryIntro', { area: true })}
          {pText('Casa Cuesta · nota', 'registryCasaNote')}
          {pText('Casa Cuesta · número de lista', 'registryCasaListNumber')}
          {pText('Casa Cuesta · enlace', 'registryCasaUrl')}
          <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Cuentas de banco</span>
              <button type="button" onClick={() => setBanks([...banks, { bank: '', type: '', number: '', holder: '', cedula: '' }])} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#4a5d23]"><Plus size={12} /> Agregar</button>
            </div>
            {banks.length === 0 && <p className="mt-2 text-[10px] italic text-stone-400">Sin cuentas configuradas — el sitio usa las de por defecto.</p>}
            <div className="mt-2 space-y-3">
              {banks.map((b, i) => (
                <div key={i} className="rounded-lg bg-stone-50 p-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['bank', 'type', 'number', 'holder', 'cedula'] as const).map((f) => (
                      <input
                        key={f}
                        placeholder={{ bank: 'Banco', type: 'Tipo de cuenta', number: 'No. de cuenta', holder: 'A nombre de', cedula: 'Cédula' }[f]}
                        value={b[f] || ''}
                        onChange={(e) => setBanks(banks.map((x, j) => (j === i ? { ...x, [f]: e.target.value } : x)))}
                        className="rounded border border-stone-200 px-2 py-1 text-xs"
                      />
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
        </>)}

        {section('Fotos del sitio', <>
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
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => { fileRefs.current[slot] = el; }}
                        onChange={(e) => onPickFile(slot, e.target.files?.[0])}
                        className="hidden"
                      />
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
                    <input
                      key={`${slot}-${editPortal}`}
                      type="url"
                      placeholder="…o pega una URL pública y presiona Enter"
                      defaultValue={a?.kind === 'url' ? a.url || '' : ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = (e.target as HTMLInputElement).value.trim();
                          if (/^https?:\/\//.test(v)) saveAsset(slot, { url: v });
                          else toast('La URL debe empezar con http.', 'error');
                        }
                      }}
                      className="mt-2 w-full rounded-lg border border-stone-200 px-2 py-1 text-[11px]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Galería — una URL por línea (vacío = fotos originales)</label>
            <textarea
              rows={4}
              value={(Array.isArray(pv('galleryUrls')) ? pv('galleryUrls') : []).join('\n')}
              onChange={(e) => pset({ galleryUrls: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })}
              onBlur={(e) => patchPortal({ galleryUrls: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })}
              className="mt-1 w-full resize-y rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-[11px]"
              placeholder="https://…/foto1.jpg&#10;https://…/foto2.jpg"
            />
          </div>
        </>, 'Sube una imagen (se guarda en la base de datos) o pega la URL de una imagen pública. Vacío = foto original. Cada portal tiene sus propias fotos.')}

        <p className="px-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">Ajustes generales · todos los portales</p>

        {section('Bloqueo del sitio', <>
          <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Quién puede entrar</label>
            <select
              value={s.lockMode || 'off'}
              onChange={(e) => patchSettings({ lockMode: e.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-2 text-xs"
            >
              <option value="off">Abierto — entra cualquiera</option>
              <option value="link">Solo con enlace — hace falta un enlace ?invitado= (cualquiera)</option>
              <option value="list">Solo lista — el enlace debe ser de un invitado registrado</option>
              <option value="password">Con contraseña — o un enlace de un invitado registrado</option>
            </select>
          </div>
          {s.lockMode === 'password' && (
            <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Contraseña del sitio</label>
              <input
                type="text"
                value={s.sitePassword ?? ''}
                onChange={(e) => set({ sitePassword: e.target.value })}
                onBlur={(e) => patchSettings({ sitePassword: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs font-mono"
                placeholder="p. ej. amor2026"
              />
            </div>
          )}
        </>)}

        {section('Confirmaciones', <>
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
        </>)}

        {section('Página de gracias', <>
          {row('Mostrar /gracias automáticamente', s.graciasAuto, (v) => patchSettings({ graciasAuto: v }), 'El sitio muestra la pantalla de agradecimiento en vez de la invitación.')}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-stone-700">Desde el día</span>
            <input type="date" value={s.graciasFrom || ''} onChange={(e) => patchSettings({ graciasFrom: e.target.value })} className="rounded-lg border border-stone-200 px-2 py-1 text-xs" />
          </div>
        </>)}

        {section('Notificaciones por correo', <>
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
          <button
            type="button"
            onClick={async () => {
              const r = await fetch(`${API_CONFIG.backendUrl}/api/admin/settings/test-email`, { method: 'POST', headers: { 'x-api-key': apiKey } });
              const d = await r.json().catch(() => ({}));
              toast(r.ok ? 'Correo de prueba enviado.' : (d.error || 'No se pudo enviar.'), r.ok ? 'success' : 'error');
            }}
            className="rounded-full border border-stone-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
          >
            Enviar correo de prueba
          </button>
        </>)}

        {section('Plantilla de WhatsApp', <>
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
        </>, 'Mensaje de invitación con PIN y enlace. Etiquetas: {SALUDO} {NOMBRE} {TELEFONO} {PIN} {PASES} {ENLACE} {ACCESO} {NOTA_ACCESO}')}
      </div>
    </div>
  );
};
