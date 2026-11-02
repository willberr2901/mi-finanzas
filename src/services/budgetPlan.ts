/**
 * ════════════════════════════════════════════════════════════════════
 * 🤖 PLAN DE PRESUPUESTO (lo que calcula Kai)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace:
 *   • splitIncome: reparte el sueldo en Deudas · Necesidades · Gustos · Ahorro.
 *       - Deudas = la suma de las cuotas del mes.
 *       - Necesidades = lo que gastas en promedio en lo básico (arriendo, mercado,
 *         servicios, transporte, salud…). Si aún no hay datos: 42% del sueldo.
 *       - Ahorro = el % que elige la persona.
 *       - Gustos = lo que sobra.
 *     Si después de deudas y necesidades queda menos del 5% del sueldo,
 *     "no alcanza" y Kai propone primero liberar deuda.
 *   • payoffPlan: plan "bola de nieve": se termina primero la deuda más pequeña
 *     y su cuota se suma a la siguiente. Dice en qué mes termina cada una.
 *   • suggestBudgets: límite por categoría con 3 formas: según lo que gastas
 *     (promedio de 3 ciclos − 10%), regla 50/30/20, o con el plan de Kai.
 * Datos: solo en el celular (preferencias). Nada sale del teléfono.
 * ════════════════════════════════════════════════════════════════════
 */
import type { Transaction } from '../utils/database';
import { segmentOf } from '../utils/categories';
import { cycleFor, inCycle, syncWorkerMeta } from '../utils/prefs';

export type PayFreq = 'mensual' | 'quincenal';
export interface BudgetPlan {
  income: number;
  freq: PayFreq;
  /** Días del mes en que entra el sueldo (1 si es mensual, 2 si es quincenal). */
  payDays: number[];
  savingsPct: number;
  /** 'deuda' = hoy no alcanza para ahorrar: primero se libera deuda. */
  mode: 'ahorro' | 'deuda';
  createdAt: number;
}

export interface PlanDebt { name: string; balance: number; cuota: number }

/** Categorías a las que se les pone límite (arriendo, deudas y ahorro ya van por Pagos/Metas). */
export const BUDGET_CATS = ['Mercado', 'Servicios', 'Transporte', 'Salud', 'Hogar', 'Educación', 'Alimentación', 'Entretenimiento', 'Otros'] as const;
const NEED_CATS = ['Mercado', 'Servicios', 'Transporte', 'Salud', 'Hogar', 'Educación'];
const WANT_CATS = ['Alimentación', 'Entretenimiento', 'Otros'];
/** Reparto típico cuando aún no hay historia. */
const DEFAULT_W: Record<string, number> = { Mercado: 0.42, Servicios: 0.2, Transporte: 0.2, Salud: 0.07, Hogar: 0.06, 'Educación': 0.05, 'Alimentación': 0.45, Entretenimiento: 0.35, Otros: 0.2 };
export const DEFAULT_NEEDS_PCT = 0.42;
export const MIN_FREE_PCT = 0.05;

const r1000 = (n: number) => Math.max(0, Math.round(n / 1000) * 1000);

// ───────────── Historia: promedio por categoría de los últimos ciclos ─────────────
export interface History { cycles: number; byCat: Map<string, number>; needs: number }
export const historyOf = (tx: Transaction[], payDay: number, ref = new Date(), back = 3): History => {
  const sums = new Map<string, number>();
  let cycles = 0;
  for (let i = 1; i <= back; i++) {
    const c = cycleFor(ref, payDay, -i);
    const list = tx.filter(t => t.type === 'expense' && inCycle(t.date, c));
    if (!list.length) continue;
    cycles++;
    for (const t of list) sums.set(t.category, (sums.get(t.category) ?? 0) + t.amount);
  }
  const byCat = new Map<string, number>();
  sums.forEach((v, k) => byCat.set(k, v / Math.max(1, cycles)));
  let needs = 0;
  byCat.forEach((v, k) => { const s = segmentOf('expense', k); if ((s === 'obligatorio' || s === 'necesario') && k !== 'Deudas') needs += v; });
  return { cycles, byCat, needs };
};

// ───────────── Reparto del sueldo ─────────────
export interface Split { deudas: number; necesidades: number; gustos: number; ahorro: number; free: number; fits: boolean; maxPct: number }
export const splitIncome = (income: number, debtsMonthly: number, savingsPct: number, needsBase?: number): Split => {
  const inc = Math.max(0, income);
  const deudas = Math.max(0, debtsMonthly);
  const necesidades = Math.max(0, Math.min(Math.max(0, inc - deudas), needsBase && needsBase > 0 ? needsBase : inc * DEFAULT_NEEDS_PCT));
  const free = inc - deudas - necesidades;
  const fits = inc > 0 && free >= inc * MIN_FREE_PCT;
  const maxPct = inc > 0 ? Math.max(0, Math.min(30, Math.floor((free / inc) * 100))) : 0;
  const pct = Math.max(0, Math.min(savingsPct, maxPct));
  const ahorro = fits ? r1000(inc * pct / 100) : 0;
  const gustos = Math.max(0, free - ahorro);
  return { deudas, necesidades, gustos, ahorro, free, fits, maxPct };
};

// ───────────── Plan para liberar deuda (bola de nieve) ─────────────
export interface PayoffStep { name: string; cuota: number; months: number; date: Date }
export const payoffPlan = (debts: PlanDebt[], start = new Date(), extra = 0): PayoffStep[] => {
  const list = debts.filter(d => d.balance > 0 && d.cuota > 0).map(d => ({ ...d, left: d.balance })).sort((a, b) => a.balance - b.balance);
  const out: PayoffStep[] = [];
  let freed = Math.max(0, extra);
  for (let m = 1; m <= 240 && out.length < list.length; m++) {
    // La plata liberada va a la deuda activa más pequeña
    const active = list.filter(d => d.left > 0);
    let bonus = freed;
    for (const d of active) {
      const pay = d.cuota + (d === active[0] ? bonus : 0);
      if (d === active[0]) bonus = 0;
      d.left -= pay;
      if (d.left <= 0) {
        out.push({ name: d.name, cuota: d.cuota, months: m, date: new Date(start.getFullYear(), start.getMonth() + m, 1) });
        freed += d.cuota;
      }
    }
  }
  return out;
};

// ───────────── Presupuesto por categoría ─────────────
export type BudgetMethod = 'promedio' | '503020' | 'plan';
export interface BudgetRow { cat: string; avg: number; value: number }

const distribute = (pool: number, cats: string[], hist: Map<string, number>): BudgetRow[] => {
  const histTotal = cats.reduce((a, c) => a + (hist.get(c) ?? 0), 0);
  const useHist = histTotal > 0;
  const wTotal = cats.reduce((a, c) => a + (useHist ? hist.get(c) ?? 0 : DEFAULT_W[c] ?? 0), 0) || 1;
  return cats.map(c => ({ cat: c, avg: hist.get(c) ?? 0, value: r1000(pool * ((useHist ? hist.get(c) ?? 0 : DEFAULT_W[c] ?? 0) / wTotal)) }))
    .filter(r => r.value > 0);
};

/**
 * Sugerencia de límites. `fixed` = lo que ya se va en arriendo (Pagos o promedio),
 * que se descuenta de las necesidades porque no lleva límite.
 */
export const suggestBudgets = (method: BudgetMethod, opts: { hist: History; income: number; split?: Split; fixed?: number }): BudgetRow[] => {
  const { hist, income } = opts;
  const fixed = Math.max(0, opts.fixed ?? hist.byCat.get('Arriendo') ?? 0);
  if (method === 'promedio') {
    return BUDGET_CATS.map(c => ({ cat: c as string, avg: hist.byCat.get(c) ?? 0, value: r1000((hist.byCat.get(c) ?? 0) * 0.9) })).filter(r => r.avg > 0);
  }
  if (method === '503020') {
    const debts = hist.byCat.get('Deudas') ?? 0;
    return [...distribute(Math.max(0, income * 0.5 - fixed - debts), NEED_CATS, hist.byCat), ...distribute(income * 0.3, WANT_CATS, hist.byCat)];
  }
  const sp = opts.split ?? splitIncome(income, 0, 0, hist.needs || undefined);
  return [...distribute(Math.max(0, sp.necesidades - fixed), NEED_CATS, hist.byCat), ...distribute(sp.gustos, WANT_CATS, hist.byCat)];
};

/** Día del ciclo según los días de pago: el ciclo arranca en el primer pago del mes. */
export const cyclePayDay = (payDays: number[]) => Math.max(1, Math.min(31, Math.min(...payDays.filter(d => d > 0)) || 1));

/** Próximo día de pago (fecha) a partir de hoy. */
export const nextPayDate = (payDays: number[], ref = new Date()): Date => {
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const cands: Date[] = [];
  for (let k = 0; k < 2; k++) for (const d of payDays) {
    const y = today.getFullYear(), m = today.getMonth() + k;
    const last = new Date(y, m + 1, 0).getDate();
    cands.push(new Date(y, m, Math.min(d, last)));
  }
  return cands.filter(d => d >= today).sort((a, b) => a.getTime() - b.getTime())[0] ?? today;
};

const PLAN_KEY = 'mf_budget_plan';
export const getPlan = (): BudgetPlan | null => { try { const p = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null'); return p && p.income > 0 ? p : null; } catch { return null; } };
export const savePlan = (p: BudgetPlan) => {
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); } catch { /* sin almacenamiento */ }
  syncWorkerMeta();
  window.dispatchEvent(new Event('mf:prefs-changed'));
};
export const openAssistant = () => window.dispatchEvent(new Event('mf:open-assistant'));
export const openBudgetCalc = () => window.dispatchEvent(new Event('mf:open-budget-calc'));
