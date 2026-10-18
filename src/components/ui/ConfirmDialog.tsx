/**
 * ════════════════════════════════════════════════════════════════════
 * 💬 VENTANA DE CONFIRMACIÓN BONITA (reemplaza el "confirm" del navegador)
 * ────────────────────────────────────────────────────────────────────
 * Uso:  if (await askConfirm({ title: '¿Eliminar?', confirmText: 'Sí' })) { ... }
 * Dónde se ve: borrar movimientos o pagos, producto extra en Mercado, salir del hogar…
 * Se monta una sola vez en App.tsx (<ConfirmHost />).
 * Si lo cambias: cambia el look de todas las preguntas de Sí/No de la app.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, HelpCircle, Home, AlertTriangle, type LucideIcon } from 'lucide-react';

type Icon = 'cart' | 'trash' | 'question' | 'home' | 'warning';
const ICONS: Record<Icon, LucideIcon> = { cart: ShoppingCart, trash: Trash2, question: HelpCircle, home: Home, warning: AlertTriangle };

export interface ConfirmOptions {
  title: string;
  message?: string;
  details?: ReactNode;
  icon?: Icon;
  tone?: 'lime' | 'danger';
  confirmText?: string;
  cancelText?: string;
}
interface Pending extends ConfirmOptions { resolve: (v: boolean) => void }

let push: ((p: Pending) => void) | null = null;

/** Muestra la ventana y espera la respuesta: true = Sí, false = No. */
export const askConfirm = (opts: ConfirmOptions) => new Promise<boolean>(resolve => {
  if (push) push({ ...opts, resolve });
  else resolve(window.confirm(opts.title)); // por si aún no está montada
});

export function ConfirmHost() {
  const [cur, setCur] = useState<Pending | null>(null);
  useEffect(() => { push = setCur; return () => { push = null; }; }, []);
  const answer = (v: boolean) => { cur?.resolve(v); setCur(null); };
  const Icon = ICONS[cur?.icon ?? 'question'];
  const danger = cur?.tone === 'danger';

  return createPortal(
    <AnimatePresence>
      {cur && (
        <motion.div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => answer(false)}>
          <motion.div role="alertdialog" aria-modal="true" aria-labelledby="mf-confirm-title" onClick={e => e.stopPropagation()}
            className="theme-dark w-full max-w-sm rounded-[30px] p-6 bg-gradient-to-b from-[#1D2550] via-[#121938] to-[#0B1026] border border-white/10 shadow-2xl text-center"
            initial={{ y: 60, scale: 0.92, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 40, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}>
            <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.08, type: 'spring', damping: 11 }}
              className={`mx-auto w-16 h-16 rounded-[22px] flex items-center justify-center shadow-xl ${danger ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-red-900/40' : 'bg-brand-lime shadow-lime-400/20'}`}>
              <Icon size={30} className={danger ? 'text-white' : 'text-brand-ink'} strokeWidth={2.3} />
            </motion.span>
            <h2 id="mf-confirm-title" className="text-white text-lg font-extrabold mt-4 leading-snug">{cur.title}</h2>
            {cur.message && <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">{cur.message}</p>}
            {cur.details && <div className="mt-4">{cur.details}</div>}
            <div className="grid grid-cols-2 gap-2 mt-6">
              <button onClick={() => answer(false)} className="h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold text-sm active:scale-95">{cur.cancelText ?? 'Cancelar'}</button>
              <button autoFocus onClick={() => answer(true)} className={`h-12 rounded-2xl font-bold text-sm active:scale-95 ${danger ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white' : 'bg-brand-lime text-brand-ink'}`}>{cur.confirmText ?? 'Sí, continuar'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
