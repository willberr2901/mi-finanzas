/**
 * ════════════════════════════════════════════════════════════════════
 * 📊 RESUMEN DEL MES (tarjeta en Inicio + historia a pantalla completa)
 * ────────────────────────────────────────────────────────────────────
 * Tarjeta: sale en Inicio los primeros 10 días de cada mes (ciclo de pago),
 *          con el resumen del mes que terminó.
 * Historia: 4 pantallas animadas que pasan solas (como los estados de WhatsApp):
 *   1) Entró / salió / ahorraste  2) En qué se fue la plata
 *   3) Qué subió y qué bajó        4) Tu consejo del mes
 * Toca la derecha para avanzar, la izquierda para volver.
 * Cálculos: services/monthRecap.ts
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Sparkles, ChevronRight, BarChart3 } from 'lucide-react';
import type { Transaction } from '../../utils/database';
import { formatCOP } from '../../utils/format';
import { cycleFor, inCycle, cycleProgress, getPrefs } from '../../utils/prefs';
import { buildRecap, recapSeen, markRecapSeen, type Recap } from '../../services/monthRecap';
import { haptic } from '../../utils/haptics';
import NewBadge from '../ui/NewBadge';

function Money({ v, className = '' }: { v: number; className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => { const c = animate(0, v, { duration: 1.1, ease: 'easeOut', onUpdate: setN }); return () => c.stop(); }, [v]);
  return <span className={className}>{formatCOP(Math.round(n))}</span>;
}

const SLIDE_MS = 6500;
const COLORS = ['#C6F432', '#7DD3FC', '#F9A8D4'];

function Story({ r, label, onClose }: { r: Recap; label: string; onClose: () => void }) {
  const [i, setI] = useState(0);
  const total = 4;
  useEffect(() => {
    const t = setTimeout(() => { if (i < total - 1) setI(i + 1); }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [i]);
  const go = (d: number) => { haptic(); setI(x => Math.max(0, Math.min(total - 1, x + d))); };

  const slides = [
    // 1) Entró / salió / ahorraste
    <div key="a" className="text-center">
      <p className="text-[12px] font-extrabold tracking-widest text-slate-400">TU {label.toUpperCase()}</p>
      <h2 className="text-white text-[28px] font-extrabold leading-tight mt-2">{r.saved >= 0 ? <>Ahorraste</> : <>Te pasaste por</>}</h2>
      <Money v={Math.abs(r.saved)} className={`block text-[46px] font-extrabold mt-1 ${r.saved >= 0 ? 'text-brand-lime' : 'text-rose-400'}`} />
      {r.income > 0 && r.saved >= 0 && <p className="text-slate-300 mt-1">el <b className="text-white">{Math.round(r.savedPct * 100)}%</b> de lo que entró</p>}
      <div className="grid grid-cols-2 gap-3 mt-8">
        <div className="rounded-2xl bg-white/[0.06] p-4"><p className="text-[11px] text-slate-400 flex items-center justify-center gap-1"><TrendingUp size={13} className="text-emerald-400" /> Entró</p><Money v={r.income} className="block text-lg font-extrabold text-emerald-400 mt-1" /></div>
        <div className="rounded-2xl bg-white/[0.06] p-4"><p className="text-[11px] text-slate-400 flex items-center justify-center gap-1"><TrendingDown size={13} className="text-rose-400" /> Salió</p><Money v={r.expense} className="block text-lg font-extrabold text-rose-400 mt-1" /></div>
      </div>
      <p className="text-[13px] text-slate-400 mt-5">{r.count} movimientos · unos <b className="text-white">{formatCOP(r.perDay)}</b> al día</p>
    </div>,
    // 2) En qué se fue
    <div key="b">
      <p className="text-[12px] font-extrabold tracking-widest text-slate-400 text-center">EN QUÉ SE FUE LA PLATA</p>
      <div className="mt-6 space-y-5">
        {r.top.map((c, k) => (
          <div key={c.category}>
            <div className="flex items-baseline justify-between"><span className="text-white font-extrabold text-lg">{k + 1}. {c.category}</span><span className="text-slate-300 font-bold">{formatCOP(c.amount)}</span></div>
            <div className="h-4 rounded-full bg-white/[0.07] overflow-hidden mt-2">
              <motion.div className="h-full rounded-full" style={{ background: COLORS[k] }} initial={{ width: 0 }} animate={{ width: `${Math.max(4, c.share * 100)}%` }} transition={{ duration: 1, delay: 0.2 + k * 0.25 }} />
            </div>
            <p className="text-[12px] text-slate-400 mt-1">{Math.round(c.share * 100)}% de tus gastos</p>
          </div>
        ))}
      </div>
      {r.biggest && <p className="text-[13px] text-slate-400 mt-6 text-center">Tu gasto más grande: <b className="text-white">{r.biggest.description}</b> ({formatCOP(r.biggest.amount)})</p>}
    </div>,
    // 3) Qué subió y qué bajó
    <div key="c" className="text-center">
      <p className="text-[12px] font-extrabold tracking-widest text-slate-400">FRENTE AL MES ANTERIOR</p>
      {r.vsPrev ? (
        <h2 className="text-white text-2xl font-extrabold mt-3">Gastaste <span className={r.vsPrev.pct <= 0 ? 'text-brand-lime' : 'text-rose-400'}>{Math.abs(Math.round(r.vsPrev.pct * 100))}% {r.vsPrev.pct <= 0 ? 'menos' : 'más'}</span></h2>
      ) : <h2 className="text-white text-2xl font-extrabold mt-3">Es tu primer mes completo 🎉</h2>}
      <div className="mt-7 space-y-3 text-left">
        {r.down && (
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-2xl p-4 bg-emerald-500/10 ring-1 ring-emerald-400/30">
            <p className="text-emerald-300 text-[12px] font-extrabold">👏 BAJÓ</p>
            <p className="text-white font-extrabold text-lg">{r.down.category} <span className="text-emerald-300">−{formatCOP(-r.down.diff)}</span></p>
          </motion.div>
        )}
        {r.up && (
          <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="rounded-2xl p-4 bg-rose-500/10 ring-1 ring-rose-400/30">
            <p className="text-rose-300 text-[12px] font-extrabold">👀 SUBIÓ</p>
            <p className="text-white font-extrabold text-lg">{r.up.category} <span className="text-rose-300">+{formatCOP(r.up.diff)}</span></p>
          </motion.div>
        )}
        {!r.up && !r.down && <p className="text-slate-400 text-center">Tus gastos fueron muy parecidos al mes anterior.</p>}
      </div>
    </div>,
    // 4) Consejo
    <div key="d" className="text-center">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 9 }} className="w-20 h-20 mx-auto rounded-3xl bg-brand-lime flex items-center justify-center"><Sparkles size={38} className="text-brand-ink" /></motion.div>
      <p className="text-[12px] font-extrabold tracking-widest text-slate-400 mt-6">TU CONSEJO DEL MES</p>
      <p className="text-white text-xl font-extrabold leading-snug mt-3">{r.tip}</p>
      <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="mt-8 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">¡A por este mes! 💪</motion.button>
    </div>,
  ];

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Resumen de ${label}`} className="theme-dark fixed inset-0 z-[160] bg-gradient-to-b from-[#121938] to-[#070B18] flex flex-col"
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
      <div className="flex gap-1.5 px-4 pt-[max(14px,env(safe-area-inset-top))]">
        {Array.from({ length: total }, (_, k) => (
          <div key={k} className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
            {k < i && <div className="h-full w-full bg-white" />}
            {k === i && <motion.div key={i} className="h-full bg-white" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }} />}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 mt-3">
        <p className="text-white font-extrabold flex items-center gap-2"><BarChart3 size={18} className="text-brand-lime" /> Resumen de {label}</p>
        <button onClick={onClose} aria-label="Cerrar" className="p-2 -mr-2 text-slate-300"><X size={22} /></button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <button aria-label="Anterior" onClick={() => go(-1)} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" />
        <button aria-label="Siguiente" onClick={() => go(1)} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" />
        <AnimatePresence mode="wait">
          <motion.div key={i} className={`absolute inset-0 px-6 flex flex-col justify-center ${i === total - 1 ? 'z-20' : ''}`}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
            {slides[i]}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="text-center text-[11px] text-slate-500 pb-[max(14px,env(safe-area-inset-bottom))]">Toca a los lados para avanzar o volver</p>
    </motion.div>
  );
}

/** ¿Hay resumen del mes que terminó para mostrar? (primeros 10 días del ciclo) */
export const recapAvailable = (tx: Transaction[]) => {
  const payDay = getPrefs().payDay; const now = new Date();
  const cur = cycleFor(now, payDay), prev = cycleFor(now, payDay, -1), prev2 = cycleFor(now, payDay, -2);
  const r = buildRecap(tx.filter(t => inCycle(t.date, prev)), tx.filter(t => inCycle(t.date, prev2)), prev.days);
  return !!r && cycleProgress(cur, now).day <= 10;
};

/** Tarjeta de Inicio (solo los primeros 10 días del mes, si hay datos del mes anterior).
 *  compact = fila de "Para hoy" en el Inicio nuevo. */
export default function MonthRecapCard({ tx, compact = false }: { tx: Transaction[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const payDay = getPrefs().payDay;
  const now = new Date();
  const cur = cycleFor(now, payDay), prev = cycleFor(now, payDay, -1), prev2 = cycleFor(now, payDay, -2);
  const r = buildRecap(tx.filter(t => inCycle(t.date, prev)), tx.filter(t => inCycle(t.date, prev2)), prev.days);
  const { day } = cycleProgress(cur, now);
  if (!r || day > 10) return null;
  if (compact) {
    const close = () => { markRecapSeen(prev.startISO); setOpen(false); };
    return (
      <>
        <button onClick={() => { haptic(); setOpen(true); }} className="w-full flex items-center gap-3 rounded-[20px] bg-surface border border-white/5 p-3 text-left">
          <span className="w-10 h-10 rounded-[13px] bg-brand-lime/15 flex items-center justify-center shrink-0"><BarChart3 size={19} className="text-brand-lime" /></span>
          <span className="flex-1 min-w-0"><span className="block text-white font-bold text-[13.5px] truncate">Tu resumen de {prev.label}</span>
            <span className="block text-[11.5px] text-slate-400 truncate">{r.saved >= 0 ? `Ahorraste ${formatCOP(r.saved)}` : `Gastaste ${formatCOP(-r.saved)} de más`} · tócalo</span></span>
          <ChevronRight size={18} className="text-slate-500 shrink-0" />
        </button>
        {createPortal(<AnimatePresence>{open && <Story r={r} label={prev.label} onClose={close} />}</AnimatePresence>, document.body)}
      </>
    );
  }
  const seen = recapSeen(prev.startISO);
  const close = () => { markRecapSeen(prev.startISO); setOpen(false); };

  return (
    <>
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => { haptic(); setOpen(true); }} data-tour="home-recap"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        className="w-full text-left rounded-[26px] p-4 bg-gradient-to-br from-[#C6F432]/20 via-[#7DD3FC]/10 to-transparent ring-1 ring-brand-lime/40 relative overflow-hidden">
        {!seen && <motion.span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-brand-lime" animate={{ scale: [1, 1.6, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} />}
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-brand-lime flex items-center justify-center shrink-0"><BarChart3 size={24} className="text-brand-ink" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold flex items-center gap-2">Tu resumen de {prev.label} <NewBadge id="home-resumen" /></p>
            <p className="text-[12px] text-slate-300 mt-0.5">{r.saved >= 0 ? <>Ahorraste <b className="text-brand-lime">{formatCOP(r.saved)}</b></> : <>Gastaste <b className="text-rose-300">{formatCOP(-r.saved)}</b> de más</>} · toca para verlo</p>
          </div>
          <ChevronRight size={20} className="text-slate-400 shrink-0" />
        </div>
      </motion.button>
      {createPortal(<AnimatePresence>{open && <Story r={r} label={prev.label} onClose={close} />}</AnimatePresence>, document.body)}
    </>
  );
}
