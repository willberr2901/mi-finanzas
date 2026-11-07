/**
 * ════════════════════════════════════════════════════════════════════
 * 📲 AVISOS CON EL CELULAR BLOQUEADO (notificaciones "push")
 * ────────────────────────────────────────────────────────────────────
 * Para avisar de una VERSIÓN NUEVA aunque la app esté cerrada o el celular bloqueado.
 * Cómo: el navegador nos da una "dirección de avisos" anónima (no dice quién eres);
 *   la guardamos en el servidor (función push_subscribe). Cuando publicamos una versión
 *   grande, la función del servidor notify-update manda un toque a esas direcciones.
 * NO se envía: nombre, correo, teléfono, montos ni nada de tus finanzas.
 * Se apaga en Ajustes → Recordatorios → "Avisos de nuevas versiones" (borra la dirección).
 * iPhone: solo funciona con la app instalada en la pantalla de inicio (iOS 16.4+).
 * ════════════════════════════════════════════════════════════════════
 */
import { SYNC_URL, SYNC_KEY } from './household/syncConfig';
import { IS_TEST } from '../utils/env';

export const VAPID_PUBLIC = 'BIaA510Kk-VOACt3iY39oq8eyQ_LFRP4dJwjK3oYZY7_Q6_aM81JPBdiPMOFsXMAWwen91FIt3cFNHOp01_QNVE';
const ASKED = 'mf_push_asked';

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const b64 = (s: string) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); };
const rpc = (fn: string, body: object) => fetch(`${SYNC_URL}/rest/v1/rpc/${fn}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SYNC_KEY, Authorization: `Bearer ${SYNC_KEY}` }, body: JSON.stringify(body),
});

/** ¿Este celular ya tiene los avisos con pantalla bloqueada? */
export const pushActive = async () => {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  try { return !!(await (await navigator.serviceWorker.ready).pushManager.getSubscription()); } catch { return false; }
};

/** Pide permiso (si hace falta) y registra este celular. Devuelve true si quedó activo. */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) return false;
  try { localStorage.setItem(ASKED, '1'); } catch { /* nada */ }
  const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (perm !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC) });
    const j = sub.toJSON();
    const r = await rpc('push_subscribe', { p_endpoint: j.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth, p_env: IS_TEST ? 'pruebas' : 'real' });
    return r.ok;
  } catch { return false; }
}

/** Apaga los avisos: borra la dirección del servidor y del navegador. */
export async function disablePush() {
  try {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (!sub) return;
    await rpc('push_unsubscribe', { p_endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  } catch { /* nada */ }
}

/** Refresca la dirección cada vez que se abre la app (el navegador a veces la cambia). */
export async function refreshPush() {
  if (await pushActive()) enablePush().catch(() => {});
}

/** ¿Mostrar la invitación de Kai? Una sola vez, si se puede y aún no está activo. */
export const shouldAskPush = async () => {
  if (!pushSupported() || Notification.permission === 'denied') return false;
  try { if (localStorage.getItem(ASKED)) return false; if (localStorage.getItem('mf_update_notices') === 'off') return false; } catch { return false; }
  return !(await pushActive());
};
export const markPushAsked = () => { try { localStorage.setItem(ASKED, '1'); } catch { /* nada */ } };
