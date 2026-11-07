/**
 * ════════════════════════════════════════════════════════════════════
 * 🎬 NOVEDADES EN FORMATO "VIDEO" (pantalla completa, tipo estados de WhatsApp)
 * ────────────────────────────────────────────────────────────────────
 * Una pantalla por novedad, con su animación, que pasa sola cada 7 s.
 * Toca a la derecha para avanzar, a la izquierda para volver; mantén presionado para pausar.
 * "Probarlo" lleva directo a la función. Contenido: services/releaseStories.ts
 * ════════════════════════════════════════════════════════════════════
 */
import { openAssistant } from '../../services/budgetPlan';
import { openRating } from '../../services/ratingService';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Pause } from 'lucide-react';
import { APP_VERSION } from '../../version';
import { RELEASE_STORY } from '../../services/releaseStories';
import { DEMOS } from './FeatureDemos';
import { openSupport } from '../../services/supportService';
import { haptic } from '../../utils/haptics';

const MS = 7000;

export default function WhatsNewStory({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = RELEASE_STORY.length;
  const s = RELEASE_STORY[i];
  const Demo = DEMOS[s.demo];

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => (i < n - 1 ? setI(i + 1) : undefined), MS);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  const go = (d: number) => { haptic(); setI(x => Math.max(0, Math.min(n - 1, x + d))); };
  const tryIt = () => {
    const to = s.cta?.to; if (!to) return;
    onClose();
    if (to === '#apoyar') setTimeout(openSupport, 250); else if (to === '#kai') setTimeout(openAssistant, 250); else if (to === '#calificar') setTimeout(openRating, 250); else if (to === '#mas') setTimeout(() => window.dispatchEvent(new CustomEvent('mf:quick-add')), 250); else navigate(to);
  };

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Novedades de la versión ${APP_VERSION}`}
      className="theme-dark fixed inset-0 z-[170] bg-gradient-to-b from-[#16204A] via-[#0E1430] to-[#070B18] flex flex-col"
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', damping: 22, stiffness: 240 }}>
      <div className="flex gap-1.5 px-4 pt-[max(14px,env(safe-area-inset-top))]">
        {RELEASE_STORY.map((_, k) => (
          <div key={k} className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
            {k < i && <div className="h-full w-full bg-brand-lime" />}
            {k === i && <motion.div key={`${i}-${paused}`} className="h-full bg-brand-lime" initial={{ width: 0 }} animate={{ width: paused ? undefined : '100%' }} transition={{ duration: MS / 1000, ease: 'linear' }} />}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 mt-3">
        <p className="text-white font-extrabold text-sm">✨ Novedades · v{APP_VERSION}</p>
        <div className="flex items-center gap-1">
          {paused && <Pause size={16} className="text-slate-400" />}
          <button onClick={onClose} aria-label="Cerrar novedades" className="p-2 -mr-2 text-slate-300"><X size={22} /></button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden"
        onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
        <button aria-label="Anterior" onClick={() => go(-1)} className="absolute left-0 top-0 bottom-28 w-1/3 z-10" />
        <button aria-label="Siguiente" onClick={() => go(1)} className="absolute right-0 top-0 bottom-28 w-1/3 z-10" />
        <AnimatePresence mode="wait">
          <motion.div key={i} className="absolute inset-0 px-6 flex flex-col justify-center"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.32 }}>
            <div className="rounded-[30px] bg-white/[0.04] ring-1 ring-white/10 py-6 px-3"><Demo /></div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 text-[12px] font-extrabold tracking-widest text-brand-lime">{s.tag}</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="text-white text-[26px] font-extrabold leading-tight mt-1">{s.title}</motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-slate-300 text-[15px] leading-relaxed mt-2">{s.text}</motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-20 px-6 pb-[max(18px,env(safe-area-inset-bottom))] space-y-2">
        {s.cta && <motion.button whileTap={{ scale: 0.96 }} onClick={tryIt} className="w-full py-3.5 rounded-2xl bg-white/[0.08] ring-1 ring-white/15 text-white font-extrabold">{s.cta.label}</motion.button>}
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => (i < n - 1 ? go(1) : onClose())} className="w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2">
          {i < n - 1 ? <>Siguiente <ArrowRight size={18} /></> : '¡Listo, a usarla!'}
        </motion.button>
        <p className="text-center text-[11px] text-slate-500">{i + 1} de {n} · toca a los lados o mantén presionado para pausar</p>
      </div>
    </motion.div>
  );
}
