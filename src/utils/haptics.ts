/**
 * 📳 Vibración suave al tocar (como las apps de 4,9 ⭐).
 * Solo en celulares que lo permiten (Android). En iPhone el navegador no deja vibrar: no pasa nada.
 * Se puede apagar en Ajustes (localStorage 'mf_haptics' = 'off').
 */
export const hapticsOn = () => { try { return localStorage.getItem('mf_haptics') !== 'off'; } catch { return true; } };
export const setHaptics = (on: boolean) => { try { localStorage.setItem('mf_haptics', on ? 'on' : 'off'); } catch { /* sin almacenamiento */ } };
/** light = un toque; success = guardado; warn = algo salió mal. */
export function haptic(kind: 'light' | 'success' | 'warn' = 'light') {
  if (!hapticsOn() || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try { navigator.vibrate(kind === 'success' ? [12, 40, 18] : kind === 'warn' ? [30, 60, 30] : 10); } catch { /* sin vibración */ }
}
