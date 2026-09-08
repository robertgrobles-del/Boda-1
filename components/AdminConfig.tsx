import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, Trash2, Upload, Plus, Image as ImageIcon } from 'lucide-react';
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

// Comprime una imagen a JPEG <= ~1.6 MB para guardarla en la base de datos.
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

  // --- Plantilla de WhatsApp ---
  const [wa, setWa] = useState('');
  useEffect(() => { setWa((settings?.waTemplate && String(settings.waTemplate)) || DEFAULT_WA_TEMPLATE); }, [settings?.waTemplate]);

  // --- Cuentas de banco ---
  const banks: any[] = Array.isArray(s?.registryBanks) ? s.registryBanks : [];
  const setBanks = (b: any[]) => set({ registryBanks: b });

  // --- Imágenes ---
  const [assets, setAssets] = useState<Record<string, any>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const loadAssets = async () => {
    try {
      const r = await fetch(`${API_CONFIG.backendUrl}/api/admin/assets`, { headers: { 'x-api-key': apiKey } });
      if (r.ok) {
        const list = await r.json();
        setAssets(Object.fromEntries(list.map((a: any) => [a.slot, a])));
      }
    } catch { /* noop */ }
  };
  useEffect(() => { loadAssets(); }, []); // eslint-disable-line

  const saveAsset = async (slot: string, body: any) => {
    try {
      const r = await fetch(`${API_CONFIG.backendUrl}/api/admin/assets/${slot}`, {
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
      await fetch(`${API_CONFIG.backendUrl}/api/admin/assets/${slot}`, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
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
  const Toggle = (label: string, val: boolean, on: (v: boolean) => void, hint?: string) => (
    <label className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 px-3.5 py-3 cursor-pointer">
      <span className="text-xs">
        <span className="font-bold text-stone-700">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] font-normal text-stone-400">{hint}</span>}
      </span>
      <input type="checkbox" checked={!!val} onChange={(e) => on(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a5d23]" />
    </label>
  );
  const Text = (label: string, key: string, opts: { area?: boolean; placeholder?: string } = {}) => (
    <div className="rounded-xl border border-stone-200 px-3.5 py-2.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</label>
      {opts.area ? (
        <textarea
          rows={2}
          value={s[key] ?? ''}
          placeholder={opts.placeholder}
          onChange={(e) => set({ [key]: e.target.value })}
          onBlur={(e) => patchSettings({ [key]: e.target.value })}
          className="mt-1 w-full resize-y rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
        />
      ) : (
        <input
          type="text"
          value={s[key] ?? ''}
          placeholder={opts.placeholder}
          onChange={(e) => set({ [key]: e.target.value })}
          onBlur={(e) => patchSettings({ [key]: e.target.value })}
          className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
        />
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
        {section('Anuncio (barra superior del sitio)', <>
          {Toggle('Mostrar el anuncio', s.announceShow, (v) => patchSettings({ announceShow: v }))}
          {Text('Texto del anuncio', 'announceText', { placeholder: 'Ej: La ceremonia inicia a las 5:00 PM' })}
        </>)}

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
          {Toggle('Aceptar nuevas confirmaciones', s.rsvpOpen, (v) => patchSettings({ rsvpOpen: v }), 'Al desactivar, el formulario RSVP queda cerrado.')}
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

        {section('Sitio de invitados', <>
          {Toggle('Mostrar contador "X confirmaron"', s.showCounter, (v) => patchSettings({ showCounter: v }))}
          {Toggle('Mostrar el libro de mensajes', s.showGuestbook, (v) => patchSettings({ showGuestbook: v }))}
          {Toggle('Sección "Nuestra historia"', s.showStory, (v) => patchSettings({ showStory: v }))}
          {Toggle('Sección "Padres / padrinos"', s.showParents, (v) => patchSettings({ showParents: v }))}
          {Toggle('Sección "Galería"', s.showGallery, (v) => patchSettings({ showGallery: v }))}
          {Toggle('Sección "Código de vestimenta"', s.showDressCode, (v) => patchSettings({ showDressCode: v }))}
          {Toggle('Sección "Mesa de regalos"', s.showGifts, (v) => patchSettings({ showGifts: v }))}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-stone-700">Fecha y hora del evento<span className="mt-0.5 block text-[10px] font-normal text-stone-400">Para la cuenta regresiva. Vacío = predeterminada.</span></span>
            <input type="datetime-local" value={s.eventDateTime || ''} onChange={(e) => patchSettings({ eventDateTime: e.target.value })} className="rounded-lg border border-stone-200 px-2 py-1 text-xs" />
          </div>
        </>)}

        {section('Página de gracias', <>
          {Toggle('Mostrar /gracias automáticamente', s.graciasAuto, (v) => patchSettings({ graciasAuto: v }), 'El sitio muestra la pantalla de agradecimiento en vez de la invitación.')}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs">
            <span className="font-bold text-stone-700">Desde el día</span>
            <input type="date" value={s.graciasFrom || ''} onChange={(e) => patchSettings({ graciasFrom: e.target.value })} className="rounded-lg border border-stone-200 px-2 py-1 text-xs" />
          </div>
        </>)}

        {section('Notificaciones por correo', <>
          {Toggle('Avisarme al confirmar un invitado', s.emailNotify, (v) => patchSettings({ emailNotify: v }))}
          {Toggle('Enviar correo de confirmación al invitado', s.emailGuest, (v) => patchSettings({ emailGuest: v }))}
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

        {section('Textos · Código de vestimenta', <>
          {Text('Título 1', 'dressFormalTitle')}
          {Text('Texto 1', 'dressFormalText', { area: true })}
          {Text('Título 2', 'dressColorsTitle')}
          {Text('Texto 2', 'dressColorsText', { area: true })}
        </>)}

        {section('Textos · Mesa de regalos', <>
          {Text('Introducción', 'registryIntro', { area: true })}
          {Text('Casa Cuesta · nota', 'registryCasaNote')}
          {Text('Casa Cuesta · número de lista', 'registryCasaListNumber')}
          {Text('Casa Cuesta · enlace', 'registryCasaUrl')}
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
              <button type="button" onClick={() => patchSettings({ registryBanks: banks }).then(() => toast('Cuentas guardadas.', 'success'))} className="mt-3 flex items-center gap-2 rounded-lg bg-[#4a5d23] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#3b4c1b]">
                <Check size={12} /> Guardar cuentas
              </button>
            )}
          </div>
        </>)}

        {section('Fotos del sitio', <>
          {IMAGE_SLOTS.map(({ slot, label, hint }) => {
            const a = assets[slot];
            const previewUrl = a ? `${API_CONFIG.backendUrl}/api/img/${slot}?t=${new Date(a.updatedAt).getTime()}` : '';
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
              value={(Array.isArray(s.galleryUrls) ? s.galleryUrls : []).join('\n')}
              onChange={(e) => set({ galleryUrls: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })}
              onBlur={(e) => patchSettings({ galleryUrls: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })}
              className="mt-1 w-full resize-y rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-[11px]"
              placeholder="https://…/foto1.jpg&#10;https://…/foto2.jpg"
            />
          </div>
        </>, 'Sube una imagen (se guarda en la base de datos) o pega la URL de una imagen pública. Vacío = foto original.')}
      </div>
    </div>
  );
};
