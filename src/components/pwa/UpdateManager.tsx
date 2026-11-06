/**
 * ════════════════════════════════════════════════════════════════════
 * ⬆️ ACTUALIZACIÓN AUTOMÁTICA (SIN VENTANA)
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
import { useEffect } from 'react';

const CHECK_EVERY_MS = 30 * 60 * 1000; // busca versión nueva cada 30 min y al volver a la app
const FRESH_MS = 15000;                 // "recién abierta"
const openedAt = Date.now();

const busy = () => {
  const a = document.activeElement as HTMLElement | null;
  const typing = !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
  return typing || !!document.querySelector('[role="dialog"]');
};

export default function UpdateManager() {
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
    /** Hay versión nueva lista: instalar ya o al salir. */
    const ready = () => {
      if (!navigator.serviceWorker.controller) return;   // primera instalación: nada que actualizar
      pending = true;
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
      window.location.reload();
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

  return null;
}
