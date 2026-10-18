/**
 * ════════════════════════════════════════════════════════════════════
 * ⚖️ CUENTAS CLARAS (gastos compartidos)
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Reparte los pagos compartidos del mes entre los dos según el porcentaje y dice quién le debe a quién.
 * Dónde se ve: Pagos, cuando hay pagos "Compartido".
 * Si lo cambias: Cambia el cálculo de quién debe cuánto.
 * ════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, ArrowRight, Check, Share2, SlidersHorizontal, Info } from 'lucide-react';
import type { BillStatus } from '../../services/billsService';
import { usePrefs, ownerLabel } from '../../utils/prefs';
import { formatCOP } from '../../utils/format';
import { notify } from '../../services/notificationService';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const PRESETS = [50, 60, 70, 40, 30];

/**
 * "Cuentas claras": reparte los pagos compartidos del mes entre los dos del hogar
 * según el porcentaje acordado y dice quién le debe a quién.
 */
export default function SharedSettlementCard({ statuses, period }: { statuses: BillStatus[]; period: string }) {
  const [prefs, setPrefs] = usePrefs();
  const [editing, setEditing] = useState(false);
  const shared = statuses.filter(s => s.bill.owner === 'compartido');
  if (!shared.length) return null;

  const me = ownerLabel('yo', prefs), partner = ownerLabel('pareja', prefs);
  const pctMe = Math.min(100, Math.max(0, prefs.split ?? 50));
  const ratio = pctMe / 100;

  const amountOf = (s: BillStatus) => s.payment?.amount ?? s.bill.amount;
  const total = shared.reduce((a, s) => a + amountOf(s), 0);
  const paid = shared.filter(s => s.paid);
  const paidTotal = paid.reduce((a, s) => a + amountOf(s), 0);
  const paidByMe = paid.filter(s => s.payment?.paidBy !== 'pareja').reduce((a, s) => a + amountOf(s), 0);
  const paidByPartner = paidTotal - paidByMe;
  const unassigned = paid.filter(s => !s.payment?.paidBy).length;
  const pending = total - paidTotal;

  // Positivo: la pareja le debe a "yo". Negativo: "yo" le debe a la pareja.
  const raw = paidByMe - paidTotal * ratio;
  const settledAmt = prefs.settled?.[period] ?? 0;
  const balance = Math.round(raw - settledAmt);
  const even = Math.abs(balance) < 500;
  const debtor = balance > 0 ? partner : me;
  const creditor = balance > 0 ? me : partner;
  const [y, m] = period.split('-').map(Number);
  const monthName = MONTHS[(m || 1) - 1];

  const summary = () => [
    `Cuentas claras de ${monthName} ${y} 🏠`,
    `Gastos compartidos: ${formatCOP(total)} (${pctMe}% ${me} / ${100 - pctMe}% ${partner})`,
    `${me} pagó ${formatCOP(paidByMe)} · ${partner} pagó ${formatCOP(paidByPartner)}`,
    even ? '✅ Estamos a paz y salvo' : `➡️ ${debtor} le debe ${formatCOP(Math.abs(balance))} a ${creditor}`,
    pending > 0 ? `Falta por pagar: ${formatCOP(pending)}` : '',
    '— Mi Finanzas',
  ].filter(Boolean).join('\n');

  const share = async () => {
    try { if ('share' in navigator) { await navigator.share({ text: summary() }); return; } } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(summary())}`, '_blank', 'noopener');
  };

  const settle = () => {
    setPrefs({ settled: { ...(prefs.settled || {}), [period]: Math.round(raw) } });
    notify({ title: 'Cuentas saldadas', message: `${debtor} le pagó ${formatCOP(Math.abs(balance))} a ${creditor}.`, type: 'success' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      className="theme-dark relative overflow-hidden rounded-[26px] p-4 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20" data-tour="bills-shared">
      <div className="absolute -top-14 -right-10 w-40 h-40 rounded-full bg-lime-300/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-brand-lime/15 ring-1 ring-brand-lime/30 flex items-center justify-center"><Scale size={16} className="text-brand-lime" /></span>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight">Cuentas claras</p>
            <p className="text-[11px] text-slate-400">Compartidos de {monthName} · {pctMe}/{100 - pctMe}</p>
          </div>
        </div>
        <button onClick={() => setEditing(v => !v)} aria-label="Cambiar cómo dividen" className="p-2 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white"><SlidersHorizontal size={15} /></button>
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative overflow-hidden">
            <div className="pt-3">
              <p className="text-[11px] text-slate-300 mb-2">¿Cómo dividen los gastos compartidos?</p>
              <div className="flex gap-1.5 flex-wrap">
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setPrefs({ split: p })} className={`px-3 py-1.5 rounded-full text-xs font-bold ${pctMe === p ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.07] text-white ring-1 ring-white/10'}`}>{p}/{100 - p}</button>
                ))}
              </div>
              <input type="range" min={0} max={100} step={5} value={pctMe} onChange={e => setPrefs({ split: Number(e.target.value) })} className="w-full mt-3 accent-[#C6F432]" aria-label={`Porcentaje de ${me}`} />
              <div className="flex justify-between text-[11px] text-slate-300"><span>{me}: {pctMe}%</span><span>{partner}: {100 - pctMe}%</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative grid grid-cols-2 gap-2 mt-3">
        {[{ who: me, paidAmt: paidByMe, share: paidTotal * ratio }, { who: partner, paidAmt: paidByPartner, share: paidTotal * (1 - ratio) }].map(p => (
          <div key={p.who} className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-3">
            <p className="text-[11px] text-slate-300 truncate">{p.who} pagó</p>
            <p className="text-white font-extrabold">{formatCOP(p.paidAmt)}</p>
            <p className="text-[10px] text-slate-400">le toca {formatCOP(p.share)}</p>
          </div>
        ))}
      </div>

      <div className={`relative mt-3 rounded-2xl p-3 border-l-4 ${even ? 'border-brand-lime bg-brand-lime/10' : 'border-brand-lime bg-white/[0.06]'}`}>
        {even ? (
          <p className="text-sm text-white font-bold flex items-center gap-2"><Check size={16} className="text-brand-lime" />Están a paz y salvo{settledAmt ? ' (ya saldaron)' : ''}</p>
        ) : (
          <>
            <p className="text-sm text-white font-bold flex items-center gap-1.5 flex-wrap">{debtor} <ArrowRight size={14} className="text-brand-lime" /> {creditor}</p>
            <p className="text-2xl font-extrabold text-brand-lime leading-tight">{formatCOP(Math.abs(balance))}</p>
            <p className="text-[11px] text-slate-400">para quedar {pctMe}/{100 - pctMe} con lo pagado hasta hoy</p>
          </>
        )}
      </div>

      {pending > 0 && <p className="relative text-[11px] text-slate-300 mt-2">Falta por pagar {formatCOP(pending)} en compartidos: a {me} le tocan {formatCOP(pending * ratio)} y a {partner} {formatCOP(pending * (1 - ratio))}.</p>}
      {unassigned > 0 && <p className="relative text-[10px] text-slate-400 mt-1 flex items-start gap-1"><Info size={11} className="mt-0.5 shrink-0" />{unassigned === 1 ? '1 pago no dice' : `${unassigned} pagos no dicen`} quién pagó; se cuenta{unassigned === 1 ? '' : 'n'} a {me}.</p>}

      <div className="relative grid grid-cols-2 gap-2 mt-3">
        <button onClick={share} className="py-2.5 rounded-xl bg-white/[0.08] ring-1 ring-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5"><Share2 size={14} />Enviar resumen</button>
        <button onClick={settle} disabled={even} className="py-2.5 rounded-xl bg-brand-lime text-brand-ink text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"><Check size={14} />Marcar saldado</button>
      </div>
    </motion.div>
  );
}
