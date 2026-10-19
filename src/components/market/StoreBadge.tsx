/**
 * ════════════════════════════════════════════════════════════════════
 * 🏪 DISTINTIVO DE LA TIENDA (iniciales con color propio)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: dibuja un "logo" propio de la app para cada tienda: sus
 *           iniciales sobre un color que siempre es el mismo para esa tienda
 *           (D1 siempre se ve igual, la plaza siempre igual…).
 * Por qué no los logos reales: son marcas registradas de cada empresa;
 *           usar los nuestros evita problemas legales y funciona sin internet.
 * Dónde se ve: Mercado → "¿Dónde estás comprando?", Terminar mercado,
 *              Historial y Precios por tienda.
 * ════════════════════════════════════════════════════════════════════
 */
import { Store } from 'lucide-react';

/** Paleta de la app para las tiendas (combinaciones de color propias). */
const PALETTE = [
  ['#C6F432', '#0B1026'], ['#7C3AED', '#FFFFFF'], ['#06B6D4', '#04202A'], ['#F97316', '#FFFFFF'],
  ['#E11D48', '#FFFFFF'], ['#10B981', '#03231A'], ['#F59E0B', '#2A1A02'], ['#3B82F6', '#FFFFFF'],
  ['#EC4899', '#FFFFFF'], ['#14B8A6', '#04211E'], ['#A3E635', '#14200A'], ['#6366F1', '#FFFFFF'],
] as const;

const hash = (s: string) => { let h = 7; for (const c of s.toLowerCase().normalize('NFD').replace(/[̀-ͯ\s]/g, '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** "Tienda del barrio" → "TB", "D1" → "D1", "Éxito" → "ÉX", "Plaza de mercado" → "PM". */
export const storeInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(w => !/^(de|del|la|el|los|las|y|&)$/i.test(w));
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, words[0].length <= 3 ? 3 : 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function StoreBadge({ name, size = 36, className = '' }: { name?: string; size?: number; className?: string }) {
  if (!name) {
    return (
      <span style={{ width: size, height: size, borderRadius: size * 0.3 }} className={`inline-flex items-center justify-center shrink-0 bg-white/[0.06] ring-1 ring-white/10 text-slate-400 ${className}`} aria-hidden="true">
        <Store size={size * 0.5} />
      </span>
    );
  }
  const [bg, fg] = PALETTE[hash(name) % PALETTE.length];
  const initials = storeInitials(name);
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: size * 0.3, background: `linear-gradient(140deg, ${bg}, ${bg}CC)`, color: fg, fontSize: size * (initials.length > 2 ? 0.3 : 0.38) }}
      className={`relative inline-flex items-center justify-center shrink-0 font-black tracking-tight shadow-md shadow-black/30 ring-1 ring-white/15 overflow-hidden ${className}`}>
      <span className="absolute -right-1 -top-1 w-1/2 h-1/2 rounded-full bg-white/20 blur-[2px]" />
      <span className="relative leading-none">{initials}</span>
    </span>
  );
}
