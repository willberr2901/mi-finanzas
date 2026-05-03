import { ShoppingCart, Check, X } from 'lucide-react';

export default function MarketActive() {
  return (
    <div className="flex items-center gap-2 text-green-400">
      <ShoppingCart className="w-5 h-5" />
      <span className="text-sm font-medium">Mercado Activo</span>
    </div>
  );
}