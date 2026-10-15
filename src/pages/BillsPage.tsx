import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Pencil, Trash2, Undo2, CheckCircle2, AlertCircle } from 'lucide-react';
import { db, type Bill, type Owner } from '../utils/database';
import { loadBillStatuses, payBill, unpayBill, describeDue, OWNER_LABEL, periodOf, googleCalendarLink, buildICS, type BillStatus } from '../services/billsService';
import { formatCOP, todayISO } from '../utils/format';
import { notify } from '../services/notificationService';
import BillForm from '../components/bills/BillForm';
import MoneyInput from '../components/ui/MoneyInput';
import ModuleHeader from '../components/ui/ModuleHeader';
import { usePageTour } from '../components/tour/Tour';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const STATE_STYLE: Record<BillStatus['state'], { dot: string; text: string }> = {
  pagado: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  vencido: { dot: 'bg-red-500', text: 'text-red-400' },
  hoy: { dot: 'bg-amber-400', text: 'text-amber-300' },
  pronto: { dot: 'bg-amber-400', text: 'text-amber-300' },
  pendiente: { dot: 'bg-violet-400', text: 'text-slate-400' },
};

export default function BillsPage() {
  const today = new Date();
  const [ref, setRef] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [statuses, setStatuses] = useState<BillStatus[]>([]);
  const [debts, setDebts] = useState<Bill[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  usePageTour('pagos', [
    { target: 'bills-add', title: 'Agrega tus pagos del mes', text: 'Arriendo, servicios, tarjetas de crédito o créditos. Lo registras una vez y se programa solo todos los meses.' },
    { target: 'bills-calendar', title: 'Tu calendario de pagos', text: 'Cada punto es un pago: rojo vencido, amarillo pronto, morado pendiente y verde pagado. Toca un día para ver qué vence. Desliza para cambiar de mes.' },
    { target: 'bills-export', title: 'Recordatorios en tu celular', text: 'Agrega todos tus pagos al calendario del celular: te avisará un día antes y el mismo día, aunque no abras la app.' },
  ]);
  const [owner, setOwner] = useState<'todos' | Owner>('todos');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [paying, setPaying] = useState<BillStatus | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [askedLater, setAskedLater] = useState<Set<string>>(new Set());

  const isCurrentMonth = periodOf(ref) === periodOf(today);
  // Para el mes actual se calcula con la fecha de hoy; para otros meses, con el día 1.
  const refDate = isCurrentMonth ? today : ref;

  const reload = useCallback(async () => {
    setStatuses(await loadBillStatuses(refDate));
    setDebts((await db.bills.where('kind').equals('deuda').toArray()));
    window.dispatchEvent(new Event('mf:data-changed'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  useEffect(() => { reload(); }, [reload]);

  const visible = useMemo(() => statuses.filter(s => owner === 'todos' || s.bill.owner === owner), [statuses, owner]);
  const total = visible.reduce((s, x) => s + (x.payment?.amount ?? x.bill.amount), 0);
  const paidTotal = visible.filter(x => x.paid).reduce((s, x) => s + (x.payment?.amount ?? 0), 0);
  const pct = total > 0 ? Math.round((paidTotal / total) * 100) : 0;

  const overdue = visible.filter(s => s.state === 'vencido' && !askedLater.has(s.bill.id));
  const upcoming = visible.filter(s => !s.paid && s.state !== 'vencido');
  const paid = visible.filter(s => s.paid);
  const dayList = selectedDay ? visible.filter(s => s.dueDate.getDate() === selectedDay) : [];

  // Cuadrícula del calendario (lunes primero)
  const year = ref.getFullYear(), month = ref.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const byDay = (d: number) => visible.filter(s => s.dueDate.getDate() === d);

  const [dir, setDir] = useState(0);
  const changeMonth = (delta: number) => { setDir(delta); setRef(new Date(year, month + delta, 1)); setSelectedDay(null); };

  const exportAll = () => {
    const blob = new Blob([buildICS(statuses.map(s => s.bill))], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mis-pagos-mi-finanzas.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    notify({ title: 'Recordatorios listos', message: 'Abre el archivo para agregarlos a tu calendario: te avisará un día antes y el mismo día.', type: 'success', duration: 6000 });
  };

  const saveBill = async (data: Omit<Bill, 'id' | 'createdAt' | 'active'>) => {
    if (editing) {
      await db.bills.update(editing.id, { ...data, active: true });
      notify({ title: 'Pago actualizado', message: data.name, type: 'success' });
    } else {
      const bill: Bill = { ...data, id: crypto.randomUUID(), createdAt: Date.now(), active: true };
      await db.bills.add(bill);
      setJustAdded(bill.id);
      // Si el día de pago de este mes ya pasó, pregunta si ya se pagó (para no marcarlo vencido sin razón).
      if (bill.dueDay < today.getDate() && window.confirm(`El día ${bill.dueDay} ya pasó este mes. ¿Ya pagaste "${bill.name}" este mes?`)) {
        // Queda pagado este mes y se registra como gasto para que el balance cuadre.
        await db.billPayments.add({ id: crypto.randomUUID(), billId: bill.id, period: periodOf(today), amount: bill.amount, paidAt: Date.now() });
        await db.transactions.add({ id: crypto.randomUUID(), date: todayISO(), type: 'expense', amount: bill.amount, category: bill.category, description: bill.name, createdAt: Date.now() });
      }
      notify({ title: 'Pago guardado', message: `${bill.name} · cada día ${bill.dueDay}`, type: 'success' });
    }
    setFormOpen(false); setEditing(null); reload();
  };

  const confirmPay = async () => {
    if (!paying || !payAmount) return;
    await payBill(paying.bill, payAmount, refDate);
    notify({ title: 'Pago registrado', message: `${paying.bill.name}: ${formatCOP(payAmount)} quedó como gasto en Finanzas`, type: 'success' });
    setPaying(null); reload();
  };

  const removeBill = async (b: Bill) => {
    if (!window.confirm(`¿Eliminar "${b.name}"? Los gastos ya registrados se conservan.`)) return;
    await db.bills.delete(b.id);
    notify({ title: 'Pago eliminado', message: b.name, type: 'info' });
    reload();
  };

  const undo = async (s: BillStatus) => { await unpayBill(s); notify({ title: 'Pago desmarcado', message: s.bill.name, type: 'info' }); reload(); };

  const row = (s: BillStatus, i: number) => (
    <motion.div key={s.bill.id} layout initial={s.bill.id === justAdded ? { opacity: 0, scale: 0.8, y: -20 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={s.bill.id === justAdded ? { type: 'spring', damping: 12, stiffness: 200 } : { delay: i * 0.04 }}
      className={`bg-[#111827] border rounded-2xl p-3 flex items-center gap-3 ${s.bill.id === justAdded ? 'border-amber-400/70 shadow-lg shadow-amber-500/20' : 'border-white/5'}`}>
      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${s.paid ? 'bg-emerald-500/15' : s.state === 'vencido' ? 'bg-red-500/15' : 'bg-white/5'}`}>
        <span className="text-[9px] text-slate-400 leading-none">{MONTHS[s.dueDate.getMonth()].slice(0, 3).toUpperCase()}</span>
        <span className="text-white font-bold text-base leading-none mt-0.5">{s.dueDate.getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-white font-medium text-sm truncate ${s.paid ? 'line-through opacity-60' : ''}`}>{s.bill.name}</p>
        <p className="text-[11px] text-slate-400 truncate">
          <span className={STATE_STYLE[s.state].text}>{describeDue(s)}</span> · {OWNER_LABEL[s.bill.owner]}
          {s.bill.kind === 'tarjeta' ? ' · Tarjeta' : ''}{s.bill.kind === 'deuda' && s.bill.totalInstallments ? ` · cuota ${(s.bill.paidInstallments ?? 0) + (s.paid ? 0 : 1)}/${s.bill.totalInstallments}` : ''}
        </p>
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-sm">{formatCOP(s.payment?.amount ?? s.bill.amount)}</p>
        <div className="flex justify-end gap-1 mt-1">
          {s.paid
            ? <button onClick={() => undo(s)} aria-label={`Desmarcar ${s.bill.name}`} className="p-1 text-slate-500 hover:text-white"><Undo2 size={14} /></button>
            : <button onClick={() => { setPaying(s); setPayAmount(s.bill.amount); }} className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">Pagar</button>}
          <a href={googleCalendarLink(s.bill)} target="_blank" rel="noopener noreferrer" aria-label={`Agregar ${s.bill.name} a Google Calendar`} title="Recordatorio en Google Calendar" className="p-1 text-slate-500 hover:text-amber-300"><CalendarDays size={14} /></a>
          <button onClick={() => { setEditing(s.bill); setFormOpen(true); }} aria-label={`Editar ${s.bill.name}`} className="p-1 text-slate-500 hover:text-blue-400"><Pencil size={14} /></button>
          <button onClick={() => removeBill(s.bill)} aria-label={`Eliminar ${s.bill.name}`} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-5 pb-28">
      <ModuleHeader module="pagos" title="Pagos y deudas" />
      <button data-tour="bills-add" onClick={() => { setEditing(null); setFormOpen(true); }}
        className="w-full -mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98]">
        <Plus size={20} /> Agregar pago fijo o deuda
      </button>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(['todos', 'yo', 'pareja', 'compartido'] as const).map(o => (
          <button key={o} onClick={() => setOwner(o)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${owner === o ? 'bg-white text-black font-bold' : 'bg-[#111827] text-slate-300 border border-white/10'}`}>
            {o === 'todos' ? 'Todos' : OWNER_LABEL[o]}
          </button>
        ))}
      </div>

      {/* Resumen del mes */}
      <div className="bg-gradient-to-br from-violet-600/30 to-cyan-600/20 border border-violet-500/20 rounded-3xl p-5 flex items-center gap-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
            <motion.circle cx="40" cy="40" r="34" fill="none" stroke="#C6F432" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={213.6} initial={{ strokeDashoffset: 213.6 }} animate={{ strokeDashoffset: 213.6 * (1 - pct / 100) }} transition={{ duration: 1.1, ease: 'easeOut' }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white font-bold">{pct}%</span>
        </div>
        <div>
          <p className="text-slate-300 text-xs">Total de {MONTHS[month].toLowerCase()}</p>
          <p className="text-white text-2xl font-bold">{formatCOP(total)}</p>
          <p className="text-xs text-slate-300 mt-1">Pagado <span className="text-emerald-300 font-semibold">{formatCOP(paidTotal)}</span> · Falta <span className="text-amber-300 font-semibold">{formatCOP(total - paidTotal)}</span></p>
        </div>
      </div>

      {/* Calendario */}
      <div data-tour="bills-calendar" className="bg-[#111827] border border-white/5 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => changeMonth(-1)} aria-label="Mes anterior" className="p-2 text-slate-400 hover:text-white"><ChevronLeft size={18} /></button>
          <p className="text-white font-semibold flex items-center gap-2"><CalendarDays size={16} className="text-violet-400" />{MONTHS[month]} {year}</p>
          <button onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="p-2 text-slate-400 hover:text-white"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500 mb-1">{WEEK.map((d, i) => <span key={i}>{d}</span>)}</div>
        <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={`${year}-${month}`} className="grid grid-cols-7 gap-1"
          initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.22, ease: 'easeOut' }}
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25} onDragEnd={(_, info) => { if (info.offset.x < -60) changeMonth(1); else if (info.offset.x > 60) changeMonth(-1); }}>
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const items = byDay(d);
            const isToday = isCurrentMonth && d === today.getDate();
            const sel = selectedDay === d;
            return (
              <button key={i} onClick={() => setSelectedDay(sel ? null : d)} aria-label={`${d} de ${MONTHS[month]}${items.length ? `, ${items.length} pagos` : ''}`}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${sel ? 'bg-amber-500 text-black font-bold scale-105' : isToday ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}>
                {d}
                <span className="flex gap-0.5 h-1.5 mt-0.5">{items.slice(0, 3).map((s, k) => <span key={k} className={`w-1.5 h-1.5 rounded-full ${STATE_STYLE[s.state].dot}`} />)}</span>
              </button>
            );
          })}
        </motion.div>
        </AnimatePresence>
        <p className="text-[10px] text-slate-500 text-center mt-2">Desliza el calendario para cambiar de mes</p>
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Vencido</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Pronto</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400" />Pendiente</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Pagado</span>
        </div>
        <AnimatePresence>
          {selectedDay && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                <p className="text-xs text-slate-400">Día {selectedDay}</p>
                {dayList.length ? dayList.map((s, i) => row(s, i)) : <p className="text-sm text-slate-500">Sin pagos este día.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {statuses.length > 0 && (
        <button data-tour="bills-export" onClick={exportAll} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/25 text-left active:scale-[0.99]">
          <CalendarDays size={22} className="text-amber-300 shrink-0" />
          <span className="flex-1">
            <span className="block text-white text-sm font-semibold">Recordatorios en el calendario del celular</span>
            <span className="block text-[11px] text-slate-400">Todos tus pagos, cada mes, con aviso un día antes y el mismo día. Así no se te pasa ninguno aunque no abras la app.</span>
          </span>
        </button>
      )}

      {/* ¿Ya lo pagaste? */}
      {overdue.map(s => (
        <motion.div key={s.bill.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-sm text-white flex items-start gap-2"><AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <span><strong>{s.bill.name}</strong> vencía el día {s.dueDate.getDate()}. ¿Ya lo pagaste?</span></p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => { setPaying(s); setPayAmount(s.bill.amount); }} className="flex-1 bg-emerald-500 text-black font-bold py-2 rounded-xl text-sm">Sí, ya pagué</button>
            <button onClick={() => setAskedLater(prev => new Set(prev).add(s.bill.id))} className="flex-1 border border-white/20 text-white py-2 rounded-xl text-sm">Todavía no</button>
          </div>
        </motion.div>
      ))}

      {statuses.length === 0 ? (
        <div className="text-center py-10 bg-[#111827] border border-dashed border-white/10 rounded-3xl">
          <CalendarDays className="mx-auto text-violet-400 mb-3" size={32} />
          <p className="text-white font-semibold">Agrega tu primer pago</p>
          <p className="text-slate-400 text-sm mt-1 px-6">Arriendo, servicios, tarjetas o créditos. Te avisamos antes de cada vencimiento.</p>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-primary mt-4 px-6">Agregar pago</button>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && <section className="space-y-2"><h2 className="text-sm font-bold text-slate-300">Por pagar</h2>{upcoming.map((s, i) => row(s, i))}</section>}
          {overdue.length === 0 && visible.some(s => s.state === 'vencido') && (
            <section className="space-y-2"><h2 className="text-sm font-bold text-red-400">Vencidos</h2>{visible.filter(s => s.state === 'vencido').map((s, i) => row(s, i))}</section>
          )}
          {paid.length > 0 && <section className="space-y-2"><h2 className="text-sm font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 size={14} /> Pagados</h2>{paid.map((s, i) => row(s, i))}</section>}
        </>
      )}

      {/* Deudas */}
      {debts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-300">Avance de deudas</h2>
          {debts.filter(d => owner === 'todos' || d.owner === owner).map(d => {
            const tot = d.totalInstallments || 1, done = d.paidInstallments ?? 0;
            const p = Math.min(100, Math.round((done / tot) * 100));
            return (
              <div key={d.id} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                <div className="flex justify-between text-sm"><span className="text-white font-medium">{d.name}</span><span className="text-slate-300">{done} de {tot} cuotas</span></div>
                <div className="h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <motion.div className={`h-full rounded-full ${p >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-violet-500 to-cyan-400'}`} initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1 }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{p >= 100 ? '¡Deuda pagada!' : `${p}% pagado · saldo aprox. ${formatCOP((tot - done) * d.amount)}`}</p>
              </div>
            );
          })}
        </section>
      )}

      <AnimatePresence>{formOpen && <BillForm initial={editing} onSave={saveBill} onClose={() => { setFormOpen(false); setEditing(null); }} />}</AnimatePresence>

      <AnimatePresence>
        {paying && (
          <motion.div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPaying(null)}>
            <motion.div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="pay-title"
              className="w-full max-w-md bg-[#111827] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 pb-8" initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}>
              <h2 id="pay-title" className="text-white text-lg font-bold">Registrar pago</h2>
              <p className="text-slate-400 text-sm mb-4">{paying.bill.name} · ¿cuánto pagaste este mes?</p>
              <MoneyInput value={payAmount} onChange={setPayAmount} prefix className="input-modern w-full text-lg" ariaLabel="Valor pagado" />
              <p className="text-[11px] text-slate-500 mt-2">Si el valor cambió (ej. la tarjeta), escríbelo. La fecha de pago sigue siendo el día {paying.bill.dueDay}.</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setPaying(null)} className="flex-1 py-3 rounded-xl border border-white/15 text-white">Cancelar</button>
                <button onClick={confirmPay} className="flex-1 btn-primary">Confirmar pago</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
