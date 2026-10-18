import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, RefreshCw } from 'lucide-react';
import { APP_VERSION } from '../../version';

interface RemoteVersion { version: string; notes: string[] }

const CHECK_EVERY_MS = 30 * 60 * 1000; // busca versión nueva cada 30 min y al volver a la app

/**
 * Único aviso de actualización de la app.
 * Cuando se publica una versión nueva en Vercel, el celular la descarga en segundo
 * plano y aquí aparece la ventana "Nueva versión" con sus novedades. Un toque y listo:
 * nada que descargar a mano.
 */
export default function UpdateManager() {
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [remote, setRemote] = useState<RemoteVersion | null>(null);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const hadController = useRef(typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let interval: number | undefined;

    const announce = () => {
      fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then((v: RemoteVersion | null) => { if (v && v.version !== APP_VERSION) setRemote(v); })
        .catch(() => {})
        .finally(() => setShow(true));
    };

    const watch = (reg: ServiceWorkerRegistration) => {
      regRef.current = reg;
      if (reg.waiting && navigator.serviceWorker.controller) announce();
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announce();
        });
      });
    };

    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      watch(reg);
      reg.update().catch(() => {});
      interval = window.setInterval(() => reg.update().catch(() => {}), CHECK_EVERY_MS);
    });

    const onControllerChange = () => { if (hadController.current) announce(); };
    const onVisible = () => { if (document.visibilityState === 'visible') regRef.current?.update().catch(() => {}); };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (interval) clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const applyUpdate = () => {
    setUpdating(true);
    const waiting = regRef.current?.waiting;
    if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
    // Recarga cuando la versión nueva toma el control (o a más tardar en 1,5 s).
    navigator.serviceWorker?.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    setTimeout(() => window.location.reload(), 1500);
  };

  const notes = remote?.notes?.length ? remote.notes : ['Mejoras de rendimiento y correcciones'];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-labelledby="update-title"
        >
          <motion.div
            className="w-full max-w-sm bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl shadow-violet-900/40 relative overflow-hidden"
            initial={{ y: 60, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" aria-hidden="true" />

            <div className="relative flex flex-col items-center text-center">
              <div className="relative w-16 h-16 mb-4">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500"
                  animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-white" size={28} /></div>
              </div>
              <h2 id="update-title" className="text-white text-xl font-bold">Nueva versión disponible</h2>
              <p className="text-slate-400 text-sm mt-1">
                {remote ? <>Versión <span className="text-violet-300 font-semibold">{remote.version}</span> lista para ti</> : 'Tenemos mejoras listas para ti'}
              </p>
            </div>

            <ul className="relative mt-5 space-y-2.5">
              {notes.slice(0, 5).map((n, i) => (
                <motion.li key={n} className="flex items-start gap-3 text-sm text-slate-200"
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check size={12} className="text-emerald-400" /></span>
                  {n}
                </motion.li>
              ))}
            </ul>

            <div className="relative mt-6 space-y-2">
              <button
                onClick={applyUpdate} disabled={updating}
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-brand-ink font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-80"
              >
                <RefreshCw size={18} className={updating ? 'animate-spin' : ''} />
                {updating ? 'Actualizando…' : 'Actualizar ahora'}
              </button>
              {!updating && (
                <button onClick={() => setShow(false)} className="w-full text-slate-400 text-sm py-2.5 hover:text-white">Más tarde</button>
              )}
              <p className="text-center text-[11px] text-slate-500">Tus datos se conservan. Solo toma un segundo.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
