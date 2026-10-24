/**
 * 🗂️ Ícono de cada categoría del mercado (dibujos de lucide, con el color de la categoría).
 * Las categorías y sus colores están en services/market/categories.ts.
 */
import { Carrot, Milk, Drumstick, Croissant, Wheat, CupSoda, Cookie, SprayCan, Sparkles, PawPrint, Package } from 'lucide-react';
import { CATEGORIES, type CategoryId } from '../../services/market/categories';

const ICONS: Record<CategoryId, typeof Carrot> = {
  frutas: Carrot, lacteos: Milk, carnes: Drumstick, panaderia: Croissant, despensa: Wheat, bebidas: CupSoda,
  mecato: Cookie, aseo: SprayCan, personal: Sparkles, mascotas: PawPrint, otros: Package,
};

export default function CategoryIcon({ id, size = 16, boxed = false }: { id: CategoryId; size?: number; boxed?: boolean }) {
  const Icon = ICONS[id] ?? Package;
  const color = CATEGORIES.find(c => c.id === id)?.color ?? '#CBD5E1';
  if (!boxed) return <Icon size={size} style={{ color }} aria-hidden="true" />;
  return (
    <span className="shrink-0 rounded-xl flex items-center justify-center" style={{ width: size * 2, height: size * 2, background: `${color}22`, boxShadow: `inset 0 0 0 1px ${color}44` }}>
      <Icon size={size} style={{ color }} aria-hidden="true" />
    </span>
  );
}
