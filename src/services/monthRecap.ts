/**
 * ════════════════════════════════════════════════════════════════════
 * 📊 RESUMEN DE FIN DE MES (como Copilot o Monarch, pero dentro del celular)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: compara el mes (ciclo de pago) que terminó con el anterior y arma
 *           un resumen corto: cuánto entró y salió, cuánto ahorraste, en qué
 *           gastaste más, qué subió, qué bajó y un consejo.
 * Dónde se ve: Inicio (tarjeta los primeros 10 días del mes) → historia a pantalla completa
 *              (components/home/MonthRecap.tsx).
 * Todo se calcula en el celular. Pruebas: src/__tests__/resumen-mes.test.ts.
 * ════════════════════════════════════════════════════════════════════
 */
import type { Transaction } from '../utils/database';

export interface CatChange { category: string; now: number; before: number; diff: number; pct: number }
export interface Recap {
  income: number; expense: number; saved: number; savedPct: number;
  count: number; days: number; perDay: number;
  top: { category: string; amount: number; share: number }[];
  up: CatChange | null;     // la categoría que más subió
  down: CatChange | null;   // la que más bajó (buena noticia)
  vsPrev: { expense: number; pct: number } | null;
  biggest: Transaction | null;
  tip: string;
}

const sumBy = (tx: Transaction[]) => {
  const m = new Map<string, number>();
  for (const t of tx) if (t.type === 'expense') m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
  return m;
};

/** Arma el resumen de un mes: `cur` = movimientos del mes, `prev` = del mes anterior. */
export function buildRecap(cur: Transaction[], prev: Transaction[], days: number): Recap | null {
  if (!cur.length) return null;
  const income = cur.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenses = cur.filter(t => t.type === 'expense');
  const expense = expenses.reduce((a, t) => a + t.amount, 0);
  const saved = income - expense;
  const by = sumBy(cur), byPrev = sumBy(prev);
  const top = [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([category, amount]) => ({ category, amount, share: expense ? amount / expense : 0 }));

  const changes: CatChange[] = [];
  for (const cat of new Set([...by.keys(), ...byPrev.keys()])) {
    const now = by.get(cat) ?? 0, before = byPrev.get(cat) ?? 0;
    if (!before || Math.abs(now - before) < 10000) continue;   // ignora cambios chiquitos
    changes.push({ category: cat, now, before, diff: now - before, pct: (now - before) / before });
  }
  const up = changes.filter(c => c.diff > 0).sort((a, b) => b.diff - a.diff)[0] ?? null;
  const down = changes.filter(c => c.diff < 0).sort((a, b) => a.diff - b.diff)[0] ?? null;
  const prevExpense = prev.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const vsPrev = prevExpense ? { expense: prevExpense, pct: (expense - prevExpense) / prevExpense } : null;
  const biggest = [...expenses].sort((a, b) => b.amount - a.amount)[0] ?? null;
  const savedPct = income ? saved / income : 0;

  let tip = 'Registra tus ingresos para ver cuánto lograste ahorrar el próximo mes.';
  if (income) {
    if (saved < 0) tip = `Gastaste más de lo que entró. Prueba poner un límite a ${top[0]?.category ?? 'tus gastos'} en Presupuestos.`;
    else if (savedPct < 0.1) tip = 'Intenta separar el 10% apenas te paguen: lo que no ves, no lo gastas.';
    else if (up) tip = `Vas bien. Ojo con ${up.category}: subió ${Math.round(up.pct * 100)}% frente al mes pasado.`;
    else tip = '¡Excelente mes! Pon ese ahorro en una meta para que no se te vaya en gustos.';
  }
  return { income, expense, saved, savedPct, count: cur.length, days, perDay: days ? expense / days : 0, top, up, down, vsPrev, biggest, tip };
}

// ═══ ¿Ya vio el resumen de este mes? (solo en el celular) ═══
const SEEN = 'mf_recap_seen';
export const recapSeen = (key: string) => { try { return localStorage.getItem(SEEN) === key; } catch { return false; } };
export const markRecapSeen = (key: string) => { try { localStorage.setItem(SEEN, key); } catch { /* sin almacenamiento */ } };
