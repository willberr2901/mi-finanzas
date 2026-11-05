/**
 * ════════════════════════════════════════════════════════════════════
 * ⭐ CALIFICACIONES (cuándo pedirlas sin cansar)
 * ────────────────────────────────────────────────────────────────────
 * Antes la encuesta salía apenas se abría la app y la gente la cerraba.
 * Ahora se pide en un MOMENTO FELIZ ('mf:happy'):
 *   • guardaste tu plan con Kai · registraste tu sueldo · pagaste una cuota o un pago
 * Reglas:
 *   • Desde el 2.º día de uso y nunca dos veces el mismo día.
 *   • "Ahora no" → vuelve a preguntar en 3, 7, 21 y 45 días (máx. 4 veces).
 *   • Si ya calificó: con 4–5 estrellas no se vuelve a pedir sola;
 *     con 1–3, otra vez en 60 días (para ver si mejoró).
 *   • Siempre se puede calificar desde el menú (Módulos → Califícanos).
 * Qué se envía: solo las estrellas, lo que escriba (opcional) y la parte de la app,
 * con la versión y el tipo de celular (feedbackService.sendFeedback). Nada de finanzas.
 * App de pruebas: sale en cada momento feliz (para revisarla) y NO envía nada.
 * ════════════════════════════════════════════════════════════════════
 */
import { IS_TEST } from '../utils/env';

const KEY = 'mf_rate';
interface RateState { stars?: number; ratedAt?: number; asks: number; next: number; lastAsk?: string }
const read = (): RateState => { try { return { asks: 0, next: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { asks: 0, next: 0 }; } };
const write = (s: RateState) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ } };
const today = () => new Date().toLocaleDateString('en-CA');
const usageDays = () => { try { return Number(localStorage.getItem('mf_fb_days') || 0); } catch { return 0; } };
const BACKOFF = [3, 7, 21, 45];

export const shouldAskRating = () => {
  const s = read();
  if (IS_TEST) return s.lastAsk !== `${today()}-${new Date().getHours()}-${Math.floor(new Date().getMinutes() / 2)}`;
  if (s.lastAsk === today()) return false;
  if (s.ratedAt) return (s.stars ?? 0) < 4 && Date.now() - s.ratedAt > 60 * 86400000;
  if (s.asks >= BACKOFF.length) return false;
  return usageDays() >= 2 && Date.now() >= s.next;
};
export const markRatingShown = () => {
  const s = read();
  s.lastAsk = IS_TEST ? `${today()}-${new Date().getHours()}-${Math.floor(new Date().getMinutes() / 2)}` : today();
  write(s);
};
export const dismissRating = () => {
  const s = read();
  if (!s.ratedAt) { s.next = Date.now() + BACKOFF[Math.min(s.asks, BACKOFF.length - 1)] * 86400000; s.asks += 1; }
  write(s);
};
export const saveRating = (stars: number) => { const s = read(); s.stars = stars; s.ratedAt = Date.now(); write(s); };
export const myRating = () => read().stars ?? 0;

/** Un momento feliz (plan guardado, sueldo registrado, pago hecho). */
export const happyMoment = (why: string) => window.dispatchEvent(new CustomEvent('mf:happy', { detail: why }));
export const openRating = () => window.dispatchEvent(new Event('mf:open-rating'));
