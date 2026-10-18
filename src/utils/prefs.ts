import { useEffect, useState } from 'react';

// Preferencias de la app. Viven solo en este celular (no son datos financieros).
export type ThemePref = 'dark' | 'light' | 'system';

export interface Prefs {
  /** Día del mes en que entra el sueldo: el ciclo financiero empieza ese día (1 = mes calendario). */
  payDay: number;
  /** Nombres del hogar para "Yo" y "Mi pareja". */
  names: { yo: string; pareja: string };
  /** Límite mensual por categoría de gasto (en pesos). */
  budgets: Record<string, number>;
  /** Recordatorio diario para anotar los gastos. */
  reminder: { enabled: boolean; time: string };
  theme: ThemePref;
}

const KEY = 'mf_prefs';
const DEFAULTS: Prefs = {
  payDay: 1,
  names: { yo: '', pareja: '' },
  budgets: {},
  reminder: { enabled: false, time: '20:00' },
  theme: 'dark',
};

export const getPrefs = (): Prefs => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      ...DEFAULTS, ...raw,
      names: { ...DEFAULTS.names, ...(raw.names || {}) },
      reminder: { ...DEFAULTS.reminder, ...(raw.reminder || {}) },
      budgets: { ...(raw.budgets || {}) },
    };
  } catch { return { ...DEFAULTS }; }
};

/** Copia mínima para el service worker (no puede leer localStorage). */
const syncToWorker = async (p: Prefs) => {
  try {
    if (!('caches' in window)) return;
    const cache = await caches.open('mf-meta');
    await cache.put(new Request('/__mf_prefs'), new Response(JSON.stringify({ reminder: p.reminder, payDay: p.payDay, budgets: p.budgets })));
  } catch { /* sin almacenamiento disponible */ }
};

export const setPrefs = (patch: Partial<Prefs>) => {
  const next = { ...getPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* almacenamiento lleno o bloqueado */ }
  syncToWorker(next);
  window.dispatchEvent(new Event('mf:prefs-changed'));
  return next;
};

export const usePrefs = (): [Prefs, (patch: Partial<Prefs>) => void] => {
  const [prefs, set] = useState(getPrefs);
  useEffect(() => {
    const on = () => set(getPrefs());
    window.addEventListener('mf:prefs-changed', on);
    window.addEventListener('storage', on);
    return () => { window.removeEventListener('mf:prefs-changed', on); window.removeEventListener('storage', on); };
  }, []);
  return [prefs, (patch) => set(setPrefs(patch))];
};

// ───────────── Nombres del hogar ─────────────
export type Owner = 'yo' | 'pareja' | 'compartido';
export const ownerLabel = (o: Owner, p: Prefs = getPrefs()): string => {
  if (o === 'compartido') return 'Compartido';
  if (o === 'yo') return p.names.yo.trim() || localStorage.getItem('miFinanzasUserName') || 'Yo';
  return p.names.pareja.trim() || 'Mi pareja';
};

// ───────────── Ciclo según el día de pago ─────────────
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dayIn = (y: number, m: number, d: number) => new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate()));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface Cycle {
  start: Date;        // primer día del ciclo
  end: Date;          // último día del ciclo (incluido)
  startISO: string;
  endISO: string;
  days: number;       // duración total
  label: string;      // "octubre" o "15 oct – 14 nov"
  short: string;      // "oct" o "15 oct"
  isCalendar: boolean;
}

/** Ciclo financiero que contiene `ref`, desplazado `offset` ciclos (−1 = el anterior). */
export const cycleFor = (ref: Date = new Date(), payDay: number = getPrefs().payDay, offset = 0): Cycle => {
  const pd = Math.min(31, Math.max(1, Math.round(payDay || 1)));
  let y = ref.getFullYear(), m = ref.getMonth();
  if (ref.getDate() < dayIn(y, m, pd).getDate()) m -= 1;
  m += offset;
  const start = dayIn(y, m, pd);
  const nextStart = dayIn(start.getFullYear(), start.getMonth() + 1, pd);
  const end = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() - 1);
  const days = Math.round((nextStart.getTime() - start.getTime()) / 86400000);
  const isCalendar = pd === 1;
  return {
    start, end, startISO: iso(start), endISO: iso(end), days, isCalendar,
    label: isCalendar ? MONTHS[start.getMonth()] : `${start.getDate()} ${MON[start.getMonth()]} – ${end.getDate()} ${MON[end.getMonth()]}`,
    short: isCalendar ? MON[start.getMonth()] : `${start.getDate()} ${MON[start.getMonth()]}`,
  };
};

export const inCycle = (dateISO: string | undefined, c: Cycle) => !!dateISO && dateISO >= c.startISO && dateISO <= c.endISO;

/** Día dentro del ciclo (1..days) y días que faltan para el próximo pago. */
export const cycleProgress = (c: Cycle, ref: Date = new Date()) => {
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = Math.round((today.getTime() - c.start.getTime()) / 86400000) + 1;
  return { day: Math.max(1, Math.min(c.days, day)), left: Math.max(0, c.days - day) };
};
