/**
 * ════════════════════════════════════════════════════════════════════
 * 🎯 TARJETA DE PRESUPUESTOS
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Barras de cuánto llevas gastado en cada categoría frente a su límite del ciclo.
 * Dónde se ve: Inicio.
 * Si lo cambias: Los límites se editan en Ajustes → Presupuestos (utils/prefs.ts).
 * ════════════════════════════════════════════════════════════════════
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiggyBank, ChevronRight, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import type { Transaction } from '../../utils/database';
import { formatCOP } from '../../utils/format';

export type BudgetLevel = 'ok' | 'warn' | 'over';
export const budgetLevel = (pct: number): BudgetLevel => (pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok');
const STYLE: Record<BudgetLevel, { bar: string; text: string; chip: string }> = {
  ok: { bar: 'bg-brand-lime', text: 'text-slate-300', chip: 'text-brand-lime' },
  warn: { bar: 'bg-amber-400', text: 'text-amber-300', chip: 'text-amber-300' },
  over: { bar: 'bg-rose-400', text: 'text-rose-300', chip: 'text-rose-300' },
};

interface Props { expenses: Transaction[]; budgets: Record<string, number>; daysLeft: number; }

/** Tarjeta de Inicio con el avance de cada presupuesto por categoría. */
export default function BudgetsCard({ expenses, budgets, daysLeft }: Props) {
  const entries = Object.entries(budgets).filter(([, v]) => v > 0);

  if (!entries.length) {
    return (
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[26px] p-4 bg-gradient-to-br theme-dark from-[#1B2350] to-surface ring-1 ring-lime-300/15">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 shrink-0 rounded-2xl bg-brand-lime/15 ring-1 ring-brand-lime/30 flex items-center justify-center"><PiggyBank size={20} className="text-brand-lime" /></span>
          <div className="flex-1">
            <p className="text-white font-bold text-[15px]">Ponle límite a tus gastos</p>
            <p className="text-xs text-slate-400 mt-0.5">Define cuánto quieres gastar en mercado, salidas o transporte y te avisamos antes de pasarte.</p>
            <Link to="/ajustes?s=presupuestos" className="mt-3 inline-flex items-center gap-1 rounded-xl bg-brand-lime text-brand-ink text-xs font-bold px-3 py-2">Crear mis presupuestos <ChevronRight size={14} /></Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const spentBy = new Map<string, number>();
  for (const t of expenses) spentBy.set(t.category, (spentBy.get(t.category) ?? 0) + t.amount);
  const rows = entries.map(([cat, limit]) => {
    const spent = spentBy.get(cat) ?? 0;
    const pct = (spent / limit) * 100;
    return { cat, limit, spent, pct, left: limit - spent, level: budgetLevel(pct) };
  }).sort((a, b) => b.pct - a.pct);

  const totalLimit = rows.reduce((a, r) => a + r.limit, 0);
  const totalSpent = rows.reduce((a, r) => a + Math.min(r.spent, r.limit * 3), 0);
  const totalPct = Math.round((totalSpent / Math.max(1, totalLimit)) * 100);
  const totalLevel = budgetLevel(totalPct);
  const overCount = rows.filter(r => r.level === 'over').length;
  const warnCount = rows.filter(r => r.level === 'warn').length;
  const C = 2 * Math.PI * 22;

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-white/5 rounded-[26px] p-4" data-tour="home-budgets">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br theme-dark from-[#232C5A] to-[#0E1430] ring-1 ring-white/10 flex items-center justify-center"><PiggyBank size={16} className="text-brand-lime" /></span>
          <h2 className="text-white font-bold text-[15px]">Presupuestos</h2>
        </div>
        <Link to="/ajustes?s=presupuestos" className="text-xs text-slate-300 font-semibold flex items-center">Editar<ChevronRight size={14} /></Link>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] ring-1 ring-white/5 p-3">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
            <motion.circle cx="25" cy="25" r="22" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={C}
              className={totalLevel === 'over' ? 'stroke-rose-400' : totalLevel === 'warn' ? 'stroke-amber-400' : 'stroke-brand-lime'}
              initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - Math.min(100, totalPct) / 100) }} transition={{ duration: 1.1 }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-white">{totalPct}%</span>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-bold">{formatCOP(totalSpent)} <span className="text-slate-400 font-medium">de {formatCOP(totalLimit)}</span></p>
          <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${overCount ? 'text-rose-300' : warnCount ? 'text-amber-300' : 'text-brand-lime'}`}>
            {overCount ? <><Flame size={12} /> {overCount === 1 ? '1 categoría pasada' : `${overCount} categorías pasadas`}</>
              : warnCount ? <><AlertTriangle size={12} /> {warnCount === 1 ? '1 categoría cerca del límite' : `${warnCount} cerca del límite`}</>
              : <><CheckCircle2 size={12} /> Vas dentro de tus límites</>}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {rows.map((r, i) => {
          const st = STYLE[r.level];
          const perDay = daysLeft > 0 && r.left > 0 ? r.left / (daysLeft + 1) : 0;
          return (
            <div key={r.cat}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-white font-semibold truncate">{r.cat}</span>
                <span className="text-[11px] text-slate-400 shrink-0"><span className="text-white font-bold">{formatCOP(r.spent)}</span> / {formatCOP(r.limit)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden mt-1.5">
                <motion.div className={`h-full rounded-full ${st.bar}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, r.pct)}%` }} transition={{ duration: 0.9, delay: 0.15 + i * 0.07 }} />
              </div>
              <p className={`text-[11px] mt-1 ${st.text}`}>
                {r.level === 'over' ? `Te pasaste ${formatCOP(-r.left)}`
                  : r.level === 'warn' ? `Llevas ${Math.round(r.pct)}% · te quedan ${formatCOP(r.left)}`
                  : `Te quedan ${formatCOP(r.left)}${perDay ? ` · unos ${formatCOP(perDay)} por día` : ''}`}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
