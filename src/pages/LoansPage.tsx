/**
 * ════════════════════════════════════════════════════════════════════
 * 🤝 PANTALLA PRÉSTAMOS ("Me deben" / "Yo debo")
 * ────────────────────────────────────────────────────────────────────
 * Para las deudas pequeñas con personas, aparte de Pagos: "me prestaron para el
 * pasaje", "le presté a Juan para el almuerzo".
 *   • Arriba: cuánto te deben y cuánto debes.
 *   • Pestañas Me deben / Yo debo, agrupado por persona, con anillo de % pagado.
 *   • 🟢 "Me abonó / Abonar" (la deuda baja) · 🔴 "Le presté más / Me prestó más" (sube).
 *     Cada movimiento con fecha, hora y nota; el saldo se recalcula solo.
 *   • Historial: gráfica + línea de tiempo de colores + "Estado de cuenta" (imagen o texto) por WhatsApp.
 *   • Recordar por WhatsApp (abre WhatsApp con un mensaje amable).
 *   • Botón "Nuevo préstamo" abajo.
 * Datos: services/loansService.ts (solo en el celular, cifrado).
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { enableReminders, remindersSupported, requestBillCheck } from '../services/alertsService';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, HandCoins, ArrowDownLeft, ArrowUpRight, MessageCircle, Check, Trash2, Undo2, ChevronDown, CalendarDays, Delete, History, Share2 } from 'lucide-react';
import Kai from '../components/assistant/Kai';
import { PaidRing, BalanceChart, Timeline, statementImage, GREEN, RED } from '../components/loans/LoanVisuals';
import ModuleHeader from '../components/ui/ModuleHeader';
import { usePageTour } from '../components/tour/Tour';
import BottomSheet from '../components/ui/BottomSheet';
import MoneyInput from '../components/ui/MoneyInput';
import { askConfirm } from '../components/ui/ConfirmDialog';
import { notify } from '../services/notificationService';
import { formatCOP } from '../utils/format';
import {
  useLoans, addLoan, addPayment, addMore, removeLoan, undoLastPayment, knownPeople, loanTotals, byPerson, leftOf, paidOf, extraOf, totalOf, pctPaid, isClosed, isLate,
  reminderText, statementText, loanHistory, monthFlow, REASONS, today, type Loan, type LoanDir,
} from '../services/loansService';

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

export default function LoansPage() {
  const loans = useLoans();
  const [tab, setTab] = useState<LoanDir>('meDeben');
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState<{ loan: Loan; kind: 'abono' | 'mas' } | null>(null);
  const [detail, setDetail] = useState<Loan | null>(null);
  // Desde un aviso: /prestamos?abonar=<id> abre "Abonar" · /prestamos?ver=<id> abre el detalle
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const id = params.get('abonar') || params.get('ver');
    if (!id) return;
    const l = loans.find(x => x.id === id);
    if (l) { setTab(l.dir); if (params.get('abonar')) setPaying({ loan: l, kind: 'abono' }); else setDetail(l); }
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const [showClosed, setShowClosed] = useState(false);
  const t = loanTotals(loans);

  usePageTour('prestamos', [
    { target: 'ln-summary', title: 'Tus cuentas con personas', text: 'Aquí ves cuánto te deben y cuánto debes a amigos y familia. Es aparte de tus pagos fijos y créditos.' },
    { target: 'ln-tabs', title: 'Me deben · Yo debo', text: '"Me deben" es lo que tú prestaste. "Yo debo" es lo que te prestaron, por ejemplo para el pasaje.' },
    { target: 'ln-list', title: 'Verde baja, rojo sube', text: 'Toca 🟢 "Me abonó" cuando te paguen (la deuda baja) o 🔴 "Le presté más" si le prestas otra vez (sube). Cada movimiento queda con fecha y hora en el historial, que puedes enviar por WhatsApp.' },
    { target: 'ln-new', title: 'Anota un préstamo', text: 'Elige si te deben o debes, con quién, cuánto y para qué. Si pones para cuándo, se marca como vencido cuando pase la fecha.' },
  ]);

  const open = loans.filter(l => l.dir === tab && !isClosed(l));
  const closed = loans.filter(l => l.dir === tab && isClosed(l));
  const groups = useMemo(() => byPerson(open), [open]);
  const countOf = (d: LoanDir) => loans.filter(l => l.dir === d && !isClosed(l)).length;

  const remind = (l: Loan) => window.open(`https://wa.me/?text=${encodeURIComponent(reminderText(l, formatCOP))}`, '_blank', 'noopener,noreferrer');

  return (
    <div className="pb-32">
      <ModuleHeader module="prestamos" />

      {/* Resumen */}
      <div data-tour="ln-summary" className="theme-dark relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20">
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
      <div data-tour="ln-tabs" className="grid grid-cols-2 gap-1 bg-white/[0.04] ring-1 ring-white/10 p-1 rounded-2xl mt-4" role="tablist">
        {([['meDeben', 'Me deben'], ['debo', 'Yo debo']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative py-2.5 rounded-xl text-sm font-bold ${tab === id ? 'text-brand-ink' : 'text-slate-300'}`}>
            {tab === id && <motion.span layoutId="ln-tab" className="absolute inset-0 rounded-xl bg-brand-lime" transition={{ type: 'spring', damping: 26, stiffness: 300 }} />}
            <span className="relative">{label}{countOf(id) ? ` · ${countOf(id)}` : ''}</span>
          </button>
        ))}
      </div>

      {/* Este mes: verde lo abonado, rojo lo prestado */}
      {(() => { const f = monthFlow(loans, tab); return (f.abonado > 0 || f.prestado > 0) && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-2xl px-3 py-2.5" style={{ background: `${GREEN}17`, border: `1px solid ${GREEN}55` }}><p className="text-[10px] font-extrabold tracking-wide" style={{ color: GREEN }}>↓ ABONADO ESTE MES</p><p className="text-white font-extrabold text-[17px]">{formatCOP(f.abonado)}</p></div>
          <div className="rounded-2xl px-3 py-2.5" style={{ background: `${RED}17`, border: `1px solid ${RED}55` }}><p className="text-[10px] font-extrabold tracking-wide" style={{ color: RED }}>↑ PRESTADO ESTE MES</p><p className="text-white font-extrabold text-[17px]">{formatCOP(f.prestado)}</p></div>
        </div>
      ); })()}

      {/* Lista por persona */}
      <div data-tour="ln-list" className="mt-4 space-y-3">
        {groups.length === 0 && (
          <div className="text-center py-10">
            <div className="theme-dark w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#232C5A] to-[#0B1026] ring-1 ring-lime-300/30 flex items-center justify-center"><HandCoins size={36} className="text-brand-lime" /></div>
            <p className="text-white font-semibold mt-4">{tab === 'meDeben' ? 'Nadie te debe' : 'No le debes a nadie'}</p>
            <p className="text-slate-400 text-sm mt-1">{tab === 'meDeben' ? 'Anota lo que prestas: “Le presté a Juan para el almuerzo”.' : 'Anota lo que te prestan: “Mi hermana me prestó para el pasaje”.'}</p>
          </div>
        )}
        {groups.map(g => {
          const total = g.loans.reduce((a, l) => a + totalOf(l), 0), paid = g.loans.reduce((a, l) => a + paidOf(l), 0), extra = g.loans.reduce((a, l) => a + extraOf(l), 0);
          const gp = total ? Math.round((paid / total) * 100) : 0;
          const ringCol = g.loans.some(isLate) ? '#FCD34D' : GREEN;
          return (
          <motion.div layout key={g.person} className="rounded-[26px] p-4 bg-gradient-to-br from-[#18204A] to-[#10173A] border border-white/[0.07]">
            <div className="flex items-center gap-3">
              <PaidRing pct={gp} size={66} color={ringCol}><span className="text-white font-extrabold text-lg">{g.person.charAt(0).toUpperCase()}</span></PaidRing>
              <div className="flex-1 min-w-0">
                <p className="text-white font-extrabold truncate">{g.person}</p>
                <p className="text-[11px] text-slate-400">{gp > 0 ? `${tab === 'meDeben' ? 'Pagó' : 'Pagaste'} ${gp}%` : 'Sin abonos aún'} · {g.loans.length} {g.loans.length === 1 ? 'préstamo' : 'préstamos'}</p>
                <p className={`text-[22px] font-extrabold leading-tight ${tab === 'meDeben' ? 'text-brand-lime' : 'text-amber-300'}`}>{formatCOP(g.left)}</p>
              </div>
            </div>
            {(paid > 0 || extra > 0) && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {paid > 0 && <span className="text-[10.5px] font-extrabold px-2 py-1 rounded-full" style={{ background: `${GREEN}22`, color: GREEN }}>↓ {formatCOP(paid)} abonado</span>}
                {extra > 0 && <span className="text-[10.5px] font-extrabold px-2 py-1 rounded-full" style={{ background: `${RED}22`, color: RED }}>↑ {formatCOP(extra)} más</span>}
              </div>
            )}
            <div className="mt-3 space-y-2">
              {g.loans.map(l => (
                <div key={l.id} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3">
                  <button onClick={() => setDetail(l)} className="w-full text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white text-sm font-bold truncate">{l.reason || 'Préstamo'}</span>
                      <span className="text-white text-sm font-extrabold">{formatCOP(leftOf(l))}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] text-slate-400">
                      <span>{fmtDate(l.date)} · prestado {formatCOP(totalOf(l))}{extraOf(l) > 0 && <span style={{ color: RED }}> (+{formatCOP(extraOf(l))} después)</span>}</span>
                      {l.due && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 ${isLate(l) ? 'bg-rose-500/15 text-rose-300' : 'bg-white/[0.07] text-slate-300'}`}><CalendarDays size={9} />{isLate(l) ? 'VENCIDO' : `para el ${fmtDate(l.due)}`}</span>}
                    </div>
                    {pctPaid(l) > 0 && <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pctPaid(l)}%`, background: GREEN }} /></div>}
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPaying({ loan: l, kind: 'abono' })} className="h-10 rounded-xl text-[#052e16] text-[13px] font-extrabold flex items-center justify-center gap-1" style={{ background: GREEN }}>↓ {tab === 'meDeben' ? 'Me abonó' : 'Abonar'}</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPaying({ loan: l, kind: 'mas' })} className="h-10 rounded-xl text-[#fff] text-[13px] font-extrabold flex items-center justify-center gap-1" style={{ background: RED }}>↑ {tab === 'meDeben' ? 'Le presté más' : 'Me prestó más'}</motion.button>
                    <button onClick={() => setDetail(l)} className="h-9 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5"><History size={14} /> Historial</button>
                    {tab === 'meDeben'
                      ? <button onClick={() => remind(l)} className="h-9 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5"><MessageCircle size={14} className="text-brand-lime" /> Recordar</button>
                      : <button onClick={() => shareStatement(l)} className="h-9 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5"><Share2 size={14} /> Estado de cuenta</button>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          );
        })}

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
                      <span className="flex-1 min-w-0"><span className="block text-sm text-white font-semibold truncate">{l.person} · {l.reason}</span><span className="block text-[11px] text-slate-400">{formatCOP(totalOf(l))} · {fmtDate(l.date)}</span></span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Botón nuevo */}
      <motion.button data-tour="ln-new" whileTap={{ scale: 0.93 }} onClick={() => setAdding(true)}
        className="fixed right-4 bottom-6 z-40 h-14 pl-5 pr-6 rounded-full bg-brand-lime text-brand-ink font-extrabold flex items-center gap-2 shadow-xl shadow-lime-400/25">
        <Plus size={22} strokeWidth={3} /> Nuevo préstamo
      </motion.button>

      <NewLoanSheet open={adding} initialDir={tab} onClose={() => setAdding(false)} onSaved={d => setTab(d)} />
      <MoveSheet move={paying} onClose={() => setPaying(null)} />
      <DetailSheet loan={detail && (loans.find(x => x.id === detail.id) ?? detail)} onClose={() => setDetail(null)} onMove={(l, kind) => { setDetail(null); setPaying({ loan: l, kind }); }} />
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
    // Con fecha: ofrecer los avisos del celular (una sola vez se pide el permiso)
    if (due && remindersSupported() && Notification.permission === 'default') {
      enableReminders().then(p => { if (p === 'granted') { notify({ title: 'Te avisaremos 🔔', message: dir === 'debo' ? 'Antes de que se venza tu pago.' : 'Cuando sea hora de cobrar.', type: 'success' }); requestBillCheck(); } });
    } else if (due) requestBillCheck();
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

/** Comparte el estado de cuenta como imagen (si el celular puede) o como texto por WhatsApp. */
async function shareStatement(l: Loan, asText = false) {
  const text = statementText(l, formatCOP);
  if (!asText) {
    try {
      const blob = await statementImage(l);
      if (blob) {
        const file = new File([blob], `estado-de-cuenta-${l.person.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Estado de cuenta', text: `Estado de cuenta · ${l.person}` }); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        notify({ title: 'Imagen descargada', message: 'Búscala en tus descargas y envíala por WhatsApp.', type: 'success', log: false });
        return;
      }
    } catch (e) { if ((e as Error)?.name === 'AbortError') return; }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

// ═══ SECCIÓN: Registrar movimiento (🟢 abono / 🔴 más prestado) ═══
const nowTime = () => new Date().toTimeString().slice(0, 5);
function MoveSheet({ move, onClose }: { move: { loan: Loan; kind: 'abono' | 'mas' } | null; onClose: () => void }) {
  const loan = move?.loan ?? null;
  const [kind, setKind] = useState<'abono' | 'mas'>('abono');
  const [digits, setDigits] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  useEffect(() => { if (move) { setKind(move.kind); setDigits(''); setDate(today()); setTime(nowTime()); setNote(''); setShowNote(false); } }, [move]);
  if (!loan) return <BottomSheet open={false} onClose={onClose} title="">{null}</BottomSheet>;
  const left = leftOf(loan), meDeben = loan.dir === 'meDeben';
  const raw = Number(digits || 0);
  const amount = kind === 'abono' ? Math.min(raw, left) : raw;
  const after = kind === 'abono' ? left - amount : left + amount;
  const col = kind === 'abono' ? GREEN : RED;
  const press = (k: string) => setDigits(d => (k === '⌫' ? d.slice(0, -1) : (d + k).replace(/^0+/, '').slice(0, 10)));
  const save = () => {
    if (amount <= 0) return notify({ title: '¿Cuánto fue?', type: 'info', log: false });
    const at = new Date(`${date}T${time || '12:00'}`).getTime() || Date.now();
    if (kind === 'abono') addPayment(loan.id, amount, date, note, at); else addMore(loan.id, amount, date, note, at);
    notify(kind === 'abono'
      ? { title: after === 0 ? '¡Saldado! 🎉' : 'Abono guardado 🟢', message: after === 0 ? `${loan.person} y tú quedaron a paz y salvo.` : `Quedan ${formatCOP(after)} pendientes.`, type: 'success' }
      : { title: 'Préstamo sumado 🔴', message: `Ahora ${meDeben ? `${loan.person} te debe` : `le debes a ${loan.person}`} ${formatCOP(after)}.`, type: 'success' });
    onClose();
  };
  const barMax = Math.max(left, after, 1);
  const opts: ['abono' | 'mas', string, string, string][] = [['abono', '↓', meDeben ? 'Me abonó' : 'Abonar', 'La deuda baja'], ['mas', '↑', meDeben ? 'Le presté más' : 'Me prestó más', 'La deuda sube']];
  return (
    <BottomSheet open onClose={onClose} title={`¿Qué pasó con ${loan.person}?`} subtitle={`${loan.reason} · ${meDeben ? 'te debe' : 'le debes'} ${formatCOP(left)}`} icon={<HandCoins size={20} />} labelId="ln-move">
      <div className="grid grid-cols-2 gap-2">
        {opts.map(([k, ic, t, d]) => {
          const on = kind === k, c = k === 'abono' ? GREEN : RED;
          return (
            <motion.button key={k} whileTap={{ scale: 0.96 }} onClick={() => setKind(k)} aria-pressed={on} className="rounded-2xl p-3 text-left"
              style={on ? { background: c, color: k === 'abono' ? '#052e16' : '#fff' } : { background: `${c}1c`, border: `1.5px solid ${c}66` }}>
              <span className="block text-[22px] font-black leading-none" style={on ? undefined : { color: c }}>{ic}</span>
              <span className={`block text-[14px] font-extrabold mt-1 ${on ? '' : 'text-white'}`}>{t}</span>
              <span className={`block text-[10.5px] font-bold ${on ? 'opacity-80' : 'text-slate-400'}`}>{d}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="text-center text-[38px] font-extrabold mt-3 leading-none" style={{ color: col }} aria-live="polite">{kind === 'abono' ? '−' : '+'}{formatCOP(amount)}</p>
      {kind === 'abono' && raw > left && <p className="text-center text-[11px] text-amber-300 font-bold mt-1">Solo faltan {formatCOP(left)}: se guarda eso.</p>}
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden flex mt-3" aria-hidden="true">
        <div className="h-full bg-brand-lime transition-all" style={{ width: `${(Math.min(left, after) / barMax) * 100}%` }} />
        <div className="h-full transition-all" style={{ width: `${(Math.abs(after - left) / barMax) * 100}%`, background: col, opacity: 0.75 }} />
      </div>
      <div className="flex justify-between text-[12px] font-bold mt-1.5"><span className="text-slate-400">Antes {formatCOP(left)}</span><span className="text-white">Queda <b className="text-brand-lime">{formatCOP(after)}</b></span></div>
      {kind === 'abono' && <div className="flex gap-1.5 mt-2">
        <button onClick={() => setDigits(String(left))} className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/[0.07] text-slate-200 ring-1 ring-white/10">Todo</button>
        <button onClick={() => setDigits(String(Math.round(left / 2)))} className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/[0.07] text-slate-200 ring-1 ring-white/10">La mitad</button>
      </div>}
      <div className="grid grid-cols-3 gap-1.5 mt-2.5">
        <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} aria-label="Fecha" className="h-10 px-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-[12px] font-bold outline-none focus:border-brand-lime" />
        <input type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="Hora" className="h-10 px-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-[12px] font-bold outline-none focus:border-brand-lime" />
        <button onClick={() => setShowNote(v => !v)} className={`h-10 rounded-xl text-[12px] font-bold ${note ? 'bg-brand-lime/15 text-brand-lime' : 'bg-white/[0.06] text-slate-300'} ring-1 ring-white/10`}>📝 Nota</button>
      </div>
      {showNote && <input value={note} onChange={e => setNote(e.target.value)} maxLength={80} placeholder='Ej: "por Nequi", "para los pasajes"' autoFocus className="mt-2 w-full h-11 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm outline-none focus:border-brand-lime" />}
      <div className="grid grid-cols-3 gap-1.5 mt-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'].map(k => (
          <motion.button key={k} whileTap={{ scale: 0.92 }} onClick={() => press(k)} aria-label={k === '⌫' ? 'Borrar' : k} className="h-12 rounded-xl bg-white/[0.07] text-white text-[20px] font-extrabold flex items-center justify-center">{k === '⌫' ? <Delete size={20} /> : k}</motion.button>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={save} className="mt-3 w-full h-14 rounded-2xl font-extrabold flex items-center justify-center gap-2" style={{ background: col, color: kind === 'abono' ? '#052e16' : '#fff' }}>
        {kind === 'abono' ? (after === 0 && amount > 0 ? '¡Marcar como saldado! 🎉' : 'Guardar abono ✓') : 'Sumar al préstamo ↑'}
      </motion.button>
    </BottomSheet>
  );
}

// ═══ SECCIÓN: Historial (gráfica + línea de tiempo + estado de cuenta) ═══
function DetailSheet({ loan, onClose, onMove }: { loan: Loan | null; onClose: () => void; onMove: (l: Loan, kind: 'abono' | 'mas') => void }) {
  const [filter, setFilter] = useState<'todo' | 'abono' | 'mas'>('todo');
  useEffect(() => { setFilter('todo'); }, [loan?.id]);
  if (!loan) return <BottomSheet open={false} onClose={onClose} title="">{null}</BottomSheet>;
  const meDeben = loan.dir === 'meDeben';
  const events = loanHistory(loan);
  const shown = filter === 'todo' ? events : events.filter(e => e.kind === filter || e.kind === 'inicio');
  const del = async () => { if (await askConfirm({ title: `¿Borrar este préstamo con ${loan.person}?`, icon: 'trash', tone: 'danger', confirmText: 'Sí, borrar' })) { removeLoan(loan.id); onClose(); } };
  const undo = async () => {
    const last = loan.payments[loan.payments.length - 1]; if (!last) return;
    if (await askConfirm({ title: `¿Deshacer ${last.kind === 'mas' ? 'el préstamo adicional' : 'el abono'} de ${formatCOP(last.amount)}?`, icon: 'trash', confirmText: 'Sí, deshacer' })) undoLastPayment(loan.id);
  };
  const chip = (id: typeof filter, label: string, c: string) => (
    <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id} className="text-[11.5px] font-extrabold px-3 py-1.5 rounded-full" style={filter === id ? { background: c, color: id === 'abono' ? '#052e16' : id === 'todo' ? '#0B1026' : '#fff' } : { background: `${c}1f`, color: c }}>{label}</button>
  );
  return (
    <BottomSheet open onClose={onClose} title={`${loan.person} · ${loan.reason}`} subtitle={meDeben ? 'Te debe' : 'Le debes'} icon={<History size={20} />} labelId="ln-detail">
      <div className="flex items-center gap-3">
        <PaidRing pct={pctPaid(loan)} size={88} color={isClosed(loan) ? GREEN : isLate(loan) ? '#FCD34D' : GREEN}>
          <span className="text-white font-extrabold text-[17px] leading-none">{pctPaid(loan)}%</span><span className="text-[9px] text-slate-400 font-bold">pagado</span>
        </PaidRing>
        <div className="flex-1 min-w-0">
          <p className="text-[30px] font-extrabold leading-none text-brand-lime">{formatCOP(leftOf(loan))}</p>
          <p className="text-[11.5px] text-slate-400 mt-1">Prestado {formatCOP(totalOf(loan))} · Abonado <span style={{ color: GREEN }}>{formatCOP(paidOf(loan))}</span></p>
          {extraOf(loan) > 0 && <p className="text-[11.5px]" style={{ color: RED }}>Incluye {formatCOP(extraOf(loan))} prestados después</p>}
        </div>
        {isClosed(loan) && <Kai mood="celebra" size={56} />}
      </div>
      {events.length > 1 && <div className="mt-3 rounded-2xl bg-white/[0.04] px-1 pt-1"><BalanceChart events={events} /></div>}
      <div className="flex gap-1.5 mt-3">{chip('todo', 'Todo', '#E2E8F0')}{chip('abono', '↓ Abonos', GREEN)}{chip('mas', '↑ Préstamos', RED)}</div>
      <Timeline events={shown} meDeben={meDeben} />
      {events.some(e => e.kind !== 'inicio' && !e.at) && <p className="text-[10.5px] text-slate-500 -mt-1 mb-2">Los movimientos anteriores a esta versión no tienen hora.</p>}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {!isClosed(loan) && <button onClick={() => onMove(loan, 'abono')} className="h-11 rounded-2xl font-extrabold text-[#052e16] text-sm" style={{ background: GREEN }}>↓ {meDeben ? 'Me abonó' : 'Abonar'}</button>}
        <button onClick={() => onMove(loan, 'mas')} className={`h-11 rounded-2xl font-extrabold text-[#fff] text-sm ${isClosed(loan) ? 'col-span-2' : ''}`} style={{ background: RED }}>↑ {meDeben ? 'Le presté más' : 'Me prestó más'}</button>
        <button onClick={() => shareStatement(loan)} className="h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold col-span-2 flex items-center justify-center gap-2"><Share2 size={17} /> Enviar estado de cuenta</button>
        <button onClick={() => shareStatement(loan, true)} className="h-10 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-[12.5px] font-bold col-span-2 flex items-center justify-center gap-1.5"><MessageCircle size={14} className="text-brand-lime" /> Enviar como texto por WhatsApp</button>
        {loan.payments.length > 0 && <button onClick={undo} className="h-11 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white text-sm font-bold flex items-center justify-center gap-1.5"><Undo2 size={15} /> Deshacer último</button>}
        <button onClick={del} className={`h-11 rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/30 text-rose-300 text-sm font-bold flex items-center justify-center gap-1.5 ${loan.payments.length ? '' : 'col-span-2'}`}><Trash2 size={15} /> Borrar</button>
      </div>
    </BottomSheet>
  );
}
