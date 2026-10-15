import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronRight, Plus, CalendarPlus, ScanLine, ShoppingCart, Sparkles } from 'lucide-react';
import { db, type Transaction, type SavingsGoal } from '../utils/database';
import { calculateHealthScore } from '../services/financialIntelligence';
import { loadBillStatuses, describeDue, type BillStatus } from '../services/billsService';
import { formatCOP, parseLocalDate, todayISO } from '../utils/format';
import { segmentOf, SEGMENT_INFO } from '../utils/categories';
import { getMarketHistory, type MarketPurchase } from '../utils/marketHistory';
import { secureStorage } from '../utils/security';
import { MODULES } from '../utils/modules';
import ModuleHeader from '../components/ui/ModuleHeader';
import HelpTip from '../components/ui/HelpTip';
import CountUp from '../components/ui/CountUp';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const SEGS = ['obligatorio', 'necesario', 'gusto', 'ahorro'] as const;

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 22, stiffness: 220 } } };

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<BillStatus[]>([]);
  const [lastMarket, setLastMarket] = useState<MarketPurchase | null>(null);
  const name = localStorage.getItem('miFinanzasUserName');

  useEffect(() => {
    Promise.all([db.transactions.toArray(), db.goals.toArray(), loadBillStatuses()])
      .then(([txs, gls, bs]) => { setTransactions(txs); setGoals(gls); setBills(bs); })
      .catch(() => {});
    setLastMarket(getMarketHistory()[0] ?? null);
  }, []);

  const now = new Date();
  const monthKey = todayISO().slice(0, 7);
  const monthTx = transactions.filter(t => (t.date || '').startsWith(monthKey));
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const spentPct = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;

  const split = monthTx.filter(t => t.type === 'expense').reduce((acc, t) => {
    const k = segmentOf('expense', t.category) as typeof SEGS[number]; acc[k] = (acc[k] || 0) + t.amount; return acc;
  }, { obligatorio: 0, necesario: 0, gusto: 0, ahorro: 0 } as Record<typeof SEGS[number], number>);

  const totalBalance = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  const hasRecentData = transactions.some(t => now.getTime() - parseLocalDate(t.date).getTime() < 30 * 86400000);
  const score = hasRecentData ? calculateHealthScore(transactions, goals, totalBalance).total : null;
  const scoreColor = score === null ? '#64748b' : score >= 80 ? '#34d399' : score >= 60 ? '#22d3ee' : score >= 40 ? '#fbbf24' : '#f87171';
  const scoreLabel = score === null ? 'Sin datos aún' : score >= 80 ? 'Excelente' : score >= 60 ? 'Buen camino' : score >= 40 ? 'Ajustar hábitos' : 'Requiere atención';

  const pending = bills.filter(b => !b.paid);
  const pendingTotal = pending.reduce((s, b) => s + b.bill.amount, 0);

  const marketItems = secureStorage.getItem('marketItems');
  const marketBudget = secureStorage.getItem('marketBudget');
  const listTotal = Array.isArray(marketItems) ? marketItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0) : 0;
  const marketPct = typeof marketBudget === 'number' && marketBudget > 0 ? Math.round((listTotal / marketBudget) * 100) : 0;

  const actions = [
    { to: '/finanzas', label: 'Movimiento', icon: Plus, m: MODULES.finanzas, help: 'Registra un ingreso o un gasto.' },
    { to: '/mercado', label: 'Mercado', icon: ShoppingCart, m: MODULES.mercado, help: 'Abre tu lista de compras.' },
    { to: '/pagos', label: 'Pago fijo', icon: CalendarPlus, m: MODULES.pagos, help: 'Agrega arriendo, servicios o una deuda.' },
    { to: '/escaner', label: 'Escanear', icon: ScanLine, m: MODULES.escaner, help: 'Lee una factura con la cámara.' },
  ];

  return (
    <div>
      <ModuleHeader module="inicio" title={name ? `Hola, ${name}` : 'Mi Finanzas'} subtitle={`${DAYS[now.getDay()][0].toUpperCase()}${DAYS[now.getDay()].slice(1)} ${now.getDate()} de ${MONTHS[now.getMonth()]}`} />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
        {/* Balance del mes */}
        <motion.div variants={item} className="relative overflow-hidden rounded-[28px] p-6 bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 shadow-2xl shadow-violet-900/50">
          <motion.div className="absolute -top-16 -right-10 w-48 h-48 bg-white/15 rounded-full blur-2xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} aria-hidden="true" />
          <motion.div className="absolute -bottom-20 -left-10 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 7, repeat: Infinity }} aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-white/80 text-sm font-medium">Te queda en {MONTHS[now.getMonth()]}</p>
              <HelpTip title="Balance del mes" text="Lo que entró este mes menos lo que has gastado. Se actualiza con cada movimiento, mercado o pago que registres." />
            </div>
            <CountUp value={balance} className={`block text-[40px] leading-tight font-extrabold mt-1 tracking-tight ${balance < 0 ? 'text-red-100' : 'text-white'}`} />
            <div className="h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
              <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${spentPct}%` }} transition={{ duration: 1.2, delay: 0.3 }} />
            </div>
            <p className="text-white/80 text-xs mt-1.5">{income > 0 ? `Has gastado el ${spentPct}% de lo que entró` : 'Registra tus ingresos para ver tu avance'}</p>
            <div className="flex gap-3 mt-4">
              <Link to="/finanzas" className="flex-1 bg-white/15 hover:bg-white/25 backdrop-blur-sm py-2.5 px-3 rounded-2xl text-white">
                <span className="flex items-center gap-1 text-[11px] text-white/80"><TrendingUp size={12} /> Ingresos</span>
                <span className="block text-sm font-bold">{formatCOP(income)}</span>
              </Link>
              <Link to="/finanzas" className="flex-1 bg-white/15 hover:bg-white/25 backdrop-blur-sm py-2.5 px-3 rounded-2xl text-white">
                <span className="flex items-center gap-1 text-[11px] text-white/80"><TrendingDown size={12} /> Gastos</span>
                <span className="block text-sm font-bold">{formatCOP(expense)}</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Accesos rápidos */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-bold">¿Qué quieres hacer?</h2>
            <HelpTip text="Atajos a lo que más se usa: registrar un movimiento, ir al mercado, agregar un pago fijo o escanear una factura." />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {actions.map(a => (
              <Link key={a.to} to={a.to} title={a.help} className="flex flex-col items-center gap-1.5 group">
                <motion.span whileTap={{ scale: 0.88 }} whileHover={{ y: -3 }} className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.m.gradient} flex items-center justify-center shadow-lg ${a.m.glow}`}>
                  <a.icon size={24} className="text-white" />
                </motion.span>
                <span className="text-[11px] text-slate-300 font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Próximos pagos */}
        <motion.div variants={item} className="bg-[#111827] border border-white/5 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${MODULES.pagos.gradient} flex items-center justify-center`}><MODULES.pagos.icon size={16} className="text-white" /></span>
              <div>
                <h2 className="text-white font-bold text-sm">Próximos pagos</h2>
                <p className="text-[11px] text-slate-400">{pending.length ? `${pending.length} pendientes · ${formatCOP(pendingTotal)}` : 'Al día este mes'}</p>
              </div>
            </div>
            <Link to="/pagos" className="text-xs text-amber-300 font-semibold flex items-center">Calendario <ChevronRight size={14} /></Link>
          </div>
          {bills.length === 0 ? (
            <Link to="/pagos" className="block text-center border border-dashed border-amber-500/30 rounded-2xl py-4 text-sm text-slate-300">
              Agrega tu arriendo, servicios o deudas y te avisamos antes de cada vencimiento
            </Link>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
              {(pending.length ? pending : bills).slice(0, 6).map(b => (
                <Link key={b.bill.id} to="/pagos" className={`snap-start shrink-0 w-36 rounded-2xl p-3 border ${b.state === 'vencido' ? 'bg-red-500/10 border-red-500/30' : b.state === 'hoy' || b.state === 'pronto' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                  <p className="text-white text-sm font-semibold truncate">{b.bill.name}</p>
                  <p className="text-white font-bold mt-1">{formatCOP(b.bill.amount)}</p>
                  <p className={`text-[11px] mt-0.5 ${b.state === 'vencido' ? 'text-red-300' : b.state === 'pagado' ? 'text-emerald-300' : 'text-amber-200'}`}>{describeDue(b)}</p>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* ¿En qué se va la plata? */}
        <motion.div variants={item} className="bg-[#111827] border border-white/5 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-sm">¿En qué se va tu plata este mes?</h2>
            <HelpTip title="Clasificación automática" text="Cada gasto se ordena solo según lo que escribes. Obligatorios y recurrentes: arriendo, mercado, servicios y deudas. Necesarios: transporte, salud, hogar, educación. Gustos: salidas, plataformas, comida por fuera." />
          </div>
          {expense === 0 ? (
            <p className="text-sm text-slate-400">Cuando registres gastos verás aquí cómo se reparten.</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
                {SEGS.map((k, i) => split[k] > 0 && (
                  <motion.div key={k} className={SEGMENT_INFO[k].bar} initial={{ width: 0 }} animate={{ width: `${(split[k] / expense) * 100}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.12 }} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {SEGS.map(k => (
                  <div key={k} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${SEGMENT_INFO[k].bar}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 truncate">{SEGMENT_INFO[k].short}</p>
                      <p className="text-sm text-white font-semibold">{formatCOP(split[k])}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Salud + Mercado */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <div className="bg-[#111827] border border-white/5 rounded-3xl p-4 flex flex-col items-center text-center">
            <div className="self-stretch flex justify-between items-center"><p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Salud</p>
              <HelpTip text="Puntaje de 0 a 100 según cuánto ahorras, cuánto gastas frente a lo que entra, tu colchón de dinero y el avance de tus metas (últimos 30 días)." /></div>
            <div className="relative w-24 h-24 mt-1">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="9" />
                <motion.circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="9" strokeLinecap="round" strokeDasharray={263.9}
                  initial={{ strokeDashoffset: 263.9 }} animate={{ strokeDashoffset: 263.9 * (1 - (score ?? 0) / 100) }} transition={{ duration: 1.3, delay: 0.4 }} />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-extrabold text-white">{score ?? '—'}</span><span className="text-[10px] text-slate-500">/100</span></span>
            </div>
            <p className="text-xs font-semibold mt-1" style={{ color: scoreColor }}>{scoreLabel}</p>
          </div>

          <Link to="/mercado" className="bg-[#111827] border border-white/5 rounded-3xl p-4 flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${MODULES.mercado.gradient} flex items-center justify-center`}><ShoppingCart size={16} className="text-white" /></span>
              <p className="text-white font-bold text-sm">Mercado</p>
            </div>
            {listTotal > 0 ? (
              <>
                <p className="text-[11px] text-slate-400 mt-3">Lista actual</p>
                <p className="text-white font-bold">{formatCOP(listTotal)}</p>
                <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden"><motion.div className={`h-full rounded-full ${marketPct >= 100 ? 'bg-red-500' : marketPct >= 85 ? 'bg-amber-400' : 'bg-emerald-400'}`} initial={{ width: 0 }} animate={{ width: `${Math.min(marketPct, 100)}%` }} transition={{ duration: 1, delay: 0.5 }} /></div>
                <p className="text-[11px] text-slate-400 mt-1">{marketPct}% del presupuesto</p>
              </>
            ) : lastMarket ? (
              <>
                <p className="text-[11px] text-slate-400 mt-3">Último mercado</p>
                <p className="text-white font-bold">{formatCOP(lastMarket.total)}</p>
                <p className="text-[11px] text-slate-400 mt-1">{new Date(lastMarket.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {lastMarket.itemsCount} productos</p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-3 flex-1">Arma tu primera lista y lleva la cuenta en vivo.</p>
            )}
            <span className="text-xs text-emerald-300 font-semibold mt-auto pt-2 flex items-center">Abrir <ChevronRight size={14} /></span>
          </Link>
        </motion.div>

        <motion.p variants={item} className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1 pt-1">
          <Sparkles size={12} className="text-violet-400" /> Toca el <span className="font-bold text-slate-300">(?)</span> en cualquier sección para saber para qué sirve
        </motion.p>
      </motion.div>
    </div>
  );
}
