/**
 * ════════════════════════════════════════════════════════════════════
 * 🚨 "ALGUIEN INTENTÓ ENTRAR" + 🙈 OCULTAR AL CAMBIAR DE APP
 * ────────────────────────────────────────────────────────────────────
 * • Si alguien puso mal el PIN, al desbloquear te avisa cuántas veces y a qué hora
 *   (lo deja listo SecurityContext → mf_pin_alert). Todo queda en este celular.
 * • Con PIN activo, al salir de la app la pantalla se desenfoca para que en el
 *   multitarea nadie vea tus saldos (clase .mf-privacy en <html>, ver index.css).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Kai from '../assistant/Kai';
import { useSecurity, ALERT_KEY } from '../../contexts/SecurityContext';
import { useNavigate } from 'react-router-dom';

const fmtHour = (t: number) => {
  const d = new Date(t); const today = new Date();
  const h = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === today.toDateString() ? `hoy a las ${h}` : `el ${d.getDate()}/${d.getMonth() + 1} a las ${h}`;
};

export default function SecurityAlert() {
  const { isLocked, isSetup } = useSecurity();
  const [alert, setAlert] = useState<{ count: number; last: number } | null>(null);
  const navigate = useNavigate();

  // 🚨 Aviso al desbloquear
  useEffect(() => {
    if (isLocked) return;
    try { const a = JSON.parse(localStorage.getItem(ALERT_KEY) || 'null'); if (a?.count) setAlert(a); } catch { /* nada */ }
  }, [isLocked]);

  // 🙈 Desenfocar al salir de la app (solo si tiene PIN)
  useEffect(() => {
    if (!isSetup) return;
    const root = document.documentElement;
    const hide = () => root.classList.add('mf-privacy');
    const show = () => root.classList.remove('mf-privacy');
    const onVis = () => (document.visibilityState === 'hidden' ? hide() : show());
    window.addEventListener('blur', hide); window.addEventListener('focus', show); window.addEventListener('pagehide', hide);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('blur', hide); window.removeEventListener('focus', show); window.removeEventListener('pagehide', hide); document.removeEventListener('visibilitychange', onVis); show(); };
  }, [isSetup]);

  const done = () => { try { localStorage.removeItem(ALERT_KEY); } catch { /* nada */ } setAlert(null); };

  return createPortal(
    <AnimatePresence>
      {alert && !isLocked && (
        <motion.div className="fixed inset-0 z-[185] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="sa-title" initial={{ y: 40, scale: 0.92 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }}
            className="theme-dark w-full max-w-sm rounded-[30px] p-6 text-center bg-gradient-to-b from-[#3B0D16] to-[#121938] border border-rose-400/30 shadow-2xl shadow-black/60 text-white">
            <div className="flex justify-center"><Kai mood="calma" size={110} /></div>
            <h2 id="sa-title" className="text-[20px] font-extrabold mt-1">🚨 Alguien intentó entrar</h2>
            <p className="text-[14px] text-slate-200 mt-1.5 font-semibold">{alert.count === 1 ? '1 intento' : `${alert.count} intentos`} con PIN equivocado, {fmtHour(alert.last)}</p>
            <p className="text-[12.5px] text-slate-400 mt-2">Tus datos siguen seguros: después de 5 intentos la app hace esperar. Si no fuiste tú, cambia tu PIN.</p>
            <button onClick={() => { done(); navigate('/ajustes'); }} className="mt-5 w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">Cambiar mi PIN</button>
            <button onClick={done} className="mt-2 w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 font-bold">Fui yo, todo bien</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
