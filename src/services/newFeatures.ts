/**
 * ════════════════════════════════════════════════════════════════════
 * ✨ ETIQUETAS "NUEVO" DENTRO DE CADA MÓDULO
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: además de la ventana de novedades, marca con una etiqueta "NUEVO"
 *           lo que cambió dentro de cada módulo, y pone un puntito en el menú ☰.
 * Cuándo se quita: al tocarla, después de verla 5 veces o a los 10 días.
 * Al publicar una versión: agrega aquí lo nuevo (id, módulo, versión y texto corto).
 * Dónde se ve: componente <NewBadge id="..."/> (components/ui/NewBadge.tsx) y SidebarMenu.
 * Todo se guarda solo en el celular (localStorage 'mf_new_seen').
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';

export interface NewFeature { id: string; module: string; since: string; hint: string }

export const NEW_FEATURES: NewFeature[] = [
  { id: 'fin-tu-mes', module: 'finanzas', since: '2026-10-30', hint: 'Ingresos − Gastos = lo que te queda' },
];

const KEY = 'mf_new_seen';
const DAYS = 10, MAX_VIEWS = 5;
const EVENT = 'mf:new-seen';
type Seen = Record<string, { views: number; done?: boolean }>;
const read = (): Seen => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const write = (s: Seen) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ } window.dispatchEvent(new Event(EVENT)); };

const expired = (f: NewFeature) => Date.now() - new Date(`${f.since}T12:00:00`).getTime() > DAYS * 86400000;
export const isNew = (id: string) => {
  const f = NEW_FEATURES.find(x => x.id === id);
  if (!f || expired(f)) return false;
  const s = read()[id];
  return !s?.done && (s?.views ?? 0) < MAX_VIEWS;
};
/** Cuenta una vista (se llama una vez cada vez que se muestra). */
export const countView = (id: string) => { const s = read(); const v = s[id] ?? { views: 0 }; s[id] = { ...v, views: v.views + 1 }; write(s); };
/** La persona ya lo vio (tocó la etiqueta o usó la función). */
export const markSeen = (id: string) => { const s = read(); s[id] = { views: s[id]?.views ?? 0, done: true }; write(s); };
/** ¿El módulo tiene algo nuevo sin ver? (para el puntito del menú) */
export const moduleHasNew = (module: string) => NEW_FEATURES.some(f => f.module === module && isNew(f.id));

/** Hook: se actualiza cuando cambia lo visto. */
export function useNewTick() {
  const [, set] = useState(0);
  useEffect(() => { const on = () => set(t => t + 1); window.addEventListener(EVENT, on); return () => window.removeEventListener(EVENT, on); }, []);
}
