import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Plus, RefreshCw, Minus, GripVertical, MoveRight } from 'lucide-react';
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

// Color estable por "party" (grupo/confirmación) para reconocer familias de un vistazo.
const PARTY_COLORS = [
  '#4a5d23', '#b35a44', '#2f6f6f', '#7a5195', '#bc5090',
  '#ff764a', '#3d6b35', '#8a6d3b', '#4c6ef5', '#c9971f',
];
const partyColor = (party: string) => {
  let h = 0;
  for (let i = 0; i < party.length; i++) h = (h * 31 + party.charCodeAt(i)) >>> 0;
  return PARTY_COLORS[h % PARTY_COLORS.length];
};

export const SeatingChart: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);

  const [tableSize, setTableSize] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_SIZE) || '', 10);
    return v > 0 ? v : 8;
  });
  const [tableCount, setTableCount] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_COUNT) || '', 10);
    return v > 0 ? v : 0; // 0 = aún no calculado
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
    setMenuKey(null);
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
      if (t && m.has(t)) m.get(t)!.push(p);
      else if (t) { m.set(t, [p]); }
      else unassigned.push(p);
    }
    return { m, unassigned };
  }, [people, assignments, effectiveCount]);

  const filteredUnassigned = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? byTable.unassigned.filter((p) => p.name.toLowerCase().includes(q) || p.party.toLowerCase().includes(q))
      : byTable.unassigned;
    // Agrupar por party conservando orden
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

  const onDrop = (table: number | null) => (e: React.DragEvent) => {
    e.preventDefault();
    const key = e.dataTransfer.getData('text/plain');
    setDragKey(null);
    if (key) assign(key, table);
  };
  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const Chip: React.FC<{ p: Person; current: number | null }> = ({ p, current }) => (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', p.key);
        e.dataTransfer.effectAllowed = 'move';
        setDragKey(p.key);
      }}
      onDragEnd={() => setDragKey(null)}
      className={`group relative flex items-center gap-1.5 rounded-full border bg-white pl-1.5 pr-2 py-1 text-xs shadow-sm transition-all ${
        dragKey === p.key ? 'opacity-40' : 'hover:shadow-md'
      }`}
      style={{ borderColor: `${partyColor(p.party)}55` }}
      title={`${p.name} · ${p.party}`}
    >
      <GripVertical size={12} className="shrink-0 cursor-grab text-stone-300" />
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: partyColor(p.party) }} />
      <span className="max-w-[9rem] truncate font-medium text-stone-700">{p.name}</span>
      <button
        type="button"
        onClick={() => setMenuKey(menuKey === p.key ? null : p.key)}
        className="ml-0.5 shrink-0 rounded-full p-0.5 text-stone-300 hover:bg-stone-100 hover:text-stone-600"
        title="Mover a…"
      >
        <MoveRight size={13} />
      </button>

      {menuKey === p.key && (
        <>
          <button type="button" aria-label="Cerrar" className="fixed inset-0 z-30 cursor-default" onClick={() => setMenuKey(null)} />
          <div className="absolute left-0 top-8 z-40 max-h-64 w-40 overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 text-left shadow-lg">
            <button
              type="button"
              onClick={() => assign(p.key, null)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-stone-50 ${current == null ? 'font-bold text-[#4a5d23]' : 'text-stone-600'}`}
            >
              Sin asignar
            </button>
            {Array.from({ length: effectiveCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => assign(p.key, n)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-stone-50 ${current === n ? 'font-bold text-[#4a5d23]' : 'text-stone-600'}`}
              >
                Mesa {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { const n = effectiveCount + 1; setTableCount(n); assign(p.key, n); }}
              className="flex w-full items-center gap-2 border-t border-stone-100 px-3 py-1.5 text-[11px] text-stone-500 hover:bg-stone-50"
            >
              <Plus size={12} /> Nueva mesa {effectiveCount + 1}
            </button>
          </div>
        </>
      )}
    </div>
  );

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
              {totals.total} invitados · <span className="text-[#4a5d23] font-semibold">{totals.assigned} asignados</span> · {totals.unassigned} sin asignar
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

      {people.length === 0 && !loading ? (
        <div className="rounded-3xl border border-stone-200/50 bg-white py-16 text-center text-sm italic text-stone-400">
          Todavía no hay confirmaciones para la recepción. Aparecerán aquí a medida que acepten la invitación.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Pool sin asignar */}
          <div
            onDragOver={allowDrop}
            onDrop={onDrop(null)}
            className={`h-fit rounded-3xl border-2 border-dashed bg-white p-4 transition-colors ${
              dragKey ? 'border-[#4a5d23] bg-[#f1f4ea]/40' : 'border-stone-200'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Sin asignar ({byTable.unassigned.length})</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar invitado…"
              className="mb-3 w-full rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs focus:border-[#4a5d23] focus:outline-none"
            />
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {filteredUnassigned.length === 0 ? (
                <p className="py-6 text-center text-xs italic text-stone-300">
                  {search ? 'Nadie coincide.' : '¡Todos asignados! 🎉'}
                </p>
              ) : (
                filteredUnassigned.map((g) => (
                  <div key={g.party}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: partyColor(g.party) }} />
                      {g.party}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((p) => <Chip key={p.key} p={p} current={null} />)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grilla de mesas */}
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: effectiveCount }, (_, i) => i + 1).map((n) => {
              const seated = byTable.m.get(n) || [];
              const over = seated.length > tableSize;
              const full = seated.length === tableSize;
              return (
                <div
                  key={n}
                  onDragOver={allowDrop}
                  onDrop={onDrop(n)}
                  className={`flex min-h-[150px] flex-col rounded-3xl border-2 bg-white p-4 transition-colors ${
                    dragKey ? 'border-[#4a5d23]/60' : 'border-stone-200/70'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold text-stone-700">
                      <span className="h-6 w-6 rounded-full border-2 border-[#4a5d23]/40" />
                      Mesa {n}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        over ? 'bg-red-50 text-red-600' : full ? 'bg-amber-50 text-amber-700' : 'bg-[#f1f4ea] text-[#4a5d23]'
                      }`}
                    >
                      {seated.length}/{tableSize}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-wrap content-start gap-1.5">
                    {seated.length === 0 ? (
                      <span className="m-auto text-[11px] italic text-stone-300">Arrastra invitados aquí</span>
                    ) : (
                      seated.map((p) => <Chip key={p.key} p={p} current={n} />)
                    )}
                  </div>

                  {seated.length === 0 && n === effectiveCount && n > 1 && (
                    <button
                      type="button"
                      onClick={() => setTableCount(n - 1)}
                      className="mt-2 inline-flex items-center gap-1 self-end text-[10px] font-bold uppercase tracking-wider text-stone-300 hover:text-red-500"
                    >
                      <Minus size={11} /> Quitar mesa
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
