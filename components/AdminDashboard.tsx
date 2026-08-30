import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle, XCircle, Search, Download, Key, LogOut,
  Smartphone, Plus, MessageSquare, Trash2, Send, Copy, ExternalLink, 
  Sparkles, RefreshCw, Sliders, FileText, Check, Image as ImageIcon,
  MessageCircle
} from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';

const DEFAULT_WA_TEMPLATE = `💍 *¡Estás cordialmente invitado/a a nuestra boda!* ✨
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

🖼️ *Ver invitación digital:*
{IMAGEN}

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
  createdAt: string;
}

interface AllowedGuest {
  id: number;
  phone: string;
  pin: string;
  maxGuests?: number;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

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
  const [newMaxGuests, setNewMaxGuests] = useState('2');
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<{ id: number; name: string; message: string; createdAt: string }[]>([]);
  const [activeView, setActiveView] = useState<'rsvps' | 'allowed' | 'messages'>('rsvps');

  // WhatsApp Template and Sender state
  const [waTemplate, setWaTemplate] = useState(() => localStorage.getItem('sd_wa_template') || DEFAULT_WA_TEMPLATE);
  const [waImageUrl, setWaImageUrl] = useState(() => localStorage.getItem('sd_wa_image_url') || `${window.location.origin}/images/Iglesia_Santa_Barbara.webp`);
  const [autoSendWa, setAutoSendWa] = useState(() => localStorage.getItem('sd_auto_send_wa') !== 'false');
  const [showTemplateSettings, setShowTemplateSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Phone sanitization for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `1${digits}`;
    }
    return digits;
  };

  // Build rendered message
  const buildWhatsAppMessage = (phone: string, pin: string, maxGuests?: number): string => {
    const weddingUrl = `${window.location.origin}/#confirmar`;
    const count = (maxGuests || 2).toString();
    return waTemplate
      .replace(/{TELEFONO}/g, phone)
      .replace(/{PHONE}/g, phone)
      .replace(/{PIN}/g, pin)
      .replace(/{PASES}/g, count)
      .replace(/{INVITADOS}/g, count)
      .replace(/{ENLACE}/g, weddingUrl)
      .replace(/{LINK}/g, weddingUrl)
      .replace(/{IMAGEN}/g, waImageUrl);
  };

  // Send WhatsApp
  const handleSendWhatsApp = (phone: string, pin: string, maxGuests?: number) => {
    const cleanPhone = formatPhoneForWhatsApp(phone);
    const msg = buildWhatsAppMessage(phone, pin, maxGuests);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast(`Abriendo WhatsApp para enviar a ${phone}`, 'success');
  };

  // Copy message text
  const handleCopyMessage = async (phone: string, pin: string, id?: number, maxGuests?: number) => {
    const msg = buildWhatsAppMessage(phone, pin, maxGuests);
    try {
      await navigator.clipboard.writeText(msg);
      if (id !== undefined) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      }
      toast('Mensaje de invitación copiado al portapapeles.', 'success');
    } catch {
      toast('No se pudo copiar automáticamente.', 'error');
    }
  };

  // Generate random PIN
  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewPin(randomPin);
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

  // Save template
  const handleSaveTemplate = () => {
    localStorage.setItem('sd_wa_template', waTemplate);
    localStorage.setItem('sd_wa_image_url', waImageUrl);
    localStorage.setItem('sd_auto_send_wa', autoSendWa ? 'true' : 'false');
    toast('Plantilla de WhatsApp guardada exitosamente.', 'success');
  };

  // Reset template
  const handleResetTemplate = () => {
    if (window.confirm('¿Restablecer la plantilla a los valores por defecto?')) {
      const defaultImg = `${window.location.origin}/images/Iglesia_Santa_Barbara.webp`;
      setWaTemplate(DEFAULT_WA_TEMPLATE);
      setWaImageUrl(defaultImg);
      localStorage.setItem('sd_wa_template', DEFAULT_WA_TEMPLATE);
      localStorage.setItem('sd_wa_image_url', defaultImg);
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
    const guestsAllowed = parseInt(newMaxGuests, 10) || 2;

    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/allowed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ phone: currentPhone, pin: currentPin, maxGuests: guestsAllowed })
      });

      if (res.ok) {
        toast('Invitado autorizado con éxito.', 'success');
        if (autoSendWa) {
          handleSendWhatsApp(currentPhone, currentPin, guestsAllowed);
        }
        setNewPhone('');
        setNewPin('');
        setNewMaxGuests('2');
        fetchAllowedGuests();
      } else {
        toast('Error al registrar invitado.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Error de conexión con el servidor.', 'error');
    }
  };

  const exportGuestsToCSV = () => {
    if (!guests.length) return;

    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Asiste', 'Acompañantes', 'Cédulas', 'Restricciones', 'Mensaje', 'Fecha Registro'];
    const rows = guests.map(g => {
      let parsedCedulas = '';
      try {
        const arr = JSON.parse(g.cedulas);
        parsedCedulas = Array.isArray(arr) ? arr.join(' - ') : g.cedulas;
      } catch {
        parsedCedulas = g.cedulas;
      }

      return [
        g.id,
        `"${g.name.replace(/"/g, '""')}"`,
        g.email,
        g.phone || '',
        g.attending ? 'SÍ' : 'NO',
        g.guestsCount,
        `"${parsedCedulas}"`,
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
    a.phone.includes(searchTerm) || a.pin.includes(searchTerm)
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#fdfaf6] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-stone-200/50 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#f1f4ea] rounded-full flex items-center justify-center mb-4">
              <Key className="text-[#4a5d23]" size={28} />
            </div>
            <h1 className="font-serif text-2xl text-stone-800 font-bold mb-1">Acceso Administrativo</h1>
            <p className="text-stone-500 text-xs italic font-serif">Stephanie & Daniel - Boda 2026</p>
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
            <h1 className="font-serif text-3xl font-bold text-stone-800 md:text-4xl">Panel de Administración</h1>
            <p className="text-stone-500 text-xs italic font-serif mt-1">Stephanie & Daniel · Control de RSVP & Seguridad de Lista</p>
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
        <div className="flex border-b border-stone-200 gap-6">
          <button
            onClick={() => setActiveView('rsvps')}
            className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeView === 'rsvps' ? 'border-[#4a5d23] text-[#4a5d23]' : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            Confirmaciones (RSVP)
          </button>
          <button
            onClick={() => setActiveView('allowed')}
            className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeView === 'allowed' ? 'border-[#4a5d23] text-[#4a5d23]' : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            Lista de Teléfonos (PINs)
          </button>
          <button
            onClick={() => setActiveView('messages')}
            className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeView === 'messages' ? 'border-[#4a5d23] text-[#4a5d23]' : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            Libro de Mensajes ({messages.length})
          </button>
        </div>

        {activeView === 'rsvps' ? (
          <>
            {/* Metrics Grid */}
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Registrados</span>
                    <span className="text-2xl font-serif font-bold">{summary.totalRSVPs}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Asistirán</span>
                    <span className="text-2xl font-serif font-bold">{summary.totalGuests} <span className="text-xs text-stone-400">personas</span></span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="text-stone-500" size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Grupos Sí</span>
                    <span className="text-2xl font-serif font-bold">{summary.accepted}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <XCircle className="text-red-500" size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Grupos No</span>
                    <span className="text-2xl font-serif font-bold">{summary.declined}</span>
                  </div>
                </div>
              </div>
            )}

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
                      <th className="py-4 px-6">Invitado</th>
                      <th className="py-4 px-6 text-center">Asiste</th>
                      <th className="py-4 px-6 text-center">Cantidad</th>
                      <th className="py-4 px-6">Cédulas</th>
                      <th className="py-4 px-6">Restricciones</th>
                      <th className="py-4 px-6">Mensaje</th>
                      <th className="py-4 px-6">Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {filteredGuests.map((g) => {
                      let parsedCedulas = [];
                      try {
                        parsedCedulas = JSON.parse(g.cedulas);
                      } catch {
                        parsedCedulas = g.cedulas ? [g.cedulas] : [];
                      }

                      return (
                        <tr key={g.id} className="hover:bg-stone-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-serif font-bold text-stone-800">{g.name}</p>
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
                          <td className="py-4 px-6 max-w-[200px] truncate">
                            {parsedCedulas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {parsedCedulas.map((c: string, idx: number) => (
                                  <span key={idx} className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[10px] font-mono">{c}</span>
                                ))}
                              </div>
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
                        </tr>
                      );
                    })}
                    {filteredGuests.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-stone-400 italic">No se encontraron invitados.</td>
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
                  <h2 className="font-serif text-lg font-bold text-stone-900">Invitaciones por WhatsApp & PIN</h2>
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
                          <h3 className="font-serif text-lg font-bold text-stone-800 flex items-center gap-2">
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
                            { tag: '{TELEFONO}', label: 'Teléfono' },
                            { tag: '{PIN}', label: 'PIN Exclusivo' },
                            { tag: '{PASES}', label: 'Pases Permitidos' },
                            { tag: '{ENLACE}', label: 'Enlace a la Web' },
                            { tag: '{IMAGEN}', label: 'URL Imagen' },
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

                      {/* Image URL Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                          <span>URL de la Imagen de Invitación</span>
                          <button
                            type="button"
                            onClick={() => setWaImageUrl(`${window.location.origin}/images/Iglesia_Santa_Barbara.webp`)}
                            className="text-[#4a5d23] hover:underline font-sans normal-case text-[10px]"
                          >
                            Usar foto de Santa Bárbara
                          </button>
                        </label>
                        <div className="relative">
                          <ImageIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="url"
                            value={waImageUrl}
                            onChange={(e) => setWaImageUrl(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#4a5d23]"
                            placeholder="https://tudominio.com/images/invitacion.webp"
                          />
                        </div>
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
                          onClick={() => handleSendWhatsApp('8095551234', '1234', 2)}
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
                          {/* Image preview in bubble */}
                          {waImageUrl && (
                            <div className="w-full h-36 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                              <img
                                src={waImageUrl}
                                alt="Vista previa de invitación"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // fallback if url fails
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          <div className="whitespace-pre-wrap font-sans leading-relaxed text-[11px] text-stone-700">
                            {buildWhatsAppMessage('829-923-4460', '8421', 2)}
                          </div>

                          <div className="text-[9px] text-stone-400 text-right font-mono">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                          </div>
                        </div>

                        <p className="mt-3 text-[10px] text-stone-500 text-center italic">
                          Los valores se sustituirán automáticamente por el número, PIN y pases permitidos de cada invitado.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form to add allowed guest */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200/50 shadow-sm h-fit space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f1f4ea] rounded-full flex items-center justify-center">
                    <Smartphone className="text-[#4a5d23]" size={20} />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold">Autorizar Teléfono</h2>
                    <p className="text-xs text-stone-400">Registrar invitado, PIN y pases asignados</p>
                  </div>
                </div>

                <form onSubmit={handleAddAllowedGuest} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="new-phone" className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                      Número de Teléfono
                    </label>
                    <input
                      id="new-phone"
                      type="tel"
                      required
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4a5d23] text-sm"
                      placeholder="Ej: 8299234460 o 8095551234"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                    <p className="text-[10px] text-stone-400">Se usará para WhatsApp y validación en la web.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="new-pin" className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                          PIN Asignado
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateRandomPin}
                          className="text-[9px] font-bold text-[#4a5d23] hover:underline flex items-center gap-0.5"
                        >
                          <Sparkles size={10} /> Random
                        </button>
                      </div>
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

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#4a5d23] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#3b4c1b] transition-all shadow-md active:scale-95"
                  >
                    <Plus size={15} />
                    {autoSendWa ? 'Registrar y Abrir WhatsApp' : 'Registrar en Lista'}
                  </button>
                </form>
              </div>

              {/* Allowed Guests List */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold">Teléfonos Autorizados ({allowedGuests.length})</h3>
                    <p className="text-xs text-stone-400">Lista de invitados con acceso de confirmación y cupos</p>
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                    <input
                      type="text"
                      className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:border-[#4a5d23] text-xs w-full sm:w-56"
                      placeholder="Buscar teléfono o PIN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        <th className="py-4 px-6">Teléfono</th>
                        <th className="py-4 px-4 text-center">PIN</th>
                        <th className="py-4 px-4 text-center">Pases</th>
                        <th className="py-4 px-4 text-center">Estado</th>
                        <th className="py-4 px-6 text-center">Acciones WhatsApp</th>
                        <th className="py-4 px-4 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                      {filteredAllowed.map((a) => (
                        <tr key={a.id} className="hover:bg-stone-50/40 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-stone-800">
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
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              a.used 
                                ? 'bg-stone-100 text-stone-400' 
                                : 'bg-green-50 text-green-700 border border-green-200/50'
                            }`}>
                              {a.used ? 'Confirmado' : 'Activo'}
                            </span>
                            {a.usedAt && (
                              <p className="text-[9px] text-stone-400 font-mono mt-0.5">
                                {new Date(a.usedAt).toLocaleDateString()}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Send WhatsApp Button */}
                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(a.phone, a.pin, a.maxGuests)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                                title={`Enviar invitación por WhatsApp a ${a.phone} (${a.maxGuests || 2} pases)`}
                              >
                                <Send size={11} />
                                WhatsApp
                              </button>

                              {/* Copy text Button */}
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(a.phone, a.pin, a.id, a.maxGuests)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-200 hover:bg-stone-100 text-stone-600 text-[10px] font-medium transition-all active:scale-95"
                                title="Copiar mensaje personalizado"
                              >
                                {copiedId === a.id ? (
                                  <>
                                    <Check size={12} className="text-green-600" />
                                    <span className="text-green-600 font-bold">Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteAllowedGuest(a.id)}
                              className="text-stone-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                              title="Eliminar de autorizados"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredAllowed.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-stone-400 italic">
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
                <h3 className="font-serif text-lg font-bold">Libro de Mensajes</h3>
                <p className="text-xs text-stone-400">Deseos y mensajes que dejaron los invitados</p>
              </div>
            </div>

            <div className="divide-y divide-stone-100">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-4 p-6 hover:bg-stone-50/40 transition-colors">
                  <div>
                    <p className="font-serif italic text-stone-700">"{m.message}"</p>
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
    </div>
  );
};
