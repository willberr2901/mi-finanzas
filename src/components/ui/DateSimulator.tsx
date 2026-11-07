/**
 * 🧪 Botón "Simular fecha" — SOLO en la app de pruebas (utils/simDate.ts).
 * Deja ver la app como si fuera 1 de diciembre, Halloween, Año Nuevo, día de pago o fin de mes.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IS_TEST } from '../../utils/env';
import { simDate, setSimDate } from '../../utils/simDate';
import { getPlan } from '../../services/budgetPlan';

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function options() {
  const real = new Date();
  const y = real.getMonth() === 11 ? real.getFullYear() : real.getFullYear();
  const payDay = (getPlan()?.payDays?.[0]) ?? 1;
  const pay = new Date(real.getFullYear(), real.getMonth() + (real.getDate() > payDay ? 1 : 0), payDay);
  const end = new Date(real.getFullYear(), real.getMonth() + 1, 0);
  return [
    { e: '📅', t: 'Hoy real', v: null },
    { e: '🎄', t: '1 dic', v: `${y}-12-01` },
    { e: '🎅', t: '24 dic', v: `${y}-12-24` },
    { e: '🎆', t: '31 dic', v: `${y}-12-31` },
    { e: '👑', t: '6 ene', v: `${y + 1}-01-06` },
    { e: '🎃', t: '31 oct', v: `${y}-10-31` },
    { e: '💚', t: 'Día de pago', v: iso(pay) },
    { e: '📊', t: 'Fin de mes', v: iso(end) },
  ] as { e: string; t: string; v: string | null }[];
}

export default function DateSimulator() {
  const [open, setOpen] = useState(false);
  if (!IS_TEST) return null;
  const cur = simDate();
  const opts = options();
  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label="Simular fecha (solo pruebas)"
        className="fixed left-0 z-[290] w-9 h-11 rounded-r-2xl bg-amber-400/90 text-[#1A0A00] text-xl shadow-lg shadow-black/50 flex items-center justify-center active:scale-95"
        style={{ top: '46%' }}>🧪{cur && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-[#0B1026]" />}</button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="theme-dark fixed left-3 right-3 z-[291] rounded-3xl bg-[#0B1026f2] border-2 border-amber-400 p-3 shadow-2xl shadow-black/60"
            style={{ top: 'calc(46% + 52px)' }}>
            <div className="flex items-center justify-between"><p className="font-extrabold text-[13px] text-amber-300">🧪 Simular fecha</p><span className="text-[11px] text-slate-400 font-bold">solo pruebas</span></div>
            <div className="grid grid-cols-4 gap-1.5 mt-2.5">
              {opts.map(o => {
                const on = (o.v ?? null) === cur;
                return (
                  <button key={o.t} onClick={() => setSimDate(o.v)}
                    className={`rounded-xl py-2 px-1 text-center text-[11px] font-extrabold ${on ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.08] text-white'}`}>
                    <span className="block text-lg leading-none mb-0.5">{o.e}</span>{o.t}
                  </button>
                );
              })}
            </div>
            <p className="text-[10.5px] text-slate-400 mt-2 leading-snug">La app se ve como si fuera esa fecha (temporada, Kai, saludos, avisos). Tus datos no cambian.{cur && <> Ahora: <b className="text-amber-300">{cur}</b></>}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
