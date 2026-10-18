import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowDownCircle, ArrowUpCircle, ShoppingCart, CalendarPlus, Check, MessageSquareText, ChevronRight } from 'lucide-react';
import { openPasteMovement } from './quick/PasteMovementSheet';
import MoneyInput from './ui/MoneyInput';
import { db } from '../utils/database';
import { guessCategory, segmentOf, SEGMENT_INFO } from '../utils/categories';
import { formatCOP, todayISO } from '../utils/format';
import { notify } from '../services/notificationService';
import { findMatchingBill, markPaidFromTransaction } from '../services/billsService';

/** Botón flotante "+": registra rápido un gasto o ingreso, o salta a Mercado / Pagos, desde cualquier pantalla. */
export default function QuickAdd({ hidden }: { hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<null | 'expense' | 'income'>(null);
  const [amount, setAmount] = useState(0);
  const [desc, setDesc] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const reset = () => { setMode(null); setAmount(0); setDesc(''); setSaved(false); };
  const close = () => { setOpen(false); setTimeout(reset, 250); };
  const category = mode ? guessCategory(desc, mode) ?? (mode === 'income' ? 'Otros ingresos' : 'Otros') : 'Otros';

  const save = async () => {
    if (!mode || !amount || !desc.trim()) return notify({ title: 'Escribe el valor y qué fue', type: 'info' });
    const tx = { id: crypto.randomUUID(), date: todayISO(), type: mode, amount, category, description: desc.trim(), createdAt: Date.now() };
    await db.transactions.add(tx);
    if (mode === 'expense') {
      const bill = await findMatchingBill(tx.description, category);
      if (bill && await markPaidFromTransaction(bill, amount, new Date())) notify({ title: `${bill.name} quedó pagado`, message: 'Lo marcamos en Pagos.', type: 'info' });
    }
    window.dispatchEvent(new Event('mf:data-changed'));
    setSaved(true);
    setTimeout(close, 1100);
  };

  const actions = [
    { id: 'expense', label: 'Gasto', desc: 'Algo que pagaste', icon: ArrowDownCircle, grad: 'from-rose-500 to-pink-600', onClick: () => setMode('expense') },
    { id: 'income', label: 'Ingreso', desc: 'Sueldo, recargos, ventas', icon: ArrowUpCircle, grad: 'from-emerald-500 to-teal-500', onClick: () => setMode('income') },
    { id: 'market', label: 'Mercado', desc: 'Agregar a la lista', icon: ShoppingCart, grad: 'from-emerald-500 to-lime-400', onClick: () => { close(); navigate('/mercado'); } },
    { id: 'bill', label: 'Pago fijo', desc: 'Arriendo, tarjeta, crédito', icon: CalendarPlus, grad: 'from-amber-500 to-orange-500', onClick: () => { close(); navigate('/pagos'); } },
  ];

  return (
    <>
      <AnimatePresence>
        {!hidden && (
          <motion.button data-tour="fab" onClick={() => setOpen(true)} aria-label="Registro rápido"
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileTap={{ scale: 0.88 }}
            className="fixed bottom-6 right-5 z-50 w-16 h-16 rounded-[22px] bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-500 shadow-2xl shadow-violet-600/50 flex items-center justify-center">
            <motion.span animate={{ rotate: open ? 45 : 0 }}><Plus size={30} className="text-brand-ink" strokeWidth={2.6} /></motion.span>
            <motion.span className="absolute inset-0 rounded-[22px] border-2 border-violet-300/60" animate={{ scale: [1, 1.25], opacity: [0.7, 0] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5 }} />
          </motion.button>
        )}
      </AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-[115] bg-black/70 backdrop-blur-sm flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
              <motion.div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Registro rápido"
                className="w-full max-w-md bg-surface2 border border-white/10 rounded-t-[32px] p-5 pb-10"
                initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
                <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto mb-4" />
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white text-lg font-bold">{mode === 'expense' ? 'Nuevo gasto' : mode === 'income' ? 'Nuevo ingreso' : '¿Qué quieres registrar?'}</h2>
                  <button onClick={close} aria-label="Cerrar" className="p-2 text-slate-400"><X size={20} /></button>
                </div>

                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.div key="ok" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${mode === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}><Check size={34} className="text-white" strokeWidth={3} /></motion.div>
                      <p className="text-white font-bold mt-3">{mode === 'income' ? 'Ingreso' : 'Gasto'} registrado</p>
                      <p className="text-slate-400 text-sm">{desc} · {formatCOP(amount)}</p>
                    </motion.div>
                  ) : !mode ? (
                    <motion.div key="grid" className="grid grid-cols-2 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {actions.map((a, i) => (
                        <motion.button key={a.id} onClick={a.onClick} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.95 }}
                          className="text-left p-4 rounded-3xl bg-white/[0.04] border border-white/10">
                          <span className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${a.grad} flex items-center justify-center shadow-lg`}><a.icon size={22} className="text-white" /></span>
                          <span className="block text-white font-bold mt-3">{a.label}</span>
                          <span className="block text-[11px] text-slate-400">{a.desc}</span>
                        </motion.button>
                      ))}
                      <motion.button onClick={() => { close(); setTimeout(() => openPasteMovement(), 200); }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} whileTap={{ scale: 0.97 }}
                        className="col-span-2 flex items-center gap-3 text-left p-4 rounded-3xl bg-gradient-to-r from-brand-lime/15 to-transparent ring-1 ring-brand-lime/30">
                        <span className="w-11 h-11 rounded-2xl bg-brand-lime flex items-center justify-center shrink-0"><MessageSquareText size={22} className="text-brand-ink" /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-white font-bold">Desde notificación del banco</span>
                          <span className="block text-[11px] text-slate-400">Pega el mensaje de TD, TC, Nequi o Bre-B, o sube el comprobante</span>
                        </span>
                        <ChevronRight size={18} className="text-slate-400" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <MoneyInput value={amount} onChange={setAmount} prefix placeholder="$ 0" ariaLabel="Valor"
                        className="w-full bg-transparent text-center text-4xl font-extrabold text-white outline-none py-3 placeholder:text-slate-600" />
                      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={mode === 'expense' ? '¿En qué? Ej: Uber, almuerzo, luz' : '¿De dónde? Ej: sueldo, recargos'} autoFocus
                        onKeyDown={e => e.key === 'Enter' && save()}
                        className="w-full mt-2 h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-400" />
                      {mode === 'expense' && desc && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-slate-400 mt-2">
                          Categoría: <span className="text-white font-semibold">{category}</span> · <span className={SEGMENT_INFO[segmentOf('expense', category) as 'obligatorio'].color}>{SEGMENT_INFO[segmentOf('expense', category) as 'obligatorio'].short}</span>
                        </motion.p>
                      )}
                      <div className="flex gap-2 mt-5">
                        <button onClick={reset} className="px-5 py-3.5 rounded-2xl border border-white/15 text-white">Atrás</button>
                        <button onClick={save} className={`flex-1 py-3.5 rounded-2xl font-bold bg-gradient-to-r ${mode === 'income' ? 'from-emerald-400 to-emerald-500 text-brand-ink' : 'from-rose-500 to-pink-600 text-white'}`}>Guardar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
