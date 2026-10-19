/**
 * ════════════════════════════════════════════════════════════════════
 * ✅ TERMINAR EL MERCADO (resumen final)
 * ────────────────────────────────────────────────────────────────────
 * Muestra: lo comprado de la lista, los antojos (extras), lo que faltó y
 * la diferencia contra el estimado. Al confirmar:
 *   1) guarda el mercado en el historial con la tienda (se sincroniza con el hogar),
 *   2) opcional: lo registra como gasto "Mercado" en Finanzas (solo en este celular),
 *   3) lo que faltó se queda en la lista para la próxima vez.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, ListChecks, PackageX, Wallet, Store } from 'lucide-react';
import StorePicker from './StorePicker';
import BottomSheet from '../ui/BottomSheet';
import { finishTrip, lastPrice, type ListItem, type Trip } from '../../services/market/marketStore';
import { db } from '../../utils/database';
import { formatCOP, todayISO } from '../../utils/format';

export default function FinishSheet({ open, items, store = '', onClose, onDone }: { open: boolean; items: ListItem[]; store?: string; onClose: () => void; onDone: (t: Trip) => void }) {
  const [register, setRegister] = useState(true);
  const [where, setWhere] = useState(store);
  useEffect(() => { if (open) setWhere(store); }, [open, store]);
  const bought = items.filter(i => i.checked);
  const planned = bought.filter(i => !i.extra);
  const extras = bought.filter(i => i.extra);
  const missing = items.filter(i => !i.checked);
  const sum = (l: ListItem[]) => l.reduce((s, i) => s + (i.paid || 0) * i.qty, 0);
  const total = sum(bought);
  const estimate = planned.reduce((s, i) => s + (lastPrice(i.name) ?? i.paid ?? 0) * i.qty, 0);
  const diff = sum(planned) - estimate;

  const confirm = async () => {
    const trip = finishTrip(where);
    if (!trip) return;
    if (register && trip.total > 0) {
      try {
        await db.transactions.add({ id: crypto.randomUUID(), date: todayISO(), type: 'expense', amount: trip.total, category: 'Mercado', description: `Mercado${trip.store ? ` en ${trip.store}` : ''} · ${trip.items.length} productos`, createdAt: Date.now() });
        window.dispatchEvent(new Event('mf:data-changed'));
      } catch { /* el historial del mercado ya quedó guardado */ }
    }
    onDone(trip);
  };

  const Row = ({ icon, label, value, sub, tone = '' }: { icon: JSX.Element; label: string; value: string; sub?: string; tone?: string }) => (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-9 h-9 rounded-xl bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center text-brand-lime">{icon}</span>
      <div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold">{label}</p>{sub && <p className="text-[11px] text-slate-400 truncate">{sub}</p>}</div>
      <p className={`font-bold text-sm ${tone || 'text-white'}`}>{value}</p>
    </div>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="Terminar mercado" subtitle="Revisa el resumen antes de cerrar" icon={<CheckCircle2 size={22} />}>
      <div className="theme-dark rounded-[24px] p-5 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20 text-center">
        <p className="text-slate-300 text-xs">Total del mercado</p>
        <p className="text-brand-lime text-4xl font-extrabold tracking-tight mt-1">{formatCOP(total)}</p>
        {estimate > 0 && Math.abs(diff) >= 100 && (
          <p className={`text-xs mt-1 font-semibold ${diff < 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {diff < 0 ? `Pagaste ${formatCOP(-diff)} menos de lo estimado en tu lista 🎉` : `Pagaste ${formatCOP(diff)} más de lo estimado en tu lista`}
          </p>
        )}
      </div>
      <div className="mt-3 divide-y divide-white/5">
        <Row icon={<ListChecks size={17} />} label={`De tu lista · ${planned.length}`} value={formatCOP(sum(planned))} />
        <Row icon={<Sparkles size={17} />} label={`Antojos (extras) · ${extras.length}`} value={formatCOP(sum(extras))} sub={extras.map(e => e.name).join(', ') || 'Ninguno, ¡bien!'} tone={extras.length ? 'text-amber-300' : ''} />
        <Row icon={<PackageX size={17} />} label={`Sin comprar · ${missing.length}`} value={missing.length ? 'Pasan a la próxima' : '—'} sub={missing.map(m => m.name).join(', ') || 'Compraste todo'} tone="text-slate-300" />
      </div>
      <div className="mt-3 p-3.5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
        <p className="text-white text-sm font-semibold mb-2 flex items-center gap-1.5"><Store size={15} className="text-brand-lime" /> ¿Dónde compraste?</p>
        <StorePicker value={where} onChange={setWhere} />
      </div>
      <button onClick={() => setRegister(r => !r)} role="switch" aria-checked={register}
        className="mt-3 w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 text-left">
        <Wallet size={18} className="text-brand-lime" />
        <span className="flex-1"><span className="block text-white text-sm font-semibold">Registrar como gasto en Finanzas</span><span className="block text-[11px] text-slate-400">Categoría Mercado · solo en este celular</span></span>
        <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${register ? 'bg-brand-lime' : 'bg-white/15'}`}><span className={`block w-5 h-5 rounded-full bg-[#fff] shadow transition-transform ${register ? 'translate-x-5' : ''}`} /></span>
      </button>
      <button onClick={confirm} disabled={!bought.length} className="mt-4 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98]">
        <CheckCircle2 size={20} /> Cerrar mercado · {formatCOP(total)}
      </button>
    </BottomSheet>
  );
}
