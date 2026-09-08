import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Users, Plus, RefreshCw, X, Wand2, Tag, Save, Trash2, Lock, Unlock, AlertTriangle, Download, UtensilsCrossed, Undo2, Redo2 } from 'lucide-react';
import { API_CONFIG } from '../constants';
import { useToast } from './Toast';

interface Person {
  key: string;
  name: string;
  party: string;
  rsvpId: number;
  tag?: string | null;
  dietary?: string | null;
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
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const tableRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null); // 'pool' | 't{n}' | 't{n}s{i}'
  const [editingLabel, setEditingLabel] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  // undo / redo
  type Snap = { a: Assignments; l: Record<number, string>; k: number[] };
  const historyRef = useRef<Snap[]>([]);
  const [histIdx, setHistIdx] = useState(0);
  const travelRef = useRef(false);

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
      const labelsObj = Object.fromEntries(
        Object.entries(data.tables || {}).map(([k, v]) => [Number(k), v as string]),
      ) as Record<number, string>;
      const lockedArr = ((data.locked || []) as any[]).map(Number);
      travelRef.current = true; // que el efecto de historial no registre esta carga
      setAssignments(norm);
      setTableLabels(labelsObj);
      setLocked(new Set<number>(lockedArr));
      setDirty(false);
      historyRef.current = [{ a: norm, l: labelsObj, k: lockedArr }];
      setHistIdx(0);
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

  // Registrar cada cambio en el historial (para deshacer/rehacer)
  useEffect(() => {
    if (travelRef.current) { travelRef.current = false; return; }
    const s: Snap = { a: assignments, l: tableLabels, k: [...locked] };
    const cur = historyRef.current[histIdx];
    if (cur && JSON.stringify(cur) === JSON.stringify(s)) return;
    const next = historyRef.current.slice(0, histIdx + 1);
    next.push(JSON.parse(JSON.stringify(s)));
    historyRef.current = next.slice(-60);
    setHistIdx(historyRef.current.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, tableLabels, locked]);

  const applySnap = (s: Snap) => {
    travelRef.current = true;
    setAssignments(s.a);
    setTableLabels(s.l);
    setLocked(new Set(s.k));
    setDirty(true);
    setSelected(null);
  };
  const canUndo = histIdx > 0;
  const canRedo = histIdx < historyRef.current.length - 1;
  const undo = () => { if (canUndo) { applySnap(historyRef.current[histIdx - 1]); setHistIdx(histIdx - 1); } };
  const redo = () => { if (canRedo) { applySnap(historyRef.current[histIdx + 1]); setHistIdx(histIdx + 1); } };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_CONFIG.backendUrl}/api/admin/seating/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ assignments, tables: tableLabels, locked: [...locked] }),
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

  // Mueve TODA una familia (los miembros sin asignar) a una mesa, en asientos seguidos.
  const moveGroup = (party: string, table: number, startSeat?: number) => {
    const members = people.filter((p) => p.party === party && !assignments[p.key]);
    if (!members.length) return;
    setAssignments((a) => {
      const next = { ...a };
      const taken = (s: number) => Object.values(next).some((v) => v.table === table && v.seat === s);
      let seat = startSeat ?? 0;
      for (const m of members) {
        while (taken(seat)) seat++;
        next[m.key] = { table, seat };
        seat++;
      }
      return next;
    });
    setSelected(null);
    setDirty(true);
  };

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

  const toggleLock = (n: number) => {
    setLocked((s) => {
      const next = new Set(s);
      if (next.has(n)) next.delete(n);
      else next.add(n);
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
    setLocked((s) => {
      const next = new Set<number>();
      s.forEach((num) => {
        if (num === n) return;
        next.add(num > n ? num - 1 : num);
      });
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

  const searchQ = search.trim().toLowerCase();
  const matches = useCallback(
    (p: Person) => !!searchQ && (p.name.toLowerCase().includes(searchQ) || p.party.toLowerCase().includes(searchQ)),
    [searchQ],
  );

  // Al buscar, hacer scroll a la mesa del primer invitado sentado que coincide
  useEffect(() => {
    if (!searchQ) return;
    const hit = people.find((p) => assignments[p.key] && matches(p));
    const t = hit ? assignments[hit.key].table : null;
    if (t && tableRefs.current[t]) {
      tableRefs.current[t]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchQ, people, assignments, matches]);

  // --- avisos automáticos ---
  const warnings = useMemo(() => {
    const w: string[] = [];
    // familias divididas
    const partyTables = new Map<string, Set<number>>();
    people.forEach((p) => {
      const t = assignments[p.key]?.table;
      if (!t) return;
      if (!partyTables.has(p.party)) partyTables.set(p.party, new Set());
      partyTables.get(p.party)!.add(t);
    });
    partyTables.forEach((set, party) => {
      if (set.size > 1) w.push(`"${party}" está repartida en ${set.size} mesas (${[...set].sort((a, b) => a - b).join(', ')}).`);
    });
    // mesas sobre capacidad
    const perTable = new Map<number, number>();
    Object.values(assignments).forEach((s) => perTable.set(s.table, (perTable.get(s.table) || 0) + 1));
    perTable.forEach((c, t) => {
      if (c > tableSize) w.push(`Mesa ${t} tiene ${c} personas (excede ${tableSize}).`);
    });
    // etiqueta con mesa pero gente sin sentar ahí
    const labelByTag = new Map<string, number>();
    Object.entries(tableLabels).forEach(([n, l]) => labelByTag.set(l.trim().toLowerCase(), Number(n)));
    const stray = new Map<string, number>();
    people.forEach((p) => {
      if (!p.tag) return;
      const t = labelByTag.get(p.tag.trim().toLowerCase());
      if (!t) return;
      if ((assignments[p.key]?.table ?? 0) !== t) stray.set(p.tag, (stray.get(p.tag) || 0) + 1);
    });
    stray.forEach((c, tg) => w.push(`${c} de "${tg}" no están en su mesa (etiqueta ${tg}). Usa "Auto-asignar".`));
    return w;
  }, [people, assignments, tableLabels, tableSize]);

  // --- exportar "Mesa → invitados" a CSV ---
  const exportCSV = () => {
    const rows: string[][] = [['Mesa', 'Etiqueta', 'Asiento', 'Invitado', 'Familia', 'Restricción']];
    for (let n = 1; n <= effectiveCount; n++) {
      const map = seatMapOf(n);
      map.forEach((p, i) => {
        if (!p) return;
        rows.push([
          String(n),
          tableLabels[n] || '',
          String(i + 1),
          p.name,
          p.party,
          p.dietary || '',
        ]);
      });
    }
    unassigned.forEach((p) => rows.push(['—', '', '', p.name, p.party, p.dietary || '']));
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mesas_boda.csv';
    a.click();
  };

  const esc = (s: string) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

  const openPrint = (title: string, body: string, style: string) => {
    const w = window.open('', '_blank');
    if (!w) {
      toast('Permite las ventanas emergentes para imprimir.', 'error');
      return;
    }
    w.document.write(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title>` +
      `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
      `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&family=Great+Vibes&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">` +
      `<style>*{box-sizing:border-box;margin:0}body{font-family:'Inter',system-ui,sans-serif;color:#1a1a1a}${style}</style>` +
      `</head><body>${body}<script>window.onload=function(){setTimeout(function(){window.print()},500)}</script></body></html>`,
    );
    w.document.close();
  };

  // A6 — tarjetas de sitio (place cards)
  const printPlaceCards = () => {
    const cards: { name: string; table: number }[] = [];
    for (let n = 1; n <= effectiveCount; n++) {
      seatMapOf(n).forEach((p) => { if (p) cards.push({ name: p.name, table: n }); });
    }
    if (!cards.length) { toast('No hay invitados sentados aún.', 'error'); return; }
    const body = `<div class="grid">${cards
      .map(
        (c) =>
          `<div class="card"><div class="eyebrow">Stephanie &amp; Dalvin</div>` +
          `<div class="name">${esc(c.name)}</div><div class="mesa">Mesa ${c.table}</div></div>`,
      )
      .join('')}</div>`;
    openPrint(
      'Tarjetas de sitio',
      body,
      `.grid{display:grid;grid-template-columns:1fr 1fr}` +
        `.card{height:6.6cm;border:1px dashed #d6d6d6;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:.7cm;page-break-inside:avoid}` +
        `.eyebrow{font-size:8pt;letter-spacing:.3em;text-transform:uppercase;color:#4a5d23}` +
        `.name{font-family:'Great Vibes',cursive;font-size:30pt;line-height:1.05;margin:.25cm 0}` +
        `.mesa{font-size:11pt;letter-spacing:.15em;text-transform:uppercase;color:#b35a44;font-weight:700}` +
        `@page{margin:1cm}`,
    );
  };

  // A4 — plano / roster imprimible por mesa
  const printPlan = () => {
    let sections = '';
    for (let n = 1; n <= effectiveCount; n++) {
      const map = seatMapOf(n);
      const cnt = map.filter(Boolean).length;
      if (!cnt && !tableLabels[n]) continue;
      const list = map
        .map((p, i) => (p ? `<li><b>${i + 1}.</b> ${esc(p.name)}${p.dietary ? ` <em>· ${esc(p.dietary)}</em>` : ''}</li>` : ''))
        .join('');
      sections +=
        `<div class="t"><h2>Mesa ${n}${tableLabels[n] ? ` <span class="lbl">${esc(tableLabels[n])}</span>` : ''}` +
        `<span class="cap">${cnt}/${tableSize}</span></h2><ol>${list}</ol></div>`;
    }
    const unass = unassigned.length
      ? `<div class="t"><h2>Sin asignar <span class="cap">${unassigned.length}</span></h2><ol>${unassigned
          .map((p) => `<li>${esc(p.name)}</li>`)
          .join('')}</ol></div>`
      : '';
    const body =
      `<h1>Plano de mesas · Recepción</h1>` +
      `<p class="sub">Stephanie &amp; Dalvin — ${totals.assigned}/${totals.total} sentados · impreso ${new Date().toLocaleDateString()}</p>` +
      `<div class="cols">${sections}${unass}</div>`;
    openPrint(
      'Plano de mesas',
      body,
      `h1{font-family:'Playfair Display',serif;font-size:20pt;margin-bottom:.1cm}` +
        `.sub{color:#666;font-size:9pt;margin-bottom:.5cm}` +
        `.cols{column-count:3;column-gap:.7cm}` +
        `.t{break-inside:avoid;border:1px solid #e5e5e5;border-radius:8px;padding:.35cm;margin-bottom:.35cm}` +
        `h2{font-size:11pt;display:flex;align-items:center;gap:.2cm;border-bottom:1px solid #eee;padding-bottom:.15cm;margin-bottom:.15cm}` +
        `.lbl{background:#eef2e3;color:#4a5d23;font-size:8pt;padding:1px 6px;border-radius:99px}` +
        `.cap{margin-left:auto;color:#888;font-size:9pt;font-weight:400}` +
        `ol{margin:0;padding-left:1.1em;font-size:9.5pt;line-height:1.5}` +
        `em{color:#b35a44;font-style:normal;font-size:8pt}` +
        `@media print{@page{margin:1cm}.cols{column-count:3}}`,
    );
  };

  // --- drag helpers ---
  const startDrag = (key: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
    // Diferido: cambiar el estado en pleno dragstart puede cancelar el arrastre.
    requestAnimationFrame(() => {
      setDragKey(key);
      setSelected(null);
      document.body.classList.add('select-none');
    });
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

  const handleDrop = (k: string, target: 'pool' | { table: number; seat?: number }) => {
    if (!k) return;
    if (k.startsWith('group:')) {
      const party = k.slice(6);
      if (target === 'pool') {
        people.filter((p) => p.party === party && assignments[p.key]).forEach((p) => toPool(p.key));
      } else {
        moveGroup(party, target.table, target.seat);
      }
      return;
    }
    if (target === 'pool') toPool(k);
    else if (target.seat != null) placeAt(k, target.table, target.seat);
    else toTable(k, target.table);
  };

  // Nota: `chip` y `renderTable` son FUNCIONES (no componentes) a propósito:
  // definirlos como componentes dentro del render los recrea en cada estado y
  // React desmonta el nodo que se está arrastrando → cancela el drag.
  const chip = (p: Person, opts: { onPick: () => void; compact?: boolean }) => {
    const isSel = selected === p.key;
    const isHit = matches(p);
    return (
      <div
        role="button"
        tabIndex={0}
        draggable
        onDragStart={startDrag(p.key)}
        onDragEnd={endDrag}
        onClick={(e) => { e.stopPropagation(); opts.onPick(); }}
        title={`${p.name} · ${p.party}${p.tag ? ` · ${p.tag}` : ''}${p.dietary ? ` · ⚠ ${p.dietary}` : ''}`}
        className={`flex cursor-grab items-center gap-1 rounded-full border bg-white py-1 text-[10px] font-medium shadow-sm transition-all active:cursor-grabbing ${
          opts.compact ? 'px-1.5' : 'pl-2 pr-2.5'
        } ${
          isSel ? 'ring-2 ring-[#4a5d23] ring-offset-1'
          : isHit ? 'ring-2 ring-amber-400 ring-offset-1'
          : 'hover:-translate-y-0.5 hover:shadow-md'
        } ${dragKey === p.key ? 'opacity-30' : ''}`}
        style={{ borderColor: `${partyColor(p.party)}77` }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: partyColor(p.party) }} />
        <span className={`truncate ${opts.compact ? 'max-w-[4rem]' : 'max-w-[8.5rem]'} text-stone-700`}>
          {opts.compact ? firstName(p.name) : p.name}
        </span>
        {p.dietary && <UtensilsCrossed size={9} className="shrink-0 text-amber-600" />}
      </div>
    );
  };

  const renderTable = (n: number) => {
    const map = seatMapOf(n);
    const seatedCount = map.filter(Boolean).length;
    const slots = map.length;
    const over8 = seatedCount > tableSize;
    const full = seatedCount === tableSize;
    const dietCount = map.filter((p) => p?.dietary).length;
    const isLocked = locked.has(n);

    return (
      <div className="flex flex-col items-center" ref={(el) => { tableRefs.current[n] = el; }}>
        <div className="relative aspect-square w-full max-w-[270px]">
          {/* candado */}
          <button
            type="button"
            onClick={() => toggleLock(n)}
            title={isLocked ? 'Mesa fija — desbloquear' : 'Fijar mesa (auto-asignar la ignora)'}
            className={`absolute right-1 top-1 z-20 rounded-full p-1 shadow-sm transition-colors ${
              isLocked ? 'bg-amber-100 text-amber-700' : 'bg-white text-stone-300 hover:text-stone-600'
            }`}
          >
            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>

          {/* mesa (círculo central) — soltar/clic aquí = primer asiento libre */}
          <div
            {...over(`t${n}`)}
            onDrop={(e) => { e.preventDefault(); const k = e.dataTransfer.getData('text/plain'); endDrag(); handleDrop(k, { table: n }); }}
            onClick={() => { if (selected) toTable(selected, n); }}
            className={`absolute inset-[26%] flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border-2 p-2 text-center transition-all ${
              dragOver === `t${n}` ? 'scale-105 border-[#4a5d23] bg-[#4a5d23]/15'
              : isLocked ? 'border-amber-300 bg-amber-50/70'
              : 'border-[#4a5d23]/25 bg-[#f1f4ea]/70'
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
            <div className="flex items-center gap-1">
              <span
                className={`rounded-full px-1.5 text-[9px] font-bold ${
                  over8 ? 'bg-red-100 text-red-600' : full ? 'bg-amber-100 text-amber-700' : 'text-[#4a5d23]'
                }`}
              >
                {seatedCount}/{tableSize}
              </span>
              {dietCount > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1 text-[8px] font-bold text-amber-700" title="Restricciones alimentarias en esta mesa">
                  <UtensilsCrossed size={8} /> {dietCount}
                </span>
              )}
            </div>
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
                className={`absolute z-10 flex items-center justify-center rounded-full p-2 transition-colors ${
                  dragOver === seatId ? 'bg-[#4a5d23]/10' : ''
                }`}
                style={style}
                {...over(seatId)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const k = e.dataTransfer.getData('text/plain');
                  endDrag();
                  handleDrop(k, { table: n, seat: i });
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selected) placeAt(selected, n, i);
                }}
              >
                {p ? (
                  chip(p, {
                    compact: true,
                    onPick: () => {
                      if (selected && selected !== p.key) placeAt(selected, n, i);
                      else setSelected((s) => (s === p.key ? null : p.key));
                    },
                  })
                ) : (
                  <span
                    className={`block h-8 w-8 cursor-pointer rounded-full border-2 border-dashed transition-all ${
                      dragOver === seatId ? 'scale-125 border-[#4a5d23] bg-[#4a5d23]/25' : hot ? 'border-[#4a5d23]/50 bg-[#4a5d23]/5' : 'border-stone-300'
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
            >
              <Download size={13} /> Exportar
            </button>
            {exportOpen && (
              <>
                <button type="button" aria-label="Cerrar" className="fixed inset-0 z-30 cursor-default" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-10 z-40 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 text-left shadow-lg">
                  <button type="button" onClick={() => { setExportOpen(false); exportCSV(); }} className="block w-full px-3.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50">
                    Excel / CSV (mesa → invitados)
                  </button>
                  <button type="button" onClick={() => { setExportOpen(false); printPlan(); }} className="block w-full px-3.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50">
                    Plano imprimible (PDF)
                  </button>
                  <button type="button" onClick={() => { setExportOpen(false); printPlaceCards(); }} className="block w-full px-3.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50">
                    Tarjetas de sitio (PDF)
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="flex overflow-hidden rounded-full border border-stone-200">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
              className="px-2.5 py-2 text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
            >
              <Undo2 size={13} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Shift+Z)"
              className="border-l border-stone-200 px-2.5 py-2 text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
            >
              <Redo2 size={13} />
            </button>
          </div>
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

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            <AlertTriangle size={13} /> Avisos ({warnings.length})
          </div>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-800">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

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
            onDrop={(e) => { e.preventDefault(); const k = e.dataTransfer.getData('text/plain'); endDrag(); handleDrop(k, 'pool'); }}
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
                      <p
                        draggable={g.items.length > 1}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', `group:${g.party}`);
                          e.dataTransfer.effectAllowed = 'move';
                          requestAnimationFrame(() => { setDragKey(`group:${g.party}`); document.body.classList.add('select-none'); });
                        }}
                        onDragEnd={endDrag}
                        title={g.items.length > 1 ? 'Arrastra para sentar a toda la familia junta' : undefined}
                        className={`mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-400 ${
                          g.items.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: partyColor(g.party) }} />
                        {g.party}
                        <span className="text-stone-300">({g.items.length})</span>
                        {gtag && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#4a5d23]/10 px-1.5 text-[9px] text-[#4a5d23]">
                            <Tag size={9} /> {gtag}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.items.map((p) => (
                          <React.Fragment key={p.key}>
                            {chip(p, { onPick: () => setSelected((s) => (s === p.key ? null : p.key)) })}
                          </React.Fragment>
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
              <React.Fragment key={n}>{renderTable(n)}</React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
