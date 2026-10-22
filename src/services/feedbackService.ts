/**
 * ════════════════════════════════════════════════════════════════════
 * 💬 OPINIONES (feedback) DE LOS USUARIOS
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: envía al servidor la calificación (1 a 5 estrellas), lo que les
 *           gusta, lo que mejorarían, la parte de la app y un apodo OPCIONAL.
 *           No se envía nada más: ni nombre real obligatorio, ni datos financieros.
 * Cuándo se pide (ver shouldAskFeedback):
 *   • Quien NUNCA ha respondido: cada vez que abre la app (desde su segundo día de uso).
 *     "Ahora no" la calla solo por 2 horas, para que no salga en cada toque.
 *   • Quien ya respondió: otra vez a los 30 días; "Ahora no" espera 10 días.
 * Dónde se ve el resultado: Reportes → Opiniones (solo administradora).
 * Servidor: funciones feedback_send / feedback_list / feedback_mark (supabase/sync.sql).
 * ════════════════════════════════════════════════════════════════════
 */
import { SYNC_URL, SYNC_KEY } from './household/syncConfig';
import { APP_VERSION } from '../version';

export type FeedbackArea = 'general' | 'inicio' | 'mercado' | 'finanzas' | 'pagos' | 'escaner' | 'hogar' | 'otro';
export const AREAS: { id: FeedbackArea; label: string }[] = [
  { id: 'general', label: 'Toda la app' }, { id: 'mercado', label: 'Mercado' }, { id: 'finanzas', label: 'Finanzas' },
  { id: 'pagos', label: 'Pagos' }, { id: 'inicio', label: 'Inicio' }, { id: 'escaner', label: 'Escáner' },
  { id: 'hogar', label: 'Hogar compartido' }, { id: 'otro', label: 'Otro' },
];
export const areaLabel = (a: string) => AREAS.find(x => x.id === a)?.label ?? 'Otro';

export interface FeedbackItem {
  id: number; created_at: string; rating: number; liked: string; improve: string;
  area: string; alias: string; platform: string; app_version: string; status: 'nuevo' | 'revisado' | 'resuelto';
}

const rpc = async (fn: string, body: unknown) => {
  const r = await fetch(`${SYNC_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer',
    headers: { apikey: SYNC_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(r.status === 400 ? 'Clave incorrecta' : 'Sin conexión');
  const t = await r.text();
  return t ? JSON.parse(t) : null;
};

const platform = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'otro';
};

// ═══ SECCIÓN: Enviar ═══
const K = { sent: 'mf_fb_sent', snooze: 'mf_fb_snooze', days: 'mf_fb_days', lastDay: 'mf_fb_lastday' };
export const sendFeedback = async (f: { rating: number; liked: string; improve: string; area: FeedbackArea; alias: string }) => {
  await rpc('feedback_send', {
    p_rating: Math.min(5, Math.max(1, Math.round(f.rating))), p_liked: f.liked.trim().slice(0, 1000), p_improve: f.improve.trim().slice(0, 1000),
    p_area: f.area, p_alias: f.alias.trim().slice(0, 40), p_platform: platform(), p_version: APP_VERSION,
  });
  try { localStorage.setItem(K.sent, String(Date.now())); } catch { /* sin almacenamiento */ }
};

// ═══ SECCIÓN: Cuándo preguntar ═══
/** Cuenta los días distintos en que se usó la app (solo en este celular). */
export const countUsageDay = () => {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    if (localStorage.getItem(K.lastDay) === today) return;
    localStorage.setItem(K.lastDay, today);
    localStorage.setItem(K.days, String(Number(localStorage.getItem(K.days) || 0) + 1));
  } catch { /* sin almacenamiento */ }
};
/** ¿Esta persona ya envió alguna vez su opinión desde este celular? */
export const hasSentFeedback = () => { try { return Number(localStorage.getItem(K.sent) || 0) > 0; } catch { return false; } };
export const shouldAskFeedback = () => {
  try {
    const days = Number(localStorage.getItem(K.days) || 0);
    const sent = Number(localStorage.getItem(K.sent) || 0);
    const snooze = Number(localStorage.getItem(K.snooze) || 0);
    if (Date.now() < snooze) return false;                       // dijo "Ahora no" hace poco
    if (!sent) return days >= 2;                                 // nunca ha opinado: cada vez que abre (desde su 2.º día)
    return Date.now() - sent >= 30 * 86400000;                   // ya opinó: otra vez al mes
  } catch { return false; }
};
/** "Ahora no": 2 horas si nunca ha opinado (vuelve a salir la próxima vez que abra), 10 días si ya opinó. */
export const snoozeFeedback = () => {
  const ms = hasSentFeedback() ? 10 * 86400000 : 2 * 3600000;
  try { localStorage.setItem(K.snooze, String(Date.now() + ms)); } catch { /* sin almacenamiento */ }
};
export const openFeedback = () => window.dispatchEvent(new Event('mf:open-feedback'));

// ═══ SECCIÓN: Administradora ═══
export const listFeedback = (key: string): Promise<FeedbackItem[]> => rpc('feedback_list', { p_key: key });
export const markFeedback = (key: string, id: number, status: FeedbackItem['status']) => rpc('feedback_mark', { p_key: key, p_id: id, p_status: status });
