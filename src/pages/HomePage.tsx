/**
 * ════════════════════════════════════════════════════════════════════
 * 🏠 PANTALLA INICIO (4 bloques, fija: no hace falta bajar)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace:
 *   1. Anillos del mes: gastado · días · ahorro, cuánto te queda y cuánto puedes gastar por día.
 *   2. 8 íconos: Gasto, Ingreso, Mercado, Pagos, Alcancía, Metas, Escáner, Reportes.
 *   3. "Para hoy": máximo 3 avisos (1–3 según el alto del celular), lo más urgente primero.
 *   4. "Ver análisis completo" → pantalla Análisis del mes (todo lo que antes estaba aquí).
 * Kai flota arriba a la derecha y te habla. Mientras carga se ve el esqueleto.
 * Si lo cambias: los cálculos están en services/useMonthData.ts.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ChevronRight, CalendarDays } from 'lucide-react';
import ModuleHeader from '../components/ui/ModuleHeader';
import CountUp from '../components/ui/CountUp';
import { usePageTour } from '../components/tour/Tour';
import { amountsHidden, setAmountsHidden } from '../utils/privacyMask';
import { formatCOP } from '../utils/format';
import { useSeason } from '../services/season';
import { useMonthData } from '../services/useMonthData';
import { openAssistant } from '../services/budgetPlan';
import { paydayPending, registerSalary, openQuickAdd } from '../services/quickActions';
import { budgetLevel } from '../components/home/BudgetsCard';
import MonthRecapCard, { recapAvailable } from '../components/home/MonthRecap';
import { daysSinceBackup, backupSnoozed } from '../services/backupService';
import TripleRing from '../components/home/TripleRing';
import HomeSkeleton from '../components/home/HomeSkeleton';
import FloatingKai, { type KaiTip } from '../components/assistant/FloatingKai';
import Kai from '../components/assistant/Kai';
import NewBadge from '../components/ui/NewBadge';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Cuántos avisos de "Para hoy" caben sin tener que bajar (y si los íconos van compactos). */
function useFit() {
  const calc = () => { const h = window.innerHeight; return { items: h >= 800 ? 3 : h >= 720 ? 2 : 1, compact: h < 700 }; };
  const [fit, setFit] = useState(calc);
  useEffect(() => { const on = () => setFit(calc()); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  return fit;
}

interface Hoy { key: string; node: ReactNode }
function HoyRow({ emoji, bg, title, sub, action, onClick, to }: { emoji: ReactNode; bg: string; title: ReactNode; sub: ReactNode; action?: string; onClick?: () => void; to?: string }) {
  const inner = (
    <>
      <span className={`w-10 h-10 rounded-[13px] flex items-center justify-center text-[19px] shrink-0 ${bg}`} aria-hidden="true">{emoji}</span>
      <span className="flex-1 min-w-0"><span className="block text-white font-bold text-[13.5px] truncate">{title}</span><span className="block text-[11.5px] text-slate-400 truncate">{sub}</span></span>
      {action ? <span className="shrink-0 rounded-xl bg-brand-lime text-brand-ink text-xs font-extrabold px-3 py-2">{action}</span> : <ChevronRight size={18} className="text-slate-500 shrink-0" />}
    </>
  );
  const cls = 'w-full flex items-center gap-3 rounded-[20px] bg-surface border border-white/5 p-3 text-left active:scale-[0.99] transition-transform';
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>;
}

export default function HomePage() {
  const d = useMonthData();
  const { s, plan, base, left, rings, perDayAllowed, payInfo, upcoming, cycle, tx, loaded, prefs, daysLeft, savingTarget, savedNow } = d;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const fit = useFit();
  const season = useSeason();
  const name = localStorage.getItem('miFinanzasUserName');
  const now = new Date();

  usePageTour('inicio', [
    { target: 'menu', title: 'Tu menú', text: 'Aquí están todos los módulos: Mercado, Finanzas, Pagos, el escáner de facturas y Ajustes.' },
    { target: 'home-hero', title: 'Tu mes en anillos', text: 'Lima: lo que has gastado del sueldo. Azul: cuánto va del mes. Rosado: tu ahorro. Y cuánto puedes gastar por día.' },
    { target: 'home-icons', title: 'Todo a un toque', text: 'Anota un gasto o un ingreso, ve al mercado, a tus pagos, a la alcancía o a tus reportes.' },
    { target: 'home-hoy', title: 'Para hoy', text: 'Lo más importante del día: pagos que vencen, presupuestos en alerta y tu resumen.' },
    { target: 'bell', title: 'Tus avisos', text: 'Aquí ves todos tus avisos y eliges qué te avisamos y a qué hora.' },
  ]);

  // Enlaces desde las notificaciones: /?registrar=gasto | ingreso | asistente
  useEffect(() => {
    const r = params.get('registrar');
    if (!r) return;
    params.delete('registrar'); setParams(params, { replace: true });
    if (r === 'gasto') setTimeout(() => openQuickAdd('expense'), 300);
    if (r === 'ingreso') setTimeout(() => openQuickAdd('income'), 300);
    if (r === 'asistente') setTimeout(openAssistant, 300);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Guarda el dato del día para el saludo de Kai de la próxima apertura (solo en este celular)
  useEffect(() => {
    if (!loaded || !(base > 0 && left >= 0)) return;
    const n = new Date();
    try { localStorage.setItem('mf_hoy', JSON.stringify({ d: `${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`, t: formatCOP(perDayAllowed) })); } catch { /* sin almacenamiento */ }
  }, [loaded, base, left, perDayAllowed]);
  if (!loaded) return <HomeSkeleton />;

  // ── Presupuestos en alerta ──
  const budgetRows = Object.entries(prefs.budgets).filter(([, v]) => v > 0).map(([cat, limit]) => {
    const spent = s.byCat.get(cat) ?? 0; const pct = (spent / limit) * 100;
    return { cat, limit, spent, pct, left: limit - spent, level: budgetLevel(pct) };
  }).sort((a, b) => b.pct - a.pct);
  const worst = budgetRows.find(b => b.level !== 'ok');
  const salary = paydayPending(tx, plan);
  const nextBill = upcoming[0];
  const urgentBill = upcoming.find(b => b.state === 'vencido' || b.state === 'hoy' || b.state === 'pronto');
  const backupDue = tx.length >= 15 && !backupSnoozed() && ((daysSinceBackup() ?? 999) >= 30);

  // ── Para hoy: lo más urgente primero ──
  const hoy: Hoy[] = [];
  if (salary) hoy.push({ key: 'sueldo', node: <HoyRow emoji="💚" bg="bg-brand-lime/15" title={`¡Hoy te pagan ${formatCOP(salary)}!`} sub="¿Ya te llegó? Regístralo con un toque" action="Registrar" onClick={() => registerSalary(salary)} /> });
  if (urgentBill) hoy.push({ key: 'pago', node: <HoyRow emoji="📅" bg={urgentBill.state === 'vencido' || urgentBill.state === 'hoy' ? 'bg-rose-500/20' : 'bg-amber-500/15'} title={`${urgentBill.bill.name} ${urgentBill.daysLeft < 0 ? 'está vencido' : urgentBill.daysLeft === 0 ? 'vence hoy' : urgentBill.daysLeft === 1 ? 'vence mañana' : `vence en ${urgentBill.daysLeft} días`}`} sub={formatCOP(urgentBill.bill.amount)} action="Pagar" to="/pagos" /> });
  if (!plan) hoy.push({ key: 'kai', node: <HoyRow emoji={<Kai size={34} still />} bg="bg-[#1D2A6B]" title={<span className="flex items-center gap-1.5">Arma tu presupuesto con Kai <NewBadge id="home-kai" /></span>} sub="Sueldo, deudas y ahorro en 3 pasos" action="Empezar" onClick={openAssistant} /> });
  if (worst) hoy.push({ key: 'presupuesto', node: <HoyRow emoji="🎯" bg={worst.level === 'over' ? 'bg-rose-500/20' : 'bg-amber-500/15'} title={worst.level === 'over' ? `${worst.cat} pasó su límite` : `${worst.cat} va en ${Math.round(worst.pct)}%`} sub={worst.level === 'over' ? `Te pasaste ${formatCOP(-worst.left)}` : `Quedan ${formatCOP(worst.left)} para ${daysLeft + 1} días`} to="/analisis" /> });
  if (season?.id === 'navidad') hoy.push({ key: 'navidad', node: <HoyRow emoji={<Kai size={34} still />} bg="bg-[#7A1424]" title="Kai Noel: arma tu cena navideña 🎄" sub="Natilla, buñuelos, pernil… a la lista con un toque" action="Armar" to="/mercado?plantilla=navidad" /> });
  if (recapAvailable(tx)) hoy.push({ key: 'recap', node: <MonthRecapCard tx={tx} compact /> });
  if (backupDue) hoy.push({ key: 'respaldo', node: <HoyRow emoji="💾" bg="bg-sky-400/15" title="Guarda una copia de tus datos" sub="Si pierdes el celular, la recuperas" to="/ajustes?s=respaldo" /> });
  if (nextBill && nextBill !== urgentBill) hoy.push({ key: 'proximo', node: <HoyRow emoji="🗓️" bg="bg-white/[0.06]" title={`Próximo pago: ${nextBill.bill.name}`} sub={`En ${nextBill.daysLeft} días · ${formatCOP(nextBill.bill.amount)}`} to="/pagos" /> });
  if (!hoy.length) hoy.push({ key: 'ok', node: <HoyRow emoji="✨" bg="bg-brand-lime/15" title="Todo al día" sub="No tienes pagos cerca ni presupuestos en alerta" to="/analisis" /> });

  // ── Lo que dice Kai ──
  const tips: KaiTip[] = [];
  if (!plan) tips.push({ text: '¿Armamos tu presupuesto juntos? 🤖', mood: 'normal', action: openAssistant });
  if (salary) tips.push({ text: `¡Hoy te pagan ${formatCOP(salary)}! ¿Lo registro?`, mood: 'feliz', action: () => registerSalary(salary) });
  if (worst?.level === 'over') tips.push({ text: `Ojo: ${worst.cat} ya pasó su límite 👀`, mood: 'pensando', action: () => navigate('/analisis') });
  else if (worst) tips.push({ text: `${worst.cat} va en ${Math.round(worst.pct)}%. Vamos con calma 🙌`, mood: 'pensando' });
  if (base > 0 && left >= 0) tips.push({ text: `¡Vas bien! Puedes gastar ${formatCOP(perDayAllowed)} hoy 💚`, mood: 'feliz' });
  if (plan && plan.mode === 'ahorro' && savedNow < savingTarget) tips.push({ text: `Recuerda separar tu ahorro: faltan ${formatCOP(savingTarget - savedNow)} 🐷`, mood: 'normal' });
  if (base > 0 && left < 0) tips.push({ text: 'Este mes vamos justos. No te preocupes, lo ajustamos juntos 💚', mood: 'calma', action: openAssistant });

  const icons: { emoji: string; label: string; to?: string; onClick?: () => void }[] = [
    { emoji: '➖', label: 'Gasto', onClick: () => openQuickAdd('expense') },
    { emoji: '➕', label: 'Ingreso', onClick: () => openQuickAdd('income') },
    { emoji: '🛒', label: 'Mercado', to: '/mercado' },
    { emoji: '📅', label: 'Pagos', to: '/pagos' },
    { emoji: '🪙', label: 'Alcancía', to: '/finanzas?tab=metas&alcancia=1' },
    { emoji: '🎯', label: 'Metas', to: '/finanzas?tab=metas' },
    { emoji: '🧾', label: 'Escáner', to: '/escaner' },
    { emoji: '📊', label: 'Reportes', to: '/analisis' },
  ];

  return (
    <div className="overscroll-none">
      <ModuleHeader module="inicio" title={`${name ? `Hola, ${name}` : 'Mi Finanzas'}${season ? ` ${season.emoji}` : ''}`}
        subtitle={`${DAYS[now.getDay()][0].toUpperCase()}${DAYS[now.getDay()].slice(1)} ${now.getDate()} de ${MONTHS[now.getMonth()]}`}
        right={<FloatingKai tips={tips} onTap={openAssistant} />} hideIcon />

      {/* 1. Anillos del mes */}
      <motion.div data-tour="home-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-[28px] ${fit.compact ? 'p-3.5' : 'p-4'} bg-gradient-to-br theme-dark from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20 shadow-xl shadow-black/40`}>
        <div className="relative flex gap-3.5 items-center">
          <TripleRing rings={rings} size={fit.compact ? 96 : 108} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white/80 text-[12.5px]">{base > 0 ? (left >= 0 ? (cycle.isCalendar ? 'Te queda este mes' : 'Te queda este ciclo') : 'Gastaste de más') : 'Gastos de este mes'}</p>
              <button onClick={() => setAmountsHidden(!amountsHidden())} aria-label={amountsHidden() ? 'Mostrar saldos' : 'Ocultar saldos'} aria-pressed={amountsHidden()} className="w-6 h-6 shrink-0 rounded-lg bg-white/[0.08] ring-1 ring-white/10 flex items-center justify-center text-white/90">{amountsHidden() ? <EyeOff size={13} /> : <Eye size={13} />}</button>
            </div>
            <CountUp value={base > 0 ? Math.abs(left) : s.expense} className={`block text-[27px] leading-tight font-extrabold tracking-tight ${base > 0 ? (left >= 0 ? 'text-brand-lime' : 'text-rose-300') : 'text-white'}`} />
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
              {rings.map(r => <span key={r.label} className="text-[10.5px] text-white/80 whitespace-nowrap"><span style={{ color: r.color }}>●</span> {r.label} {Math.round(r.pct)}%</span>)}
            </div>
            {base > 0
              ? <p className="text-[12.5px] text-white mt-1">Puedes gastar <b className="text-brand-lime">{formatCOP(perDayAllowed)}/día</b></p>
              : <button onClick={openAssistant} className="mt-1 text-[11.5px] font-bold text-brand-lime">+ Dime tu sueldo y lleno los anillos ›</button>}
          </div>
        </div>
        <div className="relative flex items-center gap-2 mt-2.5 text-[11px] text-white/70">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] ring-1 ring-white/10 px-2.5 py-1 shrink-0"><CalendarDays size={12} className="text-brand-lime" />{cycle.isCalendar ? `${cycle.label[0].toUpperCase()}${cycle.label.slice(1)}` : cycle.label}</span>
          <span className="truncate">{payInfo}</span>
          <span className="ml-auto shrink-0 text-white/60">Salió {formatCOP(s.expense)}</span>
        </div>
      </motion.div>

      {/* 2. Íconos */}
      <motion.div data-tour="home-icons" className="grid grid-cols-4 gap-2 mt-3" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.03 } } }}>
        {icons.map(a => {
          const inner = <><span className={`${fit.compact ? 'text-[20px]' : 'text-[23px]'} leading-none`} aria-hidden="true">{a.emoji}</span><span className="text-[11px] font-bold text-white mt-1.5">{a.label}</span></>;
          const cls = `snow-cap relative flex flex-col items-center justify-center rounded-[20px] bg-surface border border-white/5 ${fit.compact ? 'h-[62px]' : 'h-[72px]'} active:scale-95 transition-transform`;
          return (
            <motion.div key={a.label} variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }}>
              {a.to ? <Link to={a.to} className={cls}>{inner}</Link> : <button onClick={a.onClick} className={`${cls} w-full`}>{inner}</button>}
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. Para hoy */}
      <div data-tour="home-hoy">
        <p className={`text-[11px] font-extrabold tracking-[.12em] text-slate-400 ${fit.compact ? 'mt-3 mb-1.5' : 'mt-4 mb-2'} px-0.5`}>PARA HOY</p>
        <div className="space-y-2">
          {hoy.slice(0, fit.items).map((h, i) => <motion.div key={h.key} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>{h.node}</motion.div>)}
        </div>
      </div>

      {/* 4. Análisis completo */}
      <Link to="/analisis" className="flex items-center justify-center gap-1 mt-2 py-1 text-[13px] font-extrabold text-brand-lime">
        Ver análisis completo{hoy.length > fit.items ? ` · ${hoy.length - fit.items} más` : ''} <ChevronRight size={15} />
      </Link>
    </div>
  );
}
