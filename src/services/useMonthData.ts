/**
 * ════════════════════════════════════════════════════════════════════
 * 📐 CUENTAS DEL MES (las usan Inicio y Análisis del mes)
 * ────────────────────────────────────────────────────────────────────
 * Lee movimientos, metas, pagos y deudas del celular y calcula:
 *   • lo que entró y salió en el ciclo, comparado con el anterior
 *   • los 3 anillos: gastado (lima) · días del mes (azul) · ahorro o deudas (rosado)
 *   • cuánto puedes gastar por día y cuándo te pagan
 * Solo lee; no guarda nada. Se recalcula cuando cambian los datos ('mf:data-changed').
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { db, type Transaction, type SavingsGoal, type Bill } from '../utils/database';
import { loadBillStatuses, type BillStatus } from './billsService';
import { parseLocalDate, todayISO } from '../utils/format';
import { segmentOf } from '../utils/categories';
import { usePrefs, cycleFor, inCycle, cycleProgress } from '../utils/prefs';
import { computeHealth } from './healthScore';
import { getPlan, nextPayDate } from './budgetPlan';

export const SEGS = ['obligatorio', 'necesario', 'gusto', 'ahorro'] as const;
export type Seg = typeof SEGS[number];

export function useMonthData() {
  const [tx, setTx] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<BillStatus[]>([]);
  const [debts, setDebts] = useState<Bill[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [prefs] = usePrefs();

  useEffect(() => {
    const load = () => Promise.all([db.transactions.toArray(), db.goals.toArray(), loadBillStatuses(), db.bills.where('kind').equals('deuda').toArray()])
      .then(([t, g, b, d]) => { setTx(t); setGoals(g); setBills(b); setDebts(d.filter(x => x.active)); })
      .catch(() => {})
      .finally(() => setLoaded(true));
    load();
    window.addEventListener('mf:data-changed', load);
    return () => window.removeEventListener('mf:data-changed', load);
  }, []);

  const todayKey = todayISO();
  const cycle = useMemo(() => cycleFor(new Date(todayKey + 'T12:00'), prefs.payDay), [todayKey, prefs.payDay]);
  const prevCycle = useMemo(() => cycleFor(new Date(todayKey + 'T12:00'), prefs.payDay, -1), [todayKey, prefs.payDay]);
  const { day: dayOfCycle, left: daysLeft } = cycleProgress(cycle);

  const s = useMemo(() => {
    const inC = (c: typeof cycle) => tx.filter(t => inCycle(t.date, c));
    const sum = (list: Transaction[], type: 'income' | 'expense') => list.filter(t => t.type === type).reduce((a, t) => a + t.amount, 0);
    const cur = inC(cycle), prev = inC(prevCycle);
    const income = sum(cur, 'income'), expense = sum(cur, 'expense');
    const prevExpense = sum(prev, 'expense'), prevIncome = sum(prev, 'income');
    // Gastos al mismo día del ciclo anterior, para comparar justo
    const cutoff = new Date(prevCycle.start.getFullYear(), prevCycle.start.getMonth(), prevCycle.start.getDate() + dayOfCycle - 1);
    const prevSameDay = prev.filter(t => t.type === 'expense' && parseLocalDate(t.date) <= cutoff).reduce((a, t) => a + t.amount, 0);
    const split = { obligatorio: 0, necesario: 0, gusto: 0, ahorro: 0 } as Record<Seg, number>;
    const byCat = new Map<string, number>();
    for (const t of cur) if (t.type === 'expense') {
      split[segmentOf('expense', t.category) as Seg] += t.amount;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    }
    const months = Array.from({ length: 6 }, (_, i) => {
      const c = cycleFor(new Date(todayKey + 'T12:00'), prefs.payDay, i - 5);
      return { label: c.short, value: sum(inC(c), 'expense'), current: i === 5 };
    });
    // Lo obligatorio se paga una vez; solo el gasto del día a día se proyecta.
    const variable = cur.filter(t => t.type === 'expense' && segmentOf('expense', t.category) !== 'obligatorio').reduce((a, t) => a + t.amount, 0);
    const perDay = variable / Math.max(1, dayOfCycle);
    return {
      income, expense, prevExpense, prevIncome, split, months, perDay, byCat,
      projection: expense + perDay * daysLeft,
      cur,
      top: [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
      expenseDelta: prevSameDay > 0 ? ((expense - prevSameDay) / prevSameDay) * 100 : null,
      incomeDelta: prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : null,
    };
  }, [tx, cycle, prevCycle, dayOfCycle, daysLeft, todayKey, prefs.payDay]);

  const plan = getPlan();
  const base = Math.max(s.income, plan?.income ?? 0);
  const left = base - s.expense;
  const savingTarget = plan ? Math.round((plan.income * plan.savingsPct) / 100) : Math.round(base * 0.1);
  const savedNow = s.split.ahorro;
  const health = useMemo(() => computeHealth({ income: s.income, expense: s.expense, gustos: s.split.gusto, bills }), [s, bills]);
  const upcoming = bills.filter(b => !b.paid);
  const debtBills = bills.filter(b => b.bill.kind === 'deuda' || b.bill.kind === 'tarjeta');
  const debtDue = debtBills.reduce((a, b) => a + (b.payment?.amount ?? b.bill.amount), 0);
  const debtPaidNow = debtBills.filter(b => b.paid).reduce((a, b) => a + (b.payment?.amount ?? 0), 0);
  const rings = [
    { label: 'Gastado', pct: base ? (s.expense / base) * 100 : 0, color: 'rgb(var(--brand))' },
    { label: 'Mes', pct: (dayOfCycle / cycle.days) * 100, color: '#7DD3FC' },
    plan?.mode === 'deuda'
      ? { label: 'Deudas', pct: debtDue ? (debtPaidNow / debtDue) * 100 : 0, color: '#F9A8D4' }
      : { label: 'Ahorro', pct: savingTarget ? (savedNow / savingTarget) * 100 : 0, color: '#F9A8D4' },
  ];
  const pendingBills = upcoming.reduce((a, b) => a + b.bill.amount, 0);
  const perDayAllowed = Math.max(0, (left - pendingBills - Math.max(0, (plan?.mode === 'deuda' ? 0 : savingTarget) - savedNow)) / (daysLeft + 1));
  const nextPay = plan ? nextPayDate(plan.payDays) : null;
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const payIn = nextPay ? Math.round((nextPay.getTime() - today0.getTime()) / 86400000) : daysLeft;
  const payInfo = nextPay ? (payIn === 0 ? 'Hoy te pagan 💚' : payIn === 1 ? 'Mañana te pagan' : `Te pagan en ${payIn} días (el ${nextPay.getDate()})`)
    : daysLeft === 0 ? (cycle.isCalendar ? 'Último día del mes' : 'Mañana te pagan') : cycle.isCalendar ? `Faltan ${daysLeft} días para fin de mes` : `Faltan ${daysLeft} días para tu pago`;
  const debtLeft = debts.reduce((a, d) => a + Math.max(0, (d.totalInstallments ?? 0) - (d.paidInstallments ?? 0)) * d.amount, 0);

  return {
    tx, goals, bills, debts, loaded, prefs, cycle, prevCycle, dayOfCycle, daysLeft, s, plan, base, left, savingTarget, savedNow,
    health, upcoming, rings, perDayAllowed, nextPay, payIn, payInfo, debtLeft,
  };
}
