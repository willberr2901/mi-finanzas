/**
 * ════════════════════════════════════════════════════════════════════
 * 👁 OCULTAR SALDOS
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Activa/desactiva mostrar las cifras como $ •••••.
 * Dónde se ve: Botón 👁 en Inicio.
 * Si lo cambias: Solo la vista; los datos no cambian.
 * Nota: Modo "ocultar saldos": las cifras se muestran como $ ••••• en pantalla.
 * ════════════════════════════════════════════════════════════════════
 */
const KEY = 'mf_hide_amounts';
let hidden = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();
export const amountsHidden = () => hidden;
export const setAmountsHidden = (v: boolean) => {
  hidden = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new Event('mf:mask-changed'));
};
