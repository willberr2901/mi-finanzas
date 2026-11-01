/**
 * ════════════════════════════════════════════════════════════════════
 * 🧪 ¿APP REAL O APP DE PRUEBAS?
 * ────────────────────────────────────────────────────────────────────
 * Hay dos copias de la app:
 *   • Real:    mi-finanzas.onrender.com          (rama main)    → la que usa la gente
 *   • Pruebas: mi-finanzas-pruebas.onrender.com  (rama pruebas) → solo para revisar antes de publicar
 * En pruebas: franja "AMBIENTE DE PRUEBAS", no cuenta estadísticas ni manda encuestas.
 * Los datos de cada una viven aparte en el celular (no se mezclan).
 * Flujo: los cambios van primero a "pruebas"; cuando Gato aprueba, pasan a "main".
 * ════════════════════════════════════════════════════════════════════
 */
export const TEST_HOST = 'mi-finanzas-pruebas.onrender.com';
export const IS_TEST = import.meta.env.VITE_APP_ENV === 'pruebas'
  || (typeof location !== 'undefined' && location.hostname === TEST_HOST);
