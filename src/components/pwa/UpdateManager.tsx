/**
 * ════════════════════════════════════════════════════════════════════
 * ⬆️ ACTUALIZACIONES: VENTANA CON KAI (versión grande) O SILENCIOSA (arreglo pequeño)
 * ────────────────────────────────────────────────────────────────────
 * • Versión grande (version.json con silent=false y número distinto): sale la ventana
 *   con Kai (UpdateWindow.tsx). "Actualizar ahora" instala con el anillo de progreso;
 *   "Más tarde" la instala sola al salir de la app. Luego se abren las Novedades.
 * • Arreglo pequeño (silent=true): se instala sola como se describe abajo, sin ventana.
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Cuando se publica una versión nueva, el celular la descarga en segundo plano
 *           y se instala SOLA, sin preguntar:
 *             • Si la app se acaba de abrir (primeros 15 s) y la persona no está escribiendo
 *               ni tiene una ventana abierta → se instala ya (recarga rápida).
 *             • Si la persona ya está usando la app → se instala cuando sale de ella,
 *               y al volver ya está al día.
 *           Después, si la versión trae novedades (SILENT_UPDATE = false), la historia
 *           "Novedades" se muestra sola (WhatsNew.tsx).
 * Dónde se ve: No se ve. Ya no existe la ventana "Nueva versión disponible".
 * Si lo cambias: Si se rompe, la gente se queda con la versión vieja.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import UpdateWindow, { type UpdateInfo } from './UpdateWindow';
import { APP_VERSION, RELEASE_NOTES } from '../../version';

const CHECK_EVERY_MS = 30 * 60 * 1000; // busca versión nueva cada 30 min y al volver a la app
const FRESH_MS = 15000;                 // "recién abierta"
const openedAt = Date.now();

const busy = () => {
  const a = document.activeElement as HTMLElement | null;
  const typing = !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
  return typing || !!document.querySelector('[role="dialog"]');
};

export default function UpdateManager() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [demo, setDemo] = useState(false);
  const installRef = useRef<() => void>(() => {});
  const windowOn = useRef(false);

  // 🧪 Vista previa (botón de pruebas)
  useEffect(() => {
    const on = () => { setDemo(true); setInfo({ version: APP_VERSION, notes: RELEASE_NOTES }); };
    window.addEventListener('mf:update-preview', on);
    return () => window.removeEventListener('mf:update-preview', on);
  }, []);
  useEffect(() => {
    if (!demo) return;
    const done = () => window.setTimeout(() => { setInfo(null); setDemo(false); window.dispatchEvent(new Event('mf:open-whatsnew')); }, 1300);
    window.addEventListener('mf:update-done', done);
    return () => window.removeEventListener('mf:update-done', done);
  }, [demo]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;
    let reg: ServiceWorkerRegistration | null = null;
    let pending = false;
    let reloading = false;
    let interval: number | undefined;

    const install = () => {
      const waiting = reg?.waiting;
      if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
    };
    installRef.current = install;
    /** Hay versión nueva lista: ventana (versión grande) o instalar ya / al salir (arreglo pequeño). */
    const ready = async () => {
      if (!navigator.serviceWorker.controller) return;   // primera instalación: nada que actualizar
      if (pending) return;
      pending = true;
      let remote: { version?: string; notes?: string[]; silent?: boolean } | null = null;
      try { remote = await (await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })).json(); } catch { /* sin internet: silenciosa */ }
      if (remote && !remote.silent && remote.version && remote.version !== APP_VERSION && document.visibilityState === 'visible') {
        windowOn.current = true;
        setInfo({ version: remote.version, notes: remote.notes?.length ? remote.notes : ['✨ Mejoras para ti'] });
        return;
      }
      if (document.visibilityState === 'hidden' || (Date.now() - openedAt < FRESH_MS && !busy())) install();
    };

    const watch = (r: ServiceWorkerRegistration) => {
      reg = r;
      if (r.waiting) ready();
      r.addEventListener('updatefound', () => {
        const worker = r.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') ready(); });
      });
    };

    navigator.serviceWorker.getRegistration().then(r => {
      if (!r) return;
      watch(r);
      r.update().catch(() => {});
      interval = window.setInterval(() => r.update().catch(() => {}), CHECK_EVERY_MS);
    });

    const onControllerChange = () => {
      if (!hadController || reloading) return;
      reloading = true;
      if (windowOn.current) { window.dispatchEvent(new Event('mf:update-done')); window.setTimeout(() => window.location.reload(), 1300); }
      else window.location.reload();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') reg?.update().catch(() => {});
      else if (pending) install();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (interval) clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <AnimatePresence>
      {info && (
        <UpdateWindow key="upd" info={info} demo={demo}
          onInstall={() => { if (!demo) { installRef.current(); window.setTimeout(() => window.location.reload(), 9000); } }}
          onLater={() => { setInfo(null); windowOn.current = false; setDemo(false); }} />
      )}
    </AnimatePresence>
  );
}
