/**
 * ════════════════════════════════════════════════════════════════════
 * 🎃🎄 TEMPORADAS (la app se viste sola según la fecha del celular)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: decide qué temporada está activa HOY y la aplica en toda la app:
 *   • 🎃 Mes de brujas  → del 1 al 31 de octubre (se quita sola el 1 de noviembre)
 *   • 🎄 Navidad        → del 1 de diciembre al 1 de enero (se quita sola el 2 de enero)
 * Cómo: pone la clase .season-halloween / .season-navidad en <html> (colores en
 *       src/index.css) y avisa a la decoración, el aviso y la tarjeta de Inicio.
 * No hay que publicar nada para que cambie: lo calcula cada celular con su fecha.
 * Se puede apagar en Ajustes → Apariencia → "Decoración de temporada".
 * Para probar otra temporada: abre la app con ?temporada=navidad (o halloween / no).
 * Para agregar otra temporada: súmala en SEASONS y en seasonFor().
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';

export type SeasonId = 'halloween' | 'navidad';

export interface Season {
  id: SeasonId;
  name: string;            // "Mes de brujas"
  emoji: string;
  popupTitle: string;
  popupText: string;
  tipTitle: string;
  tips: string[];
  until: string;           // texto: hasta cuándo dura
}

export const SEASONS: Record<SeasonId, Season> = {
  halloween: {
    id: 'halloween', name: 'Mes de brujas', emoji: '🎃',
    popupTitle: '¡Una nueva versión llegó por ti!',
    popupText: 'Disfruta el mes de brujas 🎃 Tu app se vistió de naranja y morado hasta el 31 de octubre.',
    tipTitle: 'Que tus gastos no te asusten 👻',
    tips: [
      'Los gastos hormiga son los fantasmas del mes: anótalos todos, hasta el tinto.',
      'Disfraces y dulces: ponles un presupuesto antes de salir a comprar.',
      'Revisa tus suscripciones: ¿alguna te está chupando la plata como un vampiro? 🧛',
    ],
    until: 'Hasta el 31 de octubre',
  },
  navidad: {
    id: 'navidad', name: 'Navidad', emoji: '🎄',
    popupTitle: '¡Una nueva versión llegó por ti!',
    popupText: 'Feliz Navidad 🎄 Tu app se vistió de fiesta hasta el 1 de enero. Que este diciembre la plata rinda.',
    tipTitle: 'Una Navidad sin deudas 🎁',
    tips: [
      'Haz la lista de regalos con nombre y valor antes de salir a comprar.',
      'Separa el ahorro de la prima apenas te llegue, antes de gastarla.',
      'Novenas y cenas: ponlas en el mercado y compara precios entre tiendas.',
    ],
    until: 'Hasta el 1 de enero',
  },
};

// ═══ SECCIÓN: Fechas ═══
/** Temporada para una fecha (hora del celular). */
export function seasonFor(d = new Date()): SeasonId | null {
  const m = d.getMonth(), day = d.getDate();
  if (m === 9) return 'halloween';                         // octubre completo
  if (m === 11 || (m === 0 && day === 1)) return 'navidad'; // 1 dic – 1 ene
  return null;
}
/** Clave única de cada temporada por año (para mostrar el aviso una sola vez). */
const seasonKey = (id: SeasonId, d = new Date()) => `${id}-${id === 'navidad' && d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear()}`;

// ═══ SECCIÓN: Preferencias ═══
const OFF_KEY = 'mf_season_off';
const PREVIEW_KEY = 'mf_season_preview';
const SEEN_KEY = 'mf_season_seen';
const EVENT = 'mf:season-changed';

export const seasonEnabled = () => { try { return localStorage.getItem(OFF_KEY) !== '1'; } catch { return true; } };
export const setSeasonEnabled = (on: boolean) => {
  try { if (on) localStorage.removeItem(OFF_KEY); else localStorage.setItem(OFF_KEY, '1'); } catch { /* sin almacenamiento */ }
  applySeason();
};

/** Vista previa con ?temporada=navidad|halloween|no (dura mientras la pestaña esté abierta). */
const readPreview = (): SeasonId | 'none' | null => {
  try {
    const q = new URLSearchParams(location.search).get('temporada');
    if (q) {
      const v = q === 'navidad' || q === 'halloween' ? q : 'none';
      sessionStorage.setItem(PREVIEW_KEY, v);
      return v;
    }
    const s = sessionStorage.getItem(PREVIEW_KEY);
    return s === 'navidad' || s === 'halloween' || s === 'none' ? s : null;
  } catch { return null; }
};

/** Temporada que se ve ahora (respeta la vista previa y si el usuario la apagó). */
export function activeSeason(): Season | null {
  const preview = readPreview();
  if (preview === 'none') return null;
  if (preview) return SEASONS[preview];
  if (!seasonEnabled()) return null;
  const id = seasonFor();
  return id ? SEASONS[id] : null;
}
/** La temporada de hoy aunque esté apagada (para el interruptor de Ajustes). */
export const todaySeason = (): Season | null => { const id = seasonFor(); return id ? SEASONS[id] : null; };

// ═══ SECCIÓN: Aplicar a toda la app ═══
let current: SeasonId | null = null;
export function applySeason() {
  const s = activeSeason();
  const root = document.documentElement;
  root.classList.remove('season-halloween', 'season-navidad');
  if (s) root.classList.add(`season-${s.id}`);
  // Color de la barra del celular
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s?.id === 'halloween' ? '#0D0816' : s?.id === 'navidad' ? '#06120E' : '#0B1026');
  if (current !== (s?.id ?? null)) { current = s?.id ?? null; window.dispatchEvent(new Event(EVENT)); }
}

/** Arranca: aplica hoy y vuelve a revisar a medianoche y al volver a la app (por si cambió el mes). */
export function startSeasons() {
  applySeason();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') applySeason(); });
  const scheduleMidnight = () => {
    const n = new Date(); const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 5);
    setTimeout(() => { applySeason(); scheduleMidnight(); }, next.getTime() - n.getTime());
  };
  scheduleMidnight();
}

/** Hook de React: la pantalla se actualiza cuando cambia la temporada. */
export function useSeason(): Season | null {
  const [s, setS] = useState<Season | null>(activeSeason);
  useEffect(() => {
    const on = () => setS(activeSeason());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return s;
}

// ═══ SECCIÓN: Aviso "Una versión especial llegó por ti" (una vez por temporada) ═══
export const seasonPopupPending = (s: Season | null) => {
  if (!s) return false;
  try { return localStorage.getItem(SEEN_KEY) !== seasonKey(s.id); } catch { return false; }
};
export const markSeasonPopupSeen = (s: Season) => { try { localStorage.setItem(SEEN_KEY, seasonKey(s.id)); } catch { /* sin almacenamiento */ } };
