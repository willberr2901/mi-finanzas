/**
 * ════════════════════════════════════════════════════════════════════
 * 📄 HOJA QUE SUBE DESDE ABAJO (base reutilizable)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: fondo oscuro + panel con borde redondeado que sube animado.
 * Dónde se ve: Mercado (tachar, editar, terminar), Hogar sincronizado.
 * Si lo cambias: cambia el look de todas esas hojas a la vez.
 * ════════════════════════════════════════════════════════════════════
 */
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function BottomSheet({ open, onClose, title, subtitle, icon, children, labelId = 'mf-sheet-title' }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; icon?: ReactNode; children: ReactNode; labelId?: string;
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-end justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby={labelId} onClick={e => e.stopPropagation()}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-surface2 rounded-t-[32px] border-t border-white/10 p-5 pb-8 relative"
            initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }} transition={{ type: 'spring', damping: 27, stiffness: 270 }}>
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-brand-lime/10 blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="relative w-10 h-1.5 rounded-full bg-white/15 mx-auto mb-4" />
            <button onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 p-2 text-slate-400"><X size={20} /></button>
            <div className="relative flex items-center gap-3 mb-4 pr-8">
              {icon && <span className="w-11 h-11 shrink-0 rounded-2xl bg-brand-lime flex items-center justify-center text-brand-ink shadow-lg shadow-lime-400/20">{icon}</span>}
              <div className="min-w-0">
                <h2 id={labelId} className="text-white text-lg font-extrabold leading-tight">{title}</h2>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <div className="relative">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
