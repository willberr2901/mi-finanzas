import { useState } from 'react';
import { ownerLabel } from '../../utils/prefs';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import MoneyInput from '../ui/MoneyInput';
import { EXPENSE_CATEGORIES, OBLIGATORY, guessCategory } from '../../utils/categories';
import type { Bill, Owner } from '../../utils/database';

interface Props {
  initial?: Bill | null;
  onSave: (data: Omit<Bill, 'id' | 'createdAt' | 'active'>) => void;
  onClose: () => void;
}

const owners = (): { id: Owner; label: string }[] => (['yo', 'pareja', 'compartido'] as const).map(id => ({ id, label: ownerLabel(id) }));

export default function BillForm({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState<Bill['kind']>(initial?.kind ?? 'fijo');
  const [category, setCategory] = useState(initial?.category ?? 'Servicios');
  const [categoryTouched, setCategoryTouched] = useState(!!initial);
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [dueDay, setDueDay] = useState(String(initial?.dueDay ?? ''));
  const [owner, setOwner] = useState<Owner>(initial?.owner ?? 'compartido');
  const [total, setTotal] = useState(String(initial?.totalInstallments ?? ''));
  const [paid, setPaid] = useState(String(initial?.paidInstallments ?? '0'));
  const [error, setError] = useState('');

  const onName = (v: string) => {
    setName(v);
    if (!categoryTouched) {
      const g = guessCategory(v);
      if (g) { setCategory(g); if (/tarjeta/i.test(v)) setKind('tarjeta'); }
    }
  };

  const submit = () => {
    const day = parseInt(dueDay);
    if (!name.trim()) return setError('Escribe el nombre del pago.');
    if (!amount) return setError(kind === 'tarjeta' ? 'Escribe un valor aproximado (lo puedes cambiar cada mes al pagar).' : 'Escribe el valor.');
    if (!day || day < 1 || day > 31) return setError('El día de pago va de 1 a 31.');
    const totalN = parseInt(total) || undefined;
    if (kind === 'deuda' && !totalN) return setError('Escribe cuántas cuotas tiene la deuda.');
    onSave({
      name: name.trim(), kind, category: kind !== 'fijo' ? 'Deudas' : category, amount, dueDay: day, owner,
      totalInstallments: kind === 'deuda' ? totalN : undefined,
      paidInstallments: kind === 'deuda' ? Math.min(parseInt(paid) || 0, totalN ?? 0) : undefined,
    });
  };

  const label = 'text-xs text-slate-400 font-medium mb-1 block';

  return (
    <motion.div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="bill-form-title"
        className="w-full max-w-md bg-surface border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 pb-8 max-h-[92vh] overflow-y-auto"
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: 'spring', damping: 24, stiffness: 260 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="bill-form-title" className="text-white text-lg font-bold">{initial ? 'Editar pago' : 'Nuevo pago o deuda'}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl mb-2">
          {(['fijo', 'tarjeta', 'deuda'] as const).map(k => (
            <button key={k} onClick={() => { setKind(k); if (k !== 'fijo') setCategory('Deudas'); }}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${kind === k ? 'bg-amber-500 text-black' : 'text-slate-400'}`}>
              {k === 'fijo' ? 'Pago fijo' : k === 'tarjeta' ? 'Tarjeta crédito' : 'Crédito en cuotas'}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mb-4">
          {kind === 'fijo' ? 'Arriendo, servicios, internet: mismo día cada mes. Se programa solo mes a mes.'
            : kind === 'tarjeta' ? 'La fecha de pago es fija y el valor cambia cada mes: al pagar escribes cuánto pagaste.'
            : 'Préstamo con un número de cuotas: te mostramos cuántas llevas y cuánto falta.'}
        </p>

        <div className="space-y-3">
          <label className="block"><span className={label}>Nombre</span>
            <input value={name} onChange={e => onName(e.target.value)} placeholder={kind === 'tarjeta' ? 'Ej: Tarjeta Nu, Visa Bancolombia' : kind === 'deuda' ? 'Ej: Crédito Fincomercio, Préstamo moto' : 'Ej: Arriendo, Luz Enel, Internet'} className="input-modern w-full" /></label>

          {kind === 'fijo' && (
            <label className="block"><span className={label}>Categoría {OBLIGATORY.has(category) && <span className="text-violet-300">· obligatorio y recurrente</span>}</span>
              <select value={category} onChange={e => { setCategory(e.target.value); setCategoryTouched(true); }} className="input-modern w-full">
                {EXPENSE_CATEGORIES.filter(c => c !== 'Deudas').map(c => <option key={c} value={c}>{c}</option>)}
              </select></label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className={label}>{kind === 'deuda' ? 'Valor de la cuota' : kind === 'tarjeta' ? 'Valor aproximado' : 'Valor mensual'}</span>
              <MoneyInput value={amount} onChange={setAmount} prefix placeholder="$ 0" className="input-modern w-full" /></label>
            <label className="block"><span className={label}>{kind === 'tarjeta' ? 'Fecha límite (día)' : 'Día de pago'}</span>
              <input type="number" inputMode="numeric" min={1} max={31} value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="Ej: 5" className="input-modern w-full" /></label>
          </div>

          {kind === 'deuda' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className={label}>Total de cuotas</span>
                <input type="number" inputMode="numeric" min={1} value={total} onChange={e => setTotal(e.target.value)} placeholder="Ej: 24" className="input-modern w-full" /></label>
              <label className="block"><span className={label}>Cuotas ya pagadas</span>
                <input type="number" inputMode="numeric" min={0} value={paid} onChange={e => setPaid(e.target.value)} className="input-modern w-full" /></label>
            </div>
          )}

          <div><span className={label}>¿De quién es?</span>
            <div className="grid grid-cols-3 gap-2">
              {owners().map(o => (
                <button key={o.id} onClick={() => setOwner(o.id)}
                  className={`py-2 rounded-xl text-sm border transition-all ${owner === o.id ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 font-semibold' : 'border-white/10 text-slate-300'}`}>{o.label}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
          <button onClick={submit} className="btn-primary w-full mt-2">{initial ? 'Guardar cambios' : 'Guardar pago'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
