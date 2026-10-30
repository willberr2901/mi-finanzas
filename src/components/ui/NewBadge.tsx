/**
 * ✨ Etiqueta "NUEVO" que brilla al lado de lo que cambió (ver services/newFeatures.ts).
 * Uso: <NewBadge id="fin-tu-mes" />. Al tocarla se va; también se va sola.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { isNew, countView, markSeen, NEW_FEATURES } from '../../services/newFeatures';

export default function NewBadge({ id }: { id: string }) {
  const [show, setShow] = useState(() => isNew(id));
  const [tip, setTip] = useState(false);
  useEffect(() => { if (show) countView(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const hint = NEW_FEATURES.find(f => f.id === id)?.hint;
  return (
    <AnimatePresence>
      {show && (
        <motion.span className="relative inline-flex align-middle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', damping: 14, stiffness: 300 }}>
          <button type="button" onClick={() => { if (tip) { markSeen(id); setShow(false); } else setTip(true); }}
            aria-label={`Nuevo: ${hint ?? ''}. Toca para ocultar`}
            className="mf-new-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-lime text-brand-ink text-[10px] font-extrabold tracking-wider">
            <Sparkles size={10} strokeWidth={3} /> NUEVO
          </button>
          {tip && hint && (
            <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="status"
              className="absolute left-0 top-full mt-1.5 z-20 w-max max-w-[220px] px-3 py-2 rounded-xl bg-[#121938] ring-1 ring-brand-lime/40 text-[11px] text-white font-semibold normal-case tracking-normal shadow-xl">
              {hint}<span className="block text-[10px] text-slate-400 font-normal mt-0.5">Toca otra vez para ocultar</span>
            </motion.span>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
