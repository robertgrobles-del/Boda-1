import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Cargar variables de entorno (.env es lo que también lee Prisma; .env.backend por compatibilidad)
dotenv.config();
dotenv.config({ path: './.env.backend' });

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Sesión de admin (token firmado, expira; la clave real no se guarda en el cliente) ---
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const signSession = (exp: number) =>
    crypto.createHmac('sha256', process.env.ADMIN_API_KEY || 'x').update(String(exp)).digest('hex');
const makeSession = () => {
    const exp = Date.now() + SESSION_TTL_MS;
    return { token: `s.${exp}.${signSession(exp)}`, exp };
};
const validSession = (t: any): boolean => {
    const m = /^s\.(\d+)\.([0-9a-f]{64})$/.exec(String(t || ''));
    if (!m) return false;
    if (Number(m[1]) < Date.now()) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(m[2], 'hex'), Buffer.from(signSession(Number(m[1])), 'hex'));
    } catch {
        return false;
    }
};
const adminOk = (req: any): boolean => {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey) return false;
    const k = req.headers['x-api-key'];
    return k === adminKey || validSession(k);
};

app.post('/api/admin/login', (req, res) => {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || req.body?.key !== adminKey) {
        return res.status(401).json({ success: false, error: 'Clave incorrecta.' });
    }
    const { token, exp } = makeSession();
    res.json({ success: true, token, exp });
});

// --- Ajustes del sitio (guardados en la BD) ------------------------------------
const DEFAULT_SETTINGS = {
    emailNotify: false,          // avisar a los novios por correo al confirmar
    emailProvider: 'gmail' as 'gmail' | 'outlook',
    emailFrom: '',               // correo remitente (usuario SMTP)
    emailTo: '',                 // correo de los novios (destino del aviso)
    emailGuest: false,           // enviar correo de confirmación al invitado
    autoSendWa: true,            // abrir WhatsApp al registrar teléfono
    aforo: 0,                    // aforo total del evento
    showCounter: true,           // mostrar "X invitados confirmaron" en el sitio
    showGuestbook: true,         // mostrar el libro de mensajes en el sitio
    rsvpOpen: true,              // permitir nuevas confirmaciones
    rsvpDeadline: '2026-10-07',  // fecha límite (texto en el formulario)
    graciasAuto: false,          // redirigir el sitio a /gracias automáticamente
    graciasFrom: '2026-11-08',   // desde esta fecha
    tableSizeDefault: 8,
    // Anuncio / banner en la parte superior del sitio
    announceShow: false,
    announceText: '',
    // Secciones visibles del sitio de invitados
    showStory: true,
    showParents: true,
    showGallery: true,
    showDressCode: true,
    showGifts: true,
    // Fecha y hora del evento (ISO, p.ej. "2026-11-07T16:00"). Vacío = usar la de constants.
    eventDateTime: '',
    // Bloqueo del sitio: 'off' | 'link' (cualquier ?invitado=) | 'list' (solo nombres en la lista) | 'password'
    lockMode: 'off' as 'off' | 'link' | 'list' | 'password',
    sitePassword: '',            // contraseña única (solo cuando lockMode === 'password'); NUNCA se expone en /api/settings
    // Plantilla del mensaje de WhatsApp (vacío = usar la de por defecto del panel)
    waTemplate: '',
    // Textos editables — Código de vestimenta
    dressFormalTitle: 'Formal / Elegante',
    dressFormalText: 'Te esperamos elegante para la ocasión.',
    dressColorsTitle: 'Colores',
    dressColorsText: 'Inspírate en la paleta de otoño. Reservado el blanco y el beige para la novia.',
    // Mesa de regalos — cada bloque se activa por separado
    registryIntro: '"Su presencia es nuestro mayor regalo. Si además desean tener un detalle con nosotros, aquí están nuestras opciones."',
    registryCuestaOn: true,
    registryCasaNote: 'Disponible de forma digital y física',
    registryCasaListNumber: '194090',
    registryCasaUrl: 'https://listaderegalos.casacuesta.com/Event/Stephanie-DalvinDaniel?utm_source=share',
    registryAmazonOn: false,
    registryAmazonNote: 'Lista de bodas de Amazon',
    registryAmazonUrl: '',
    // Otras tiendas (Alis, Ikea, etc.)
    registryStores: [] as Array<{ name: string; note: string; url: string }>,
    registryBanksOn: true,
    registryBanks: [] as Array<{ bank: string; type: string; number: string; holder: string; cedula: string }>,
    // Galería: si tiene URLs, reemplazan a las fotos por defecto de la galería del sitio
    galleryUrls: [] as string[],
    // Tema visual del portal: paleta de color + tipografías (mismo layout)
    theme: 'clasico' as 'clasico' | 'rosa' | 'jardin' | 'arena' | 'custom',
    // Tema personalizado: colores base elegidos y la paleta resultante
    paletteSeeds: [] as string[],
    palette: null as null | { primary: string; accent: string; bg: string; ink: string },
};
type Settings = typeof DEFAULT_SETTINGS;

let settingsCache: { at: number; value: Settings } = { at: 0, value: { ...DEFAULT_SETTINGS } };
const getSettings = async (): Promise<Settings> => {
    if (Date.now() - settingsCache.at < 15000) return settingsCache.value;
    try {
        const row = await prisma.setting.findUnique({ where: { id: 1 } });
        const value = { ...DEFAULT_SETTINGS, ...((row?.data as any) || {}) };
        settingsCache = { at: Date.now(), value };
        return value;
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
};

// --- Portales de invitados (hasta 5) ---------------------------------------
// Cada portal tiene su propia "presentación" (textos, fotos, secciones, anuncio,
// fecha del evento, galería). El resto de ajustes son globales para todos.
const PRESENTATION_KEYS = [
    'announceShow', 'announceText',
    'showStory', 'showParents', 'showGallery', 'showDressCode', 'showGifts',
    'showCounter', 'showGuestbook',
    'eventDateTime',
    'dressFormalTitle', 'dressFormalText', 'dressColorsTitle', 'dressColorsText',
    'registryIntro',
    'registryCuestaOn', 'registryCasaNote', 'registryCasaListNumber', 'registryCasaUrl',
    'registryAmazonOn', 'registryAmazonNote', 'registryAmazonUrl',
    'registryStores', 'registryBanksOn', 'registryBanks',
    'galleryUrls', 'theme', 'paletteSeeds', 'palette',
] as const;
type PresentationKey = typeof PRESENTATION_KEYS[number];
const PRESENTATION_SET = new Set<string>(PRESENTATION_KEYS as readonly string[]);
const DEFAULT_PRESENTATION = Object.fromEntries(
    PRESENTATION_KEYS.map((k) => [k, (DEFAULT_SETTINGS as any)[k]]),
) as Pick<Settings, PresentationKey>;

const clampPortal = (v: any): number => {
    const n = parseInt(String(v ?? ''), 10);
    return n >= 1 && n <= 5 ? n : 0;
};

let rawDataCache: { at: number; value: any } = { at: 0, value: null };
const getRawData = async (): Promise<any> => {
    if (rawDataCache.value && Date.now() - rawDataCache.at < 15000) return rawDataCache.value;
    try {
        const row = await prisma.setting.findUnique({ where: { id: 1 } });
        rawDataCache = { at: Date.now(), value: (row?.data as any) || {} };
    } catch { /* mantener el último valor */ }
    return rawDataCache.value || {};
};
const invalidateSettingsCache = () => { settingsCache = { at: 0, value: { ...DEFAULT_SETTINGS } }; rawDataCache = { at: 0, value: null }; };

// Lee (y migra si hace falta) la estructura de portales de Setting.data.
const readPortals = (data: any): { activePortal: number; portalNames: Record<string, string>; portals: Record<string, any> } => {
    const d = data || {};
    if (d.portals && typeof d.portals === 'object') {
        return {
            activePortal: clampPortal(d.activePortal) || 1,
            portalNames: d.portalNames || {},
            portals: d.portals,
        };
    }
    // Migración: los valores de presentación "planos" antiguos pasan a ser el portal 1.
    const legacy: any = {};
    for (const k of PRESENTATION_KEYS) if (k in d) legacy[k] = d[k];
    return { activePortal: 1, portalNames: { 1: 'Principal' }, portals: { 1: legacy } };
};

const presentationOf = (data: any, portal: number): Pick<Settings, PresentationKey> => {
    const { portals } = readPortals(data);
    return { ...DEFAULT_PRESENTATION, ...(portals[String(portal)] || {}) };
};

// Nodemailer dinámico (según los ajustes; la contraseña siempre es env EMAIL_PASS)
const makeMailer = (s: Settings) => {
    const pass = process.env.EMAIL_PASS;
    const user = s.emailFrom || process.env.EMAIL_USER;
    if (!pass || !user) return null;
    return nodemailer.createTransport({
        service: s.emailProvider === 'outlook' ? 'hotmail' : 'gmail',
        auth: { user, pass },
    });
};

// --- Helpers · Cédula ------------------------------------------------------

const JCE_API = process.env.JCE_CEDULA_API || 'http://190.122.98.11:11080/jce/api/citizen/';
const DGII_API = 'https://api.digital.gob.do/v3/cedulas/';

const timeout = (ms: number) => {
    try { return AbortSignal.timeout(ms); } catch { return undefined; }
};

/** Consulta una cédula: JCE (con nombre) → DGII → validate. */
const lookupCedula = async (cedula: string): Promise<{ valid: boolean; name: string | null }> => {
    const clean = String(cedula || '').replace(/\D/g, '');
    if (clean.length !== 11) return { valid: false, name: null };

    // 1. JCE — trae el nombre oficial
    try {
        const r = await fetch(`${JCE_API}${clean}`, { signal: timeout(9000) });
        if (r.ok) {
            const d: any = await r.json();
            const ci = d?.citizenInfo;
            if (d?.success && ci) {
                const name = [ci.nombres, ci.apellido1, ci.apellido2].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
                return { valid: true, name: name || null };
            }
        }
    } catch { /* pasa al fallback */ }

    // 2. DGII (por si el JCE no responde)
    try {
        const r = await fetch(`${DGII_API}${clean}`, { signal: timeout(9000) });
        if (r.ok) {
            const d: any = await r.json();
            if (d && d.valid !== false) {
                const name =
                    [d.names, d.firstSurname, d.secondSurname].filter(Boolean).join(' ') ||
                    [d.nombres, d.apellido1, d.apellido2].filter(Boolean).join(' ') || null;
                return { valid: true, name: name ? name.replace(/\s+/g, ' ').trim() : null };
            }
        }
    } catch { /* sigue */ }

    // 3. Solo validez
    try {
        const r = await fetch(`${DGII_API}${clean}/validate`, { signal: timeout(6000) });
        const d: any = await r.json();
        return { valid: !!d?.valid, name: null };
    } catch {
        return { valid: false, name: null };
    }
};

const fetchCedulaName = async (cedula: string): Promise<string | null> => (await lookupCedula(cedula)).name;

// --- ROUTES ---

// Validación de cédula (proxy — el front no puede llamar al JCE por HTTP directo)
app.get('/api/cedula/:cedula', async (req, res) => {
    try {
        const result = await lookupCedula(req.params.cedula);
        res.json(result);
    } catch (error) {
        console.error('Cédula lookup error:', error);
        res.status(500).json({ valid: false, name: null });
    }
});

// Estadísticas públicas — contador "X invitados ya confirmaron" en el sitio
app.get('/api/stats', async (_req, res) => {
    try {
        const rows = await prisma.rSVP.findMany({
            where: { attending: true },
            select: { guestsCount: true },
        });
        const confirmedGuests = rows.reduce((acc, r) => acc + (r.guestsCount || 0), 0);
        res.set('Cache-Control', 'public, max-age=60');
        res.json({ confirmedGuests, confirmedParties: rows.length });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ confirmedGuests: 0, confirmedParties: 0 });
    }
});

// Enlace ?invitado= : indica si ese invitado es "solo ceremonia" o "ceremonia y recepción"
app.get('/api/invitee/:slug', async (req, res) => {
    try {
        const norm = (s: any) =>
            String(s || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

        const target = norm(req.params.slug);
        if (!target) return res.json({ found: false, ceremonyOnly: false, name: null });

        const all = await prisma.allowedGuest.findMany();
        const match = all.find((a: any) => a.name && norm(a.name) === target);

        if (!match) return res.json({ found: false, ceremonyOnly: false, name: null });

        res.set('Cache-Control', 'public, max-age=30');
        res.json({ found: true, ceremonyOnly: !!(match as any).ceremonyOnly, receptionOnly: !!(match as any).receptionOnly, name: (match as any).name });
    } catch (error) {
        console.error('Invitee lookup error:', error);
        res.status(500).json({ found: false, ceremonyOnly: false, name: null });
    }
});

// 0. POST RSVP — consultar cupos disponibles para un teléfono + PIN
app.post('/api/rsvp/check', async (req, res) => {
    try {
        const { phone, pin } = req.body;
        if (!phone || !pin) return res.status(400).json({ success: false, error: 'Teléfono y PIN requeridos.' });

        const allowed = await prisma.allowedGuest.findUnique({ where: { phone } });
        if (!allowed) return res.status(403).json({ success: false, error: 'Este número no está en la lista de invitados.' });
        if (allowed.pin !== pin) return res.status(403).json({ success: false, error: 'El PIN ingresado es incorrecto.' });

        const maxGuests = (allowed as any).maxGuests ?? 2;
        const usedCount = (allowed as any).usedCount ?? 0;

        // ¿Ya confirmó con este número? (para poder editar la respuesta)
        const prev = await prisma.rSVP.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });
        const existing = prev
            ? {
                  id: prev.id,
                  name: prev.name,
                  attending: prev.attending,
                  guestsCount: prev.guestsCount,
                  dietary: prev.dietary || '',
                  message: prev.message || '',
                  createdAt: prev.createdAt,
              }
            : null;

        res.json({ success: true, maxGuests, usedCount, remaining: Math.max(0, maxGuests - usedCount), existing });
    } catch (error) {
        console.error('RSVP check error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// PUT: el invitado edita su propia confirmación (con teléfono + PIN)
app.put('/api/rsvp/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { phone, pin, attending, dietary, message } = req.body || {};
        if (Number.isNaN(id) || !phone || !pin) return res.status(400).json({ success: false, error: 'Datos incompletos.' });

        const allowed = await prisma.allowedGuest.findUnique({ where: { phone } });
        if (!allowed || allowed.pin !== pin) return res.status(403).json({ success: false, error: 'Teléfono o PIN incorrecto.' });

        const rsvp = await prisma.rSVP.findUnique({ where: { id } });
        if (!rsvp || rsvp.phone !== phone) return res.status(404).json({ success: false, error: 'No encontramos tu confirmación.' });

        const willAttend = attending === undefined ? rsvp.attending : (attending === true || attending === 'yes' || attending === 'true');
        const newCount = willAttend ? rsvp.guestsCount || 1 : 0;

        // Ajustar cupos del teléfono si cambia el estado de asistencia
        if (rsvp.attending !== willAttend) {
            const before = rsvp.attending ? rsvp.guestsCount : 0;
            const after = willAttend ? newCount : 0;
            const used = Math.max(0, ((allowed as any).usedCount ?? 0) + (after - before));
            await prisma.allowedGuest.update({
                where: { phone },
                data: { usedCount: used, used: used >= ((allowed as any).maxGuests ?? 2) } as any,
            });
        }

        const updated = await prisma.rSVP.update({
            where: { id },
            data: {
                attending: willAttend,
                guestsCount: newCount,
                dietary: (dietary && String(dietary).trim()) || null,
                message: (message && String(message).trim()) || null,
            },
        });
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('RSVP edit error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// 1. POST RSVP
app.post('/api/rsvp', async (req, res) => {
    try {
        const { name, email, phone, pin, attending, guests, dietary, message, cedulas } = req.body;

        if (!(await getSettings()).rsvpOpen) {
            return res.status(403).json({ success: false, error: 'Las confirmaciones están cerradas por el momento.' });
        }

        if (!phone || !pin) {
            return res.status(400).json({ success: false, error: 'Se requiere teléfono y PIN para confirmar.' });
        }

        const allowed = await prisma.allowedGuest.findUnique({ where: { phone } });

        if (!allowed) {
            return res.status(403).json({ success: false, error: 'Este número de teléfono no está en la lista de invitados.' });
        }
        if (allowed.pin !== pin) {
            return res.status(403).json({ success: false, error: 'El PIN ingresado es incorrecto.' });
        }

        const guestCount = parseInt(String(guests).split(' ')[0]) || 1;
        const isAttending = attending === 'yes';

        const maxAllowed = (allowed as any).maxGuests ?? 2;
        const alreadyUsed = (allowed as any).usedCount ?? 0;
        const remaining = maxAllowed - alreadyUsed;

        if (isAttending) {
            if (remaining <= 0) {
                return res.status(403).json({
                    success: false,
                    error: `Ya registraste los ${maxAllowed} invitado(s) permitidos para este número.`,
                });
            }
            if (guestCount > remaining) {
                return res.status(400).json({
                    success: false,
                    error: `Solo te queda(n) ${remaining} cupo(s) disponible(s) para este número.`,
                });
            }
        } else if (alreadyUsed > 0) {
            return res.status(403).json({
                success: false,
                error: 'Este número ya registró invitados. Si necesitas un cambio, contáctanos.',
            });
        }

        // Cédulas de este envío (solo dígitos)
        const cedulaList: string[] = (Array.isArray(cedulas) ? cedulas : [])
            .map((c) => String(c).replace(/\D/g, ''))
            .filter(Boolean)
            .slice(0, guestCount);

        if (isAttending && cedulaList.length) {
            // a) repetidas en el mismo formulario
            const dup = cedulaList.find((c, i) => cedulaList.indexOf(c) !== i);
            if (dup) {
                return res.status(400).json({ success: false, error: `La cédula ${dup} está repetida en el formulario.` });
            }
            // b) ya registradas en otra confirmación
            const previos = await prisma.rSVP.findMany({ where: { attending: true }, select: { cedulas: true } });
            const registradas = new Set<string>();
            previos.forEach((r) => {
                try {
                    (JSON.parse(r.cedulas) as unknown[]).forEach((c) => registradas.add(String(c).replace(/\D/g, '')));
                } catch { /* noop */ }
            });
            const yaExiste = cedulaList.find((c) => registradas.has(c));
            if (yaExiste) {
                return res.status(400).json({ success: false, error: `La cédula ${yaExiste} ya fue registrada en otra confirmación.` });
            }
        }

        // Nombres oficiales por cédula (uno por invitado) — solo para la lista de invitados
        const guestNames = isAttending ? await Promise.all(cedulaList.map(fetchCedulaName)) : [];
        // El "Contacto" es el nombre que escribió la persona en el formulario
        const contactName = (name && String(name).trim()) || guestNames.find(Boolean) || 'Invitado';

        const result = await prisma.rSVP.create({
            data: {
                name: contactName,
                email,
                phone,
                attending: isAttending,
                guestsCount: isAttending ? guestCount : 0,
                dietary: dietary || null,
                message: message || null,
                cedulas: JSON.stringify(cedulaList),
                guestNames: JSON.stringify(guestNames),
            } as any,
        });

        // Acumular cupos usados
        const newUsed = isAttending ? alreadyUsed + guestCount : maxAllowed;
        await prisma.allowedGuest.update({
            where: { phone },
            data: { usedCount: newUsed, used: newUsed >= maxAllowed, usedAt: new Date() } as any,
        });

        // Auto-asignar mesa por etiqueta: si el invitado tiene una etiqueta que
        // coincide con la de alguna mesa, sentar a estas personas en esa mesa.
        const guestTag = (allowed as any).tag;
        if (isAttending && guestTag) {
            try {
                const wanted = String(guestTag).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
                const metas = await prisma.tableMeta.findMany();
                const meta = metas.find((m: any) =>
                    String(m.label || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim() === wanted,
                );
                if (meta) {
                    const t = (meta as any).tableNumber;
                    const existing = await prisma.seatAssignment.findMany({ where: { tableNumber: t } });
                    const taken = new Set<number>(existing.map((e: any) => e.seatIndex).filter((s: any) => s != null));
                    let s = 0;
                    for (let i = 0; i < guestCount; i++) {
                        while (taken.has(s)) s++;
                        taken.add(s);
                        await prisma.seatAssignment.upsert({
                            where: { personKey: `${result.id}:${i}` },
                            update: { tableNumber: t, seatIndex: s },
                            create: { personKey: `${result.id}:${i}`, tableNumber: t, seatIndex: s },
                        });
                        s++;
                    }
                }
            } catch (e) {
                console.error('Auto-seat error:', e);
            }
        }

        // Correos (según los ajustes; la contraseña siempre es la env EMAIL_PASS)
        const st = await getSettings();
        const mailer = makeMailer(st);
        const fromAddr = st.emailFrom || process.env.EMAIL_USER;

        if (mailer && isAttending && st.emailGuest && email) {
            const list = guestNames.filter(Boolean).map((n) => `<li>${n}</li>`).join('') || `<li>${guestCount} invitado(s)</li>`;
            mailer
                .sendMail({
                    from: fromAddr,
                    to: email,
                    subject: '¡Confirmación recibida! - Boda Stephanie & Dalvin',
                    html: `
                        <div style="font-family: serif; padding: 20px; color: #4a5d23;">
                            <h1>¡Hola ${contactName}!</h1>
                            <p>Hemos recibido tu confirmación para nuestra boda. ¡Estamos muy felices de que nos acompañes!</p>
                            <hr />
                            <p><strong>Invitados registrados (${guestCount}):</strong></p>
                            <ul>${list}</ul>
                            <p><strong>Fecha:</strong> 7 de Noviembre de 2026</p>
                            <p>Nos vemos pronto,</p>
                            <p><em>Stephanie &amp; Dalvin</em></p>
                        </div>
                    `,
                })
                .catch((err) => console.error('Email error:', err));
        }

        if (mailer && st.emailNotify && st.emailTo) {
            const quienes = guestNames.filter(Boolean).join(', ') || `${guestCount} invitado(s)`;
            mailer
                .sendMail({
                    from: fromAddr,
                    to: st.emailTo,
                    subject: isAttending
                        ? `✅ ${contactName} confirmó (${guestCount})`
                        : `❌ ${contactName} no asistirá`,
                    text: isAttending
                        ? `${contactName} confirmó su asistencia.\nTeléfono: ${phone}\nInvitados (${guestCount}): ${quienes}\n${dietary ? `Restricciones: ${dietary}\n` : ''}${message ? `Mensaje: ${message}\n` : ''}`
                        : `${contactName} (${phone}) marcó que NO asistirá.${message ? `\nMensaje: ${message}` : ''}`,
                })
                .catch((err) => console.error('Notify email error:', err));
        }

        res.status(201).json({ success: true, data: result, remaining: Math.max(0, maxAllowed - newUsed) });
    } catch (error) {
        console.error('RSVP Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

let cachedToken = '';
let tokenExpiry = 0; // Timestamp en ms

/** JWT RS256 firmado con la clave privada de la cuenta de servicio (método legacy). */
const buildServiceAccountBody = async (): Promise<URLSearchParams> => {
    const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
    const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const sa = JSON.parse(jsonStr);
    if (typeof sa.private_key === 'string') sa.private_key = sa.private_key.replace(/\\n/g, '\n');

    const crypto = await import('crypto');
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    })).toString('base64url');
    const signature = crypto.createSign('RSA-SHA256').update(`${header}.${payload}`).sign(sa.private_key, 'base64url');
    return new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${payload}.${signature}` });
};

/**
 * Devuelve un access token de Google Drive.
 * - Si hay GOOGLE_REFRESH_TOKEN → sube como el usuario dueño (recomendado, cuenta contra sus GB).
 * - Si no, usa la cuenta de servicio (GOOGLE_SERVICE_ACCOUNT_JSON) — método legacy.
 */
const getGoogleAccessToken = async (): Promise<string> => {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    let body: URLSearchParams;
    if (refreshToken && clientId && clientSecret) {
        body = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        body = await buildServiceAccountBody();
    } else {
        throw new Error('Faltan credenciales: GOOGLE_REFRESH_TOKEN (+ CLIENT_ID/SECRET) o GOOGLE_SERVICE_ACCOUNT_JSON');
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!res.ok) throw new Error(`token: ${await res.text()}`);

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + ((data.expires_in ? data.expires_in - 90 : 3000) * 1000);
    return cachedToken;
};

// Helper to find or create subfolder inside Google Drive
const getOrCreateSubfolder = async (accessToken: string, parentId: string, folderName: string): Promise<string> => {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&q=${encodeURIComponent(
        `name='${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )}`;

    const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
            return searchData.files[0].id;
        }
    }
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        })
    });
    
    if (!createRes.ok) {
        throw new Error('Failed to create subfolder');
    }
    
    const createData = await createRes.json();
    return createData.id;
};

// 1.5 POST Upload Photo/Video
app.post('/api/upload', async (req, res) => {
    try {
        const { name, type, base64, folder } = req.body;
        if (!name || !base64) {
            return res.status(400).json({ error: 'Name and base64 data are required' });
        }

        const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
        const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const hasCreds = Boolean(process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

        if (hasCreds && mainFolderId) {
            let accessToken: string;
            try {
                accessToken = await getGoogleAccessToken();
            } catch (e: any) {
                console.error('Google auth error:', e?.message);
                return res.status(502).json({ success: false, error: `No se pudo autenticar con Google: ${String(e?.message || e).slice(0, 220)}` });
            }
            
            // Resolve correct folder ID (main or subfolder)
            let targetFolderId = mainFolderId;
            if (folder) {
                targetFolderId = await getOrCreateSubfolder(accessToken, mainFolderId, folder);
            }

            const boundary = '-------314159265358979323846';
            const delimiter = `\r\n--${boundary}\r\n`;
            const closeDelimiter = `\r\n--${boundary}--`;

            const metadata = {
                name: `${Date.now()}_${name}`,
                parents: [targetFolderId]
            };

            const partHeader = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
            const mediaPartHeader = `\r\n--${boundary}\r\nContent-Type: ${type || 'image/jpeg'}\r\n\r\n`;
            
            const bodyPayload = Buffer.concat([
                Buffer.from(partHeader),
                Buffer.from(mediaPartHeader),
                buffer,
                Buffer.from(closeDelimiter)
            ]);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body: bodyPayload
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Google Drive upload error:', errText);
                if (errText.includes('storageQuotaExceeded') || errText.includes('quota')) {
                    return res.status(507).json({
                        success: false,
                        error: 'La carpeta de Drive rechaza la subida por cuota de la cuenta de servicio. Solución: usar una Unidad compartida.',
                    });
                }
                if (errText.includes('File not found') || errText.includes('notFound')) {
                    return res.status(404).json({
                        success: false,
                        error: 'No se encontró la carpeta (GOOGLE_DRIVE_FOLDER_ID incorrecto o sin acceso para esta cuenta).',
                    });
                }
                return res.status(502).json({ success: false, error: `Google Drive: ${errText.slice(0, 250)}` });
            }

            const data = await response.json();
            return res.status(201).json({ success: true, fileId: data.id });
        } else if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            const faltan = [
                !process.env.GOOGLE_REFRESH_TOKEN && !process.env.GOOGLE_SERVICE_ACCOUNT_JSON && 'GOOGLE_REFRESH_TOKEN',
                !mainFolderId && 'GOOGLE_DRIVE_FOLDER_ID',
            ].filter(Boolean).join(' y ');
            return res.status(503).json({
                success: false,
                error: `Falta configurar Google Drive en Vercel: ${faltan}. Agrégala(s) y haz Redeploy.`,
            });
        } else {
            // Fallback a disco local (solo desarrollo)
            const uploadDir = path.join(process.cwd(), 'public', 'images', 'preboda', folder || '');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `${Date.now()}_${name}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);

            const relativePath = folder ? `/images/preboda/${folder}/${fileName}` : `/images/preboda/${fileName}`;
            return res.status(201).json({ success: true, url: relativePath });
        }
    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, error: `Error al subir: ${String(error?.message || error).slice(0, 200)}` });
    }
});

// --- Ajustes -----------------------------------------------------------------

// Público: solo lo que necesita el sitio de invitados.
// Presentación = del portal activo (o de ?portalPreview=N para previsualizar sin activar).
app.get('/api/settings', async (req, res) => {
    const s = await getSettings();
    const raw = await getRawData();
    const previewN = clampPortal(req.query.portalPreview);
    const portal = previewN || readPortals(raw).activePortal;
    const pres = presentationOf(raw, portal);
    let images: Record<string, number> = {};
    try {
        const assets = await prisma.siteAsset.findMany({ where: { portal }, select: { slot: true, updatedAt: true } });
        images = Object.fromEntries(assets.map((a) => [a.slot, a.updatedAt.getTime()]));
    } catch { /* noop */ }
    res.set('Cache-Control', previewN ? 'no-store' : 'public, max-age=30');
    res.json({
        // globales
        rsvpOpen: s.rsvpOpen,
        rsvpDeadline: s.rsvpDeadline,
        graciasAuto: s.graciasAuto,
        graciasFrom: s.graciasFrom,
        lockMode: s.lockMode,
        // presentación del portal
        ...pres,
        _portal: portal,
        images,
    });
});

// Verificar la contraseña del sitio (modo "solo con enlace / contraseña")
app.post('/api/site/unlock', async (req, res) => {
    const s = await getSettings();
    const pass = String(req.body?.password || '');
    const ok = s.lockMode === 'password' && s.sitePassword !== '' && pass === s.sitePassword;
    res.json({ ok });
});

// Servir una imagen del sitio (override del panel) o caer al archivo estático.
// ?portal=N para una imagen de un portal concreto; sin parámetro = portal activo.
app.get('/api/img/:slot', async (req, res) => {
    const slot = String(req.params.slot).replace(/[^\w-]/g, '').slice(0, 40);
    let portal = clampPortal(req.query.portal);
    if (!portal) {
        try { portal = readPortals(await getRawData()).activePortal; } catch { portal = 1; }
    }
    try {
        const asset = await prisma.siteAsset.findUnique({ where: { portal_slot: { portal, slot } } });
        if (asset) {
            if (asset.kind === 'url' && asset.url) {
                res.set('Cache-Control', 'public, max-age=3600');
                return res.redirect(302, asset.url);
            }
            if (asset.kind === 'data' && asset.data) {
                const buf = Buffer.from(asset.data, 'base64');
                res.set('Content-Type', asset.mime || 'image/jpeg');
                res.set('Cache-Control', 'public, max-age=86400');
                return res.end(buf);
            }
        }
    } catch { /* noop */ }
    // Sin override: la portada OG necesita SIEMPRE una imagen → cae al archivo estático.
    if (slot === 'og') return res.redirect(302, '/images/og-image.jpg?v=4');
    return res.status(404).end();
});

// Resuelve el portal a editar/gestionar: ?portal=N o el activo.
const resolvePortal = async (req: any): Promise<number> =>
    clampPortal(req.query.portal) || readPortals(await getRawData()).activePortal;

// Admin: gestión de imágenes del sitio (por portal)
app.get('/api/admin/assets', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const portal = await resolvePortal(req);
    const assets = await prisma.siteAsset.findMany({ where: { portal } });
    res.json(assets.map((a) => ({ slot: a.slot, kind: a.kind, url: a.url, hasData: Boolean(a.data), mime: a.mime, updatedAt: a.updatedAt })));
});

app.put('/api/admin/assets/:slot', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const portal = await resolvePortal(req);
    const slot = String(req.params.slot).replace(/[^\w-]/g, '').slice(0, 40);
    if (!slot) return res.status(400).json({ error: 'Slot inválido.' });
    const { url, dataUrl } = req.body || {};
    try {
        if (typeof url === 'string' && /^https?:\/\//.test(url)) {
            await prisma.siteAsset.upsert({
                where: { portal_slot: { portal, slot } },
                update: { kind: 'url', url, data: null, mime: null },
                create: { portal, slot, kind: 'url', url },
            });
            return res.json({ success: true });
        }
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
            const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(dataUrl);
            if (!m) return res.status(400).json({ error: 'Imagen inválida.' });
            const mime = m[1];
            const b64 = m[2];
            // Límite ~4 MB en base64 (~3 MB de imagen)
            if (b64.length > 5_600_000) return res.status(413).json({ error: 'La imagen es muy grande (máx. ~3 MB).' });
            await prisma.siteAsset.upsert({
                where: { portal_slot: { portal, slot } },
                update: { kind: 'data', data: b64, mime, url: null },
                create: { portal, slot, kind: 'data', data: b64, mime },
            });
            return res.json({ success: true });
        }
        return res.status(400).json({ error: 'Envía una URL pública o una imagen.' });
    } catch (error) {
        console.error('Asset save error:', error);
        res.status(500).json({ error: 'No se pudo guardar la imagen.' });
    }
});

app.delete('/api/admin/assets/:slot', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const portal = await resolvePortal(req);
    const slot = String(req.params.slot).replace(/[^\w-]/g, '').slice(0, 40);
    try {
        await prisma.siteAsset.delete({ where: { portal_slot: { portal, slot } } });
    } catch { /* ya no existe */ }
    res.json({ success: true });
});

// Admin: todos los ajustes + estructura de portales
app.get('/api/admin/settings', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const s = await getSettings();
    const { activePortal, portalNames, portals } = readPortals(await getRawData());
    res.json({
        ...s, activePortal, portalNames, portals,
        emailPassSet: Boolean(process.env.EMAIL_PASS), emailUserEnv: process.env.EMAIL_USER || '',
    });
});

// Guardar ajustes GLOBALES (todo menos la presentación, que va por portal) + portal activo / nombres
app.put('/api/admin/settings', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const raw = await getRawData();
        const incoming = req.body || {};
        const next: any = { ...raw };
        for (const k of Object.keys(DEFAULT_SETTINGS)) {
            if (PRESENTATION_SET.has(k)) continue; // la presentación va por portal
            if (k in incoming) next[k] = incoming[k];
        }
        if ('activePortal' in incoming) next.activePortal = clampPortal(incoming.activePortal) || 1;
        if (incoming.portalNames && typeof incoming.portalNames === 'object') {
            next.portalNames = { ...(next.portalNames || {}), ...incoming.portalNames };
        }
        const migrated = readPortals(next);
        next.portals = migrated.portals;
        next.portalNames = next.portalNames || migrated.portalNames;
        next.activePortal = clampPortal(next.activePortal) || migrated.activePortal;
        await prisma.setting.upsert({ where: { id: 1 }, update: { data: next }, create: { id: 1, data: next } });
        invalidateSettingsCache();
        const s = await getSettings();
        res.json({
            success: true,
            settings: {
                ...s, ...readPortals(next),
                emailPassSet: Boolean(process.env.EMAIL_PASS), emailUserEnv: process.env.EMAIL_USER || '',
            },
        });
    } catch (error) {
        console.error('Settings save error:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Guardar la PRESENTACIÓN de un portal (1..5) y opcionalmente su nombre.
app.put('/api/admin/portals/:n', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const n = clampPortal(req.params.n);
    if (!n) return res.status(400).json({ error: 'Portal inválido (1..5).' });
    try {
        const raw = await getRawData();
        const { portals, portalNames } = readPortals(raw);
        const incoming = req.body || {};
        const merged: any = { ...(portals[String(n)] || {}) };
        for (const k of PRESENTATION_KEYS) if (k in incoming) merged[k] = incoming[k];
        if (Array.isArray(merged.registryBanks)) merged.registryBanks = merged.registryBanks.slice(0, 3);
        if (Array.isArray(merged.registryStores)) merged.registryStores = merged.registryStores.slice(0, 8);
        const next: any = { ...raw, portals: { ...portals, [n]: merged } };
        if (typeof incoming.name === 'string') {
            next.portalNames = { ...portalNames, [n]: incoming.name.slice(0, 40) };
        } else {
            next.portalNames = portalNames;
        }
        next.activePortal = clampPortal(raw.activePortal) || 1;
        await prisma.setting.upsert({ where: { id: 1 }, update: { data: next }, create: { id: 1, data: next } });
        invalidateSettingsCache();
        res.json({
            success: true, portal: n,
            presentation: { ...DEFAULT_PRESENTATION, ...merged },
            portalNames: next.portalNames,
        });
    } catch (error) {
        console.error('Portal save error:', error);
        res.status(500).json({ error: 'No se pudo guardar el portal.' });
    }
});

// Enviar un correo de prueba a la dirección de los novios
app.post('/api/admin/settings/test-email', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const s = await getSettings();
    const mailer = makeMailer(s);
    if (!mailer) return res.status(400).json({ error: 'Falta la contraseña (EMAIL_PASS) o el correo remitente.' });
    if (!s.emailTo) return res.status(400).json({ error: 'Falta el correo de destino (novios).' });
    try {
        await mailer.sendMail({
            from: s.emailFrom || process.env.EMAIL_USER,
            to: s.emailTo,
            subject: 'Prueba de notificación — Boda S&D',
            text: 'Si recibes esto, las notificaciones por correo están funcionando. 🎉',
        });
        res.json({ success: true });
    } catch (error: any) {
        res.status(502).json({ error: String(error?.message || error).slice(0, 200) });
    }
});

// --- Galería post-boda: fotos que subieron los invitados (Google Drive) ------

let galleryCache: { at: number; items: { id: string; name: string }[] } = { at: 0, items: [] };

app.get('/api/gallery', async (_req, res) => {
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const hasCreds = Boolean(process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    if (!mainFolderId || !hasCreds) return res.json({ items: [] });

    // Cache 5 min (listar Drive es lento)
    if (Date.now() - galleryCache.at < 5 * 60 * 1000 && galleryCache.items.length) {
        return res.json({ items: galleryCache.items });
    }

    try {
        const token = await getGoogleAccessToken();
        const auth = { headers: { Authorization: `Bearer ${token}` } };

        // Carpeta principal + subcarpetas
        const subRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=100&fields=files(id)&q=${encodeURIComponent(
                `'${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            )}`,
            auth,
        );
        const subs = subRes.ok ? ((await subRes.json()).files || []).map((f: any) => f.id) : [];
        const folders = [mainFolderId, ...subs];

        const items: { id: string; name: string }[] = [];
        for (const fid of folders) {
            const r = await fetch(
                `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=1000&orderBy=createdTime desc&fields=files(id,name)&q=${encodeURIComponent(
                    `'${fid}' in parents and mimeType contains 'image/' and trashed=false`,
                )}`,
                auth,
            );
            if (r.ok) ((await r.json()).files || []).forEach((f: any) => items.push({ id: f.id, name: f.name }));
        }

        galleryCache = { at: Date.now(), items };
        res.json({ items });
    } catch (error: any) {
        console.error('Gallery list error:', error);
        res.status(500).json({ items: [], error: String(error?.message || error).slice(0, 150) });
    }
});

app.get('/api/gallery/img/:id', async (req, res) => {
    const id = String(req.params.id || '').replace(/[^\w-]/g, '');
    if (!id) return res.status(400).end();
    try {
        const token = await getGoogleAccessToken();
        const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok || !r.body) return res.status(r.status).end();
        res.set('Content-Type', r.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        const buf = Buffer.from(await r.arrayBuffer());
        res.end(buf);
    } catch (error) {
        console.error('Gallery img error:', error);
        res.status(500).end();
    }
});

// 2.5 Guestbook — Libro de mensajes para los novios
app.post('/api/messages', async (req, res) => {
    try {
        const { name, message, honeypot } = req.body;

        if (honeypot) {
            // Bot: responde OK sin guardar nada
            return res.status(201).json({ success: true });
        }

        const cleanName = String(name || '').trim().slice(0, 60);
        const cleanMessage = String(message || '').trim().slice(0, 600);

        if (!cleanName || cleanMessage.length < 2) {
            return res.status(400).json({ success: false, error: 'Escribe tu nombre y un mensaje.' });
        }

        const result = await prisma.guestMessage.create({
            data: { name: cleanName, message: cleanMessage }
        });

        res.status(201).json({ success: true, data: { id: result.id, name: result.name, message: result.message, createdAt: result.createdAt } });
    } catch (error) {
        console.error('Guestbook Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// 3. GET Attendance Summary (Admin only)
app.get('/api/admin/summary', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const rsvps = await prisma.rSVP.findMany();

        const summary = {
            totalRSVPs: rsvps.length,
            accepted: rsvps.filter(r => r.attending).length,
            declined: rsvps.filter(r => !r.attending).length,
            totalGuests: rsvps.reduce((acc, curr) => acc + curr.guestsCount, 0),
            dietaryRestrictions: rsvps.filter(r => r.dietary).map(r => ({ name: r.name, restriction: r.dietary }))
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// 4. GET All Guests (Admin only)
app.get('/api/admin/guests', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const guests = await prisma.rSVP.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
});

// 4b. DELETE una confirmación (Admin) — libera los cupos usados
app.delete('/api/admin/guests/:id', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!process.env.ADMIN_API_KEY || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        const rsvp = await prisma.rSVP.findUnique({ where: { id } });
        if (!rsvp) return res.status(404).json({ error: 'No existe' });

        if (rsvp.attending && rsvp.phone) {
            const ag = await prisma.allowedGuest.findUnique({ where: { phone: rsvp.phone } });
            if (ag) {
                const newUsed = Math.max(0, ((ag as any).usedCount ?? 0) - rsvp.guestsCount);
                await prisma.allowedGuest.update({
                    where: { phone: rsvp.phone },
                    data: { usedCount: newUsed, used: newUsed >= ((ag as any).maxGuests ?? 2) } as any,
                });
            }
        }

        await prisma.rSVP.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete RSVP error:', error);
        res.status(500).json({ error: 'Failed to delete guest' });
    }
});

// PUT: editar una confirmación (nombre, cantidad, restricciones, mensaje, asiste)
app.put('/api/admin/guests/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { name, guestsCount, dietary, message, attending } = req.body || {};

    try {
        const rsvp = await prisma.rSVP.findUnique({ where: { id } });
        if (!rsvp) return res.status(404).json({ error: 'No existe' });

        const willAttend = attending === undefined ? rsvp.attending : (attending === true || attending === 'yes' || attending === 'true');
        let newCount = rsvp.guestsCount;
        if (guestsCount !== undefined) {
            const c = parseInt(guestsCount, 10);
            if (Number.isFinite(c) && c >= 0) newCount = c;
        }
        if (!willAttend) newCount = 0;

        // Ajustar cupos usados del teléfono según el delta
        if (rsvp.phone) {
            const ag = await prisma.allowedGuest.findUnique({ where: { phone: rsvp.phone } }) as any;
            if (ag) {
                const before = rsvp.attending ? rsvp.guestsCount : 0;
                const after = willAttend ? newCount : 0;
                const delta = after - before;
                const used = Math.max(0, (ag.usedCount ?? 0) + delta);
                if (after > before) {
                    const max = ag.maxGuests ?? 2;
                    if (used > max) return res.status(400).json({ error: `Se pasa del cupo del teléfono (${max}).` });
                }
                await prisma.allowedGuest.update({
                    where: { phone: rsvp.phone },
                    data: { usedCount: used, used: used >= (ag.maxGuests ?? 2) } as any,
                });
            }
        }

        const data: any = { attending: willAttend, guestsCount: newCount };
        if (name !== undefined) data.name = (name && String(name).trim()) || rsvp.name;
        if (dietary !== undefined) data.dietary = (dietary && String(dietary).trim()) || null;
        if (message !== undefined) data.message = (message && String(message).trim()) || null;

        const updated = await prisma.rSVP.update({ where: { id }, data });
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Edit RSVP error:', error);
        res.status(500).json({ error: 'Failed to update guest' });
    }
});

// 6. GET All Allowed Guests (Admin only)
app.get('/api/admin/allowed', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const allowed = await prisma.allowedGuest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(allowed);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch allowed guests' });
    }
});

// 7. POST Add Allowed Guest (Admin only)
app.post('/api/admin/allowed', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { phone, pin, maxGuests, aforo, name, ceremonyOnly, receptionOnly, tag } = req.body;
    if (!phone || !pin) {
        return res.status(400).json({ error: 'Phone and PIN are required' });
    }

    const count = parseInt(maxGuests, 10) || 2;
    const aforoNum = parseInt(aforo, 10) || 0;
    const cleanName = (name && String(name).trim().slice(0, 60)) || null;
    const cleanTag = (tag && String(tag).trim().slice(0, 40)) || null;
    const ceremonyOnlyBool = ceremonyOnly === true || ceremonyOnly === 'true';
    const receptionOnlyBool = !ceremonyOnlyBool && (receptionOnly === true || receptionOnly === 'true');

    try {
        if (aforoNum > 0) {
            const all = await prisma.allowedGuest.findMany();
            const otros = all
                .filter((a) => a.phone !== phone)
                .reduce((s, a) => s + ((a as any).maxGuests || 2), 0);
            if (otros + count > aforoNum) {
                return res.status(400).json({
                    error: `Se excede el aforo (${aforoNum}). Pases ya asignados a otros números: ${otros}. Disponibles: ${Math.max(0, aforoNum - otros)}.`,
                });
            }
        }

        const result = await prisma.allowedGuest.upsert({
            where: { phone },
            update: { pin, maxGuests: count, ceremonyOnly: ceremonyOnlyBool, receptionOnly: receptionOnlyBool, tag: cleanTag, ...(cleanName !== null ? { name: cleanName } : {}) } as any, // no se reinician los cupos ya usados
            create: { phone, pin, maxGuests: count, name: cleanName, ceremonyOnly: ceremonyOnlyBool, receptionOnly: receptionOnlyBool, tag: cleanTag } as any
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save allowed guest' });
    }
});

// 7e. POST Importar invitados en lote (una línea por invitado)
app.post('/api/admin/allowed/bulk', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const text = String(req.body?.text || '');
    if (!text.trim()) return res.status(400).json({ error: 'Sin datos' });

    const splitRow = (line: string) => line.split(/\t|,|;/).map((c) => c.trim());
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // Saltar fila de encabezados si la primera parece serlo
    if (lines[0] && /nombre|tel[eé]fono|phone|pin/i.test(lines[0]) && !/\d{7,}/.test(lines[0])) lines.shift();

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const line of lines) {
        const [name, phoneRaw, pinRaw, pasesRaw, tag] = splitRow(line);
        const phone = String(phoneRaw || '').replace(/[^\d]/g, '');
        if (phone.length < 7) { errors.push(`Teléfono inválido: "${line}"`); continue; }
        const pin = String(pinRaw || '').trim() || String(Math.floor(1000 + Math.random() * 9000));
        const maxGuests = parseInt(pasesRaw, 10) || 2;
        const cleanName = (name && String(name).trim().slice(0, 60)) || null;
        const cleanTag = (tag && String(tag).trim().slice(0, 40)) || null;
        try {
            const existing = await prisma.allowedGuest.findUnique({ where: { phone } });
            await prisma.allowedGuest.upsert({
                where: { phone },
                update: { pin, maxGuests, ...(cleanName ? { name: cleanName } : {}), ...(cleanTag ? { tag: cleanTag } : {}) } as any,
                create: { phone, pin, maxGuests, name: cleanName, tag: cleanTag } as any,
            });
            if (existing) updated++;
            else created++;
        } catch (e: any) {
            errors.push(`Error con ${phone}: ${String(e?.message || e).slice(0, 80)}`);
        }
    }

    res.json({ success: true, created, updated, errors });
});

// 7c. POST Reset a un teléfono autorizado (vuelve a 0 sus cupos usados)
app.post('/api/admin/allowed/:id/reset', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!process.env.ADMIN_API_KEY || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    try {
        const result = await prisma.allowedGuest.update({
            where: { id },
            data: { usedCount: 0, used: false, usedAt: null } as any,
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset allowed guest' });
    }
});

// 7d. PUT Editar un teléfono autorizado (nombre, teléfono, PIN, pases)
app.put('/api/admin/allowed/:id', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!process.env.ADMIN_API_KEY || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { name, phone, pin, maxGuests, aforo, ceremonyOnly, receptionOnly, tag } = req.body;

    try {
        const current = await prisma.allowedGuest.findUnique({ where: { id } }) as any;
        if (!current) return res.status(404).json({ error: 'No existe' });

        const data: any = {};

        if (phone !== undefined) {
            const cleanPhone = String(phone).trim();
            if (!cleanPhone) return res.status(400).json({ error: 'El teléfono no puede quedar vacío.' });
            if (cleanPhone !== current.phone) {
                const dup = await prisma.allowedGuest.findUnique({ where: { phone: cleanPhone } });
                if (dup) return res.status(400).json({ error: 'Ya existe otro registro con ese teléfono.' });
                data.phone = cleanPhone;
            }
        }
        if (pin !== undefined) {
            const cleanPin = String(pin).trim();
            if (!cleanPin) return res.status(400).json({ error: 'El PIN no puede quedar vacío.' });
            data.pin = cleanPin;
        }
        if (name !== undefined) {
            data.name = (name && String(name).trim().slice(0, 60)) || null;
        }
        if (ceremonyOnly !== undefined || receptionOnly !== undefined) {
            const c = ceremonyOnly === true || ceremonyOnly === 'true';
            const r = !c && (receptionOnly === true || receptionOnly === 'true');
            data.ceremonyOnly = c;
            data.receptionOnly = r;
        }
        if (tag !== undefined) {
            data.tag = (tag && String(tag).trim().slice(0, 40)) || null;
        }
        if (maxGuests !== undefined) {
            const parsed = parseInt(maxGuests, 10);
            const count = Number.isNaN(parsed) ? (current.maxGuests || 2) : parsed;
            if (count < (current.usedCount ?? 0)) {
                return res.status(400).json({ error: `Ya hay ${current.usedCount} registrados; los pases no pueden bajar de ese número.` });
            }
            const aforoNum = parseInt(aforo, 10) || 0;
            if (aforoNum > 0) {
                const all = await prisma.allowedGuest.findMany();
                const otros = all.filter((a) => a.id !== id).reduce((s, a) => s + ((a as any).maxGuests || 2), 0);
                if (otros + count > aforoNum) {
                    return res.status(400).json({ error: `Se excede el aforo (${aforoNum}). Pases de otros números: ${otros}. Disponibles: ${Math.max(0, aforoNum - otros)}.` });
                }
            }
            data.maxGuests = count;
            data.used = (current.usedCount ?? 0) >= count;
        }

        const result = await prisma.allowedGuest.update({ where: { id }, data });
        res.json(result);
    } catch (error) {
        console.error('Edit allowed guest error:', error);
        res.status(500).json({ error: 'Failed to update allowed guest' });
    }
});

// 7b. DELETE Allowed Guest (Admin only)
app.delete('/api/admin/allowed/:id', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }

    try {
        await prisma.allowedGuest.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete allowed guest' });
    }
});

// 8. GET All Guestbook Messages (Admin only)
app.get('/api/admin/messages', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const messages = await prisma.guestMessage.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// 9. DELETE a Guestbook Message (Admin only)
app.delete('/api/admin/messages/:id', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || !adminOk(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }

    try {
        await prisma.guestMessage.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// --- Organización de mesas de la recepción (Admin) ---------------------------

const isAdmin = (req: any) => adminOk(req);

const onlyDigits = (s: any) => String(s || '').replace(/\D/g, '');
const normLabel = (s: any) =>
    String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** Detecta/repara texto con doble codificación UTF-8 (p.ej. "PÃ©rez" → "Pérez"). */
const looksMojibake = (s: string) => /Ã[\x80-\xbf]|Â[\x80-\xbf\xa0-\xbf]|â‚¬|â€|Ã‚|Ã©|Ã±|Ã³|Ã¡|Ã­|Ãº/.test(s);
const fixMojibake = (s: any): string => {
    const str = String(s ?? '');
    if (!str || !looksMojibake(str)) return str;
    try {
        const fixed = Buffer.from(str, 'latin1').toString('utf8');
        if (!fixed.includes('�') && Buffer.from(fixed, 'utf8').toString('latin1') === str) return fixed;
    } catch { /* noop */ }
    return str;
};

/** Expande las confirmaciones (que van a la recepción) a personas individuales. */
const buildSeatingPeople = async () => {
    const [rsvps, allowed] = await Promise.all([
        prisma.rSVP.findMany({ where: { attending: true }, orderBy: { createdAt: 'asc' } }),
        prisma.allowedGuest.findMany(),
    ]);

    const byPhone = new Map<string, any>();
    allowed.forEach((a: any) => byPhone.set(onlyDigits(a.phone), a));

    const people: { key: string; name: string; party: string; rsvpId: number; tag: string | null; dietary: string | null }[] = [];
    for (const r of rsvps as any[]) {
        const ag = r.phone ? byPhone.get(onlyDigits(r.phone)) : null;
        if (ag && ag.ceremonyOnly) continue; // no van a la recepción
        let names: string[] = [];
        try { names = JSON.parse(r.guestNames || '[]'); } catch { /* noop */ }
        const count = Math.max(r.guestsCount || 0, names.filter(Boolean).length, 1);
        const party = fixMojibake(r.name);
        for (let i = 0; i < count; i++) {
            people.push({
                key: `${r.id}:${i}`,
                name: fixMojibake(names[i] || (i === 0 ? r.name : `${r.name} (${i + 1})`)),
                party,
                rsvpId: r.id,
                tag: (ag && ag.tag) || null,
                dietary: (r.dietary && String(r.dietary).trim()) || null,
            });
        }
    }
    return people;
};

// GET: personas a sentar + asignaciones + etiquetas de mesa
app.get('/api/admin/seating', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [people, rows, metas] = await Promise.all([
            buildSeatingPeople(),
            prisma.seatAssignment.findMany(),
            prisma.tableMeta.findMany(),
        ]);

        const validKeys = new Set(people.map((p) => p.key));

        // Limpiar asignaciones huérfanas
        const stale = rows.filter((x) => !validKeys.has(x.personKey)).map((x) => x.id);
        if (stale.length) {
            await prisma.seatAssignment.deleteMany({ where: { id: { in: stale } } });
        }

        const assignments: Record<string, { table: number; seat: number | null }> = {};
        rows.filter((x) => validKeys.has(x.personKey)).forEach((x: any) => {
            assignments[x.personKey] = { table: x.tableNumber, seat: x.seatIndex ?? null };
        });

        const tables: Record<number, string> = {};
        const locked: number[] = [];
        const positions: Record<number, { x: number; y: number }> = {};
        const capacities: Record<number, number> = {};
        metas.forEach((m: any) => {
            if (m.label) tables[m.tableNumber] = m.label;
            if (m.locked) locked.push(m.tableNumber);
            if (m.x != null && m.y != null) positions[m.tableNumber] = { x: m.x, y: m.y };
            if (m.capacity != null && m.capacity > 0) capacities[m.tableNumber] = m.capacity;
        });

        res.json({ people, assignments, tables, locked, positions, capacities });
    } catch (error) {
        console.error('Seating GET error:', error);
        res.status(500).json({ error: 'Failed to load seating' });
    }
});

// POST: guardar TODA la distribución (asignaciones + etiquetas de mesa)
app.post('/api/admin/seating/save', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { assignments, tables, locked, positions, capacities } = req.body || {};

    try {
        const people = await buildSeatingPeople();
        const validKeys = new Set(people.map((p) => p.key));

        const seatRows = Object.entries(assignments || {})
            .map(([key, v]: [string, any]) => {
                const table = parseInt(String(v && typeof v === 'object' ? v.table : v), 10);
                const rawSeat = v && typeof v === 'object' ? v.seat : null;
                const seat = rawSeat == null || !Number.isFinite(Number(rawSeat)) ? null : Math.max(0, Math.trunc(Number(rawSeat)));
                return { personKey: key, tableNumber: table, seatIndex: seat };
            })
            .filter((r) => validKeys.has(r.personKey) && Number.isFinite(r.tableNumber) && r.tableNumber >= 1);

        // Una fila TableMeta por cada mesa que tenga etiqueta y/o esté bloqueada
        const lockedSet = new Set<number>((Array.isArray(locked) ? locked : []).map((n: any) => parseInt(n, 10)).filter(Boolean));
        const labels = new Map<number, string>();
        Object.entries(tables || {}).forEach(([n, label]) => {
            const num = parseInt(n, 10);
            const clean = String(label || '').trim().slice(0, 40);
            if (num >= 1 && clean) labels.set(num, clean);
        });
        const pos = new Map<number, { x: number; y: number }>();
        Object.entries(positions || {}).forEach(([n, p]: [string, any]) => {
            const num = parseInt(n, 10);
            const x = Number(p?.x);
            const y = Number(p?.y);
            if (num >= 1 && Number.isFinite(x) && Number.isFinite(y)) {
                pos.set(num, { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) });
            }
        });

        const caps = new Map<number, number>();
        Object.entries(capacities || {}).forEach(([n, c]: [string, any]) => {
            const num = parseInt(n, 10);
            const cap = parseInt(c, 10);
            if (num >= 1 && Number.isFinite(cap) && cap > 0 && cap <= 40) caps.set(num, cap);
        });

        const metaNums = new Set<number>([...labels.keys(), ...lockedSet, ...pos.keys(), ...caps.keys()]);
        const metaRows = [...metaNums].map((tableNumber) => ({
            tableNumber,
            label: labels.get(tableNumber) || '',
            locked: lockedSet.has(tableNumber),
            capacity: caps.get(tableNumber) ?? null,
            x: pos.get(tableNumber)?.x ?? null,
            y: pos.get(tableNumber)?.y ?? null,
        }));

        await prisma.seatAssignment.deleteMany({});
        await prisma.tableMeta.deleteMany({});
        if (seatRows.length) await prisma.seatAssignment.createMany({ data: seatRows });
        if (metaRows.length) await prisma.tableMeta.createMany({ data: metaRows });

        res.json({ success: true, seats: seatRows.length, tables: metaRows.length });
    } catch (error) {
        console.error('Seating save error:', error);
        res.status(500).json({ error: 'Failed to save seating' });
    }
});

// POST: etiqueta de una mesa (label vacío = quitar)
app.post('/api/admin/seating/table', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const n = parseInt(req.body?.tableNumber, 10);
    if (!n || n <= 0) return res.status(400).json({ error: 'tableNumber inválido' });
    const label = String(req.body?.label || '').trim().slice(0, 40);
    try {
        if (!label) {
            await prisma.tableMeta.deleteMany({ where: { tableNumber: n } });
            return res.json({ success: true, label: null });
        }
        await prisma.tableMeta.upsert({
            where: { tableNumber: n },
            update: { label },
            create: { tableNumber: n, label },
        });
        res.json({ success: true, label });
    } catch (error) {
        console.error('Table meta error:', error);
        res.status(500).json({ error: 'Failed to save table label' });
    }
});

// POST: auto-asignar por etiqueta (a los que aún no tienen mesa)
app.post('/api/admin/seating/autoassign', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const [people, rows, metas] = await Promise.all([
            buildSeatingPeople(),
            prisma.seatAssignment.findMany(),
            prisma.tableMeta.findMany(),
        ]);
        const assigned = new Set(rows.map((r) => r.personKey));
        const tableByTag = new Map<string, number>(); // las mesas bloqueadas quedan fuera
        metas.forEach((m: any) => {
            if (m.label && !m.locked) tableByTag.set(normLabel(m.label), m.tableNumber);
        });

        // asientos ya ocupados por mesa
        const occupied = new Map<number, Set<number>>();
        rows.forEach((r: any) => {
            if (r.seatIndex == null) return;
            if (!occupied.has(r.tableNumber)) occupied.set(r.tableNumber, new Set());
            occupied.get(r.tableNumber)!.add(r.seatIndex);
        });
        const nextSeat = (t: number) => {
            if (!occupied.has(t)) occupied.set(t, new Set());
            const set = occupied.get(t)!;
            let s = 0;
            while (set.has(s)) s++;
            set.add(s);
            return s;
        };

        let n = 0;
        for (const p of people) {
            if (assigned.has(p.key) || !p.tag) continue;
            const t = tableByTag.get(normLabel(p.tag));
            if (!t) continue;
            const seatIndex = nextSeat(t);
            await prisma.seatAssignment.upsert({
                where: { personKey: p.key },
                update: { tableNumber: t, seatIndex },
                create: { personKey: p.key, tableNumber: t, seatIndex },
            });
            n++;
        }
        res.json({ success: true, assigned: n });
    } catch (error) {
        console.error('Autoassign error:', error);
        res.status(500).json({ error: 'Failed to auto-assign' });
    }
});

// POST: reparar nombres con doble codificación UTF-8 ("PÃ©rez" → "Pérez")
app.post('/api/admin/fix-encoding', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
        let fixed = 0;

        const rsvps = await prisma.rSVP.findMany();
        for (const r of rsvps as any[]) {
            const data: any = {};
            const name = fixMojibake(r.name);
            if (name !== r.name) data.name = name;
            if (r.guestNames) {
                try {
                    const arr = JSON.parse(r.guestNames);
                    if (Array.isArray(arr)) {
                        const arr2 = arr.map((x) => (typeof x === 'string' ? fixMojibake(x) : x));
                        const j = JSON.stringify(arr2);
                        if (j !== r.guestNames) data.guestNames = j;
                    }
                } catch { /* noop */ }
            }
            if (r.message && fixMojibake(r.message) !== r.message) data.message = fixMojibake(r.message);
            if (r.dietary && fixMojibake(r.dietary) !== r.dietary) data.dietary = fixMojibake(r.dietary);
            if (Object.keys(data).length) {
                await prisma.rSVP.update({ where: { id: r.id }, data });
                fixed++;
            }
        }

        const allowed = await prisma.allowedGuest.findMany();
        for (const a of allowed as any[]) {
            const data: any = {};
            if (a.name && fixMojibake(a.name) !== a.name) data.name = fixMojibake(a.name);
            if (a.tag && fixMojibake(a.tag) !== a.tag) data.tag = fixMojibake(a.tag);
            if (Object.keys(data).length) {
                await prisma.allowedGuest.update({ where: { id: a.id }, data });
                fixed++;
            }
        }

        const msgs = await prisma.guestMessage.findMany();
        for (const m of msgs as any[]) {
            const data: any = {};
            if (fixMojibake(m.name) !== m.name) data.name = fixMojibake(m.name);
            if (fixMojibake(m.message) !== m.message) data.message = fixMojibake(m.message);
            if (Object.keys(data).length) {
                await prisma.guestMessage.update({ where: { id: m.id }, data });
                fixed++;
            }
        }

        res.json({ success: true, fixed });
    } catch (error) {
        console.error('Fix encoding error:', error);
        res.status(500).json({ error: 'Failed to fix encoding' });
    }
});

// POST: asignar / mover una persona (tableNumber null o 0 = a "sin asignar")
app.post('/api/admin/seating/assign', async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { key, tableNumber } = req.body || {};
    if (!key || typeof key !== 'string') return res.status(400).json({ error: 'key requerido' });

    const n = parseInt(tableNumber, 10);

    try {
        if (!n || n <= 0) {
            await prisma.seatAssignment.deleteMany({ where: { personKey: key } });
            return res.json({ success: true, tableNumber: null });
        }
        await prisma.seatAssignment.upsert({
            where: { personKey: key },
            update: { tableNumber: n },
            create: { personKey: key, tableNumber: n },
        });
        res.json({ success: true, tableNumber: n });
    } catch (error) {
        console.error('Seating assign error:', error);
        res.status(500).json({ error: 'Failed to assign seat' });
    }
});

export default app;
