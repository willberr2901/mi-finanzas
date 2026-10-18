/**
 * ════════════════════════════════════════════════════════════════════
 * ➕➖ CANTIDAD + UNIDAD (und, lb, kg, litro, paq)
 * ────────────────────────────────────────────────────────────────────
 * Dónde se ve: Mercado (agregar producto, tachar y editar).
 * lb/kg suben de a media (0,5); el resto de a 1. El precio siempre es por unidad.
 * ════════════════════════════════════════════════════════════════════
 */
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { UNITS, unitStep, type Unit } from '../../services/market/marketStore';

export const fmtQty = (q: number) => (Number.isInteger(q) ? String(q) : q.toLocaleString('es-CO', { maximumFractionDigits: 2 }));

export function QtyStepper({ qty, unit, onChange, size = 'md' }: { qty: number; unit: Unit; onChange: (q: number) => void; size?: 'md' | 'sm' }) {
  const step = unitStep(unit);
  const h = size === 'sm' ? 'w-8 h-8' : 'w-11 h-12';
  return (
    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl" role="group" aria-label="Cantidad">
      <motion.button type="button" whileTap={{ scale: 0.8 }} onClick={() => onChange(Math.max(step, +(qty - step).toFixed(2)))} aria-label="Menos" className={`${h} flex items-center justify-center text-slate-200`}><Minus size={size === 'sm' ? 14 : 18} /></motion.button>
      <motion.span key={qty} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`min-w-[28px] px-0.5 text-center text-white font-bold ${size === 'sm' ? 'text-sm' : 'text-lg'}`}>{fmtQty(qty)}</motion.span>
      <motion.button type="button" whileTap={{ scale: 0.8 }} onClick={() => onChange(+(qty + step).toFixed(2))} aria-label="Más" className={`${h} flex items-center justify-center text-slate-200`}><Plus size={size === 'sm' ? 14 : 18} /></motion.button>
    </div>
  );
}

export function UnitPicker({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="radiogroup" aria-label="Unidad">
      {UNITS.map(u => (
        <button type="button" key={u.id} role="radio" aria-checked={unit === u.id} onClick={() => onChange(u.id)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${unit === u.id ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] text-slate-300 ring-1 ring-white/10'}`}>
          {u.label}
        </button>
      ))}
    </div>
  );
}

