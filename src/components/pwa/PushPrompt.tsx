/**
 * ════════════════════════════════════════════════════════════════════
 * 🔔 "AVISOS EN TU PANTALLA" (Kai pide permiso una sola vez)
 * ────────────────────────────────────────────────────────────────────
 * Sale una vez, con calma (30 s después de abrir y sin otra ventana encima), para
 * ofrecer avisos de versión nueva aunque el celular esté bloqueado (pushService.ts).
 * "Ahora no" no vuelve a preguntar: se puede activar en Ajustes → Recordatorios.
 * También refresca la dirección de avisos al abrir la app si ya estaba activa.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Kai from '../assistant/Kai';
import { enablePush, markPushAsked, refreshPush, shouldAskPush } from '../../services/pushService';
import { notify } from '../../services/notificationService';
import { haptic } from '../../utils/haptics';

const ROWS = [
  ['⬆️', 'Actualizaciones', 'Cuando haya versión nueva, con el celular bloqueado'],
  ['💚', 'Día de pago', 'Registrar tu sueldo en 1 toque'],
  ['📅', 'Pagos por vencer', 'Un día antes'],
];

export default function PushPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refreshPush().catch(() => {});
    if (new URLSearchParams(location.search).get('avisos') === '1') { setShow(true); return; }
    let t: number; let tries = 0;
    const attempt = async () => {
      if (document.querySelector('[role="dialog"]') || document.visibilityState !== 'visible') { if (++tries < 20) t = window.setTimeout(attempt, 15000); return; }
      if (await shouldAskPush()) setShow(true);
    };
    t = window.setTimeout(attempt, 30000);
    const on = () => setShow(true);
    window.addEventListener('mf:ask-push', on);
    return () => { window.clearTimeout(t); window.removeEventListener('mf:ask-push', on); };
  }, []);

  const later = () => { markPushAsked(); setShow(false); };
  const yes = async () => {
    setBusy(true); haptic('light');
    const ok = await enablePush();
    setBusy(false); setShow(false);
    notify(ok
      ? { title: '¡Listo! Te aviso aunque tengas el celular bloqueado 🔔', type: 'success', log: false }
      : { title: 'No se pudieron activar los avisos', message: 'Revisa el permiso de notificaciones del navegador. En iPhone, instala la app en tu pantalla de inicio.', type: 'info', log: false });
  };

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div className="theme-dark fixed inset-0 z-[170] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={later}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="push-title" onClick={e => e.stopPropagation()}
            initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 24 }}
            className="w-full max-w-sm rounded-[30px] p-5 bg-gradient-to-b from-[#18204A] to-[#0E1433] border border-white/10 text-white shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2">
              <Kai mood="feliz" size={74} />
              <div className="flex-1 rounded-2xl bg-[#fff] text-[#0B1026] text-[13px] font-extrabold px-3 py-2">¿Te aviso aunque tengas el celular bloqueado? 🔔</div>
            </div>
            <h2 id="push-title" className="text-[22px] font-extrabold mt-3">Avisos en tu <span className="text-brand-lime">pantalla</span></h2>
            <p className="text-[12.5px] text-slate-400 font-semibold">Llegan con la app cerrada. Luego eliges cuáles en Ajustes.</p>
            <div className="mt-3 space-y-2">
              {ROWS.map(([e, t, d]) => (
                <div key={t} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] ring-1 ring-white/10 px-3 py-2.5">
                  <span className="text-xl" aria-hidden="true">{e}</span>
                  <span className="flex-1"><span className="block text-[13.5px] font-extrabold">{t}</span><span className="block text-[11px] text-slate-400 font-semibold">{d}</span></span>
                  <span className="w-10 h-6 rounded-full bg-brand-lime relative" aria-hidden="true"><span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-[#fff]" /></span>
                </div>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.96 }} disabled={busy} onClick={yes} className="mt-4 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold disabled:opacity-60">{busy ? 'Activando…' : '🔔 Activar avisos'}</motion.button>
            <button onClick={later} className="mt-1 w-full h-11 text-sm font-bold text-slate-400">Ahora no</button>
            <p className="text-[10.5px] text-slate-500 text-center">No pedimos tu número ni tu correo · lo puedes apagar cuando quieras</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
