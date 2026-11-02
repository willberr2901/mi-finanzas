/**
 * ════════════════════════════════════════════════════════════════════
 * 🔔 ¿QUÉ TE AVISAMOS? (preferencias de notificaciones)
 * ────────────────────────────────────────────────────────────────────
 * Cada aviso se prende o apaga y algunos tienen hora:
 *   💚 Día de pago (registrar el sueldo con un toque) · 📅 Pagos y cuotas
 *   🕗 ¿Gastaste algo hoy? (solo si no anotaste nada) · 🎯 Presupuestos 80%/100%
 *   📊 Resumen semanal (domingos) · 🤖 Consejos de Kai · 🔕 Horas de silencio (10 p. m. – 7 a. m.)
 * Se guardan solo en el celular (localStorage 'mf_notif') y se le pasa una copia
 * al service worker (que no puede leer localStorage) para los avisos en segundo plano.
 * El "¿Gastaste algo hoy?" usa el recordatorio diario de siempre (prefs.reminder).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { getPrefs, setPrefs, syncWorkerMeta } from '../utils/prefs';

export interface NotifPrefs {
  payday: { on: boolean; time: string };
  bills: { on: boolean; time: string };
  budget: { on: boolean };
  weekly: { on: boolean; time: string };
  kai: { on: boolean };
  quiet: { on: boolean };
}
const KEY = 'mf_notif';
const EVENT = 'mf:notif-changed';
export const NOTIF_DEFAULTS: NotifPrefs = {
  payday: { on: true, time: '08:00' }, bills: { on: true, time: '07:30' }, budget: { on: true },
  weekly: { on: true, time: '18:00' }, kai: { on: true }, quiet: { on: false },
};

export const getNotifPrefs = (): NotifPrefs => {
  try { const raw = JSON.parse(localStorage.getItem(KEY) || '{}'); return { ...NOTIF_DEFAULTS, ...raw }; } catch { return { ...NOTIF_DEFAULTS }; }
};
export const setNotifPrefs = (patch: Partial<NotifPrefs>) => {
  const next = { ...getNotifPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* sin almacenamiento */ }
  syncWorkerMeta();
  window.dispatchEvent(new Event(EVENT));
  return next;
};
/** El recordatorio diario de gastos vive en prefs.reminder (compatibilidad). */
export const getDaily = () => getPrefs().reminder;
export const setDaily = (r: { enabled: boolean; time: string }) => setPrefs({ reminder: r });

export const useNotifPrefs = (): [NotifPrefs, (p: Partial<NotifPrefs>) => void] => {
  const [p, set] = useState(getNotifPrefs);
  useEffect(() => { const on = () => set(getNotifPrefs()); window.addEventListener(EVENT, on); return () => window.removeEventListener(EVENT, on); }, []);
  return [p, (patch) => set(setNotifPrefs(patch))];
};

/** ¿Estamos en horas de silencio? (10 p. m. – 7 a. m.) */
export const inQuietHours = (d = new Date()) => getNotifPrefs().quiet.on && (d.getHours() >= 22 || d.getHours() < 7);
