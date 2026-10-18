/**
 * ════════════════════════════════════════════════════════════════════
 * 🏠 PANTALLA INICIO
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Resumen del ciclo: 1) saldo del mes, 2) indicadores, presupuestos, 3) pagos del mes, 4) tendencia, 5) en qué se va la plata, 6) mercado y metas, 7) deudas y salud financiera.
 * Dónde se ve: Al abrir la app.
 * Si lo cambias: Solo lee datos; no guarda nada. Cada bloque tiene su comentario numerado (1. … 7.).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowDownRight, ArrowUpRight, ChevronRight, CalendarClock, ShoppingCart, Target, Landmark, Gauge, CalendarDays, TrendingUp, Wallet, Flame } from 'lucide-react';
import { db, type Transaction, type SavingsGoal, type Bill } from '../utils/database';
import { calculateHealthScore } from '../services/financialIntelligence';
import { loadBillStatuses, type BillStatus } from '../services/billsService';
import { formatCOP, parseLocalDate, todayISO } from '../utils/format';
import { segmentOf, SEGMENT_INFO } from '../utils/categories';
import { getMarketHistory } from '../utils/marketHistory';
import { listItems, getBudget, estimateList } from '../services/market/marketStore';
import ModuleHeader from '../components/ui/ModuleHeader';
import CountUp from '../components/ui/CountUp';
import { usePageTour } from '../components/tour/Tour';
import { usePrefs, cycleFor, inCycle, cycleProgress } from '../utils/prefs';
import BudgetsCard from '../components/home/BudgetsCard';
import { amountsHidden, setAmountsHidden } from '../utils/privacyMask';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const SEGS = ['obligatorio', 'necesario', 'gusto', 'ahorro'] as const;
const SEG_HEX: Record<typeof SEGS[number], string> = { obligatorio: '#C6F432', necesario: '#8792C4', gusto: '#F59E0B', ahorro: '#5EEAD4' };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 22, stiffness: 200 } } };

const Card = ({ children, className = '', ...rest }: any) => (
  <motion.div variants={item} className={`bg-surface border border-white/5 rounded-[26px] p-4 ${className}`} {...rest}>{children}</motion.div>
);
const Title = ({ icon: Icon, color, children, to, link }: { icon: any; color: string; children: any; to?: string; link?: string }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className={`w-8 h-8 rounded-xl bg-gradient-to-br theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10 flex items-center justify-center ${color ? "" : ""}`}><Icon size={16} className="text-brand-lime" /></span>
      <h2 className="text-white font-bold text-[15px]">{children}</h2>
    </div>
    {to && <Link to={to} className="text-xs text-slate-300 font-semibold flex items-center">{link}<ChevronRight size={14} /></Link>}
  </div>
);
const Delta = ({ pct, goodWhenDown = true }: { pct: number | null; goodWhenDown?: boolean }) => {
  if (pct === null || !isFinite(pct)) return <span className="text-[11px] text-white/60">sin mes anterior</span>;
  const up = pct > 0; const good = goodWhenDown ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${good ? 'text-emerald-300' : 'text-rose-300'}`}><Icon size={13} />{Math.abs(Math.round(pct))}%</span>;
};

export default function HomePage() {
  const [tx, setTx] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<BillStatus[]>([]);
  const [debts, setDebts] = useState<Bill[]>([]);
  const name = localStorage.getItem('miFinanzasUserName');
  const [prefs] = usePrefs();

  usePageTour('inicio', [
    { target: 'menu', title: 'Tu menú', text: 'Aquí están todos los módulos: Mercado, Finanzas, Pagos, el escáner de facturas y Ajustes.' },
    { target: 'home-hero', title: 'Tu mes en un vistazo', text: 'Cuánto ha entrado, cuánto has gastado y cuánto te queda este mes. También ves si gastas más o menos que el mes pasado.' },
    { target: 'home-pagos', title: 'Pagos del mes', text: 'Tus pagos fijos y deudas con los días que faltan para cada uno. Toca uno para ir a pagarlo.' },
    { target: 'fab', title: 'Registro rápido', text: 'Con este botón registras un gasto, un ingreso, un producto del mercado o un pago, desde cualquier pantalla.' },
    { target: 'bell', title: 'Tus avisos', text: 'La campana te avisa de pagos por vencer y si te pasas del presupuesto. Desde ahí activas los avisos en el celular.' },
  ]);

  useEffect(() => {
    const load = () => Promise.all([db.transactions.toArray(), db.goals.toArray(), loadBillStatuses(), db.bills.where('kind').equals('deuda').toArray()])
      .then(([t, g, b, d]) => { setTx(t); setGoals(g); setBills(b); setDebts(d.filter(x => x.active)); })
      .catch(() => {});
    load();
    window.addEventListener('mf:data-changed', load);
    return () => window.removeEventListener('mf:data-changed', load);
  }, []);

  const now = new Date();
  const todayKey = todayISO();
  // ═══ SECCIÓN: Cálculos del ciclo (lo que entra, lo que sale, proyección) ═══
  // Ciclo financiero: del día de pago al día anterior del siguiente pago (o el mes calendario).
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
    const split = { obligatorio: 0, necesario: 0, gusto: 0, ahorro: 0 } as Record<typeof SEGS[number], number>;
    const byCat = new Map<string, number>();
    for (const t of cur) if (t.type === 'expense') {
      split[segmentOf('expense', t.category) as typeof SEGS[number]] += t.amount;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    }
    const months = Array.from({ length: 6 }, (_, i) => {
      const c = cycleFor(new Date(todayKey + 'T12:00'), prefs.payDay, i - 5);
      return { label: c.short, value: sum(inC(c), 'expense'), current: i === 5 };
    });
    // Lo obligatorio (arriendo, servicios, deudas, mercado grande) se paga una vez; solo el gasto del día a día se proyecta.
    const variable = cur.filter(t => t.type === 'expense' && segmentOf('expense', t.category) !== 'obligatorio').reduce((a, t) => a + t.amount, 0);
    const perDay = variable / Math.max(1, dayOfCycle);
    return {
      income, expense, prevExpense, prevIncome, split, months, perDay,
      projection: expense + perDay * daysLeft,
      cur,
      top: [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
      expenseDelta: prevSameDay > 0 ? ((expense - prevSameDay) / prevSameDay) * 100 : null,
      incomeDelta: prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : null,
    };
  }, [tx, cycle, prevCycle, dayOfCycle, daysLeft, todayKey, prefs.payDay]);

  const balance = s.income - s.expense;
  const spentPct = s.income > 0 ? Math.round((s.expense / s.income) * 100) : 0;
  const totalBalance = tx.reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0);
  const recent = tx.some(t => now.getTime() - parseLocalDate(t.date).getTime() < 30 * 86400000);
  const health = recent ? calculateHealthScore(tx, goals, totalBalance) : null;
  const hColor = !health ? '#6A7396' : health.total >= 80 ? '#C6F432' : health.total >= 60 ? '#A3E64F' : health.total >= 40 ? '#fbbf24' : '#f87171';
  const hLabel = !health ? 'Faltan datos' : health.total >= 80 ? 'Excelente' : health.total >= 60 ? 'Buen camino' : health.total >= 40 ? 'Ajustar hábitos' : 'Requiere atención';

  const billTotal = bills.reduce((a, b) => a + (b.payment?.amount ?? b.bill.amount), 0);
  const billPaid = bills.filter(b => b.paid).reduce((a, b) => a + (b.payment?.amount ?? 0), 0);
  const billPct = billTotal ? Math.round((billPaid / billTotal) * 100) : 0;
  const upcoming = bills.filter(b => !b.paid);
  const debtLeft = debts.reduce((a, d) => a + Math.max(0, (d.totalInstallments ?? 0) - (d.paidInstallments ?? 0)) * d.amount, 0);

  // Mercado: total aproximado de la lista actual (services/market/marketStore.ts)
  const marketList = listItems();
  const marketBudget = getBudget();
  const listTotal = estimateList(marketList).total;
  const lastMarket = getMarketHistory()[0];
  const maxMonth = Math.max(1, ...s.months.map(m => m.value));
  const segTotal = SEGS.reduce((a, k) => a + s.split[k], 0);

  // Donut de segmentos
  let acc = 0;
  const arcs = SEGS.filter(k => s.split[k] > 0).map(k => { const frac = s.split[k] / Math.max(1, segTotal); const a = { k, frac, offset: acc }; acc += frac; return a; });
  const C = 2 * Math.PI * 38;

  return (
    <div className="pb-28">
      <ModuleHeader module="inicio" title={name ? `Hola, ${name}` : 'Mi Finanzas'} subtitle={`${DAYS[now.getDay()][0].toUpperCase()}${DAYS[now.getDay()].slice(1)} ${now.getDate()} de ${MONTHS[now.getMonth()]}`} />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {/* 1. Resumen del mes */}
        <motion.div data-tour="home-hero" variants={item} className="relative overflow-hidden rounded-[30px] p-5 bg-gradient-to-br theme-dark from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20 shadow-2xl shadow-black/50">
          <motion.div className="absolute -top-16 -right-10 w-52 h-52 bg-lime-300/20 rounded-full blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} aria-hidden="true" />
          <div className="relative flex gap-4 items-center">
            <div className="flex-1 min-w-0">
              {s.income > 0 ? (
                <>
                  <div className="flex items-center gap-2"><p className="text-white/80 text-sm">{balance >= 0 ? (cycle.isCalendar ? `Te queda en ${cycle.label}` : 'Te queda en este ciclo') : `Gastaste más de lo que entró`}</p><button onClick={() => setAmountsHidden(!amountsHidden())} aria-label={amountsHidden() ? 'Mostrar saldos' : 'Ocultar saldos'} aria-pressed={amountsHidden()} className="w-7 h-7 shrink-0 rounded-lg bg-white/[0.08] ring-1 ring-white/10 flex items-center justify-center text-white/90 active:scale-90 transition-transform">{amountsHidden() ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
                  <CountUp value={Math.abs(balance)} className={`block text-[34px] leading-tight font-extrabold tracking-tight ${balance >= 0 ? 'text-brand-lime' : 'text-rose-300'}`} />
                  <p className="text-white/75 text-xs">{balance >= 0 ? `de ${formatCOP(s.income)} que entraron` : `por encima de tus ingresos de ${formatCOP(s.income)}`}</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2"><p className="text-white/80 text-sm">{cycle.isCalendar ? `Gastos de ${cycle.label}` : 'Gastos de este ciclo'}</p><button onClick={() => setAmountsHidden(!amountsHidden())} aria-label={amountsHidden() ? 'Mostrar saldos' : 'Ocultar saldos'} aria-pressed={amountsHidden()} className="w-7 h-7 shrink-0 rounded-lg bg-white/[0.08] ring-1 ring-white/10 flex items-center justify-center text-white/90 active:scale-90 transition-transform">{amountsHidden() ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
                  <CountUp value={s.expense} className="block text-[34px] leading-tight font-extrabold text-white tracking-tight" />
                  <Link to="/finanzas" className="inline-block mt-1 text-[11px] text-white bg-white/20 rounded-full px-2.5 py-1">+ Registra tus ingresos para ver cuánto te queda</Link>
                </>
              )}
            </div>
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" />
                <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#C6F432" strokeWidth="10" strokeLinecap="round" strokeDasharray={263.9}
                  initial={{ strokeDashoffset: 263.9 }} animate={{ strokeDashoffset: 263.9 * (1 - Math.min(spentPct, 100) / 100) }} transition={{ duration: 1.3, delay: 0.3 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-xl font-extrabold">{s.income > 0 ? `${spentPct}%` : '—'}</span>
                <span className="text-[9px] text-white/80">gastado</span>
              </div>
            </div>
          </div>
          <div className="relative flex items-center gap-2 mt-3 text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] ring-1 ring-white/10 px-2.5 py-1"><CalendarDays size={12} className="text-brand-lime" />{cycle.isCalendar ? `${cycle.label[0].toUpperCase()}${cycle.label.slice(1)}` : cycle.label}</span>
            <span>{daysLeft === 0 ? (cycle.isCalendar ? 'Último día del mes' : 'Mañana te pagan') : cycle.isCalendar ? `Faltan ${daysLeft} días para fin de mes` : `Faltan ${daysLeft} días para tu pago`}</span>
          </div>
          <div className="relative grid grid-cols-2 gap-2 mt-3">
            <Link to="/finanzas" className="bg-white/[0.06] ring-1 ring-white/10 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] text-white/80">Entró</p>
              <p className="text-white font-bold">{formatCOP(s.income)}</p>
              <Delta pct={s.incomeDelta} goodWhenDown={false} />
            </Link>
            <Link to="/finanzas" className="bg-white/[0.06] ring-1 ring-white/10 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] text-white/80">Salió</p>
              <p className="text-white font-bold">{formatCOP(s.expense)}</p>
              <span className="flex items-center gap-1"><Delta pct={s.expenseDelta} /><span className="text-[10px] text-white/60">vs. {prevCycle.isCalendar ? prevCycle.short : 'ciclo ant.'}</span></span>
            </Link>
          </div>
        </motion.div>

        {/* 2. Indicadores */}
        <motion.div variants={item} className="grid grid-cols-3 gap-2">
          {[
            { icon: Flame, label: 'Gasto diario (sin fijos)', value: formatCOP(s.perDay), color: 'text-orange-300' },
            { icon: TrendingUp, label: cycle.isCalendar ? 'Así cierras el mes' : 'Así cierras el ciclo', value: formatCOP(s.projection), color: s.income && s.projection > s.income ? 'text-rose-300' : 'text-cyan-300' },
            { icon: CalendarDays, label: cycle.isCalendar ? 'Días para fin de mes' : 'Días para tu pago', value: String(daysLeft), color: 'text-violet-300' },
          ].map(k => (
            <div key={k.label} className="bg-surface border border-white/5 rounded-2xl p-3">
              <k.icon size={16} className={k.color} />
              <p className={`font-extrabold text-[15px] mt-1.5 ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{k.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Presupuestos por categoría */}
        <BudgetsCard expenses={s.cur.filter(t => t.type === 'expense')} budgets={prefs.budgets} daysLeft={daysLeft} />

        {/* 3. Pagos del mes */}
        <Card data-tour="home-pagos">
          <Title icon={CalendarClock} color="from-amber-500 to-orange-500" to="/pagos" link="Calendario">Pagos del mes</Title>
          {bills.length === 0 ? (
            <Link to="/pagos" className="block rounded-2xl p-4 bg-gradient-to-r from-amber-500/15 to-orange-500/5 border border-amber-500/25">
              <p className="text-white font-semibold text-sm">Programa tus pagos fijos</p>
              <p className="text-slate-400 text-xs mt-1">Arriendo, servicios, tarjetas y créditos se repiten solos cada mes y te avisamos antes de que venzan.</p>
            </Link>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white text-2xl font-extrabold">{billPct}%<span className="text-sm text-slate-400 font-medium"> pagado</span></p>
                  <p className="text-[11px] text-slate-400">{formatCOP(billPaid)} de {formatCOP(billTotal)}</p>
                </div>
                <p className="text-[11px] text-slate-400 text-right">{upcoming.length ? `${upcoming.length} por pagar` : '¡Todo pagado!'}</p>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 mt-2 overflow-hidden flex">
                <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-lime-300" initial={{ width: 0 }} animate={{ width: `${billPct}%` }} transition={{ duration: 1.1, delay: 0.2 }} />
              </div>
              {upcoming.length > 0 && (
                <div className="flex gap-3 overflow-x-auto mt-4 pb-1 -mx-1 px-1 snap-x">
                  {upcoming.map((b, i) => {
                    const urgent = b.state === 'vencido' || b.state === 'hoy';
                    const soon = b.state === 'pronto';
                    const frac = Math.max(0, Math.min(1, 1 - b.daysLeft / 30));
                    const grad = urgent ? 'from-rose-500/30 to-red-600/10 border-rose-400/40' : soon ? 'from-amber-500/25 to-orange-500/10 border-amber-400/40' : 'from-violet-500/20 to-indigo-500/5 border-violet-400/25';
                    const ring = urgent ? '#fb7185' : soon ? '#fbbf24' : '#C6F432';
                    return (
                      <motion.div key={b.bill.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07 }} className="snap-start shrink-0">
                        <Link to="/pagos" className={`block w-40 rounded-3xl p-3.5 bg-gradient-to-br border ${grad}`}>
                          <div className="flex items-center justify-between">
                            <div className="relative w-12 h-12">
                              <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90" aria-hidden="true">
                                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
                                <motion.circle cx="24" cy="24" r="20" fill="none" stroke={ring} strokeWidth="5" strokeLinecap="round" strokeDasharray={125.6}
                                  initial={{ strokeDashoffset: 125.6 }} animate={{ strokeDashoffset: 125.6 * (1 - frac) }} transition={{ duration: 1, delay: 0.4 + i * 0.07 }} />
                              </svg>
                              <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                <span className="text-white font-extrabold text-sm">{b.daysLeft < 0 ? '!' : b.daysLeft}</span>
                                <span className="text-[8px] text-slate-300">{b.daysLeft < 0 ? 'vencido' : b.daysLeft === 1 ? 'día' : 'días'}</span>
                              </span>
                            </div>
                            {urgent && <motion.span className="w-2.5 h-2.5 rounded-full bg-rose-400" animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />}
                          </div>
                          <p className="text-white font-semibold text-sm mt-2.5 truncate">{b.bill.name}</p>
                          <p className="text-white text-lg font-extrabold">{formatCOP(b.bill.amount)}</p>
                          <p className="text-[10px] text-slate-300">Día {b.dueDate.getDate()} · {b.bill.kind === 'tarjeta' ? 'Tarjeta' : b.bill.kind === 'deuda' ? 'Crédito' : 'Pago fijo'}</p>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Card>

        {/* 4. Tendencia */}
        <Card>
          <Title icon={TrendingUp} color="from-cyan-500 to-blue-600">{cycle.isCalendar ? 'Tus gastos mes a mes' : 'Tus gastos por ciclo'}</Title>
          <div className="flex items-end gap-2 h-32" role="img" aria-label="Gastos de los últimos 6 meses">
            {s.months.map((m, i) => (
              <div key={m.label + i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className={`text-[9px] ${m.current ? 'text-white font-bold' : 'text-slate-500'}`}>{m.value ? `${Math.round(m.value / 1000)}k` : ''}</span>
                <motion.div className={`w-full rounded-t-xl ${m.current ? 'bg-gradient-to-t from-cyan-500 to-violet-500' : 'bg-slate-700'}`}
                  initial={{ height: 0 }} animate={{ height: `${Math.max(m.value ? 6 : 2, (m.value / maxMonth) * 100)}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.08, type: 'spring', damping: 18 }} />
                <span className={`text-[10px] ${m.current ? 'text-white font-bold' : 'text-slate-500'}`}>{m.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            {s.prevExpense > 0 ? <>{cycle.isCalendar ? 'El mes pasado' : 'El ciclo pasado'} gastaste <strong className="text-white">{formatCOP(s.prevExpense)}</strong>. A este ritmo cerrarías {cycle.isCalendar ? cycle.label : 'este ciclo'} en <strong className="text-white">{formatCOP(s.projection)}</strong>.</> : 'Cuando tengas más de un mes de datos verás aquí cómo cambian tus gastos.'}
          </p>
        </Card>

        {/* 5. En qué se va la plata */}
        <Card>
          <Title icon={Wallet} color="from-violet-600 to-fuchsia-500" to="/finanzas" link="Detalle">¿En qué se va tu plata?</Title>
          {segTotal === 0 ? <p className="text-sm text-slate-400">Cuando registres gastos verás aquí cómo se reparten.</p> : (
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1e293b" strokeWidth="14" />
                  {arcs.map((a, i) => (
                    <motion.circle key={a.k} cx="50" cy="50" r="38" fill="none" stroke={SEG_HEX[a.k]} strokeWidth="14"
                      strokeDasharray={`${a.frac * C} ${C}`} strokeDashoffset={-a.offset * C}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: '50px 50px' }} transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }} />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400">Total</span>
                  <span className="text-white font-bold text-sm">{formatCOP(segTotal)}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {SEGS.filter(k => s.split[k] > 0).map(k => (
                  <div key={k}>
                    <div className="flex justify-between text-xs"><span className="text-slate-300">{SEGMENT_INFO[k].short}</span><span className="text-white font-semibold">{Math.round((s.split[k] / segTotal) * 100)}%</span></div>
                    <p className="text-[10px] text-slate-500">{formatCOP(s.split[k])}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {s.top.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5">
              <p className="text-xs text-slate-400">Categorías donde más gastas</p>
              {s.top.map(([cat, v], i) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-white">{i + 1}. {cat}</span><span className="text-slate-300">{formatCOP(v)} · {Math.round((v / Math.max(1, s.expense)) * 100)}%</span></div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: SEG_HEX[segmentOf('expense', cat) as typeof SEGS[number]] }} initial={{ width: 0 }} animate={{ width: `${(v / Math.max(1, s.top[0][1])) * 100}%` }} transition={{ duration: 0.9, delay: 0.3 + i * 0.1 }} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 6. Mercado + Metas */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <Link to="/mercado" className="bg-surface border border-white/5 rounded-[26px] p-4 block">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-400 flex items-center justify-center"><ShoppingCart size={16} className="text-white" /></span>
            <p className="text-white font-bold text-sm mt-2">Mercado</p>
            {listTotal > 0 ? (
              <>
                <p className="text-white text-lg font-extrabold mt-1">{formatCOP(listTotal)}</p>
                <p className="text-[10px] text-slate-400">≈ {marketList.length} en la lista · {marketBudget ? `${Math.round((listTotal / marketBudget) * 100)}% del presupuesto` : ''}</p>
              </>
            ) : lastMarket ? (
              <>
                <p className="text-white text-lg font-extrabold mt-1">{formatCOP(lastMarket.total)}</p>
                <p className="text-[10px] text-slate-400">último mercado · {new Date(lastMarket.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</p>
              </>
            ) : <p className="text-[11px] text-slate-400 mt-1">Arma tu primera lista</p>}
          </Link>
          <Link to="/finanzas" className="bg-surface border border-white/5 rounded-[26px] p-4 block">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center"><Target size={16} className="text-white" /></span>
            <p className="text-white font-bold text-sm mt-2">Metas</p>
            {goals.length ? goals.slice(0, 2).map(g => {
              const p = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));
              return (
                <div key={g.id} className="mt-2">
                  <div className="flex justify-between text-[11px]"><span className="text-slate-300 truncate">{g.name}</span><span className="text-white font-bold">{p}%</span></div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1"><motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1, delay: 0.4 }} /></div>
                </div>
              );
            }) : <p className="text-[11px] text-slate-400 mt-1">Crea una meta de ahorro</p>}
          </Link>
        </motion.div>

        {/* 7. Deudas + Salud */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <Link to="/pagos" className="bg-surface border border-white/5 rounded-[26px] p-4 block">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Landmark size={16} className="text-white" /></span>
            <p className="text-white font-bold text-sm mt-2">Créditos</p>
            {debts.length ? (
              <>
                <p className="text-white text-lg font-extrabold mt-1">{formatCOP(debtLeft)}</p>
                <p className="text-[10px] text-slate-400">por pagar en {debts.length} crédito{debts.length > 1 ? 's' : ''}</p>
              </>
            ) : <p className="text-[11px] text-slate-400 mt-1">Sin créditos en cuotas</p>}
          </Link>
          <div className="bg-surface border border-white/5 rounded-[26px] p-4">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center"><Gauge size={16} className="text-white" /></span>
            <p className="text-white font-bold text-sm mt-2">Salud financiera</p>
            <div className="flex items-baseline gap-1 mt-1"><span className="text-2xl font-extrabold" style={{ color: hColor }}>{health?.total ?? '—'}</span><span className="text-[10px] text-slate-500">/100</span></div>
            <p className="text-[10px] font-semibold" style={{ color: hColor }}>{hLabel}</p>
            {health && <p className="text-[10px] text-slate-400 mt-1">Ahorras el {health.savingsRate}% de lo que entra</p>}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
