import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Users, Plus, RefreshCw, X, Wand2, Tag, Save, Trash2 } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';

interface Person {
  key: string;
  name: string;
  party: string;
  rsvpId: number;
  tag?: string | null;
}
type Seat = { table: number; seat: number | null };
type Assignments = Record<string, Seat>;

const LS_SIZE = 'sd_seat_table_size';
const LS_COUNT = 'sd_seat_table_count';

const PARTY_COLORS = [
  '#4a5d23', '#b35a44', '#2f6f6f', '#7a5195', '#bc5090',
  '#ff764a', '#3d6b35', '#8a6d3b', '#4c6ef5', '#c9971f',
];
const partyColor = (party: string) => {
  let h = 0;
  for (let i = 0; i < party.length; i++) h = (h * 31 + party.charCodeAt(i)) >>> 0;
  return PARTY_COLORS[h % PARTY_COLORS.length];
};
const firstName = (name: string) => name.split(/\s+/).filter(Boolean)[0] || name;

export const SeatingChart: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [tableLabels, setTableLabels] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null); // 'pool' | 't{n}' | 't{n}s{i}'
  const [editingLabel, setEditingLabel] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  const [tableSize, setTableSize] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_SIZE) || '', 10);
    return v > 0 ? v : 8;
  });
  const [tableCount, setTableCount] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_COUNT) || '', 10);
    return v > 0 ? v : 1;
  });

  useEffect(() => localStorage.setItem(LS_SIZE, String(tableSize)), [tableSize]);
  useEffect(() => localStorage.setItem(LS_COUNT, String(tableCount)), [tableCount]);

  const load = useCallback(async (force = false) => {
    if (!force && dirty && !window.confirm('Tienes cambios sin guardar. ¿Recargar y descartarlos?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/seating`, { headers: { 'x-api-key': apiKey } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPeople(data.people || []);
      const norm: Assignments = {};
      Object.entries<any>(data.assignments || {}).forEach(([k, v]) => {
        norm[k] = typeof v === 'object' ? { table: v.table, seat: v.seat ?? null } : { table: v, seat: null };
      });
      setAssignments(norm);
      setTableLabels(
        Object.fromEntries(Object.entries(data.tables || {}).map(([k, v]) => [Number(k), v as string])),
      );
      setDirty(false);
      setTableCount((prev) => {
        const maxT = Math.max(0, ...Object.values(norm).map((s) => s.table));
        const maxLabeled = Math.max(0, ...Object.keys(data.tables || {}).map(Number));
        const needed = Math.max(1, Math.ceil((data.people?.length || 0) / (tableSize || 8)));
        return Math.max(prev, maxT, maxLabeled, needed);
      });
    } catch {
      toast('No se pudo cargar la organización de mesas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiKey, tableSize, toast, dirty]);

  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load(true);
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/seating/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ assignments, tables: tableLabels }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      toast('Distribución de mesas guardada.', 'success');
    } catch {
      toast('No se pudo guardar. Revisa la conexión e intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Mapa visual de asientos de una mesa (respeta el asiento fijo; rellena huecos con los demás).
  const seatMapOf = useCallback(
    (tableN: number, a: Assignments = assignments) => {
      const seated = people.filter((p) => a[p.key]?.table === tableN);
      const slots = Math.max(
        tableSize,
        seated.length,
        ...seated.map((p) => (a[p.key]?.seat ?? -1) + 1),
        1,
      );
      const map: (Person | null)[] = Array(slots).fill(null);
      const placed = new Set<string>();
      seated.forEach((p) => {
        const s = a[p.key]?.seat;
        if (s != null && s >= 0 && s < slots && !map[s]) {
          map[s] = p;
          placed.add(p.key);
        }
      });
      let c = 0;
      seated.forEach((p) => {
        if (placed.has(p.key)) return;
        while (c < map.length && map[c]) c++;
        if (c < map.length) map[c] = p;
        else map.push(p);
      });
      return map;
    },
    [people, assignments, tableSize],
  );

  const nextFreeSeat = (tableN: number, exclude?: string) => {
    const a = { ...assignments };
    if (exclude) delete a[exclude];
    const map = seatMapOf(tableN, a);
    const i = map.findIndex((x) => !x);
    return i === -1 ? map.length : i;
  };

  // --- mutaciones locales (se persisten al Guardar) ---
  const toPool = (key: string) => {
    setSelected(null);
    setAssignments((a) => {
      if (!a[key]) return a;
      const next = { ...a };
      delete next[key];
      return next;
    });
    setDirty(true);
  };

  const placeAt = (key: string, table: number, seat: number) => {
    const occupant = seatMapOf(table)[seat];
    setAssignments((a) => {
      const next = { ...a };
      const from = next[key];
      if (occupant && occupant.key !== key) {
        if (from) next[occupant.key] = { table: from.table, seat: from.seat };
        else delete next[occupant.key];
      }
      next[key] = { table, seat };
      return next;
    });
    setSelected(null);
    setDirty(true);
  };

  const toTable = (key: string, table: number) => placeAt(key, table, nextFreeSeat(table, key));

  const setLabel = (n: number, label: string) => {
    setEditingLabel(null);
    const clean = label.trim();
    setTableLabels((m) => {
      if ((m[n] || '') === clean) return m;
      const next = { ...m };
      if (clean) next[n] = clean;
      else delete next[n];
      return next;
    });
    setDirty(true);
  };

  const addTable = () => setTableCount((c) => c + 1);

  const deleteTable = (n: number, seatedCount: number) => {
    if (seatedCount > 0 && !window.confirm(`La Mesa ${n} tiene ${seatedCount} invitado(s). Se moverán a "Sin asignar".`)) return;
    setAssignments((a) => {
      const next: Assignments = {};
      for (const [k, s] of Object.entries(a)) {
        if (s.table === n) continue;
        next[k] = { table: s.table > n ? s.table - 1 : s.table, seat: s.seat };
      }
      return next;
    });
    setTableLabels((m) => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(m)) {
        const num = Number(k);
        if (num === n) continue;
        next[num > n ? num - 1 : num] = v;
      }
      return next;
    });
    setTableCount((c) => Math.max(1, c - 1));
    setDirty(true);
  };

  const autoAssign = async () => {
    if (dirty && !window.confirm('Tienes cambios sin guardar que se perderán. ¿Continuar?')) return;
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/seating/autoassign`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast(data.assigned ? `${data.assigned} invitado(s) sentados por etiqueta.` : 'Nadie por asignar por etiqueta.', 'success');
      load(true);
    } catch {
      toast('No se pudo auto-asignar.', 'error');
    }
  };

  const effectiveCount = useMemo(() => {
    const maxT = Math.max(0, ...Object.values(assignments).map((s) => s.table));
    const maxLabeled = Math.max(0, ...Object.keys(tableLabels).map(Number));
    return Math.max(tableCount || 1, maxT, maxLabeled);
  }, [tableCount, assignments, tableLabels]);

  const unassigned = useMemo(
    () => people.filter((p) => !assignments[p.key]),
    [people, assignments],
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? unassigned.filter((p) => p.name.toLowerCase().includes(q) || p.party.toLowerCase().includes(q))
      : unassigned;
    const groups: { party: string; items: Person[] }[] = [];
    for (const p of list) {
      const g = groups.find((x) => x.party === p.party);
      if (g) g.items.push(p);
      else groups.push({ party: p.party, items: [p] });
    }
    return groups;
  }, [unassigned, search]);

  const totals = {
    total: people.length,
    assigned: people.length - unassigned.length,
    unassigned: unassigned.length,
  };
  const selectedPerson = selected ? people.find((p) => p.key === selected) : null;

  // --- drag helpers ---
  const startDrag = (key: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
    setDragKey(key);
    setSelected(null);
    document.body.classList.add('select-none');
  };
  const endDrag = () => {
    setDragKey(null);
    setDragOver(null);
    document.body.classList.remove('select-none');
  };
  const over = (id: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(id); },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === id ? null : d));
    },
  });

  const Chip: React.FC<{ p: Person; onPick: () => void; compact?: boolean }> = ({ p, onPick, compact }) => {
    const isSel = selected === p.key;
    return (
      <div
        role="button"
        tabIndex={0}
        draggable
        onDragStart={startDrag(p.key)}
        onDragEnd={endDrag}
        onClick={(e) => { e.stopPropagation(); onPick(); }}
        title={`${p.name} · ${p.party}${p.tag ? ` · ${p.tag}` : ''}`}
        className={`flex cursor-grab items-center gap-1 rounded-full border bg-white py-1 text-[10px] font-medium shadow-sm transition-all active:cursor-grabbing ${
          compact ? 'px-1.5' : 'pl-2 pr-2.5'
        } ${isSel ? 'ring-2 ring-[#4a5d23] ring-offset-1' : 'hover:-translate-y-0.5 hover:shadow-md'} ${
          dragKey === p.key ? 'opacity-30' : ''
        }`}
        style={{ borderColor: `${partyColor(p.party)}77` }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: partyColor(p.party) }} />
        <span className={`truncate ${compact ? 'max-w-[4rem]' : 'max-w-[8.5rem]'} text-stone-700`}>
          {compact ? firstName(p.name) : p.name}
        </span>
      </div>
    );
  };

  const Table: React.FC<{ n: number }> = ({ n }) => {
    const map = seatMapOf(n);
    const seatedCount = map.filter(Boolean).length;
    const slots = map.length;
    const over8 = seatedCount > tableSize;
    const full = seatedCount === tableSize;

    return (
      <div className="flex flex-col items-center">
        <div className="relative aspect-square w-full max-w-[270px]">
          {/* mesa (círculo central) — soltar/clic aquí = primer asiento libre */}
          <div
            {...over(`t${n}`)}
            onDrop={(e) => { e.preventDefault(); const k = e.dataTransfer.getData('text/plain'); endDrag(); if (k) toTable(k, n); }}
            onClick={() => { if (selected) toTable(selected, n); }}
            className={`absolute inset-[26%] flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border-2 p-2 text-center transition-all ${
              dragOver === `t${n}` ? 'scale-105 border-[#4a5d23] bg-[#4a5d23]/15' : 'border-[#4a5d23]/25 bg-[#f1f4ea]/70'
            }`}
          >
            <span className="text-xs font-bold text-stone-700">Mesa {n}</span>
            {editingLabel === n ? (
              <input
                autoFocus
                value={labelDraft}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={() => setLabel(n, labelDraft)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setLabel(n, labelDraft);
                  if (e.key === 'Escape') setEditingLabel(null);
                }}
                maxLength={40}
                placeholder="Etiqueta…"
                className="w-[85%] rounded-full border border-[#4a5d23]/40 bg-white px-2 py-0.5 text-center text-[10px] focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingLabel(n); setLabelDraft(tableLabels[n] || ''); }}
                className={`max-w-full truncate rounded-full px-1.5 text-[9px] font-semibold ${
                  tableLabels[n] ? 'bg-[#4a5d23]/15 text-[#4a5d23]' : 'text-stone-400 hover:text-[#4a5d23]'
                }`}
              >
                {tableLabels[n] || '+ etiqueta'}
              </button>
            )}
            <span
              className={`rounded-full px-1.5 text-[9px] font-bold ${
                over8 ? 'bg-red-100 text-red-600' : full ? 'bg-amber-100 text-amber-700' : 'text-[#4a5d23]'
              }`}
            >
              {seatedCount}/{tableSize}
            </span>
          </div>

          {/* asientos concretos alrededor */}
          {map.map((p, i) => {
            const angle = (i / slots) * 2 * Math.PI - Math.PI / 2;
            const r = 43;
            const style: React.CSSProperties = {
              left: `${50 + r * Math.cos(angle)}%`,
              top: `${50 + r * Math.sin(angle)}%`,
              transform: 'translate(-50%, -50%)',
            };
            const seatId = `t${n}s${i}`;
            const hot = dragOver === seatId || (!!selected && (!p || p.key !== selected));
            return (
              <div
                key={i}
                className="absolute z-10"
                style={style}
                {...over(seatId)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const k = e.dataTransfer.getData('text/plain');
                  endDrag();
                  if (k) placeAt(k, n, i);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selected) placeAt(selected, n, i);
                }}
              >
                {p ? (
                  <Chip
                    p={p}
                    compact
                    onPick={() => {
                      if (selected && selected !== p.key) placeAt(selected, n, i);
                      else setSelected((s) => (s === p.key ? null : p.key));
                    }}
                  />
                ) : (
                  <span
                    className={`block h-6 w-6 cursor-pointer rounded-full border-2 border-dashed transition-all ${
                      dragOver === seatId ? 'scale-125 border-[#4a5d23] bg-[#4a5d23]/20' : hot ? 'border-[#4a5d23]/50' : 'border-stone-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => deleteTable(n, seatedCount)}
          className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={11} /> Eliminar mesa
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-200/50 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f4ea]">
            <Users size={20} className="text-[#4a5d23]" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Mesas de la Recepción</h2>
            <p className="text-xs text-stone-400">
              {totals.total} invitados · <span className="font-semibold text-[#4a5d23]">{totals.assigned} asignados</span> · {totals.unassigned} sin asignar
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Personas / mesa
            <input
              type="number"
              min={1}
              max={20}
              value={tableSize}
              onChange={(e) => setTableSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-14 rounded-lg border border-stone-200 px-2 py-1.5 text-center text-sm font-semibold focus:border-[#4a5d23] focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={autoAssign}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#4a5d23]/40 bg-[#f1f4ea] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#4a5d23] hover:bg-[#e3ead3]"
            title="Sentar a los invitados sin mesa según su etiqueta"
          >
            <Wand2 size={13} /> Auto-asignar
          </button>
          <button
            type="button"
            onClick={addTable}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
          >
            <Plus size={13} /> Mesa
          </button>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
            title="Recargar"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Barra de guardado (sticky) */}
      <div
        className={`sticky top-2 z-30 flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 shadow-md transition-colors ${
          dirty ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-white'
        }`}
      >
        {selectedPerson ? (
          <span className="text-xs text-stone-700">
            Moviendo a <strong>{selectedPerson.name}</strong> — toca un asiento
          </span>
        ) : (
          <span className={`text-xs ${dirty ? 'font-semibold text-amber-700' : 'text-stone-400'}`}>
            {dirty ? '● Cambios sin guardar' : 'Todo guardado'}
          </span>
        )}
        <div className="flex items-center gap-2">
          {selectedPerson && (
            <>
              <button
                type="button"
                onClick={() => toPool(selectedPerson.key)}
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
              >
                Sin asignar
              </button>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full p-1 text-stone-500 hover:bg-white">
                <X size={14} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-all ${
              !dirty || saving ? 'cursor-not-allowed bg-stone-300' : 'bg-[#4a5d23] hover:bg-[#3b4c1b] shadow'
            }`}
          >
            <Save size={13} /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {people.length === 0 && !loading ? (
        <div className="rounded-3xl border border-stone-200/50 bg-white py-16 text-center text-sm italic text-stone-400">
          Todavía no hay confirmaciones para la recepción. Aparecerán aquí a medida que acepten la invitación.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Pool sin asignar */}
          <div
            {...over('pool')}
            onDrop={(e) => { e.preventDefault(); const k = e.dataTransfer.getData('text/plain'); endDrag(); if (k) toPool(k); }}
            onClick={() => { if (selected) toPool(selected); }}
            className={`h-fit rounded-3xl border-2 border-dashed bg-white p-4 transition-colors ${
              dragOver === 'pool' ? 'border-[#4a5d23] bg-[#f1f4ea]/60' : dragKey || selected ? 'border-[#4a5d23]/60' : 'border-stone-200'
            }`}
          >
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Sin asignar ({unassigned.length})
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Buscar invitado…"
              className="mb-3 w-full rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs focus:border-[#4a5d23] focus:outline-none"
            />
            <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
              {filteredGroups.length === 0 ? (
                <p className="py-6 text-center text-xs italic text-stone-300">
                  {search ? 'Nadie coincide.' : '¡Todos asignados! 🎉'}
                </p>
              ) : (
                filteredGroups.map((g) => {
                  const gtag = g.items.find((p) => p.tag)?.tag;
                  return (
                    <div key={g.party}>
                      <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-400">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: partyColor(g.party) }} />
                        {g.party}
                        {gtag && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#4a5d23]/10 px-1.5 text-[9px] text-[#4a5d23]">
                            <Tag size={9} /> {gtag}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.items.map((p) => (
                          <Chip
                            key={p.key}
                            p={p}
                            onPick={() => setSelected((s) => (s === p.key ? null : p.key))}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Grilla de mesas redondas */}
          <div className="grid gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
            {Array.from({ length: effectiveCount }, (_, i) => i + 1).map((n) => (
              <Table key={n} n={n} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
