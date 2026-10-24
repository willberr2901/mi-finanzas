/**
 * ════════════════════════════════════════════════════════════════════
 * 🤝 PANTALLA PRÉSTAMOS ("Me deben" / "Yo debo")
 * ────────────────────────────────────────────────────────────────────
 * Para las deudas pequeñas con personas, aparte de Pagos: "me prestaron para el
 * pasaje", "le presté a Juan para el almuerzo".
 *   • Arriba: cuánto te deben y cuánto debes.
 *   • Pestañas Me deben / Yo debo, agrupado por persona, con barra de abonos.
 *   • Abonar (parcial o todo) · Recordar por WhatsApp (abre WhatsApp con un mensaje amable).
 *   • Botón "Nuevo préstamo" abajo.
 * Datos: services/loansService.ts (solo en el celular, cifrado).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, HandCoins, ArrowDownLeft, ArrowUpRight, MessageCircle, Check, Trash2, Undo2, ChevronDown, CalendarDays } from 'lucide-react';
import ModuleHeader from '../components/ui/ModuleHeader';
import BottomSheet from '../components/ui/BottomSheet';
import MoneyInput from '../components/ui/MoneyInput';
import { askConfirm } from '../components/ui/ConfirmDialog';
import { notify } from '../services/notificationService';
import { formatCOP } from '../utils/format';
import {
  useLoans, addLoan, addPayment, removeLoan, undoLastPayment, knownPeople, loanTotals, byPerson, leftOf, paidOf, isClosed, isLate,
  reminderText, REASONS, today, type Loan, type LoanDir,
} from '../services/loansService';

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

export default function LoansPage() {
  const loans = useLoans();
  const [tab, setTab] = useState<LoanDir>('meDeben');
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState<Loan | null>(null);
  const [detail, setDetail] = useState<Loan | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const t = loanTotals(loans);

  const open = loans.filter(l => l.dir === tab && !isClosed(l));
  const closed = loans.filter(l => l.dir === tab && isClosed(l));
  const groups = useMemo(() => byPerson(open), [open]);
  const countOf = (d: LoanDir) => loans.filter(l => l.dir === d && !isClosed(l)).length;

  const remind = (l: Loan) => window.open(`https://wa.me/?text=${encodeURIComponent(reminderText(l, formatCOP))}`, '_blank', 'noopener,noreferrer');

  return (
    <div className="pb-32">
      <ModuleHeader module="prestamos" />

      {/* Resumen */}
      <div className="theme-dark relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20">
        <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-lime-300/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-300 text-xs flex items-center gap-1"><ArrowDownLeft size={13} className="text-brand-lime" /> Te deben</p>
            <p className="text-brand-lime text-2xl font-extrabold tracking-tight">{formatCOP(t.meDeben)}</p>
          </div>
          <div>
            <p className="text-slate-300 text-xs flex items-center gap-1"><ArrowUpRight size={13} className="text-amber-300" /> Debes</p>
            <p className="text-amber-300 text-2xl font-extrabold tracking-tight">{formatCOP(t.debo)}</p>
          </div>
        </div>
        <p className="relative text-xs text-slate-300 mt-3">
          {t.meDeben === t.debo ? 'Estás a paz y salvo con todos 🙌' : t.meDeben > t.debo ? <>A tu favor: <strong className="text-white">{formatCOP(t.meDeben - t.debo)}</strong></> : <>En contra: <strong className="text-white">{formatCOP(t.debo - t.meDeben)}</strong></>}
          {t.late > 0 && <span className="ml-2 text-rose-300 font-semibold">· {t.late} vencido{t.late > 1 ? 's' : ''}</span>}
        </p>
      </div>

      {/* Pestañas */}
      <div className="grid grid-cols-2 gap-1 bg-white/[0.04] ring-1 ring-white/10 p-1 rounded-2xl mt-4" role="tablist">
        {([['meDeben', 'Me deben'], ['debo', 'Yo debo']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative py-2.5 rounded-xl text-sm font-bold ${tab === id ? 'text-brand-ink' : 'text-slate-300'}`}>
            {tab === id && <motion.span layoutId="ln-tab" className="absolute inset-0 rounded-xl bg-brand-lime" transition={{ type: 'spring', damping: 26, stiffness: 300 }} />}
            <span className="relative">{label}{countOf(id) ? ` · ${countOf(id)}` : ''}</span>
          </button>
        ))}
      </div>

      {/* Lista por persona */}
      <div className="mt-4 space-y-3">
        {groups.length === 0 && (
          <div className="text-center py-10">
            <div className="theme-dark w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#232C5A] to-[#0B1026] ring-1 ring-lime-300/30 flex items-center justify-center"><HandCoins size={36} className="text-brand-lime" /></div>
            <p className="text-white font-semibold mt-4">{tab === 'meDeben' ? 'Nadie te debe' : 'No le debes a nadie'}</p>
            <p className="text-slate-400 text-sm mt-1">{tab === 'meDeben' ? 'Anota lo que prestas: “Le presté a Juan para el almuerzo”.' : 'Anota lo que te prestan: “Mi hermana me prestó para el pasaje”.'}</p>
          </div>
        )}
        {groups.map(g => (
          <motion.div layout key={g.person} className="bg-surface border border-white/5 rounded-[26px] p-4">
            <div className="flex items-center gap-3">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-extrabold ${tab === 'meDeben' ? 'bg-brand-lime/15 text-brand-lime' : 'bg-amber-400/15 text-amber-300'}`}>{g.person.charAt(0).toUpperCase()}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{g.person}</p>
                <p className="text-[11px] text-slate-400">{g.loans.length} {g.loans.length === 1 ? 'préstamo' : 'préstamos'}</p>
              </div>
              <p className={`text-lg font-extrabold ${tab === 'meDeben' ? 'text-brand-lime' : 'text-amber-300'}`}>{formatCOP(g.left)}</p>
            </div>
            <div className="mt-3 space-y-2">
              {g.loans.map(l => {
                const pct = Math.round((paidOf(l) / l.amount) * 100);
                return (
                  <div key={l.id} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3">
                    <button onClick={() => setDetail(l)} className="w-full text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white text-sm font-semibold truncate">{l.reason || 'Préstamo'}</span>
                        <span className="text-white text-sm font-bold">{formatCOP(leftOf(l))}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] text-slate-400">
                        <span>{fmtDate(l.date)} · de {formatCOP(l.amount)}</span>
                        {l.due && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 ${isLate(l) ? 'bg-rose-500/15 text-rose-300' : 'bg-white/[0.07] text-slate-300'}`}><CalendarDays size={9} />{isLate(l) ? 'VENCIDO' : `para el ${fmtDate(l.due)}`}</span>}
                      </div>
                      {pct > 0 && <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden"><div className={`h-full rounded-full ${tab === 'meDeben' ? 'bg-brand-lime' : 'bg-amber-300'}`} style={{ width: `${pct}%` }} /></div>}
                    </button>
                    <div className="flex gap-2 mt-2.5">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPaying(l)} className="flex-1 h-10 rounded-xl bg-brand-lime text-brand-ink text-sm font-extrabold flex items-center justify-center gap-1.5"><Check size={15} strokeWidth={3} />{tab === 'meDeben' ? 'Me abonó' : 'Abonar'}</motion.button>
                      {tab === 'meDeben' && <motion.button whileTap={{ scale: 0.95 }} onClick={() => remind(l)} className="h-10 px-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white text-sm font-bold flex items-center gap-1.5"><MessageCircle size={15} className="text-brand-lime" /> Recordar</motion.button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {closed.length > 0 && (
          <div>
            <button onClick={() => setShowClosed(v => !v)} className="w-full flex items-center justify-between text-xs font-bold text-slate-400 tracking-wide py-2">
              <span>SALDADOS · {closed.length}</span><ChevronDown size={16} className={`transition-transform ${showClosed ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showClosed && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                  {closed.map(l => (
                    <button key={l.id} onClick={() => setDetail(l)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] ring-1 ring-white/5 text-left">
                      <span className="w-8 h-8 rounded-xl bg-brand-lime/15 text-brand-lime flex items-center justify-center"><Check size={16} strokeWidth={3} /></span>
                      <span className="flex-1 min-w-0"><span className="block text-sm text-white font-semibold truncate">{l.person} · {l.reason}</span><span className="block text-[11px] text-slate-400">{formatCOP(l.amount)} · {fmtDate(l.date)}</span></span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Botón nuevo */}
      <motion.button whileTap={{ scale: 0.93 }} onClick={() => setAdding(true)}
        className="fixed right-4 bottom-6 z-40 h-14 pl-5 pr-6 rounded-full bg-brand-lime text-brand-ink font-extrabold flex items-center gap-2 shadow-xl shadow-lime-400/25">
        <Plus size={22} strokeWidth={3} /> Nuevo préstamo
      </motion.button>

      <NewLoanSheet open={adding} initialDir={tab} onClose={() => setAdding(false)} onSaved={d => setTab(d)} />
      <PaySheet loan={paying} onClose={() => setPaying(null)} />
      <DetailSheet loan={detail} onClose={() => setDetail(null)} onPay={l => { setDetail(null); setPaying(l); }} />
    </div>
  );
}

// ═══ SECCIÓN: Nuevo préstamo ═══
function NewLoanSheet({ open, initialDir, onClose, onSaved }: { open: boolean; initialDir: LoanDir; onClose: () => void; onSaved: (d: LoanDir) => void }) {
  const [dir, setDir] = useState<LoanDir>(initialDir);
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('Pasaje');
  const [date, setDate] = useState(today());
  const [due, setDue] = useState('');
  const people = useMemo(() => (open ? knownPeople() : []), [open]);
  const reset = () => { setPerson(''); setAmount(0); setReason('Pasaje'); setDate(today()); setDue(''); };
  useEffect(() => { if (open) setDir(initialDir); }, [open, initialDir]);

  const save = () => {
    if (!person.trim()) return notify({ title: dir === 'meDeben' ? '¿Quién te debe?' : '¿A quién le debes?', type: 'info', log: false });
    if (amount <= 0) return notify({ title: '¿Cuánto fue?', type: 'info', log: false });
    addLoan({ dir, person, amount, reason, date, due: due || undefined });
    notify({ title: 'Préstamo guardado', message: dir === 'meDeben' ? `${person.trim()} te debe ${formatCOP(amount)}` : `Le debes ${formatCOP(amount)} a ${person.trim()}`, type: 'success' });
    onSaved(dir); reset(); onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Nuevo préstamo" subtitle="Solo se guarda en tu celular" icon={<HandCoins size={20} />} labelId="ln-new">
      <div className="grid grid-cols-2 gap-2">
        {([['meDeben', 'Me deben', 'Yo presté', ArrowDownLeft], ['debo', 'Yo debo', 'Me prestaron', ArrowUpRight]] as const).map(([id, label, sub, Icon]) => (
          <button key={id} onClick={() => setDir(id)} aria-pressed={dir === id}
            className={`flex items-center gap-2.5 p-3 rounded-2xl text-left border ${dir === id ? 'bg-brand-lime/10 border-brand-lime/50' : 'bg-white/[0.04] border-white/10'}`}>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${dir === id ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] text-slate-300'}`}><Icon size={18} /></span>
            <span><span className="block text-white text-sm font-bold">{label}</span><span className="block text-[10px] text-slate-400">{sub}</span></span>
          </button>
        ))}
      </div>

      <label className="block mt-4 text-xs font-semibold text-slate-300">{dir === 'meDeben' ? '¿Quién te debe?' : '¿A quién le debes?'}
        <input value={person} onChange={e => setPerson(e.target.value)} maxLength={40} placeholder="Ej: Juan, mi hermana, Carolina…"
          className="mt-1 w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-base outline-none focus:border-brand-lime" />
      </label>
      {people.length > 0 && <div className="flex gap-1.5 flex-wrap mt-2">{people.map(p => <button key={p} onClick={() => setPerson(p)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${person === p ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] text-slate-200 ring-1 ring-white/10'}`}>{p}</button>)}</div>}

      <p className="mt-4 text-xs font-semibold text-slate-300">¿Cuánto?</p>
      <MoneyInput value={amount} onChange={setAmount} prefix ariaLabel="Valor del préstamo" className="mt-1 w-full h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xl font-bold outline-none focus:border-brand-lime" />

      <p className="mt-4 text-xs font-semibold text-slate-300">¿Para qué fue?</p>
      <div className="flex gap-1.5 flex-wrap mt-1.5">
        {REASONS.map(r => <button key={r} onClick={() => setReason(r)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${reason === r ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] text-slate-200 ring-1 ring-white/10'}`}>{r}</button>)}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <label className="text-xs font-semibold text-slate-300">Fecha
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full h-12 px-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-lime" />
        </label>
        <label className="text-xs font-semibold text-slate-300">¿Para cuándo? <span className="text-slate-500 font-normal">(opcional)</span>
          <input type="date" value={due} onChange={e => setDue(e.target.value)} className="mt-1 w-full h-12 px-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-lime" />
        </label>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={save} className="mt-5 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2"><Check size={19} strokeWidth={3} /> Guardar</motion.button>
    </BottomSheet>
  );
}

// ═══ SECCIÓN: Abonar ═══
function PaySheet({ loan, onClose }: { loan: Loan | null; onClose: () => void }) {
  const left = loan ? leftOf(loan) : 0;
  const [amount, setAmount] = useState(0);
  useEffect(() => { if (loan) setAmount(leftOf(loan)); }, [loan]);
  const pay = () => {
    if (!loan || amount <= 0) return;
    addPayment(loan.id, amount);
    const rest = left - Math.min(amount, left);
    notify({ title: rest === 0 ? '¡Saldado! 🎉' : 'Abono guardado', message: rest === 0 ? `${loan.person} y tú quedaron a paz y salvo por ${loan.reason.toLowerCase()}.` : `Quedan ${formatCOP(rest)} pendientes.`, type: 'success' });
    onClose();
  };
  return (
    <BottomSheet open={!!loan} onClose={onClose} title={loan?.dir === 'meDeben' ? `${loan?.person ?? ''} te abonó` : `Abonar a ${loan?.person ?? ''}`} subtitle={loan ? `${loan.reason} · faltan ${formatCOP(left)}` : ''} icon={<Check size={20} strokeWidth={3} />} labelId="ln-pay">
      <MoneyInput value={amount} onChange={setAmount} prefix ariaLabel="Valor del abono" className="w-full h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xl font-bold outline-none focus:border-brand-lime" />
      <div className="flex gap-2 mt-2">
        <button onClick={() => setAmount(left)} className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/[0.07] text-slate-200 ring-1 ring-white/10">Todo ({formatCOP(left)})</button>
        <button onClick={() => setAmount(Math.round(left / 2))} className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/[0.07] text-slate-200 ring-1 ring-white/10">La mitad</button>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={pay} className="mt-5 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">{amount >= left ? 'Marcar como saldado' : `Abonar ${formatCOP(amount)}`}</motion.button>
    </BottomSheet>
  );
}

// ═══ SECCIÓN: Detalle (abonos, deshacer, borrar) ═══
function DetailSheet({ loan, onClose, onPay }: { loan: Loan | null; onClose: () => void; onPay: (l: Loan) => void }) {
  if (!loan) return <BottomSheet open={false} onClose={onClose} title="">{null}</BottomSheet>;
  const del = async () => { if (await askConfirm({ title: `¿Borrar este préstamo con ${loan.person}?`, icon: 'trash', tone: 'danger', confirmText: 'Sí, borrar' })) { removeLoan(loan.id); onClose(); } };
  return (
    <BottomSheet open={!!loan} onClose={onClose} title={`${loan.person} · ${loan.reason}`} subtitle={`${loan.dir === 'meDeben' ? 'Te debe' : 'Le debes'} ${formatCOP(leftOf(loan))} de ${formatCOP(loan.amount)}`} icon={<HandCoins size={20} />} labelId="ln-detail">
      <p className="text-xs font-bold text-slate-400 tracking-wide mb-2">HISTORIAL</p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm p-2.5 rounded-xl bg-white/[0.04]"><span className="text-slate-300">{fmtDate(loan.date)} · Préstamo</span><span className="text-white font-bold">{formatCOP(loan.amount)}</span></div>
        {loan.payments.map(p => <div key={p.id} className="flex justify-between text-sm p-2.5 rounded-xl bg-white/[0.04]"><span className="text-slate-300">{fmtDate(p.date)} · Abono</span><span className="text-brand-lime font-bold">− {formatCOP(p.amount)}</span></div>)}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {!isClosed(loan) && <button onClick={() => onPay(loan)} className="h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold col-span-2">Registrar abono</button>}
        {loan.payments.length > 0 && <button onClick={() => { undoLastPayment(loan.id); onClose(); }} className="h-11 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-sm font-bold flex items-center justify-center gap-1.5"><Undo2 size={15} /> Deshacer abono</button>}
        <button onClick={del} className="h-11 rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/30 text-rose-300 text-sm font-bold flex items-center justify-center gap-1.5"><Trash2 size={15} /> Borrar</button>
      </div>
    </BottomSheet>
  );
}
