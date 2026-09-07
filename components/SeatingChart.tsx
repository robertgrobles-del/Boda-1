import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Plus, RefreshCw, Minus, X } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';

interface Person {
  key: string;
  name: string;
  party: string;
  rsvpId: number;
}

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
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const [tableSize, setTableSize] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_SIZE) || '', 10);
    return v > 0 ? v : 8;
  });
  const [tableCount, setTableCount] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_COUNT) || '', 10);
    return v > 0 ? v : 0;
  });

  useEffect(() => localStorage.setItem(LS_SIZE, String(tableSize)), [tableSize]);
  useEffect(() => {
    if (tableCount > 0) localStorage.setItem(LS_COUNT, String(tableCount));
  }, [tableCount]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/seating`, {
        headers: { 'x-api-key': apiKey },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPeople(data.people || []);
      setAssignments(data.assignments || {});
      setTableCount((prev) => {
        const maxAssigned = Math.max(0, ...Object.values<number>(data.assignments || {}));
        const needed = Math.max(1, Math.ceil((data.people?.length || 0) / (tableSize || 8)));
        return Math.max(prev, maxAssigned, needed);
      });
    } catch {
      toast('No se pudo cargar la organización de mesas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiKey, tableSize, toast]);

  useEffect(() => { load(); }, [load]);

  const assign = async (key: string, table: number | null) => {
    setSelected(null);
    const prev = assignments[key] ?? null;
    if (prev === table) return;
    setAssignments((a) => {
      const next = { ...a };
      if (table == null) delete next[key];
      else next[key] = table;
      return next;
    });
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/seating/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ key, tableNumber: table ?? 0 }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast('No se pudo mover al invitado. Recargando…', 'error');
      load();
    }
  };

  const effectiveCount = useMemo(() => {
    const maxAssigned = Math.max(0, ...Object.values(assignments));
    return Math.max(tableCount || 1, maxAssigned);
  }, [tableCount, assignments]);

  const byTable = useMemo(() => {
    const m = new Map<number, Person[]>();
    for (let i = 1; i <= effectiveCount; i++) m.set(i, []);
    const unassigned: Person[] = [];
    for (const p of people) {
      const t = assignments[p.key];
      if (t && t >= 1) {
        if (!m.has(t)) m.set(t, []);
        m.get(t)!.push(p);
      } else unassigned.push(p);
    }
    return { m, unassigned };
  }, [people, assignments, effectiveCount]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? byTable.unassigned.filter((p) => p.name.toLowerCase().includes(q) || p.party.toLowerCase().includes(q))
      : byTable.unassigned;
    const groups: { party: string; items: Person[] }[] = [];
    for (const p of list) {
      const g = groups.find((x) => x.party === p.party);
      if (g) g.items.push(p);
      else groups.push({ party: p.party, items: [p] });
    }
    return groups;
  }, [byTable.unassigned, search]);

  const totals = {
    total: people.length,
    assigned: people.length - byTable.unassigned.length,
    unassigned: byTable.unassigned.length,
  };
  const selectedPerson = selected ? people.find((p) => p.key === selected) : null;

  // --- drag & drop ---
  const dragProps = (key: string) => ({
    draggable: true as const,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', key);
      e.dataTransfer.effectAllowed = 'move';
      setDragKey(key);
    },
    onDragEnd: () => setDragKey(null),
  });
  const dropProps = (table: number | null) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const key = e.dataTransfer.getData('text/plain');
      setDragKey(null);
      if (key) assign(key, table);
    },
  });

  // click-to-move: si hay alguien seleccionado y tocas una mesa/pool → lo mueve
  const clickTarget = (table: number | null) => () => {
    if (selected) assign(selected, table);
  };
  const clickPerson = (p: Person, tableOfPerson: number | null) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected && selected !== p.key) {
      // mover el seleccionado a la mesa de esta persona
      assign(selected, tableOfPerson);
    } else {
      setSelected((s) => (s === p.key ? null : p.key));
    }
  };

  /** Ficha de invitado (pool y asientos comparten estilo). */
  const Pill: React.FC<{ p: Person; table: number | null; compact?: boolean }> = ({ p, table, compact }) => {
    const isSel = selected === p.key;
    return (
      <button
        type="button"
        {...dragProps(p.key)}
        onClick={clickPerson(p, table)}
        title={`${p.name} · ${p.party}`}
        className={`flex items-center gap-1 rounded-full border bg-white py-1 text-[10px] font-medium shadow-sm transition-all ${
          compact ? 'px-1.5' : 'pl-1.5 pr-2'
        } ${isSel ? 'ring-2 ring-[#4a5d23] ring-offset-1' : 'hover:shadow-md'} ${dragKey === p.key ? 'opacity-40' : ''}`}
        style={{ borderColor: `${partyColor(p.party)}66` }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: partyColor(p.party) }} />
        <span className={`truncate ${compact ? 'max-w-[3.6rem]' : 'max-w-[8rem]'} text-stone-700`}>
          {compact ? firstName(p.name) : p.name}
        </span>
      </button>
    );
  };

  /** Mesa redonda con los asientos alrededor. */
  const Table: React.FC<{ n: number }> = ({ n }) => {
    const seated = byTable.m.get(n) || [];
    const slots = Math.max(tableSize, seated.length);
    const over = seated.length > tableSize;
    const full = seated.length === tableSize;
    return (
      <div className="flex flex-col items-center">
        <div
          {...dropProps(n)}
          onClick={clickTarget(n)}
          className={`relative aspect-square w-full max-w-[260px] cursor-pointer rounded-full outline-2 outline-offset-4 transition-all ${
            dragKey || selected ? 'outline outline-dashed outline-[#4a5d23]/50' : 'outline-transparent'
          }`}
        >
          {/* mesa (círculo central) */}
          <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full border-2 border-[#4a5d23]/25 bg-[#f1f4ea]/60 text-center">
            <span className="text-xs font-bold text-stone-700">Mesa {n}</span>
            <span
              className={`mt-0.5 rounded-full px-1.5 text-[9px] font-bold ${
                over ? 'bg-red-100 text-red-600' : full ? 'bg-amber-100 text-amber-700' : 'text-[#4a5d23]'
              }`}
            >
              {seated.length}/{tableSize}
            </span>
          </div>

          {/* asientos alrededor */}
          {Array.from({ length: slots }).map((_, i) => {
            const angle = (i / slots) * 2 * Math.PI - Math.PI / 2;
            const r = 42;
            const style: React.CSSProperties = {
              left: `${50 + r * Math.cos(angle)}%`,
              top: `${50 + r * Math.sin(angle)}%`,
              transform: 'translate(-50%, -50%)',
            };
            const p = seated[i];
            return (
              <div key={i} className="absolute z-10" style={style}>
                {p ? (
                  <Pill p={p} table={n} compact />
                ) : (
                  <span className="block h-5 w-5 rounded-full border-2 border-dashed border-stone-300" />
                )}
              </div>
            );
          })}
        </div>

        {seated.length === 0 && n === effectiveCount && n > 1 && (
          <button
            type="button"
            onClick={() => setTableCount(n - 1)}
            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-300 hover:text-red-500"
          >
            <Minus size={11} /> Quitar
          </button>
        )}
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
            onClick={() => setTableCount(effectiveCount + 1)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#4a5d23] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#3b4c1b]"
          >
            <Plus size={13} /> Agregar mesa
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
            title="Recargar"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {selectedPerson && (
        <div className="sticky top-2 z-30 flex items-center justify-between gap-3 rounded-2xl border border-[#4a5d23]/30 bg-[#f1f4ea] px-4 py-2.5 shadow-md">
          <span className="text-xs text-stone-700">
            Moviendo a <strong>{selectedPerson.name}</strong> — toca una mesa
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => assign(selectedPerson.key, null)}
              className="rounded-full border border-stone-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
            >
              Sin asignar
            </button>
            <button type="button" onClick={() => setSelected(null)} className="rounded-full p-1 text-stone-500 hover:bg-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {people.length === 0 && !loading ? (
        <div className="rounded-3xl border border-stone-200/50 bg-white py-16 text-center text-sm italic text-stone-400">
          Todavía no hay confirmaciones para la recepción. Aparecerán aquí a medida que acepten la invitación.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Pool sin asignar */}
          <div
            {...dropProps(null)}
            onClick={clickTarget(null)}
            className={`h-fit rounded-3xl border-2 border-dashed bg-white p-4 transition-colors ${
              dragKey || selected ? 'border-[#4a5d23] bg-[#f1f4ea]/40' : 'border-stone-200'
            }`}
          >
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Sin asignar ({byTable.unassigned.length})
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
                filteredGroups.map((g) => (
                  <div key={g.party}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: partyColor(g.party) }} />
                      {g.party}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((p) => <Pill key={p.key} p={p} table={null} />)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grilla de mesas redondas */}
          <div className="grid gap-x-6 gap-y-10 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {Array.from({ length: effectiveCount }, (_, i) => i + 1).map((n) => (
              <Table key={n} n={n} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
