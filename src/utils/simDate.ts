/**
 * ════════════════════════════════════════════════════════════════════
 * 🧪 SIMULADOR DE FECHAS (SOLO APP DE PRUEBAS)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: en la app de pruebas permite ver la app "como si fuera" otra fecha
 *           (1 de diciembre, Halloween, Año Nuevo, día de pago, fin de mes…).
 *           Mueve el reloj de toda la app: temporadas, saludos, ciclos y avisos.
 *           Los datos guardados NO cambian.
 * En la app real: no hace NADA (ni siquiera lee la preferencia).
 * Se activa desde el botón 🧪 (components/ui/DateSimulator.tsx).
 * Se importa primero en main.tsx para que todo el código vea la fecha simulada.
 * ════════════════════════════════════════════════════════════════════
 */
import { IS_TEST } from './env';

export const SIM_KEY = 'mf_sim_date'; // "AAAA-MM-DD"

const RealDate = Date;
/** Fecha REAL de hoy (sin simular): para armar las opciones del simulador. */
export const realToday = () => new RealDate();
/** Fecha simulada guardada (solo pruebas). */
export const simDate = (): string | null => {
  if (!IS_TEST) return null;
  try { const v = localStorage.getItem(SIM_KEY); return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; } catch { return null; }
};

/** Cambia la fecha simulada (null = volver a hoy) y recarga para que todo la tome. */
export const setSimDate = (iso: string | null) => {
  try { if (iso) localStorage.setItem(SIM_KEY, iso); else localStorage.removeItem(SIM_KEY); } catch { /* sin almacenamiento */ }
  try { sessionStorage.removeItem('mf_season_preview'); } catch { /* nada */ }
  location.reload();
};

/** Instala el reloj simulado: misma hora del día, pero en el día elegido. */
(function install() {
  const iso = simDate();
  if (!iso) return;
  const [y, m, d] = iso.split('-').map(Number);
  const now = new RealDate();
  const target = new RealDate(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
  const offset = target.getTime() - now.getTime();
  class SimDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) super(RealDate.now() + offset);
      else super(...(args as [any]));
    }
    static now() { return RealDate.now() + offset; }
  }
  (globalThis as any).Date = SimDate;
})();
