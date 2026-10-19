/**
 * ════════════════════════════════════════════════════════════════════
 * 💚 TARJETA "SALUD FINANCIERA" + DETALLE
 * ────────────────────────────────────────────────────────────────────
 * Tarjeta pequeña en Inicio con el puntaje. Al tocarla se abre el detalle:
 * medidor, las 4 partes (ahorro, pagos al día, gustos, deudas) y el consejo
 * que más te ayudaría. Sin ingresos del ciclo muestra un botón para registrarlos.
 * Cálculo: services/healthScore.ts
 * ════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, ChevronRight, Lightbulb, PiggyBank, CalendarCheck, PartyPopper, Landmark, Plus } from 'lucide-react';
import BottomSheet from '../ui/BottomSheet';
import type { HealthResult, HealthPart } from '../../services/healthScore';

const ICONS: Record<HealthPart['id'], typeof PiggyBank> = { ahorro: PiggyBank, pagos: CalendarCheck, gustos: PartyPopper, deudas: Landmark };
const barColor = (s: number) => (s >= 80 ? 'bg-brand-lime' : s >= 60 ? 'bg-lime-400' : s >= 40 ? 'bg-amber-400' : 'bg-rose-400');

/** Abre el registro rápido directo en "Nuevo ingreso". */
export const openIncome = () => window.dispatchEvent(new CustomEvent('mf:quick-add', { detail: 'income' }));

/** Medio círculo con el puntaje. */
function Meter({ value, color }: { value: number | null; color: string }) {
  const v = value ?? 0;
  const len = Math.PI * 80; // semicírculo de radio 80
  return (
    <svg viewBox="0 0 200 116" className="w-48 mx-auto" aria-hidden="true">
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
      <motion.path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
        strokeDasharray={len} initial={{ strokeDashoffset: len }} animate={{ strokeDashoffset: len * (1 - v / 100) }} transition={{ duration: 1.1, ease: 'easeOut' }} />
      <text x="100" y="92" textAnchor="middle" fontSize="40" fontWeight="800" fill="white">{value ?? '—'}</text>
      <text x="100" y="112" textAnchor="middle" fontSize="11" fill="#8A93B8">de 100</text>
    </svg>
  );
}

export default function HealthCard({ health, cycleLabel }: { health: HealthResult; cycleLabel: string }) {
  const [open, setOpen] = useState(false);
  const noIncome = health.total === null;
  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-surface border border-white/5 rounded-[26px] p-4 text-left w-full">
        <span className="flex items-center justify-between">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center"><Gauge size={16} className="text-white" /></span>
          <ChevronRight size={15} className="text-slate-600" />
        </span>
        <p className="text-white font-bold text-sm mt-2">Salud financiera</p>
        {noIncome ? (
          <>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">Registra tus ingresos del mes y te damos tu puntaje.</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-lime"><Plus size={12} /> Agregar ingreso</span>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1 mt-1"><span className="text-2xl font-extrabold" style={{ color: health.color }}>{health.total}</span><span className="text-[10px] text-slate-500">/100</span></div>
            <p className="text-[10px] font-semibold" style={{ color: health.color }}>{health.label}</p>
            <div className="flex gap-1 mt-2" aria-hidden="true">
              {health.parts.map(p => <span key={p.id} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><span className={`block h-full ${barColor(p.score)}`} style={{ width: `${p.score}%` }} /></span>)}
            </div>
          </>
        )}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Tu salud financiera" subtitle={`Ciclo ${cycleLabel}`} icon={<Gauge size={22} />} labelId="mf-health-title">
        <Meter value={health.total} color={health.color} />
        <p className="text-center font-bold -mt-1" style={{ color: health.color }}>{health.label}</p>

        {noIncome && (
          <div className="mt-4 rounded-2xl p-4 bg-white/[0.04] ring-1 ring-white/10 text-center">
            <p className="text-sm text-white font-semibold">Para calcularla necesitamos saber cuánto te entró este mes</p>
            <p className="text-[11px] text-slate-400 mt-1">Sueldo, recargos, ventas… Así medimos tu ahorro, tus gustos y tus deudas frente a lo que ganas.</p>
            <button onClick={() => { setOpen(false); setTimeout(openIncome, 250); }} className="mt-3 w-full h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2"><Plus size={18} /> Registrar un ingreso</button>
          </div>
        )}

        {health.focus && (
          <div className="mt-4 flex gap-3 rounded-2xl p-3.5 bg-brand-lime/10 ring-1 ring-brand-lime/30">
            <Lightbulb size={18} className="text-brand-lime shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-bold">Lo que más te ayudaría: {health.focus.label.toLowerCase()}</p>
              <p className="text-[12px] text-slate-200 mt-0.5">{health.focus.tip}</p>
            </div>
          </div>
        )}

        {health.parts.length > 0 && (
          <ul className="mt-4 space-y-3">
            {health.parts.map(p => {
              const Icon = ICONS[p.id];
              return (
                <li key={p.id} className="rounded-2xl p-3.5 bg-white/[0.04] ring-1 ring-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-200"><Icon size={16} /></span>
                    <span className="flex-1 text-white text-sm font-bold">{p.label}</span>
                    <span className="text-sm font-extrabold text-white">{p.score}<span className="text-[10px] text-slate-500 font-normal">/100</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 mt-2.5 overflow-hidden">
                    <motion.div className={`h-full rounded-full ${barColor(p.score)}`} initial={{ width: 0 }} animate={{ width: `${p.score}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">{p.detail}</p>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[10px] text-slate-500 text-center mt-4">Se calcula en tu celular con lo que registras: ingresos, gastos y pagos fijos del ciclo.</p>
      </BottomSheet>
    </>
  );
}
