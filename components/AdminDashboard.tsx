import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckCircle, XCircle, Search, Download, Key, LogOut,
  Smartphone, Plus, MessageSquare, Trash2, Send, Copy, ExternalLink,
  RefreshCw, Sliders, FileText, Check,
  MessageCircle, MoreVertical, Pencil, X, ChevronDown
} from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';

const DEFAULT_WA_TEMPLATE = `👋 {SALUDO}

💍 *¡Estás cordialmente invitado/a a nuestra boda!* ✨
Stephanie & Dalvin 🕊️

🗓 *Fecha:* Sábado, 7 de Noviembre de 2026 - 5:00 PM
⛪ *Ceremonia:* Catedral Castrense de Santa Bárbara
🎉 *Recepción:* Club Deportivo Naco · Salón Montás

Para confirmar tu asistencia, por favor accede a nuestra web oficial utilizando *este mismo número de teléfono* y tu *PIN exclusivo*:

📲 *Teléfono registrado:* {TELEFONO}
🔑 *PIN de acceso:* {PIN}
🎟️ *Pases reservados:* {PASES} persona(s)

🌐 *Confirma tu asistencia en el siguiente enlace:*
{ENLACE}

¡Esperamos contar con tu grata presencia en este día tan especial! ❤️`;

interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  attending: boolean;
  guestsCount: number;
  dietary: string | null;
  message: string | null;
  cedulas: string;
  guestNames?: string | null;
  createdAt: string;
}

interface AllowedGuest {
  id: number;
  phone: string;
  pin: string;
  name?: string | null;
  ceremonyOnly?: boolean;
  maxGuests?: number;
  usedCount?: number;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

const parseList = (raw?: string | null): string[] => {
  if (!raw) return [];
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.filter(Boolean).map(String) : raw ? [raw] : [];
  } catch {
    return raw ? [raw] : [];
  }
};

interface Summary {
  totalRSVPs: number;
  accepted: number;
  declined: number;
  totalGuests: number;
  dietaryRestrictions: { name: string; restriction: string }[];
}

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sd_admin_key') || '');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [allowedGuests, setAllowedGuests] = useState<AllowedGuest[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newName, setNewName] = useState('');
  const [newMaxGuests, setNewMaxGuests] = useState('2');
  const [newCeremonyOnly, setNewCeremonyOnly] = useState(false);
  const [aforo, setAforo] = useState(() => localStorage.getItem('sd_aforo') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<{ id: number; name: string; message: string; createdAt: string }[]>([]);
  const [activeView, setActiveView] = useState<'rsvps' | 'allowed' | 'messages'>('rsvps');

  // WhatsApp Template and Sender state
  const [waTemplate, setWaTemplate] = useState(() => {
    const saved = localStorage.getItem('sd_wa_template');
    if (!saved) return DEFAULT_WA_TEMPLATE;
    // Migración: se eliminó la imagen de invitación → quitar restos de plantillas viejas
    return saved
      .replace(/^.*(\{IMAGEN\}|Ver invitación digital).*$\n?/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  });
  const [autoSendWa, setAutoSendWa] = useState(() => localStorage.getItem('sd_auto_send_wa') !== 'false');
  const [showTemplateSettings, setShowTemplateSettings] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [waMenuOpenId, setWaMenuOpenId] = useState<number | null>(null);
  const [editingGuest, setEditingGuest] = useState<AllowedGuest | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', pin: '', maxGuests: '2', ceremonyOnly: false });
  const [savingEdit, setSavingEdit] = useState(false);

  // Phone sanitization for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `1${digits}`;
    }
    return digits;
  };

  // Enlace personalizado con el saludo (?invitado=Nombre)
  const buildInviteeLink = (name?: string | null, hash = ''): string => {
    const base = window.location.origin + '/';
    const clean = (name || '').trim();
    return clean ? `${base}?invitado=${encodeURIComponent(clean)}${hash}` : `${base}${hash}`;
  };

  // Build rendered message
  const buildWhatsAppMessage = (phone: string, pin: string, maxGuests?: number, name?: string | null, ceremonyOnly?: boolean): string => {
    const clean = (name || '').trim();
    const weddingUrl = buildInviteeLink(clean, '#confirmar');
    const count = (maxGuests || 2).toString();
    const saludo = clean ? `Hola ${clean}` : 'Hola';
    const acceso = ceremonyOnly ? 'Solo ceremonia' : 'Ceremonia y recepción';
    return waTemplate
      .replace(/{SALUDO}/g, saludo)
      .replace(/{NOMBRE}/g, clean)
      .replace(/{INVITADO}/g, clean)
      .replace(/{ACCESO}/g, acceso)
      .replace(/{TELEFONO}/g, phone)
      .replace(/{PHONE}/g, phone)
      .replace(/{PIN}/g, pin)
      .replace(/{PASES}/g, count)
      .replace(/{INVITADOS}/g, count)
      .replace(/{ENLACE}/g, weddingUrl)
      .replace(/{LINK}/g, weddingUrl);
  };

  // Send WhatsApp
  const handleSendWhatsApp = (phone: string, pin: string, maxGuests?: number, name?: string | null, ceremonyOnly?: boolean) => {
    const cleanPhone = formatPhoneForWhatsApp(phone);
    const msg = buildWhatsAppMessage(phone, pin, maxGuests, name, ceremonyOnly);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast(`Abriendo WhatsApp para enviar a ${name ? name : phone}`, 'success');
  };

  // Copy personalized link
  const handleCopyInviteeLink = async (name: string | null | undefined) => {
    try {
      await navigator.clipboard.writeText(buildInviteeLink(name));
      toast(name ? `Enlace de ${name} copiado.` : 'Enlace copiado (sin nombre).', 'success');
    } catch {
      toast('No se pudo copiar el enlace.', 'error');
    }
  };

  // Copy message text
  const handleCopyMessage = async (phone: string, pin: string, maxGuests?: number, name?: string | null, ceremonyOnly?: boolean) => {
    const msg = buildWhatsAppMessage(phone, pin, maxGuests, name, ceremonyOnly);
    try {
      await navigator.clipboard.writeText(msg);
      toast('Mensaje de invitación copiado al portapapeles.', 'success');
    } catch {
      toast('No se pudo copiar automáticamente.', 'error');
    }
  };

  // Delete allowed guest
  const handleDeleteAllowedGuest = async (id: number) => {
    if (!window.confirm('¿Eliminar este número de la lista de autorizados?')) return;
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/allowed/${id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': apiKey }
      });
      if (res.ok) {
        setAllowedGuests(prev => prev.filter(a => a.id !== id));
        toast('Número eliminado de la lista.', 'success');
      } else {
        toast('Error al eliminar número.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Error de conexión con el servidor.', 'error');
    }
  };

  // Eliminar una confirmación (libera cupos)
  const handleDeleteGuest = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la confirmación de "${name}"? Se liberarán sus cupos.`)) return;
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/guests/${id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': apiKey },
      });
      if (res.ok) {
        setGuests((prev) => prev.filter((g) => g.id !== id));
        toast('Confirmación eliminada.', 'success');
        // refrescar métricas y cupos
        fetch(`${API_CONFIG.backendUrl}/api/admin/summary`, { headers: { 'x-api-key': apiKey } })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d && setSummary(d))
          .catch(() => {});
        fetchAllowedGuests();
      } else {
        toast('No se pudo eliminar.', 'error');
      }
    } catch {
      toast('Error de conexión con el servidor.', 'error');
    }
  };

  // Reiniciar cupos usados de un teléfono
  const handleResetAllowedGuest = async (id: number, phone: string) => {
    if (!window.confirm(`¿Reiniciar los cupos usados de ${phone}? Volverá a poder registrar desde cero.`)) return;
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/allowed/${id}/reset`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
      });
      if (res.ok) {
        setAllowedGuests((prev) => prev.map((a) => (a.id === id ? { ...a, usedCount: 0, used: false, usedAt: null } : a)));
        toast('Cupos reiniciados.', 'success');
      } else {
        toast('No se pudo reiniciar.', 'error');
      }
    } catch {
      toast('Error de conexión con el servidor.', 'error');
    }
  };

  // Abrir el modal de edición de un teléfono autorizado
  const openEditGuest = (a: AllowedGuest) => {
    setMenuOpenId(null);
    setEditingGuest(a);
    setEditForm({
      name: a.name || '',
      phone: a.phone,
      pin: a.pin,
      maxGuests: String(a.maxGuests || 2),
      ceremonyOnly: !!a.ceremonyOnly,
    });
  };

  // Guardar cambios de un teléfono autorizado
  const handleSaveEditGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    if (!editForm.phone.trim() || !editForm.pin.trim()) {
      toast('Teléfono y PIN son obligatorios.', 'error');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/allowed/${editingGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          pin: editForm.pin.trim(),
          maxGuests: parseInt(editForm.maxGuests, 10) || 2,
          ceremonyOnly: editForm.ceremonyOnly,
          aforo: parseInt(aforo, 10) || 0,
        }),
      });
      if (res.ok) {
        toast('Invitado actualizado.', 'success');
        setEditingGuest(null);
        fetchAllowedGuests();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'No se pudo actualizar.', 'error');
      }
    } catch {
      toast('Error de conexión con el servidor.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Save template
  const handleSaveTemplate = () => {
    localStorage.setItem('sd_wa_template', waTemplate);
    localStorage.setItem('sd_auto_send_wa', autoSendWa ? 'true' : 'false');
    toast('Plantilla de WhatsApp guardada exitosamente.', 'success');
  };

  // Reset template
  const handleResetTemplate = () => {
    if (window.confirm('¿Restablecer la plantilla a los valores por defecto?')) {
      setWaTemplate(DEFAULT_WA_TEMPLATE);
      localStorage.setItem('sd_wa_template', DEFAULT_WA_TEMPLATE);
      toast('Plantilla restablecida por defecto.', 'success');
    }
  };

  // Check authorization on mount or when key changes
  useEffect(() => {
    if (!apiKey) return;

    const verifyKey = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/summary`, {
          headers: { 'x-api-key': apiKey }
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
          setIsAuthorized(true);
          localStorage.setItem('sd_admin_key', apiKey);
          fetchGuests();
          fetchAllowedGuests();
          fetchMessages();
        } else {
          setApiKey('');
          localStorage.removeItem('sd_admin_key');
          toast('Clave incorrecta o no autorizada.', 'error');
        }
      } catch (err) {
        console.error(err);
        toast('Error al conectar con el servidor.', 'error');
      } finally {
        setLoading(false);
      }
    };

    verifyKey();
  }, [apiKey]);

  const fetchGuests = async () => {
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/guests`, {
        headers: { 'x-api-key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setGuests(data);
      }
    } catch (err) {
      console.error('Error fetching guests:', err);
    }
  };

  const fetchAllowedGuests = async () => {
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/allowed`, {
        headers: { 'x-api-key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setAllowedGuests(data);
      }
    } catch (err) {
      console.error('Error fetching allowed guests:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/messages`, {
        headers: { 'x-api-key': apiKey }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const deleteMessage = async (msgId: number) => {
    if (!window.confirm('¿Eliminar este mensaje del libro?')) return;
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'x-api-key': apiKey }
      });
      if (res.ok) {
        setMessages((m) => m.filter((x) => x.id !== msgId));
        toast('Mensaje eliminado.', 'success');
      } else {
        toast('No se pudo eliminar el mensaje.', 'error');
      }
    } catch {
      toast('Error de conexión con el servidor.', 'error');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setApiKey(apiKeyInput.trim());
  };

  const handleLogout = () => {
    setApiKey('');
    setIsAuthorized(false);
    setSummary(null);
    setGuests([]);
    setAllowedGuests([]);
    setMessages([]);
    localStorage.removeItem('sd_admin_key');
    toast('Sesión cerrada.', 'success');
  };

  const handleAddAllowedGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newPin.trim()) return;

    const currentPhone = newPhone.trim();
    const currentPin = newPin.trim();
    const currentName = newName.trim();
    const guestsAllowed = parseInt(newMaxGuests, 10) || 2;
    const aforoNum = parseInt(aforo, 10) || 0;

    // Guardrail de aforo (también se valida en el backend)
    if (aforoNum > 0) {
      const otros = allowedGuests
        .filter((a) => a.phone !== currentPhone)
        .reduce((s, a) => s + (a.maxGuests || 2), 0);
      if (otros + guestsAllowed > aforoNum) {
        toast(
          `Se excede el aforo (${aforoNum}). Ya hay ${otros} pases asignados a otros números — disponibles: ${Math.max(0, aforoNum - otros)}.`,
          'error',
        );
        return;
      }
    }

    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/allowed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ phone: currentPhone, pin: currentPin, name: currentName, maxGuests: guestsAllowed, ceremonyOnly: newCeremonyOnly, aforo: aforoNum })
      });

      if (res.ok) {
        toast('Invitado autorizado con éxito.', 'success');
        if (autoSendWa) {
          handleSendWhatsApp(currentPhone, currentPin, guestsAllowed, currentName, newCeremonyOnly);
        }
        setNewPhone('');
        setNewPin('');
        setNewName('');
        setNewMaxGuests('2');
        setNewCeremonyOnly(false);
        fetchAllowedGuests();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Error al registrar invitado.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Error de conexión con el servidor.', 'error');
    }
  };

  const exportGuestsToCSV = () => {
    if (!guests.length) return;

    const headers = ['ID', 'Contacto', 'Email', 'Teléfono', 'Asiste', 'Cantidad', 'Invitados (nombre)', 'Cédulas', 'Restricciones', 'Mensaje', 'Fecha Registro'];
    const rows = guests.map(g => {
      const cedulas = parseList(g.cedulas).join(' | ');
      const names = parseList(g.guestNames).join(' | ');
      return [
        g.id,
        `"${g.name.replace(/"/g, '""')}"`,
        g.email,
        g.phone || '',
        g.attending ? 'SÍ' : 'NO',
        g.guestsCount,
        `"${names}"`,
        `"${cedulas}"`,
        g.dietary ? `"${g.dietary.replace(/"/g, '""')}"` : 'Ninguna',
        g.message ? `"${g.message.replace(/"/g, '""')}"` : '',
        new Date(g.createdAt).toLocaleDateString()
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'invitados_boda.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.phone && g.phone.includes(searchTerm))
  );

  const filteredAllowed = allowedGuests.filter(a =>
    a.phone.includes(searchTerm) ||
    a.pin.includes(searchTerm) ||
    (a.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#fdfaf6] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-stone-200/50 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#f1f4ea] rounded-full flex items-center justify-center mb-4">
              <Key className="text-[#4a5d23]" size={28} />
            </div>
            <h1 className="text-2xl text-stone-800 font-bold mb-1">Acceso Administrativo</h1>
            <p className="text-stone-500 text-xs italic">Stephanie & Dalvin - Boda 2026</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-key" className="text-[10px] font-bold text-stone-600 ml-1 uppercase tracking-wider">Clave de Acceso</label>
              <input
                id="admin-key"
                type="password"
                required
                className="w-full px-4 py-3.5 border border-stone-200 bg-[#fdfaf6] rounded-xl focus:outline-none focus:border-[#4a5d23] focus:bg-white transition-all text-sm text-stone-700"
                placeholder="Ingresa la API Key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[#4a5d23] hover:bg-[#3b4c1b] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acceder al Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] py-12 px-6 lg:px-16 text-stone-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 md:text-4xl">Panel de Administración</h1>
            <p className="text-stone-500 text-xs italic mt-1">Stephanie & Dalvin · Control de RSVP & Seguridad de Lista</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={exportGuestsToCSV}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-stone-200 bg-white text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition-colors shadow-sm"
            >
              <Download size={14} className="text-[#b35a44]" /> Exportar CSV
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-stone-100 text-xs font-bold uppercase tracking-wider hover:bg-stone-200 transition-colors shadow-sm text-stone-600"
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-1.5 border border-stone-200/60 shadow-sm w-fit">
          {([
            ['rsvps', `Confirmaciones${summary ? ` (${summary.totalRSVPs})` : ''}`],
            ['allowed', `Invitados Autorizados (${allowedGuests.length})`],
            ['messages', `Mensajes (${messages.length})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeView === key ? 'bg-[#4a5d23] text-white shadow' : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeView === 'rsvps' ? (
          <>
            {/* Metrics Grid */}
            {summary && (() => {
              const cuposTotal = allowedGuests.reduce((s, a) => s + (a.maxGuests || 2), 0);
              const cuposUsados = allowedGuests.reduce((s, a) => s + (a.usedCount || 0), 0);
              const cards = [
                { icon: <Users size={22} className="text-blue-500" />, bg: 'bg-blue-50', label: 'Confirmaciones', value: summary.totalRSVPs },
                { icon: <CheckCircle size={22} className="text-green-600" />, bg: 'bg-green-50', label: 'Asistirán', value: <>{summary.totalGuests}<span className="text-xs font-sans text-stone-400"> personas</span></> },
                { icon: <XCircle size={22} className="text-red-500" />, bg: 'bg-red-50', label: 'Declinaron', value: summary.declined },
                { icon: <Smartphone size={22} className="text-[#4a5d23]" />, bg: 'bg-[#f1f4ea]', label: 'Teléfonos', value: allowedGuests.length },
                { icon: <CheckCircle size={22} className="text-amber-600" />, bg: 'bg-amber-50', label: 'Cupos usados', value: <>{cuposUsados}<span className="text-xs font-sans text-stone-400"> / {cuposTotal}</span></> },
              ];
              return (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                  {cards.map((c) => (
                    <div key={c.label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${c.bg}`}>{c.icon}</div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">{c.label}</span>
                        <span className="text-2xl font-bold text-stone-800">{c.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-full focus:outline-none focus:border-[#4a5d23] text-sm"
                placeholder="Buscar por nombre, correo o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Guests Table */}
            <div className="bg-white rounded-3xl border border-stone-200/50 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="py-4 px-6">Contacto</th>
                      <th className="py-4 px-6 text-center">Asiste</th>
                      <th className="py-4 px-6 text-center">Cant.</th>
                      <th className="py-4 px-6">Invitados (cédula)</th>
                      <th className="py-4 px-6">Restricciones</th>
                      <th className="py-4 px-6">Mensaje</th>
                      <th className="py-4 px-6">Registro</th>
                      <th className="py-4 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {filteredGuests.map((g) => {
                      const parsedCedulas = parseList(g.cedulas);
                      const parsedNames = parseList(g.guestNames);

                      return (
                        <tr key={g.id} className="hover:bg-stone-50/30 transition-colors align-top">
                          <td className="py-4 px-6">
                            <p className="font-bold text-stone-800">{g.name}</p>
                            <p className="text-xs text-stone-400">{g.email}</p>
                            {g.phone && <p className="text-[10px] font-mono text-stone-400 mt-0.5">{g.phone}</p>}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${g.attending ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {g.attending ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-stone-700">
                            {g.attending ? g.guestsCount : '-'}
                          </td>
                          <td className="py-4 px-6">
                            {parsedCedulas.length > 0 ? (
                              <ul className="space-y-1.5">
                                {parsedCedulas.map((c: string, idx: number) => (
                                  <li key={idx} className="leading-tight">
                                    <span className="block text-xs font-semibold text-stone-700">
                                      {parsedNames[idx] || <span className="italic text-stone-400">Nombre no disponible</span>}
                                    </span>
                                    <span className="text-[10px] font-mono text-stone-400">{c}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : '-'}
                          </td>
                          <td className="py-4 px-6 text-xs text-stone-600 italic">
                            {g.dietary || '-'}
                          </td>
                          <td className="py-4 px-6 text-xs text-stone-600 max-w-[200px] truncate" title={g.message || ''}>
                            {g.message || '-'}
                          </td>
                          <td className="py-4 px-6 text-xs text-stone-400 font-mono">
                            {new Date(g.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteGuest(g.id, g.name)}
                              className="text-stone-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                              title="Eliminar esta confirmación"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredGuests.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-stone-400 italic">No se encontraron invitados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeView === 'allowed' ? (
          <div className="space-y-8">
            {/* Top Toolbar / Template Toggle */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Invitaciones por WhatsApp & PIN</h2>
                  <p className="text-xs text-stone-400">Control de números autorizados y plantilla de envío personalizado</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoSendWa}
                    onChange={(e) => {
                      setAutoSendWa(e.target.checked);
                      localStorage.setItem('sd_auto_send_wa', e.target.checked ? 'true' : 'false');
                    }}
                    className="accent-[#4a5d23] rounded"
                  />
                  <span>Enviar por WhatsApp al registrar</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowTemplateSettings(!showTemplateSettings)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    showTemplateSettings 
                      ? 'bg-[#4a5d23] text-white shadow-md' 
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Sliders size={14} />
                  {showTemplateSettings ? 'Ocultar Plantilla' : 'Editar Plantilla WhatsApp'}
                </button>
              </div>
            </div>

            {/* Aforo del evento */}
            {(() => {
              const asignados = allowedGuests.reduce((s, a) => s + (a.maxGuests || 2), 0);
              const aforoNum = parseInt(aforo, 10) || 0;
              const disp = aforoNum > 0 ? aforoNum - asignados : null;
              return (
                <div className="bg-white p-5 rounded-3xl border border-stone-200/50 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <label htmlFor="aforo" className="text-xs font-bold uppercase tracking-wider text-stone-500">Aforo total del evento</label>
                    <input
                      id="aforo"
                      type="number"
                      min={0}
                      value={aforo}
                      onChange={(e) => {
                        setAforo(e.target.value);
                        localStorage.setItem('sd_aforo', e.target.value);
                      }}
                      placeholder="Ej: 150"
                      className="w-24 px-3 py-2 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#4a5d23]"
                    />
                  </div>
                  <div className="flex-grow flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                    <span className="text-stone-500">Pases asignados: <strong className="text-stone-800">{asignados}</strong></span>
                    {aforoNum > 0 && (
                      <span className={disp! < 0 ? 'text-red-600 font-bold' : 'text-[#4a5d23]'}>
                        {disp! < 0 ? `¡Excede el aforo por ${-disp!}!` : `Disponibles: ${disp}`}
                      </span>
                    )}
                  </div>
                  {aforoNum > 0 && (
                    <div className="w-full sm:w-40 h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${asignados > aforoNum ? 'bg-red-400' : 'bg-[#4a5d23]'}`}
                        style={{ width: `${Math.min(100, (asignados / aforoNum) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Collapsible / Editable Template Editor */}
            <AnimatePresence>
              {showTemplateSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-emerald-100 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Template Inputs */}
                    <div className="lg:col-span-7 space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                            <FileText size={18} className="text-[#4a5d23]" />
                            Plantilla del Mensaje de WhatsApp
                          </h3>
                          <p className="text-xs text-stone-500">
                            Personaliza el mensaje que recibirán tus invitados con su PIN y enlace oficial.
                          </p>
                        </div>
                      </div>

                      {/* Variables Tags */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Etiquetas dinámicas (haz clic para insertar):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { tag: '{SALUDO}', label: 'Hola + Nombre' },
                            { tag: '{NOMBRE}', label: 'Nombre del Invitado' },
                            { tag: '{ACCESO}', label: 'Solo ceremonia / Ceremonia y recepción' },
                            { tag: '{TELEFONO}', label: 'Teléfono' },
                            { tag: '{PIN}', label: 'PIN Exclusivo' },
                            { tag: '{PASES}', label: 'Pases Permitidos' },
                            { tag: '{ENLACE}', label: 'Enlace personalizado' },
                          ].map((item) => (
                            <button
                              key={item.tag}
                              type="button"
                              onClick={() => setWaTemplate((prev) => prev + ` ${item.tag} `)}
                              className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 px-2.5 py-1 rounded-lg transition-all"
                            >
                              + {item.tag} <span className="text-emerald-600/70 font-sans font-normal">({item.label})</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Template Textarea */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          Contenido del Mensaje
                        </label>
                        <textarea
                          rows={10}
                          value={waTemplate}
                          onChange={(e) => setWaTemplate(e.target.value)}
                          className="w-full px-4 py-3 border border-stone-200 rounded-2xl text-xs md:text-sm font-mono leading-relaxed focus:outline-none focus:border-[#4a5d23] bg-stone-50/50"
                          placeholder="Escribe la plantilla de invitación..."
                        />
                      </div>

                      {/* Template Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveTemplate}
                          className="px-5 py-2.5 bg-[#4a5d23] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#3b4c1b] transition-all shadow-sm flex items-center gap-2"
                        >
                          <Check size={14} /> Guardar Cambios
                        </button>
                        <button
                          type="button"
                          onClick={handleResetTemplate}
                          className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw size={13} /> Restablecer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp('8095551234', '1234', 2, newName.trim() || 'Familia Pérez', newCeremonyOnly)}
                          className="px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                        >
                          <Send size={13} /> Probar Mensaje en WhatsApp
                        </button>
                      </div>
                    </div>

                    {/* Right: Live WhatsApp Bubble Preview */}
                    <div className="lg:col-span-5 flex flex-col">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                          <MessageCircle size={13} className="text-emerald-600" />
                          Vista Previa (WhatsApp)
                        </span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Ejemplo en vivo
                        </span>
                      </div>

                      <div className="flex-grow bg-[#efeae2] p-4 md:p-5 rounded-2xl border border-[#d1c7b7] flex flex-col justify-start relative shadow-inner overflow-hidden">
                        {/* WhatsApp Message Bubble */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-full text-xs text-stone-800 space-y-3 relative">
                          <div className="whitespace-pre-wrap font-sans leading-relaxed text-[11px] text-stone-700">
                            {buildWhatsAppMessage('829-923-4460', '8421', 2, newName.trim() || 'Familia Pérez', newCeremonyOnly)}
                          </div>

                          <div className="text-[9px] text-stone-400 text-right font-mono">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                          </div>
                        </div>

                        <p className="mt-3 text-[10px] text-stone-500 text-center italic">
                          Los valores se sustituirán automáticamente por el nombre, número, PIN, pases y enlace personalizado de cada invitado.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-8">
              {/* Form to add allowed guest */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/50 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f1f4ea] rounded-full flex items-center justify-center">
                    <Smartphone className="text-[#4a5d23]" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Autorizar invitados</h2>
                    <p className="text-xs text-stone-400">Registrar invitado, teléfono, PIN y pases asignados</p>
                  </div>
                </div>

                <form onSubmit={handleAddAllowedGuest} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                      <label htmlFor="new-name" className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                        Nombre del Invitado
                      </label>
                      <input
                        id="new-name"
                        type="text"
                        maxLength={60}
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4a5d23] text-sm"
                        placeholder="Ej: Familia Pérez / Juan y María"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <p className="text-[10px] text-stone-400">Saludo personalizado y enlace <span className="font-mono">?invitado=</span>.</p>
                    </div>

                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                      <label htmlFor="new-phone" className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                        Número de Teléfono
                      </label>
                      <input
                        id="new-phone"
                        type="tel"
                        required
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4a5d23] text-sm"
                        placeholder="Ej: 8299234460"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                      />
                      <p className="text-[10px] text-stone-400">Para WhatsApp y validación en la web.</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="new-pin" className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                        PIN Asignado
                      </label>
                      <input
                        id="new-pin"
                        type="text"
                        required
                        maxLength={6}
                        className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4a5d23] text-sm font-mono tracking-widest text-center"
                        placeholder="Ej: 4819"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="new-max-guests" className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                        Pases Asignados
                      </label>
                      <select
                        id="new-max-guests"
                        value={newMaxGuests}
                        onChange={(e) => setNewMaxGuests(e.target.value)}
                        className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4a5d23] text-xs font-semibold bg-white"
                      >
                        <option value="1">1 Pase</option>
                        <option value="2">2 Pases (Pareja)</option>
                        <option value="3">3 Pases</option>
                        <option value="4">4 Pases (Familia)</option>
                        <option value="5">5 Pases</option>
                        <option value="6">6 Pases</option>
                        <option value="8">8 Pases</option>
                        <option value="10">10 Pases</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex flex-1 items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCeremonyOnly}
                        onChange={(e) => setNewCeremonyOnly(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a5d23]"
                      />
                      <span className="text-[11px] leading-snug text-stone-600">
                        <span className="font-bold text-stone-700">Solo ceremonia</span> — este invitado no está invitado a la recepción.
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 py-3 px-8 bg-[#4a5d23] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#3b4c1b] transition-all shadow-md active:scale-95 sm:self-stretch"
                    >
                      <Plus size={15} />
                      {autoSendWa ? 'Registrar y Abrir WhatsApp' : 'Registrar en Lista'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Allowed Guests List */}
              <div className="bg-white rounded-3xl border border-stone-200/50 shadow-sm">
                <div className="p-6 border-b border-stone-100 rounded-t-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">Invitados Autorizados ({allowedGuests.length})</h3>
                    <p className="text-xs text-stone-400">Lista de invitados con acceso de confirmación y cupos</p>
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                    <input
                      type="text"
                      className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:border-[#4a5d23] text-xs w-full sm:w-56"
                      placeholder="Buscar nombre, teléfono o PIN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto lg:overflow-x-visible [&_tr:last-child_td:first-child]:rounded-bl-[22px] [&_tr:last-child_td:last-child]:rounded-br-[22px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        <th className="py-4 px-6">Invitado</th>
                        <th className="py-4 px-4">Teléfono</th>
                        <th className="py-4 px-4 text-center">PIN</th>
                        <th className="py-4 px-4 text-center">Pases</th>
                        <th className="py-4 px-4 text-center">Registrados</th>
                        <th className="py-4 px-6 text-center">WhatsApp</th>
                        <th className="py-4 px-4 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                      {filteredAllowed.map((a) => (
                        <tr key={a.id} className="hover:bg-stone-50/40 transition-colors">
                          <td className="py-4 px-6">
                            {a.name ? (
                              <span className="font-semibold text-stone-800">{a.name}</span>
                            ) : (
                              <span className="text-[11px] italic text-stone-300">Sin nombre</span>
                            )}
                            {a.ceremonyOnly && (
                              <span className="mt-1 block w-fit rounded-full bg-[#b35a44]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#b35a44]">
                                Solo ceremonia
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-stone-800">
                            {a.phone}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold tracking-widest text-[#4a5d23]">
                            {a.pin}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 font-sans">
                              {a.maxGuests || 2} { (a.maxGuests || 2) === 1 ? 'pase' : 'pases' }
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {(() => {
                              const max = a.maxGuests || 2;
                              const used = a.usedCount || 0;
                              const full = used >= max;
                              return (
                                <div className="mx-auto w-24">
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className={full ? 'text-stone-400' : 'text-[#4a5d23]'}>{used}/{max}</span>
                                    {full && <span className="text-[8px] uppercase text-stone-400">Completo</span>}
                                  </div>
                                  <div className="mt-1 h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${full ? 'bg-stone-300' : 'bg-[#4a5d23]'}`}
                                      style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="relative flex justify-center">
                              <button
                                type="button"
                                onClick={() => setWaMenuOpenId((prev) => (prev === a.id ? null : a.id))}
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
                                aria-haspopup="menu"
                                aria-expanded={waMenuOpenId === a.id}
                              >
                                <Send size={11} />
                                WhatsApp
                                <ChevronDown size={12} className={`transition-transform ${waMenuOpenId === a.id ? 'rotate-180' : ''}`} />
                              </button>

                              {waMenuOpenId === a.id && (
                                <>
                                  <button
                                    type="button"
                                    aria-label="Cerrar menú"
                                    className="fixed inset-0 z-30 cursor-default"
                                    onClick={() => setWaMenuOpenId(null)}
                                  />
                                  <div
                                    role="menu"
                                    className="absolute left-1/2 top-9 z-40 w-52 -translate-x-1/2 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 text-left shadow-lg"
                                  >
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => { setWaMenuOpenId(null); handleSendWhatsApp(a.phone, a.pin, a.maxGuests, a.name, a.ceremonyOnly); }}
                                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                    >
                                      <Send size={13} className="text-emerald-600" /> Enviar por WhatsApp
                                    </button>
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => { setWaMenuOpenId(null); handleCopyMessage(a.phone, a.pin, a.maxGuests, a.name, a.ceremonyOnly); }}
                                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                    >
                                      <Copy size={13} className="text-stone-400" /> Copiar mensaje
                                    </button>
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => { setWaMenuOpenId(null); handleCopyInviteeLink(a.name); }}
                                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                    >
                                      <ExternalLink size={13} className="text-stone-400" /> Copiar enlace
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="relative flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setMenuOpenId((prev) => (prev === a.id ? null : a.id))}
                                className={`p-1.5 rounded-full transition-colors ${menuOpenId === a.id ? 'bg-stone-100 text-stone-700' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}
                                title="Acciones"
                                aria-haspopup="menu"
                                aria-expanded={menuOpenId === a.id}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {menuOpenId === a.id && (
                                <>
                                  <button
                                    type="button"
                                    aria-label="Cerrar menú"
                                    className="fixed inset-0 z-30 cursor-default"
                                    onClick={() => setMenuOpenId(null)}
                                  />
                                  <div
                                    role="menu"
                                    className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 text-left shadow-lg"
                                  >
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => openEditGuest(a)}
                                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                    >
                                      <Pencil size={13} className="text-stone-400" /> Editar datos
                                    </button>
                                    <button
                                      type="button"
                                      role="menuitem"
                                      disabled={(a.usedCount || 0) === 0}
                                      onClick={() => { setMenuOpenId(null); handleResetAllowedGuest(a.id, a.phone); }}
                                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
                                    >
                                      <RefreshCw size={13} className="text-stone-400" /> Reiniciar cupos
                                    </button>
                                    <div className="my-1 border-t border-stone-100" />
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => { setMenuOpenId(null); handleDeleteAllowedGuest(a.id); }}
                                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 size={13} /> Eliminar
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredAllowed.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-stone-400 italic">
                            No se encontraron teléfonos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f1f4ea] rounded-full flex items-center justify-center">
                <MessageSquare className="text-[#4a5d23]" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Libro de Mensajes</h3>
                <p className="text-xs text-stone-400">Deseos y mensajes que dejaron los invitados</p>
              </div>
            </div>

            <div className="divide-y divide-stone-100">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-4 p-6 hover:bg-stone-50/40 transition-colors">
                  <div>
                    <p className="italic text-stone-700">"{m.message}"</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#4a5d23]">
                      {m.name}
                      <span className="ml-3 font-normal text-stone-400 normal-case tracking-normal">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className="flex-shrink-0 rounded-full p-2 text-stone-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label="Eliminar mensaje"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center py-12 text-stone-400 italic text-sm">Todavía no hay mensajes en el libro.</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal: editar teléfono autorizado */}
      <AnimatePresence>
        {editingGuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={() => !savingEdit && setEditingGuest(null)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSaveEditGuest}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl md:p-8"
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-800">Editar invitado</h3>
                  <p className="text-xs text-stone-400">
                    {editingGuest.usedCount ? `${editingGuest.usedCount} ya registrado(s)` : 'Sin registros aún'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !savingEdit && setEditingGuest(null)}
                  className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="edit-name" className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    Nombre del Invitado
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    maxLength={60}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-[#4a5d23] focus:outline-none"
                    placeholder="Ej: Familia Pérez"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-phone" className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    Número de Teléfono
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    required
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-[#4a5d23] focus:outline-none"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="edit-pin" className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                      PIN
                    </label>
                    <input
                      id="edit-pin"
                      type="text"
                      required
                      maxLength={6}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-center font-mono text-sm tracking-widest focus:border-[#4a5d23] focus:outline-none"
                      value={editForm.pin}
                      onChange={(e) => setEditForm((f) => ({ ...f, pin: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="edit-max" className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                      Pases Asignados
                    </label>
                    <select
                      id="edit-max"
                      value={editForm.maxGuests}
                      onChange={(e) => setEditForm((f) => ({ ...f, maxGuests: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-semibold focus:border-[#4a5d23] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'Pase' : 'Pases'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.ceremonyOnly}
                    onChange={(e) => setEditForm((f) => ({ ...f, ceremonyOnly: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a5d23]"
                  />
                  <span className="text-[11px] leading-snug text-stone-600">
                    <span className="font-bold text-stone-700">Solo ceremonia</span> — no está invitado a la recepción.
                  </span>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  disabled={savingEdit}
                  className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#4a5d23] py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3b4c1b] disabled:opacity-50"
                >
                  <Check size={14} /> {savingEdit ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
