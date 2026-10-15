import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AppLogo from '../ui/AppLogo';
import { markTourSeen, tourSeen, type TourStep } from './tourState';

interface TourCtx {
  register: (id: string, steps: TourStep[]) => void;
  start: (id?: string) => void;
  currentId: string | null;
}
const Ctx = createContext<TourCtx>({ register: () => {}, start: () => {}, currentId: null });

/**
 * Guía interactiva: oscurece la pantalla, ilumina el botón y una "burbuja" explica
 * para qué sirve, paso a paso. Se muestra sola la primera vez en cada módulo.
 */
export function TourProvider({ children, ready }: { children: ReactNode; ready: boolean }) {
  const tours = useRef<Record<string, TourStep[]>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [active, setActive] = useState<{ id: string; i: number } | null>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  const start = useCallback((id?: string) => {
    const key = id ?? currentId;
    if (key && tours.current[key]?.length) setActive({ id: key, i: 0 });
  }, [currentId]);

  const register = useCallback((id: string, steps: TourStep[]) => {
    tours.current[id] = steps;
    setCurrentId(id);
    if (!tourSeen(id)) {
      const t = setInterval(() => {
        if (readyRef.current) { clearInterval(t); setTimeout(() => setActive(a => a ?? { id, i: 0 }), 700); }
      }, 300);
      setTimeout(() => clearInterval(t), 60_000);
    }
  }, []);

  const finish = () => { if (active) markTourSeen(active.id); setActive(null); };
  const steps = active ? tours.current[active.id] : [];

  return (
    <Ctx.Provider value={{ register, start, currentId }}>
      {children}
      {createPortal(
        <AnimatePresence>{active && steps[active.i] && (
          <Spotlight key="tour" step={steps[active.i]} index={active.i} total={steps.length}
            onNext={() => (active.i + 1 < steps.length ? setActive({ ...active, i: active.i + 1 }) : finish())}
            onSkip={finish} />
        )}</AnimatePresence>,
        document.body
      )}
    </Ctx.Provider>
  );
}

export const useTour = () => useContext(Ctx);

/** Registra la guía de una página (y la lanza la primera vez). */
export const usePageTour = (id: string, steps: TourStep[]) => {
  const { register } = useTour();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { register(id, steps); }, [id]);
};

function Spotlight({ step, index, total, onNext, onSkip }: { step: TourStep; index: number; total: number; onNext: () => void; onSkip: () => void }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const measure = () => setRect(el.getBoundingClientRect());
    const t = setTimeout(measure, 380);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [step.target]);

  const pad = 8;
  const vh = window.innerHeight;
  const below = rect ? rect.bottom + 200 < vh : true;
  const bubbleTop = rect ? (below ? rect.bottom + pad + 14 : Math.max(16, rect.top - pad - 14 - 190)) : vh / 2 - 100;

  return (
    <motion.div className="fixed inset-0 z-[250]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onNext}>
      {/* Oscurece todo menos el botón señalado */}
      {rect ? (
        <motion.div className="absolute rounded-2xl pointer-events-none"
          initial={false}
          animate={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          style={{ boxShadow: '0 0 0 9999px rgba(3,6,15,0.78)' }}>
          <motion.span className="absolute inset-0 rounded-2xl border-2 border-violet-400" animate={{ scale: [1, 1.08, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
        </motion.div>
      ) : <div className="absolute inset-0 bg-[rgba(3,6,15,0.78)]" />}

      {/* Burbuja con la explicación */}
      <motion.div key={index} onClick={e => e.stopPropagation()} role="dialog" aria-live="polite" aria-label={step.title}
        className="absolute left-4 right-4 mx-auto max-w-sm"
        style={{ top: bubbleTop }}
        initial={{ opacity: 0, y: below ? -10 : 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', damping: 20, stiffness: 240 }}>
        <div className="bg-white text-slate-900 rounded-3xl p-4 shadow-2xl relative">
          <div className="flex gap-3">
            <motion.div className="shrink-0" animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}><AppLogo size={40} animated={false} /></motion.div>
            <div className="flex-1">
              <p className="font-bold text-[15px] leading-snug">{step.title}</p>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{step.text}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1.5" aria-hidden="true">{Array.from({ length: total }).map((_, i) => <span key={i} className={`h-1.5 rounded-full ${i === index ? 'w-5 bg-violet-600' : 'w-1.5 bg-slate-300'}`} />)}</div>
            <div className="flex gap-2">
              {index + 1 < total && <button onClick={onSkip} className="px-3 py-2 text-sm text-slate-500">Saltar</button>}
              <button onClick={onNext} className="px-4 py-2 rounded-xl bg-violet-600 text-brand-ink text-sm font-bold flex items-center gap-1">{index + 1 < total ? 'Siguiente' : '¡Entendido!'} <ArrowRight size={14} /></button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
