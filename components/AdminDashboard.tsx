import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Search, Download, Music, Key, LogOut, Smartphone, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState<{ id: number; song: string; createdAt: string }[]>([]);
  const [messages, setMessages] = useState<{ id: number; name: string; message: string; createdAt: string }[]>([]);
  const [activeView, setActiveView] = useState<'rsvps' | 'allowed' | 'messages'>('rsvps');

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
          fetchSongs();
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

  const fetchSongs = async () => {
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/songs`, {
        headers: { 'x-api-key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (err) {
      console.error('Error fetching songs:', err);
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
    setSongs([]);
    setAllowedGuests([]);
    setMessages([]);
    localStorage.removeItem('sd_admin_key');
    toast('Sesión cerrada.', 'success');
  };

  const handleAddAllowedGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newPin.trim()) return;

    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/allowed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ phone: newPhone.trim(), pin: newPin.trim() })
      });

      if (res.ok) {
        toast('Invitado autorizado con éxito.', 'success');
        setNewPhone('');
        setNewPin('');
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
    a.phone.includes(searchTerm)
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

            {/* Songs Suggestions */}
            <div className="bg-white rounded-3xl border border-stone-200/50 shadow-sm p-6 max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#f1f4ea] rounded-full flex items-center justify-center">
                  <Music className="text-[#4a5d23]" size={20} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold">Playlist Sugerida</h2>
                  <p className="text-xs text-stone-400">Canciones sugeridas por los invitados</p>
                </div>
              </div>

              <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto pr-2">
                {songs.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{s.song}</span>
                    <span className="text-[10px] font-mono text-stone-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {songs.length === 0 && (
                  <p className="text-center py-8 text-stone-400 italic text-sm">No hay canciones sugeridas todavía.</p>
                )}
              </div>
            </div>
          </>
        ) : activeView === 'allowed' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Form to add allowed guest */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/50 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#f1f4ea] rounded-full flex items-center justify-center">
                  <Smartphone className="text-[#4a5d23]" size={20} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold">Autorizar Teléfono</h2>
                  <p className="text-xs text-stone-400">Registrar un número de invitado y su PIN</p>
                </div>
              </div>

              <form onSubmit={handleAddAllowedGuest} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="new-phone" className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Número de Teléfono</label>
                  <input
                    id="new-phone"
                    type="tel"
                    required
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4a5d23] text-sm"
                    placeholder="Ej: 8095551234"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="new-pin" className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">PIN asignado</label>
                  <input
                    id="new-pin"
                    type="text"
                    required
                    maxLength={6}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4a5d23] text-sm font-mono tracking-widest"
                    placeholder="Ej: 1234"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#4a5d23] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#3b4c1b] transition-all"
                >
                  <Plus size={14} /> Registrar en Lista
                </button>
              </form>
            </div>

            {/* Allowed Guests List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200/50 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold">Teléfonos Autorizados</h3>
                  <p className="text-xs text-stone-400">Total de invitados que pueden confirmar</p>
                </div>
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                  <input
                    type="text"
                    className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:border-[#4a5d23] text-xs w-48"
                    placeholder="Buscar teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="py-4 px-6">Número de Teléfono</th>
                      <th className="py-4 px-6 text-center">PIN</th>
                      <th className="py-4 px-6 text-center">Estado del PIN</th>
                      <th className="py-4 px-6">Confirmación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {filteredAllowed.map((a) => (
                      <tr key={a.id} className="hover:bg-stone-50/30 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-stone-800">{a.phone}</td>
                        <td className="py-4 px-6 text-center font-mono tracking-wider">{a.pin}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${a.used ? 'bg-stone-100 text-stone-400' : 'bg-green-50 text-green-700'}`}>
                            {a.used ? 'Desactivado / Usado' : 'Activo'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-stone-400 font-mono">
                          {a.usedAt ? `Usado el: ${new Date(a.usedAt).toLocaleDateString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                    {filteredAllowed.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-stone-400 italic">No hay teléfonos registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
