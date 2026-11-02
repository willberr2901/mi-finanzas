/**
 * ════════════════════════════════════════════════════════════════════
 * 📊 ANÁLISIS DEL MES (antes estaba todo en Inicio)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Todo en detalle: resumen del mes, presupuestos, pagos del mes, tendencia, en qué se va la plata, mercado y metas, deudas y salud financiera.
 * Dónde se ve: Inicio → "Ver análisis completo" o el ícono Reportes.
 * Si lo cambias: Solo lee datos; no guarda nada. Cada bloque tiene su comentario numerado (1. … 7.).
 * ════════════════════════════════════════════════════════════════════
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, CalendarClock, ShoppingCart, Target, Landmark, TrendingUp, Wallet } from 'lucide-react';
import HealthCard from '../components/home/HealthCard';
import { formatCOP } from '../utils/format';
import { segmentOf, SEGMENT_INFO } from '../utils/categories';
import { getMarketHistory } from '../utils/marketHistory';
import { listItems, getBudget, estimateList } from '../services/market/marketStore';
import { usePageTour } from '../components/tour/Tour';
import { useMonthData, SEGS } from '../services/useMonthData';
import BudgetsCard from '../components/home/BudgetsCard';
import MonthRecapCard from '../components/home/MonthRecap';
import BackupReminder from '../components/home/BackupReminder';

const SEG_HEX: Record<typeof SEGS[number], string> = { obligatorio: 'rgb(var(--brand))', necesario: '#8792C4', gusto: '#F59E0B', ahorro: '#5EEAD4' };

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
export default function AnalysisPage() {
  const { tx, goals, bills, debts, cycle, daysLeft, s, health, upcoming, debtLeft, prefs } = useMonthData();
  usePageTour('analisis', [
    { target: 'home-budgets', title: 'Tus presupuestos', text: 'Cada categoría es un anillo: verde vas bien, amarillo cuidado, rojo te pasaste.' },
    { target: 'home-pagos', title: 'Pagos del mes', text: 'Tus pagos fijos y deudas con los días que faltan para cada uno. Toca uno para ir a pagarlo.' },
  ]);
  const billTotal = bills.reduce((a, b) => a + (b.payment?.amount ?? b.bill.amount), 0);
  const billPaid = bills.filter(b => b.paid).reduce((a, b) => a + (b.payment?.amount ?? 0), 0);
  const billPct = billTotal ? Math.round((billPaid / billTotal) * 100) : 0;

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
      <div className="flex items-center gap-3 mb-4"><Link to="/" aria-label="Volver a Inicio" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><ChevronLeft size={20} /></Link><div><h1 className="text-xl font-bold text-white">Análisis del mes</h1><p className="text-xs text-slate-400">{cycle.isCalendar ? `${cycle.label[0].toUpperCase()}${cycle.label.slice(1)}` : cycle.label} · todo en detalle</p></div></div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {/* Descargar el reporte */}
        <motion.div variants={item} className="grid grid-cols-2 gap-2">
          <Link to="/finanzas?tab=reportes" className="rounded-2xl bg-surface border border-white/5 p-3 flex items-center gap-2"><span className="text-xl" aria-hidden="true">📄</span><span className="text-[13px] font-bold text-white">Reporte PDF</span></Link>
          <Link to="/finanzas?tab=reportes" className="rounded-2xl bg-surface border border-white/5 p-3 flex items-center gap-2"><span className="text-xl" aria-hidden="true">📗</span><span className="text-[13px] font-bold text-white">Excel</span></Link>
        </motion.div>

        {/* Resumen del mes que terminó (primeros 10 días) y recordatorio de respaldo */}
        <MonthRecapCard tx={tx} />
        <BackupReminder txCount={tx.length} />

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
                    const ring = urgent ? '#fb7185' : soon ? '#fbbf24' : 'rgb(var(--brand))';
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
          <HealthCard health={health} cycleLabel={cycle.label} />
        </motion.div>
      </motion.div>
    </div>
  );
}
