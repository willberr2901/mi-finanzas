/**
 * ════════════════════════════════════════════════════════════════════
 * 🏪 DISTINTIVO DE LA TIENDA (diseño propio de la app)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: dibuja un ícono elegante para cada tienda:
 *   • Según el tipo de negocio, un dibujo: plaza 🥕, tienda de barrio 🏪,
 *     fruver 🍎, panadería 🥐, carnicería 🥩, droguería 💊, licorera 🍷…
 *   • Supermercados: su inicial (o "D1") en un monograma.
 *   Cada tienda tiene siempre el mismo color (D1 siempre igual, Ara siempre igual…).
 * Por qué no los logos reales: son marcas registradas de cada empresa;
 *           usar diseños propios evita problemas legales y funciona sin internet.
 * Dónde se ve: Mercado → "¿Dónde estás comprando?", Terminar mercado,
 *              Historial y Precios por tienda.
 * ════════════════════════════════════════════════════════════════════
 */
import { Store, Carrot, Apple, Croissant, Beef, Pill, Wine, Fish, Milk, Warehouse, type LucideIcon } from 'lucide-react';

/** Colores de la app para las tiendas (suaves, se ven bien sobre el fondo oscuro). */
const COLORS = ['#C6F432', '#A78BFA', '#38BDF8', '#FB923C', '#FB7185', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#2DD4BF', '#818CF8', '#F87171'];

const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const hash = (s: string) => { let h = 7; for (const c of plain(s).replace(/\s/g, '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** Tipo de negocio por palabras del nombre → dibujo. */
const KINDS: [RegExp, LucideIcon][] = [
  [/\b(plaza|galeria|mercado campesino|corabastos|paloquemao)\b/, Carrot],
  [/\b(fruver|frutas?|verduras?|fruteria)\b/, Apple],
  [/\b(panaderia|pan|pasteleria|reposteria)\b/, Croissant],
  [/\b(carniceria|carnes?|famas?|pollos?|avicola)\b/, Beef],
  [/\b(pescaderia|pescados?|mariscos?)\b/, Fish],
  [/\b(drogueria|farmacia|drogas)\b/, Pill],
  [/\b(licorera|licores|vinos?|cava)\b/, Wine],
  [/\b(lacteos|quesera|lecheria)\b/, Milk],
  [/\b(makro|pricesmart|mayorista|bodega|cash)\b/, Warehouse],
  [/\b(tienda|minimercado|miscelanea|autoservicio|supermercado de barrio|granero|abarrotes)\b/, Store],
];
const kindIcon = (name: string) => KINDS.find(([re]) => re.test(plain(name)))?.[1] ?? null;

/** Monograma: "D1" → "D1", "Éxito" → "É", "Super Inter" → "S". */
export const storeInitials = (name: string) => {
  const w = name.trim().split(/\s+/)[0] ?? '';
  if (/^[a-z]\d$/i.test(w) || (w.length <= 2 && w)) return w.toUpperCase();
  return (w.charAt(0) || '?').toUpperCase();
};

export const storeColor = (name: string) => COLORS[hash(name) % COLORS.length];

export default function StoreBadge({ name, size = 36, className = '' }: { name?: string; size?: number; className?: string }) {
  const radius = size * 0.32;
  if (!name) {
    return (
      <span style={{ width: size, height: size, borderRadius: radius }} className={`inline-flex items-center justify-center shrink-0 bg-white/[0.06] ring-1 ring-white/10 text-slate-400 ${className}`} aria-hidden="true">
        <Store size={size * 0.48} strokeWidth={2} />
      </span>
    );
  }
  const color = storeColor(name);
  const Icon = kindIcon(name);
  const initials = storeInitials(name);
  return (
    <span aria-hidden="true"
      style={{ width: size, height: size, borderRadius: radius, color, background: `linear-gradient(160deg, ${color}2E, ${color}14)`, boxShadow: `inset 0 0 0 1px ${color}55, 0 4px 14px -6px ${color}66` }}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
      {/* brillo suave arriba */}
      <span className="absolute inset-x-0 top-0 h-1/2" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent)' }} />
      {Icon
        ? <Icon size={size * 0.5} strokeWidth={2.1} className="relative" />
        : <span className="relative font-extrabold leading-none tracking-tight" style={{ fontSize: size * (initials.length > 1 ? 0.36 : 0.46), fontFamily: 'inherit' }}>{initials}</span>}
    </span>
  );
}
