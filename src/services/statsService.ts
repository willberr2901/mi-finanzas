/**
 * ════════════════════════════════════════════════════════════════════
 * 📊 ESTADÍSTICAS ANÓNIMAS (solo sumas)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: cada celular suma +1 al servidor en tres momentos:
 *   · first_open → la primera vez que se abre la app en ese celular
 *   · install    → cuando la agregan a la pantalla de inicio
 *   · active     → máximo una vez al día, si la usan
 * Qué se envía: SOLO el tipo de evento, la plataforma (android/ios/computador),
 *   si está instalada o en el navegador, y el código del enlace con el que llegó
 *   (si llegó por un enlace compartido). NADA de nombres, correos, teléfonos,
 *   montos, listas ni identificadores del celular. El servidor no puede saber
 *   quién es quién: solo guarda cuántos.
 * Se puede apagar: Ajustes → Tus datos → Estadísticas anónimas.
 * Dónde se ve el resultado: módulo Reportes (solo con la clave de administradora).
 * ════════════════════════════════════════════════════════════════════
 */
import { SYNC_URL, SYNC_KEY } from './household/syncConfig';

const K = {
  optOut: 'mf_stats_off',
  myRef: 'mf_my_ref',
  cameFrom: 'mf_ref_from',
  firstOpen: 'mf_stat_first',
  installed: 'mf_stat_installed',
  lastActive: 'mf_stat_day',
};
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

/** Código especial para quienes ya tenían la app antes de los enlaces con código. */
export const LEGACY_REF = 'original';

export const statsEnabled = () => get(K.optOut) !== '1';
export const setStatsEnabled = (on: boolean) => { if (on) localStorage.removeItem(K.optOut); else set(K.optOut, '1'); };

/** Código aleatorio de este celular para su enlace de invitación (no identifica a la persona). */
export const myRefCode = () => {
  let c = get(K.myRef);
  if (!c || !/^[a-z0-9]{8}$/.test(c)) {
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    c = Array.from(crypto.getRandomValues(new Uint8Array(8)), b => abc[b % abc.length]).join('');
    set(K.myRef, c);
  }
  return c;
};
/** Enlace para compartir la app con el código de este celular. */
export const shareLink = () => `${location.origin}/?r=${myRefCode()}`;

const platform = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'otro';
};
export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

const ping = async (kind: 'first_open' | 'install' | 'active') => {
  if (!statsEnabled()) return false;
  const ref = get(K.cameFrom) || '';
  try {
    const r = await fetch(`${SYNC_URL}/rest/v1/rpc/stats_ping`, {
      method: 'POST', keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: { apikey: SYNC_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_kind: kind, p_ref: /^[a-z0-9]{8}$/.test(ref) ? ref : '', p_platform: platform(), p_mode: isStandalone() ? 'app' : 'web' }),
    });
    return r.ok;
  } catch { return false; }
};

/** Se llama al abrir la app (App.tsx). */
export const startStats = () => {
  // ¿Llegó por un enlace compartido? (?r=código). Se guarda y se limpia de la dirección.
  const url = new URL(location.href);
  const r = url.searchParams.get('r');
  if (r && /^[a-z0-9]{8}$/.test(r) && !get(K.cameFrom) && r !== get(K.myRef)) set(K.cameFrom, r);
  if (r) { url.searchParams.delete('r'); history.replaceState(history.state, '', url.pathname + url.search + url.hash); }

  // Quien ya usaba la app ANTES de que existieran los códigos (llegó por un enlace compartido
  // sin código, v1.7 o anterior) queda marcado como "original" para poder contarlo en Reportes.
  if (!get(K.firstOpen) && !get(K.cameFrom) && get('miFinanzasWelcomeDone')) set(K.cameFrom, LEGACY_REF);

  const run = async () => {
    if (!statsEnabled()) return;
    if (!get(K.firstOpen) && await ping('first_open')) set(K.firstOpen, '1');
    if (isStandalone() && !get(K.installed) && await ping('install')) set(K.installed, '1');
    if (get(K.lastActive) !== today() && await ping('active')) set(K.lastActive, today());
  };
  setTimeout(run, 4000);   // después de cargar, sin estorbar
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') run(); });
  window.addEventListener('appinstalled', () => { if (!get(K.installed)) ping('install').then(ok => ok && set(K.installed, '1')); });
};

// ═══ SECCIÓN: Reporte (solo administradora) ═══
const ADMIN = 'mf_admin_key';
export const adminKey = () => get(ADMIN);
export const forgetAdmin = () => localStorage.removeItem(ADMIN);
export interface StatsReport {
  today: string;
  totals: Partial<Record<'first_open' | 'install' | 'active', number>>;
  byPlatform: { kind: string; platform: string; n: number }[];
  byRef: { ref: string; kind: string; n: number }[];
  daily: { day: string; kind: string; mode: string; n: number }[];
  households: number;
}
export const fetchReport = async (key: string): Promise<StatsReport> => {
  const r = await fetch(`${SYNC_URL}/rest/v1/rpc/stats_report`, {
    method: 'POST', credentials: 'omit', headers: { apikey: SYNC_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_key: key }),
  });
  if (!r.ok) throw new Error(r.status === 400 ? 'Clave incorrecta' : 'Sin conexión');
  const data = await r.json();
  set(ADMIN, key);
  return data;
};
