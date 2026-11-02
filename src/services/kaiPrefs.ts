/**
 * 🤖 Preferencias de Kai: color (blanco o negro). Solo en este celular.
 * Se cambia en Ajustes → Apariencia o dejando presionado a Kai en Inicio.
 */
import { useEffect, useState } from 'react';

export type KaiColor = 'blanco' | 'negro';
const KEY = 'mf_kai_color';
const EVENT = 'mf:kai-color';

export const getKaiColor = (): KaiColor => { try { return localStorage.getItem(KEY) === 'negro' ? 'negro' : 'blanco'; } catch { return 'blanco'; } };
export const setKaiColor = (c: KaiColor) => {
  try { localStorage.setItem(KEY, c); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new Event(EVENT));
};
export const useKaiColor = (): KaiColor => {
  const [c, set] = useState(getKaiColor);
  useEffect(() => { const on = () => set(getKaiColor()); window.addEventListener(EVENT, on); return () => window.removeEventListener(EVENT, on); }, []);
  return c;
};
