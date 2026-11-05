/**
 * 🎬 MINI "VIDEOS" ANIMADOS DE CADA NOVEDAD
 * Son animaciones dibujadas con código (se repiten solas, como un video corto),
 * así no pesan nada y se ven nítidas en cualquier celular.
 * Para una novedad nueva: agrega aquí su demo y úsala en services/releaseStories.ts.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Kai, { type KaiMood } from '../assistant/Kai';
import { Jar } from '../goals/PiggyCounter';
import { Heart, ShieldCheck, Smartphone, FileLock2, Coffee } from 'lucide-react';

const loop = { repeat: Infinity, repeatDelay: 0.8 };
const Phone = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-[170px] h-[230px] rounded-[28px] bg-[#0B1026] ring-[6px] ring-[#1A2140] shadow-2xl shadow-black/60 overflow-hidden mx-auto p-3">{children}</div>
);

/** 📊 Resumen del mes: barras que crecen y número que sube. */
export function DemoRecap() {
  const bars = [{ c: '#C6F432', w: 92, l: 'Arriendo' }, { c: '#7DD3FC', w: 60, l: 'Mercado' }, { c: '#F9A8D4', w: 38, l: 'Salidas' }];
  return (
    <Phone>
      <p className="text-[8px] font-extrabold tracking-widest text-slate-400">TU OCTUBRE</p>
      <p className="text-[11px] text-white font-extrabold mt-1">Ahorraste</p>
      <motion.p className="text-[22px] font-extrabold text-brand-lime leading-none" initial={{ opacity: 0, y: 8 }} animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, 0] }} transition={{ duration: 4, times: [0, 0.15, 0.9, 1], ...loop }}>$950.000</motion.p>
      <div className="mt-3 space-y-2.5">
        {bars.map((b, i) => (
          <div key={b.l}>
            <p className="text-[8px] text-slate-300 font-bold">{b.l}</p>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: b.c }} animate={{ width: ['0%', `${b.w}%`, `${b.w}%`, '0%'] }} transition={{ duration: 4, times: [0, 0.3 + i * 0.08, 0.9, 1], ...loop }} /></div>
          </div>
        ))}
      </div>
      <motion.div className="mt-3 rounded-xl bg-emerald-500/15 p-2" animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 4, times: [0, 0.45, 0.55, 0.9, 1], ...loop }}>
        <p className="text-[8px] text-emerald-300 font-extrabold">👏 BAJÓ</p><p className="text-[10px] text-white font-extrabold">Mercado −$100.000</p>
      </motion.div>
    </Phone>
  );
}

/** 🎯 Anillos que se llenan. */
export function DemoRings() {
  const r = [{ p: 0.62, c: 'stroke-brand-lime', l: 'Mercado' }, { p: 0.86, c: 'stroke-amber-400', l: 'Salidas' }, { p: 1, c: 'stroke-rose-400', l: 'Ropa' }];
  const C = 2 * Math.PI * 22;
  return (
    <div className="flex justify-center gap-3">
      {r.map((x, i) => (
        <div key={x.l} className="w-[86px] rounded-2xl bg-white/[0.06] p-2 text-center">
          <svg viewBox="0 0 50 50" className="w-16 h-16 mx-auto -rotate-90"><circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
            <motion.circle cx="25" cy="25" r="22" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} className={x.c}
              animate={{ strokeDashoffset: [C, C * (1 - x.p), C * (1 - x.p), C] }} transition={{ duration: 3.6, times: [0, 0.35 + i * 0.08, 0.9, 1], ...loop }} /></svg>
          <p className="text-[11px] text-white font-bold mt-1">{x.l}</p>
          <p className="text-[10px] text-slate-400">{Math.round(x.p * 100)}%</p>
        </div>
      ))}
    </div>
  );
}

/** 📳 Vibración suave al tocar. */
export function DemoHaptics() {
  return (
    <div className="relative h-[200px] flex items-center justify-center">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="absolute w-28 h-28 rounded-full border-2 border-brand-lime" animate={{ scale: [0.6, 1.8], opacity: [0.7, 0] }} transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity }} />
      ))}
      <motion.div animate={{ x: [0, -4, 4, -3, 3, 0, 0], rotate: [0, -3, 3, -2, 2, 0, 0] }} transition={{ duration: 1.8, times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 1], repeat: Infinity }}>
        <Smartphone size={80} className="text-white" strokeWidth={1.5} />
      </motion.div>
      <motion.span className="absolute bottom-6 px-3 py-1 rounded-full bg-brand-lime text-brand-ink text-xs font-extrabold" animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 1.8, times: [0, 0.1, 0.6, 1], repeat: Infinity }}>✓ Gasto guardado</motion.span>
    </div>
  );
}

/** 💾 Respaldo: tu celular → candado → archivo seguro. */
export function DemoBackup() {
  return (
    <div className="h-[200px] flex items-center justify-center gap-4">
      <Smartphone size={58} className="text-white" strokeWidth={1.5} />
      <div className="relative w-24 h-6">
        <motion.div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-sky-300 flex items-center justify-center" animate={{ left: ['0%', '75%'], opacity: [0, 1, 1, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.4 }}>
          <ShieldCheck size={14} className="text-[#06122B]" />
        </motion.div>
        <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-white/20" />
      </div>
      <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.4, times: [0, 0.9, 1] }}>
        <FileLock2 size={58} className="text-sky-300" strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

/** ☕ Apóyanos: monedas que caen en la taza y un corazón. */
export function DemoSupport() {
  return (
    <div className="relative h-[210px] flex items-end justify-center pb-6">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="absolute w-7 h-7 rounded-full bg-[#C9A44C] shadow-[inset_0_0_0_6px_#C3C9D1]" style={{ left: `calc(50% - 14px + ${(i - 1) * 18}px)` }}
          animate={{ top: [-10, 110], opacity: [0, 1, 1, 0], rotate: [0, 180] }} transition={{ duration: 1.4, delay: i * 0.45, repeat: Infinity, repeatDelay: 0.6 }} />
      ))}
      <div className="w-24 h-24 rounded-3xl bg-orange-300 flex items-center justify-center"><Coffee size={52} className="text-[#2A0A1F]" /></div>
      <motion.div className="absolute top-6 right-[calc(50%-80px)]" animate={{ scale: [0, 1.3, 1, 0], opacity: [0, 1, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.6, 0.8, 1] }}>
        <Heart size={30} className="text-brand-lime" fill="currentColor" />
      </motion.div>
    </div>
  );
}


/** 🤖 Kai: cambia de cara y dice lo que hace en cada paso. */
export function DemoKai() {
  const steps: [KaiMood, string][] = [['feliz', '¡Hola! Soy Kai 👋'], ['pensando', '¿Cuánto te entra y cuándo te pagan?'], ['normal', 'Ahorrar 10% = $280.000 al mes'], ['calma', 'No te preocupes 💚 primero liberamos deuda'], ['celebra', '¡Plan listo!']];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % steps.length), 1700); return () => clearInterval(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col items-center">
      <Kai mood={steps[i][0]} size={150} />
      <div className="h-12 -mt-2 flex items-start">
        <AnimatePresence mode="wait">
          <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="px-4 py-2 rounded-[4px_16px_16px_16px] bg-[#1B2350] ring-1 ring-white/10 text-white text-[13px] font-semibold">{steps[i][1]}</motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** 🔔 Aviso con botón: llega la notificación y se toca "Sí, registrar". */
export function DemoNotif() {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center gap-2">
      <motion.div className="w-[250px] rounded-[18px] bg-white/95 text-[#0B1026] p-3 shadow-xl" animate={{ y: [-40, 0, 0, 0], opacity: [0, 1, 1, 0] }} transition={{ duration: 3.4, times: [0, 0.15, 0.85, 1], repeat: Infinity }}>
        <p className="text-[10px] font-extrabold text-slate-500">MI FINANZAS · ahora</p>
        <p className="text-[13px] font-extrabold mt-0.5">💚 ¡Hoy te pagan!</p>
        <p className="text-[11px] text-slate-600">¿Ya te llegaron los $1.400.000?</p>
        <div className="flex gap-1.5 mt-2">
          <motion.span className="flex-1 text-center text-[11px] font-extrabold rounded-lg py-1.5 bg-[#0B1026] text-[#C6F432]" animate={{ scale: [1, 1, 0.9, 1] }} transition={{ duration: 3.4, times: [0, 0.45, 0.5, 0.55], repeat: Infinity }}>✅ Sí, registrar</motion.span>
          <span className="flex-1 text-center text-[11px] font-extrabold rounded-lg py-1.5 bg-black/5">⏰ Más tarde</span>
        </div>
      </motion.div>
      <motion.p className="text-[12px] font-extrabold text-brand-lime" animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 3.4, times: [0, 0.5, 0.6, 0.9, 1], repeat: Infinity }}>✅ Sueldo registrado · anillos al día</motion.p>
    </div>
  );
}

/** 🔄 Deudas del hogar: dos celulares que se pasan la deuda. */
export function DemoDebts() {
  const P = ({ n, c }: { n: string; c: string }) => (
    <div className="w-[92px] h-[150px] rounded-[20px] bg-[#0B1026] ring-4 ring-[#1A2140] p-2 flex flex-col gap-1.5">
      <p className="text-[9px] font-extrabold" style={{ color: c }}>{n}</p>
      <div className="rounded-lg bg-white/[0.07] p-1.5"><p className="text-[9px] font-bold text-white">🏦 Crédito</p><p className="text-[8px] text-slate-400">$420.000</p></div>
      <div className="rounded-lg bg-white/[0.07] p-1.5"><p className="text-[9px] font-bold text-white">💳 Tarjeta</p><p className="text-[8px] text-slate-400">$250.000</p></div>
    </div>
  );
  return (
    <div className="h-[200px] flex items-center justify-center gap-3">
      <P n="GATO" c="#C6F432" />
      <div className="relative w-16 h-8">
        <motion.span className="absolute top-0 text-xl" animate={{ left: ['0%', '70%'], opacity: [0, 1, 1, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>🔒</motion.span>
        <motion.span className="absolute bottom-0 text-sm font-extrabold text-emerald-300" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>✅ pagó</motion.span>
      </div>
      <P n="SU PAREJA" c="#F9A8D4" />
    </div>
  );
}

/** 🪙 Alcancía: el frasco se llena y el total sube. */
export function DemoPiggy() {
  return (
    <div className="h-[230px] flex flex-col items-center justify-center scale-[0.78] -my-6">
      <Jar level={0.8} />
      <motion.p className="text-[30px] font-extrabold text-brand-lime -mt-1" animate={{ opacity: [0, 1] }} transition={{ delay: 1 }}>$50.250</motion.p>
    </div>
  );
}

/** ⭐ Estrellas que se llenan una por una. */
export function DemoStars() {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center gap-3">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.span key={i} className="text-[40px]" animate={{ scale: [0.6, 1.3, 1], opacity: [0.25, 1, 1] }} transition={{ delay: 0.3 + i * 0.25, duration: 0.5, repeat: Infinity, repeatDelay: 2.4 }}>⭐</motion.span>
        ))}
      </div>
      <p className="text-[14px] font-bold text-yellow-300">¡Me encanta! 😍</p>
      <p className="text-[12px] text-slate-400">☕ y si quieres, apóyanos por Bre-B</p>
    </div>
  );
}

export const DEMOS = { kai: DemoKai, piggy: DemoPiggy, stars: DemoStars, notif: DemoNotif, debts: DemoDebts, recap: DemoRecap, rings: DemoRings, haptics: DemoHaptics, backup: DemoBackup, support: DemoSupport } as const;
export type DemoId = keyof typeof DEMOS;
