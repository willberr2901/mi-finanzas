/**
 * ════════════════════════════════════════════════════════════════════
 * 🛒 DATOS DEL MERCADO (lista, compras e historial de precios)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: guarda la lista de mercado en este celular, tacha productos,
 *           detecta productos extra, recuerda precios y cierra cada mercado.
 * Dónde se ve: pantalla Mercado, tarjeta de Mercado en Inicio, avisos y PDF.
 * Sincroniza: cada cambio avisa a householdSync.ts (si hay hogar creado),
 *             que lo cifra y lo envía a los demás celulares del hogar.
 * Si lo cambias: revisa MarketPage.tsx y householdSync.ts.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { secureStorage } from '../../utils/security';
import { ownerLabel } from '../../utils/prefs';

// ═══ SECCIÓN: Tipos ═══
export type Unit = 'und' | 'lb' | 'kg' | 'l' | 'paq';
export const UNITS: { id: Unit; label: string; step: number }[] = [
  { id: 'und', label: 'und', step: 1 },
  { id: 'lb', label: 'lb', step: 0.5 },
  { id: 'kg', label: 'kg', step: 0.5 },
  { id: 'l', label: 'litro', step: 1 },
  { id: 'paq', label: 'paq', step: 1 },
];
export const unitLabel = (u: Unit) => UNITS.find(x => x.id === u)?.label ?? u;
export const unitStep = (u: Unit) => UNITS.find(x => x.id === u)?.step ?? 1;

export interface ListItem {
  id: string;
  name: string;
  qty: number;
  unit: Unit;
  checked: boolean;       // tachado (ya está en el carrito)
  paid?: number;          // precio pagado por unidad
  extra?: boolean;        // no estaba en la lista (antojo)
  addedBy?: string;       // nombre de quien lo agregó
  checkedBy?: string;     // nombre de quien lo tachó
  createdAt: number;
  rev: number;            // hora del último cambio (gana el más reciente)
  deleted?: boolean;      // borrado (se conserva un tiempo para avisar a los demás celulares)
}

export interface TripItem { name: string; qty: number; unit: Unit; price: number; extra?: boolean }
export interface Trip {
  id: string;
  date: string;           // ISO
  total: number;
  items: TripItem[];
  missing: string[];      // lo que quedó sin comprar
  estimate: number;       // lo que se esperaba gastar en lo comprado de la lista
  by?: string;
  rev: number;
  deleted?: boolean;
}

interface MarketState {
  items: Record<string, ListItem>;
  trips: Record<string, Trip>;
  budget: { value: number; rev: number };
}

// ═══ SECCIÓN: Guardado en el celular ═══
const KEY = 'mf_market_v2';
const EVENT = 'mf:market-changed';
const TOMBSTONE_DAYS = 45;

const empty = (): MarketState => ({ items: {}, trips: {}, budget: { value: 300000, rev: 0 } });
let state: MarketState = load();

function load(): MarketState {
  const saved = secureStorage.getItem(KEY);
  if (saved && typeof saved === 'object' && saved.items) return { ...empty(), ...saved };
  return migrateOld();
}

/** Pasa la lista y el historial de la versión anterior (v1.6) al formato nuevo, una sola vez. */
function migrateOld(): MarketState {
  const s = empty();
  const now = Date.now();
  const oldItems = secureStorage.getItem('marketItems');
  if (Array.isArray(oldItems)) for (const o of oldItems) {
    const id = String(o.id || crypto.randomUUID());
    s.items[id] = { id, name: String(o.name || '').trim(), qty: Number(o.quantity) || 1, unit: 'und', checked: !!o.purchased, paid: o.purchased ? Number(o.price) || undefined : undefined, createdAt: Number(o.id) || now, rev: now };
  }
  const oldHistory = secureStorage.getItem('marketHistory');
  if (Array.isArray(oldHistory)) for (const h of oldHistory) {
    const id = String(h.id || crypto.randomUUID());
    const items: TripItem[] = (h.items || []).map((i: any) => ({ name: String(i.name || '').trim(), qty: Number(i.quantity) || 1, unit: 'und' as Unit, price: Number(i.price) || 0 }));
    s.trips[id] = { id, date: h.date || new Date(now).toISOString(), total: Number(h.total) || 0, items, missing: [], estimate: 0, rev: now };
  }
  const b = secureStorage.getItem('marketBudget');
  if (typeof b === 'number' && b > 0) s.budget = { value: b, rev: now };
  secureStorage.setItem(KEY, s);
  return s;
}

/** Quién soy en este celular (para "Chumpi agregó leche"). */
export const myName = () => ownerLabel('yo');

type ChangeListener = (keys: string[]) => void;
const changeListeners = new Set<ChangeListener>();
/** householdSync se suscribe aquí para subir los cambios cifrados. */
export const onLocalChange = (fn: ChangeListener) => { changeListeners.add(fn); return () => changeListeners.delete(fn); };

function commit(changedKeys: string[], local = true) {
  // Limpia borrados viejos
  const limit = Date.now() - TOMBSTONE_DAYS * 86400000;
  for (const [id, it] of Object.entries(state.items)) if (it.deleted && it.rev < limit) delete state.items[id];
  for (const [id, t] of Object.entries(state.trips)) if (t.deleted && t.rev < limit) delete state.trips[id];
  secureStorage.setItem(KEY, state);
  window.dispatchEvent(new Event(EVENT));
  window.dispatchEvent(new Event('mf:data-changed'));
  if (local && changedKeys.length) changeListeners.forEach(fn => fn(changedKeys));
}

// ═══ SECCIÓN: Lectura ═══
export const getMarket = () => state;
export const listItems = () => Object.values(state.items).filter(i => !i.deleted).sort((a, b) => b.createdAt - a.createdAt);
export const tripsList = () => Object.values(state.trips).filter(t => !t.deleted).sort((a, b) => b.date.localeCompare(a.date));
export const getBudget = () => state.budget.value;

/** Hook de React: la pantalla se actualiza sola cuando cambia el mercado (aquí o en otro celular). */
export const useMarket = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick(t => t + 1);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return { items: listItems(), trips: tripsList(), budget: state.budget.value };
};

// ═══ SECCIÓN: Comparar nombres ("Arroz Diana" ≈ "arroz") ═══
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim()
  .split(' ').map(w => w.length > 3 ? w.replace(/(es|s)$/, '') : w).join(' ');

const score = (a: string, b: string) => {
  const x = norm(a), y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 100;
  const wx = x.split(' '), wy = y.split(' ');
  if (wx.every(w => wy.includes(w)) || wy.every(w => wx.includes(w))) return 85;   // "arroz" ⊂ "arroz diana"
  if (wx[0] === wy[0] && wx[0].length >= 3) return 70;                               // misma primera palabra
  return 0;
};

/** Busca en la lista (por comprar) el producto que más se parece a lo que se escribió. */
export const matchPending = (name: string): ListItem | null => {
  let best: ListItem | null = null, bestScore = 0;
  for (const it of listItems()) {
    if (it.checked) continue;
    const s = score(name, it.name);
    if (s > bestScore) { best = it; bestScore = s; }
  }
  return bestScore >= 70 ? best : null;
};

// ═══ SECCIÓN: Historial de precios ═══
export interface PricePoint { date: string; price: number; unit: Unit }

/** Precios pagados por un producto, del más reciente al más antiguo. */
export const priceHistory = (name: string): PricePoint[] => {
  const k = norm(name);
  const out: PricePoint[] = [];
  for (const t of tripsList()) {
    const found = t.items.find(i => norm(i.name) === k);
    if (found && found.price > 0) out.push({ date: t.date, price: found.price, unit: found.unit });
  }
  return out;
};
export const lastPrice = (name: string) => priceHistory(name)[0]?.price ?? null;

export type Trend = { dir: 'down' | 'up' | 'same'; diff: number; pct: number; before: number };
/** Compara un precio con el de la última compra: 🔻 bajó, 🔺 subió, 🟰 igual. */
export const trendOf = (name: string, price: number, skipLatest = false): Trend | null => {
  const h = priceHistory(name);
  const before = (skipLatest ? h[1] : h[0])?.price;
  if (!before || !price) return null;
  const diff = price - before;
  const pct = Math.round((Math.abs(diff) / before) * 100);
  return { dir: diff < 0 ? 'down' : diff > 0 ? 'up' : 'same', diff, pct, before };
};

/** Productos conocidos para sugerir mientras se escribe (más comprados primero). */
export const knownProducts = (): { name: string; price: number; unit: Unit; times: number }[] => {
  const map = new Map<string, { name: string; price: number; unit: Unit; times: number }>();
  for (const t of tripsList()) for (const i of t.items) {
    const k = norm(i.name);
    const cur = map.get(k);
    if (cur) cur.times++;
    else map.set(k, { name: i.name, price: i.price, unit: i.unit, times: 1 });
  }
  return [...map.values()].sort((a, b) => b.times - a.times);
};

/** Total aproximado de la lista según los últimos precios conocidos. */
export const estimateList = (items = listItems()) => {
  let total = 0, unknown = 0;
  for (const i of items) {
    const p = i.checked && i.paid ? i.paid : lastPrice(i.name);
    if (p) total += p * i.qty; else unknown++;
  }
  return { total: Math.round(total), unknown };
};

// ═══ SECCIÓN: Cambios en la lista ═══
const itemKey = (id: string) => `i:${id}`;
const tripKey = (id: string) => `t:${id}`;

export const addItem = (data: { name: string; qty?: number; unit?: Unit; checked?: boolean; paid?: number; extra?: boolean }) => {
  const now = Date.now();
  const id = crypto.randomUUID();
  const me = myName();
  state.items[id] = {
    id, name: data.name.trim().slice(0, 80), qty: data.qty ?? 1, unit: data.unit ?? 'und',
    checked: !!data.checked, paid: data.paid, extra: data.extra, addedBy: me,
    checkedBy: data.checked ? me : undefined, createdAt: now, rev: now,
  };
  commit([itemKey(id)]);
  return state.items[id];
};

export const updateItem = (id: string, patch: Partial<Omit<ListItem, 'id' | 'rev'>>) => {
  const it = state.items[id];
  if (!it) return;
  state.items[id] = { ...it, ...patch, rev: Date.now() };
  commit([itemKey(id)]);
};

/** Tacha (o destacha) un producto con el precio que se pagó. */
export const checkItem = (id: string, paid?: number, qty?: number, unit?: Unit) => {
  const it = state.items[id];
  if (!it) return;
  updateItem(id, { checked: true, paid: paid ?? it.paid, qty: qty ?? it.qty, unit: unit ?? it.unit, checkedBy: myName() });
};
export const uncheckItem = (id: string) => updateItem(id, { checked: false, checkedBy: undefined });

export const removeItem = (id: string) => {
  const it = state.items[id];
  if (!it) return;
  state.items[id] = { ...it, deleted: true, rev: Date.now() };
  commit([itemKey(id)]);
};

export const setBudget = (value: number) => {
  state.budget = { value: Math.max(0, Math.round(value)), rev: Date.now() };
  commit(['b:budget']);
};

/** "Lo de siempre": agrega lo del último mercado que no esté ya en la lista. */
export const repeatLastTrip = () => {
  const last = tripsList()[0];
  if (!last) return 0;
  const current = new Set(listItems().map(i => norm(i.name)));
  let n = 0;
  for (const i of last.items) {
    if (current.has(norm(i.name))) continue;
    addItem({ name: i.name, qty: i.qty, unit: i.unit });
    current.add(norm(i.name));
    n++;
  }
  return n;
};

/** Cierra el mercado: guarda la compra en el historial y deja en la lista lo que faltó. */
export const finishTrip = (): Trip | null => {
  const bought = listItems().filter(i => i.checked);
  if (!bought.length) return null;
  const missing = listItems().filter(i => !i.checked).map(i => i.name);
  const now = Date.now();
  const items: TripItem[] = bought.map(i => ({ name: i.name, qty: i.qty, unit: i.unit, price: i.paid || 0, extra: i.extra || undefined }));
  const estimate = bought.filter(i => !i.extra).reduce((s, i) => s + (lastPrice(i.name) ?? i.paid ?? 0) * i.qty, 0);
  const trip: Trip = {
    id: crypto.randomUUID(), date: new Date(now).toISOString(),
    total: Math.round(items.reduce((s, i) => s + i.price * i.qty, 0)),
    items, missing, estimate: Math.round(estimate), by: myName(), rev: now,
  };
  state.trips[trip.id] = trip;
  const keys = [tripKey(trip.id)];
  for (const i of bought) { state.items[i.id] = { ...i, deleted: true, rev: now }; keys.push(itemKey(i.id)); }
  commit(keys);
  return trip;
};

export const deleteTrip = (id: string) => {
  const t = state.trips[id];
  if (!t) return;
  state.trips[id] = { ...t, deleted: true, rev: Date.now() };
  commit([tripKey(id)]);
};

// ═══ SECCIÓN: Puente con la sincronización del hogar ═══
/** Todas las llaves lógicas (para subir todo al crear o unirse a un hogar). */
export const allKeys = () => [
  ...Object.keys(state.items).map(itemKey),
  ...Object.keys(state.trips).map(tripKey),
  'b:budget',
];

export const getDoc = (key: string): { rev: number } | null => {
  const [type, id] = [key.slice(0, 1), key.slice(2)];
  if (type === 'i') return state.items[id] ?? null;
  if (type === 't') return state.trips[id] ?? null;
  if (key === 'b:budget') return state.budget;
  return null;
};

export type RemoteChange =
  | { kind: 'added' | 'checked' | 'removed' | 'edited'; name: string }
  | { kind: 'trip'; total: number }
  | { kind: 'budget'; value: number };

/** Aplica lo que llegó de otro celular si es más reciente. Devuelve qué cambió (para avisar). */
export const applyRemote = (docs: { key: string; value: any }[]): RemoteChange[] => {
  const changes: RemoteChange[] = [];
  for (const { key, value } of docs) {
    if (!value || typeof value.rev !== 'number') continue;
    const cur = getDoc(key);
    if (cur && cur.rev >= value.rev) continue;
    const id = key.slice(2);
    if (key.startsWith('i:')) {
      const before = state.items[id];
      state.items[id] = value as ListItem;
      const it = value as ListItem;
      if (it.deleted) { if (before && !before.deleted && !before.checked) changes.push({ kind: 'removed', name: it.name }); }
      else if (!before || before.deleted) changes.push({ kind: it.checked ? 'checked' : 'added', name: it.name });
      else if (it.checked && !before.checked) changes.push({ kind: 'checked', name: it.name });
      else changes.push({ kind: 'edited', name: it.name });
    } else if (key.startsWith('t:')) {
      const before = state.trips[id];
      state.trips[id] = value as Trip;
      if (!before && !value.deleted) changes.push({ kind: 'trip', total: value.total });
    } else if (key === 'b:budget') {
      state.budget = value;
      changes.push({ kind: 'budget', value: value.value });
    }
  }
  commit([], false);
  return changes;
};
