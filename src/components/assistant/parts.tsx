/**
 * Piezas compartidas del asistente Kai y la calculadora de presupuesto:
 * pantalla completa, burbuja de chat, lista editable de presupuestos.
 */
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Kai, { type KaiMood } from './Kai';
import MoneyInput from '../ui/MoneyInput';
import { formatCOP } from '../../utils/format';
import type { BudgetRow } from '../../services/budgetPlan';

export const CAT_EMOJI: Record<string, string> = {
  Mercado: '🛒', Servicios: '💡', Transporte: '🚌', Salud: '💊', Hogar: '🏠', 'Educación': '📚',
  'Alimentación': '🍔', Entretenimiento: '🎬', Otros: '✨',
};

/** Pantalla completa con barra de pasos, X y botón fijo abajo. */
export function Shell({ label, step, steps, onClose, children, footer }: { label: string; step: number; steps: number; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);
  return createPortal(
    <motion.div role="dialog" aria-modal="true" aria-label={label} className="theme-dark fixed inset-0 z-[170] flex flex-col bg-[#0B1026] text-white"
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(76,95,214,.35),transparent_70%)]" />
      <div className="relative z-10 px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex gap-1.5" aria-label={`Paso ${step + 1} de ${steps}`}>
            {Array.from({ length: steps }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-lime' : 'bg-white/10'}`} />)}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 -mr-1 rounded-xl bg-white/[0.07] ring-1 ring-white/10 flex items-center justify-center"><X size={18} /></button>
        </div>
        <p className="text-[11px] font-extrabold tracking-[.14em] text-slate-400 mt-3">{label.toUpperCase()}</p>
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      {footer && <div className="relative z-10 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0B1026] via-[#0B1026] to-transparent">{footer}</div>}
    </motion.div>,
    document.body,
  );
}

/** Kai grande arriba con su mensaje. */
export function KaiSays({ mood, children, size = 128 }: { mood: KaiMood; children: ReactNode; size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <Kai mood={mood} size={size} />
      <Bubble>{children}</Bubble>
    </div>
  );
}

export function Bubble({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', damping: 20 }}
      className={`w-full rounded-[4px_20px_20px_20px] bg-[#1B2350] ring-1 ring-white/10 px-4 py-3 leading-relaxed text-slate-100 ${small ? 'text-[13px] mt-3' : 'text-[14.5px] -mt-1'}`}>
      {children}
    </motion.div>
  );
}

/** Lista de presupuestos por categoría, editable. */
export function BudgetRows({ rows, onChange }: { rows: BudgetRow[]; onChange: (rows: BudgetRow[]) => void }) {
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <motion.div key={r.cat} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 rounded-[20px] bg-[#141B3A] ring-1 ring-white/10 p-3">
          <span className="w-10 h-10 rounded-2xl bg-white/[0.06] flex items-center justify-center text-xl shrink-0" aria-hidden="true">{CAT_EMOJI[r.cat] ?? '•'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] truncate">{r.cat}</p>
            <p className="text-[11px] text-slate-400">{r.avg > 0 ? `Promedio ${formatCOP(r.avg)}` : 'Sugerido para empezar'}</p>
          </div>
          <div className="w-32 shrink-0">
            <MoneyInput value={r.value} prefix ariaLabel={`Límite para ${r.cat}`} onChange={v => onChange(rows.map((x, j) => (j === i ? { ...x, value: v } : x)))}
              className="w-full rounded-2xl bg-[#0B1026] ring-1 ring-brand-lime/30 focus:ring-brand-lime outline-none px-3 py-2.5 text-right font-extrabold text-[15px]" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export const monthYear = (d: Date) => `${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()]} ${d.getFullYear()}`;
