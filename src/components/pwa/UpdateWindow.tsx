/**
 * ════════════════════════════════════════════════════════════════════
 * ⬆️ VENTANA DE ACTUALIZACIÓN v2 (con Kai)
 * ────────────────────────────────────────────────────────────────────
 * Sale cuando hay una VERSIÓN GRANDE lista (version.json con silent=false):
 *   1) "Tu app tiene cosas nuevas": Kai dentro de un anillo, chip de versión,
 *      la novedad estrella y las demás en mosaico. [Actualizar ahora] [Más tarde]
 *   2) Instalando: el anillo se llena con el % (como los anillos del Inicio).
 *   3) "¡Ya tienes la vX!" → recarga y se abren las Novedades (historia).
 * "Más tarde": se instala sola cuando sales de la app.
 * En la app de pruebas se puede ver desde el botón 🧪 → "Ver ventana de actualización".
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Kai from '../assistant/Kai';
import { haptic } from '../../utils/haptics';

export interface UpdateInfo { version: string; notes: string[] }
type Step = 'ask' | 'installing' | 'done';

const split = (n: string) => { const i = n.indexOf(' '); return i > 0 && i <= 4 ? [n.slice(0, i), n.slice(i + 1)] : ['✨', n]; };
const short = (v: string) => v.replace(/\.0$/, '');

/** Kai dentro de un anillo que se llena (0–100). */
function KaiRing({ pct, mood, size = 168 }: { pct: number; mood: 'celebra' | 'pensando' | 'feliz'; size?: number }) {
  const r = size / 2 - 9, c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs><linearGradient id="upd-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#C6F432" /><stop offset="100%" stopColor="#7DD3FC" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="10" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#upd-ring)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ ease: 'easeOut', duration: 0.5 }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"><Kai mood={mood} size={size * 0.62} /></div>
    </div>
  );
}

export default function UpdateWindow({ info, onInstall, onLater, demo }: { info: UpdateInfo; onInstall: () => void; onLater: () => void; demo?: boolean }) {
  const [step, setStep] = useState<Step>('ask');
  const [pct, setPct] = useState(0);
  const timer = useRef<number>();
  const v = short(info.version);
  const [star, ...rest] = info.notes;
  const tiles = rest.slice(0, 5);
  const more = rest.length - tiles.length;

  // Al terminar (la app avisa con 'mf:update-done') llena el anillo y celebra.
  useEffect(() => {
    const done = () => { window.clearInterval(timer.current); setPct(100); setStep('done'); haptic('success'); };
    window.addEventListener('mf:update-done', done);
    return () => { window.removeEventListener('mf:update-done', done); window.clearInterval(timer.current); };
  }, []);

  const install = () => {
    haptic('light'); setStep('installing'); setPct(4);
    timer.current = window.setInterval(() => setPct(p => (p < 92 ? p + Math.max(1, Math.round((92 - p) / 9)) : p)), 140);
    onInstall();
    if (demo) window.setTimeout(() => window.dispatchEvent(new Event('mf:update-done')), 2600);
  };

  return createPortal(
    <motion.div className="theme-dark fixed inset-0 z-[200] bg-[#040713]/85 backdrop-blur-md flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="upd-title" initial={{ y: 40, scale: 0.94 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', damping: 22 }}
        className="w-full max-w-sm rounded-[30px] p-5 bg-gradient-to-b from-[#18204A] to-[#0E1433] border border-white/10 shadow-2xl shadow-black/60 text-white max-h-[92vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 'ask' ? (
            <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold tracking-[2px] text-slate-300">⬆️ ACTUALIZACIÓN</p>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-lime text-brand-ink text-[12px] font-extrabold">v{v}</span>
              </div>
              <div className="mt-2"><KaiRing pct={78} mood="celebra" size={150} /></div>
              <h2 id="upd-title" className="text-center text-[23px] font-extrabold leading-tight mt-1">Tu app tiene <span className="text-brand-lime">cosas nuevas</span></h2>
              <p className="text-center text-[12px] text-slate-400 font-semibold mt-1">Tarda unos segundos · tus datos no se tocan</p>
              {star && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-brand-lime/10 ring-1 ring-brand-lime/35 px-3 py-2.5">
                  <span className="text-2xl" aria-hidden="true">⭐</span>
                  <span><span className="block text-[10px] font-extrabold tracking-[1.5px] text-brand-lime">LA ESTRELLA</span><span className="block text-[13px] font-bold leading-snug">{split(star)[1]}</span></span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                {tiles.map(n => { const [e, t] = split(n); return (
                  <div key={n} className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-2.5 min-h-[78px]">
                    <span className="text-lg leading-none" aria-hidden="true">{e}</span>
                    <p className="text-[10.5px] font-bold leading-tight mt-1 line-clamp-3">{t}</p>
                  </div>
                ); })}
                {more > 0 && <div className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-2.5 flex items-center justify-center text-[13px] font-extrabold text-brand-lime">+{more} más</div>}
              </div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={install} className="mt-4 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">⬆️ Actualizar ahora</motion.button>
              <button onClick={onLater} className="mt-1.5 w-full h-11 text-sm font-bold text-slate-400">Más tarde</button>
            </motion.div>
          ) : (
            <motion.div key="inst" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-3 text-center">
              <KaiRing pct={pct} mood={step === 'done' ? 'celebra' : 'pensando'} size={176} />
              {step === 'done' ? (
                <>
                  <p className="text-[24px] font-extrabold mt-3">¡Ya tienes la <span className="text-brand-lime">v{v}</span>!</p>
                  <p className="text-[12.5px] text-slate-400 font-semibold mt-1">Abriendo las novedades…</p>
                </>
              ) : (
                <>
                  <p className="text-[38px] font-extrabold text-brand-lime leading-none mt-3" aria-live="polite">{pct}%</p>
                  <p className="text-[16px] font-extrabold mt-1">Instalando la v{v}…</p>
                  <p className="text-[11.5px] text-slate-300 font-bold mt-2">✅ Descargada · {pct < 60 ? '⏳ Instalando' : '✅ Instalada'} · <span className="text-slate-500">✨ Lista</span></p>
                  <div className="mt-3 inline-block rounded-2xl bg-[#fff] text-[#0B1026] text-[12.5px] font-extrabold px-3.5 py-2">Tus datos se quedan donde están 🔒</div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
