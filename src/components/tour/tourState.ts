/**
 * ════════════════════════════════════════════════════════════════════
 * 🧭 GUÍAS: tipos y "ya la vio"
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Define un paso de la guía y recuerda qué guías ya se vieron.
 * Dónde se ve: Guíame.
 * Si lo cambias: Cambia cuándo se muestran las guías.
 * ════════════════════════════════════════════════════════════════════
 */
export interface TourStep {
  target: string;   // valor de data-tour del elemento a señalar
  title: string;
  text: string;
}

const KEY = (id: string) => `mf_tour_${id}`;
export const tourSeen = (id: string) => localStorage.getItem(KEY(id)) === '1';
export const markTourSeen = (id: string) => localStorage.setItem(KEY(id), '1');
export const resetTours = () => {
  for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k?.startsWith('mf_tour_')) localStorage.removeItem(k); }
};
