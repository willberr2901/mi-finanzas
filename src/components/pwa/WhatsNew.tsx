/**
 * ════════════════════════════════════════════════════════════════════
 * 🎁 VENTANA DE NOVEDADES
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Lista de lo nuevo de la versión (RELEASE_NOTES de src/version.ts).
 * Dónde se ve: Después de actualizar. Si el celular aún no tiene avisos activados, ofrece
 *              "Avísame de las próximas novedades" (notificación cuando salga otra versión).
 * Si lo cambias: Solo el diseño; el texto está en src/version.ts.
 * ════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Check, BellRing } from 'lucide-react';
import { APP_VERSION, RELEASE_NOTES } from '../../version';
import { enableReminders, remindersSupported } from '../../services/alertsService';

export const shouldShowWhatsNew = () => localStorage.getItem('mf_lastSeenVersion') !== APP_VERSION;
export const markWhatsNewSeen = () => localStorage.setItem('mf_lastSeenVersion', APP_VERSION);

/** Se muestra una sola vez después de cada actualización con las novedades de la versión. */
export default function WhatsNew({ onClose }: { onClose: () => void }) {
  const close = () => { markWhatsNewSeen(); onClose(); };
  const [perm, setPerm] = useState<NotificationPermission | 'none'>(() => (remindersSupported() ? Notification.permission : 'none'));
  return (
    <motion.div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="whatsnew-title"
        className="w-full max-w-sm bg-surface border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl"
        initial={{ y: 60, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 240 }}>
        <div className="absolute -top-20 -right-16 w-52 h-52 bg-violet-600/25 rounded-full blur-3xl" aria-hidden="true" />
        <div className="relative text-center">
          <motion.div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/40"
            initial={{ rotate: -20, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', damping: 9 }}>
            <Gift className="text-white" size={30} />
          </motion.div>
          <h2 id="whatsnew-title" className="text-white text-xl font-bold mt-4">¡Tu app se actualizó!</h2>
          <p className="text-slate-400 text-sm">Novedades de la versión <span className="text-violet-300 font-semibold">{APP_VERSION}</span></p>
        </div>
        <ul className="relative mt-5 space-y-2.5">
          {RELEASE_NOTES.map((n, i) => (
            <motion.li key={n} className="flex items-start gap-3 text-sm text-slate-200" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }}>
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check size={12} className="text-emerald-400" /></span>{n}
            </motion.li>
          ))}
        </ul>
        {perm === 'default' && (
          <button onClick={async () => setPerm(await enableReminders())}
            className="relative mt-5 w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.05] ring-1 ring-brand-lime/30 text-left">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-lime flex items-center justify-center"><BellRing size={19} className="text-brand-ink" /></span>
            <span className="flex-1 min-w-0"><span className="block text-white text-sm font-bold">Avísame de las próximas novedades</span><span className="block text-[11px] text-slate-400">Y de tus pagos antes de que venzan</span></span>
          </button>
        )}
        {perm === 'granted' && <p className="relative mt-4 text-center text-[11px] text-brand-lime flex items-center justify-center gap-1"><BellRing size={12} /> Te avisaremos cuando salga la próxima versión</p>}
        <button onClick={close} className="relative mt-6 w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-brand-ink font-bold py-3.5 rounded-2xl active:scale-[0.98]">¡Genial, a verlo!</button>
      </motion.div>
    </motion.div>
  );
}
