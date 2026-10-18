/**
 * ════════════════════════════════════════════════════════════════════
 * 🧾 HOJA DE UN PRODUCTO: tacharlo con su precio o editarlo
 * ────────────────────────────────────────────────────────────────────
 * mode="check": en el súper, al tocar un producto de la lista → precio y "Tachar".
 * mode="edit":  cambiar nombre, cantidad, unidad o precio, o quitarlo.
 * Dónde se ve: Mercado. Guarda con marketStore.ts (y se sincroniza con el hogar).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { Check, Trash2, Undo2, ShoppingCart, Pencil } from 'lucide-react';
import BottomSheet from '../ui/BottomSheet';
import MoneyInput from '../ui/MoneyInput';
import TrendBadge from './TrendBadge';
import { QtyStepper, UnitPicker, fmtQty } from './QtyUnit';
import { checkItem, updateItem, removeItem, uncheckItem, lastPrice, trendOf, unitLabel, type ListItem } from '../../services/market/marketStore';
import { formatCOP } from '../../utils/format';
import { askConfirm } from '../ui/ConfirmDialog';
import { notify } from '../../services/notificationService';

export default function ItemSheet({ item, mode, onClose }: { item: ListItem | null; mode: 'check' | 'edit'; onClose: () => void }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<ListItem['unit']>('und');
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (!item) return;
    setName(item.name); setQty(item.qty); setUnit(item.unit);
    setPrice(item.paid ?? lastPrice(item.name) ?? 0);
  }, [item?.id]);

  if (!item) return <BottomSheet open={false} onClose={onClose} title=""><div /></BottomSheet>;
  const trend = price ? trendOf(item.name, price) : null;
  const last = lastPrice(item.name);

  const doCheck = () => {
    if (!price) return notify({ title: `¿Cuánto costó ${item.name}?`, message: 'Escribe el precio para sumar al carrito.', type: 'info' });
    if (name.trim() && name.trim() !== item.name) updateItem(item.id, { name: name.trim(), unit });
    else if (unit !== item.unit) updateItem(item.id, { unit });
    checkItem(item.id, price, qty, unit);
    notify({ title: `${item.name} al carrito`, message: `${fmtQty(qty)} ${unitLabel(unit)} × ${formatCOP(price)} = ${formatCOP(price * qty)}`, type: 'success', log: false });
    onClose();
  };
  const save = () => {
    if (!name.trim()) return;
    updateItem(item.id, { name: name.trim(), qty, unit, paid: item.checked ? price || undefined : item.paid });
    notify({ title: 'Producto actualizado', message: name.trim(), type: 'success', log: false });
    onClose();
  };
  const del = async () => {
    if (!await askConfirm({ title: `¿Quitar ${item.name} de la lista?`, icon: 'trash', tone: 'danger', confirmText: 'Sí, quitar' })) return;
    removeItem(item.id);
    notify({ title: 'Producto quitado', message: item.name, type: 'info', log: false });
    onClose();
  };

  return (
    <BottomSheet open={!!item} onClose={onClose} title={mode === 'check' ? item.name : 'Editar producto'}
      subtitle={mode === 'check' ? (last ? `Última vez: ${formatCOP(last)} por ${unitLabel(item.unit)}` : 'Primera vez que lo compras') : item.name}
      icon={mode === 'check' ? <ShoppingCart size={22} /> : <Pencil size={20} />}>
      {mode === 'edit' && (
        <input value={name} onChange={e => setName(e.target.value)} aria-label="Nombre del producto" className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-lime mb-3" />
      )}
      <UnitPicker unit={unit} onChange={setUnit} />
      <div className="flex items-stretch gap-2 mt-3">
        <QtyStepper qty={qty} unit={unit} onChange={setQty} />
        {(mode === 'check' || item.checked) && (
          <MoneyInput value={price} onChange={setPrice} prefix placeholder={`Precio por ${unitLabel(unit)}`} ariaLabel="Precio por unidad"
            className="flex-1 min-w-0 h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-bold outline-none focus:border-brand-lime" />
        )}
      </div>
      {(mode === 'check' || item.checked) && price > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/[0.04] ring-1 ring-white/10 px-4 py-3">
          <div>
            <p className="text-[11px] text-slate-400">{fmtQty(qty)} {unitLabel(unit)} × {formatCOP(price)}</p>
            <p className="text-white text-xl font-extrabold">{formatCOP(price * qty)}</p>
          </div>
          <TrendBadge trend={trend} />
        </div>
      )}

      {mode === 'check' ? (
        <button onClick={doCheck} className="mt-4 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-base flex items-center justify-center gap-2 active:scale-[0.98]">
          <Check size={20} strokeWidth={3} /> Tachar y sumar al carrito
        </button>
      ) : (
        <div className="mt-4 space-y-2">
          <button onClick={save} className="w-full h-13 py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2 active:scale-[0.98]"><Check size={18} strokeWidth={3} /> Guardar cambios</button>
          <div className="grid grid-cols-2 gap-2">
            {item.checked
              ? <button onClick={() => { uncheckItem(item.id); onClose(); }} className="py-3 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-sm font-bold flex items-center justify-center gap-1.5"><Undo2 size={16} /> Sacar del carrito</button>
              : <span />}
            <button onClick={del} className="py-3 rounded-2xl bg-rose-500/10 ring-1 ring-rose-400/30 text-rose-300 text-sm font-bold flex items-center justify-center gap-1.5"><Trash2 size={16} /> Quitar</button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
