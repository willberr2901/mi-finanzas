/**
 * ════════════════════════════════════════════════════════════════════
 * 💲 FORMATO DE PESOS Y FECHAS
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: formatCOP ($ 1.234.567), miles, fecha de hoy. Respeta "ocultar saldos".
 * Dónde se ve: Toda la app.
 * Si lo cambias: Cambia cómo se ven todas las cifras.
 * Nota: Formato de dinero en pesos colombianos, igual en toda la app.
 * ════════════════════════════════════════════════════════════════════
 */
import { amountsHidden } from './privacyMask';
const cop0 = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const cop2 = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** $1.284.500 — sin decimales. Usa `decimals` solo para valores pequeños (ej. interés diario). */
export const formatCOP = (value: number, decimals = false): string => {
  if (amountsHidden()) return '$ •••••';
  const n = Number.isFinite(value) ? value : 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}$${decimals ? cop2.format(abs) : cop0.format(Math.round(abs))}`;
};

/** Solo los puntos de miles, sin el signo $: 1.284.500 */
export const formatThousands = (value: number): string => cop0.format(Math.round(value || 0));

/** Convierte lo que escribe la persona ("1.284.500", "$ 250000") en número. */
export const parseMoney = (text: string): number => {
  const digits = (text || '').replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
};

/** Fecha de hoy en hora local (yyyy-mm-dd). toISOString usa hora UTC y en Colombia
 *  después de las 7 p. m. daba la fecha de mañana. */
export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Lee 'yyyy-mm-dd' como fecha local (new Date('2026-10-15') la toma en UTC y muestra el 14). */
export const parseLocalDate = (value: string): Date => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
};
