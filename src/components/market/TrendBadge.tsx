/**
 * ════════════════════════════════════════════════════════════════════
 * 📈 ETIQUETA DE PRECIO: 🔻 bajó · 🔺 subió · 🟰 igual
 * ────────────────────────────────────────────────────────────────────
 * Compara el precio de hoy con el de la última compra del mismo producto.
 * Dónde se ve: lista de Mercado, historial de mercados y pestaña Precios.
 * Colores: verde = bajó (bueno), rojo = subió, gris = igual.
 * ════════════════════════════════════════════════════════════════════
 */
import { ArrowDown, ArrowUp, Equal } from 'lucide-react';
import type { Trend } from '../../services/market/marketStore';
import { formatCOP } from '../../utils/format';

export default function TrendBadge({ trend, compact = false }: { trend: Trend | null; compact?: boolean }) {
  if (!trend) return null;
  const cfg = {
    down: { Icon: ArrowDown, cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30', text: `Bajó ${formatCOP(Math.abs(trend.diff))}` },
    up: { Icon: ArrowUp, cls: 'bg-rose-500/15 text-rose-300 ring-rose-400/30', text: `Subió ${formatCOP(trend.diff)}` },
    same: { Icon: Equal, cls: 'bg-white/[0.07] text-slate-300 ring-white/10', text: 'Igual' },
  }[trend.dir];
  const { Icon } = cfg;
  return (
    <span title={`Antes: ${formatCOP(trend.before)}`} aria-label={`${cfg.text}. Antes costaba ${formatCOP(trend.before)}`}
      className={`inline-flex items-center gap-0.5 rounded-full ring-1 font-bold ${cfg.cls} ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'}`}>
      <Icon size={compact ? 10 : 11} strokeWidth={3} />
      {compact ? (trend.dir === 'same' ? 'Igual' : formatCOP(Math.abs(trend.diff))) : cfg.text}
      {!compact && trend.dir !== 'same' && <span className="opacity-70 font-semibold">· {trend.pct}%</span>}
    </span>
  );
}
