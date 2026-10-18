import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardPaste, ImageUp, Check, AlertTriangle, CreditCard, Loader2, Wand2 } from 'lucide-react';
import MoneyInput from '../ui/MoneyInput';
import { parseBankText, describeMethod, type ParsedMovement } from '../../services/bankTextParser';
import { scanReceipt } from '../../services/ocrService';
import { db } from '../../utils/database';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import { formatCOP } from '../../utils/format';
import { notify } from '../../services/notificationService';
import { findMatchingBill, markPaidFromTransaction } from '../../services/billsService';

/** Abre la hoja para registrar un movimiento desde el texto de una notificación o un comprobante. */
export const openPasteMovement = (text = '') => window.dispatchEvent(new CustomEvent('mf:paste-movement', { detail: text }));

const EXAMPLE = 'Bancolombia le informa Compra por $45.900 en EXITO CALLE 80. 17/10/2026 T.Cred *1234';

export default function PasteMovementSheet() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [reading, setReading] = useState(0);
  const [draft, setDraft] = useState<ParsedMovement | null>(null);
  const [desc, setDesc] = useState('');
  const [dup, setDup] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = (e: Event) => {
      const t = (e as CustomEvent<string>).detail || '';
      setOpen(true); setSaved(false); setText(t); setDraft(null); setReading(0);
      if (t) apply(t);
    };
    window.addEventListener('mf:paste-movement', on);
    return () => window.removeEventListener('mf:paste-movement', on);
  }, []);

  const parsed = useMemo(() => (text.trim() ? parseBankText(text) : null), [text]);

  function apply(t: string) {
    const p = parseBankText(t);
    if (!p) { notify({ title: 'No encontramos un valor', message: 'Revisa que el texto tenga el monto, por ejemplo $45.900.', type: 'warning' }); return; }
    setDraft(p); setDesc(p.merchant);
  }

  // Aviso si ya hay un movimiento igual (mismo valor y fecha) para no duplicar.
  useEffect(() => {
    if (!draft) { setDup(false); return; }
    db.transactions.where('date').equals(draft.date).toArray()
      .then(list => setDup(list.some(t => t.type === draft.type && Math.abs(t.amount - draft.amount) < 1)))
      .catch(() => setDup(false));
  }, [draft?.date, draft?.amount, draft?.type]);

  const pasteClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (!t.trim()) { notify({ title: 'El portapapeles está vacío', message: 'Copia primero el texto de la notificación.', type: 'info' }); return; }
      setText(t); apply(t);
    } catch { notify({ title: 'No pudimos leer el portapapeles', message: 'Mantén presionado el cuadro de texto y elige "Pegar".', type: 'info' }); }
  };

  const readImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setReading(2);
    try {
      const r = await scanReceipt(file, p => setReading(Math.max(2, p)));
      setText(r.rawText); setReading(0);
      const p = parseBankText(r.rawText);
      if (p) { setDraft(p); setDesc(p.merchant || r.store); }
      else notify({ title: 'Leímos el comprobante pero no el valor', message: 'Escribe o corrige el texto y toca Continuar.', type: 'warning' });
    } catch { setReading(0); notify({ title: 'No se pudo leer la imagen', message: 'Intenta con un pantallazo más nítido.', type: 'error' }); }
  };

  const save = async () => {
    if (!draft || draft.amount <= 0) return;
    const method = describeMethod(draft.method, draft.last4);
    const description = [desc.trim() || (draft.type === 'income' ? 'Ingreso' : 'Gasto'), method].filter(Boolean).join(' · ');
    const tx = { id: crypto.randomUUID(), date: draft.date, type: draft.type, amount: draft.amount, category: draft.category, description, createdAt: Date.now() };
    await db.transactions.add(tx);
    if (tx.type === 'expense') {
      const bill = await findMatchingBill(desc, tx.category);
      if (bill && await markPaidFromTransaction(bill, tx.amount, new Date(tx.date + 'T12:00'))) notify({ title: `${bill.name} quedó pagado`, message: 'Lo marcamos en Pagos.', type: 'info' });
    }
    window.dispatchEvent(new Event('mf:data-changed'));
    setSaved(true);
    setTimeout(close, 1200);
  };

  const close = () => { setOpen(false); setTimeout(() => { setDraft(null); setText(''); setSaved(false); }, 250); };
  const cats = draft?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[125] bg-black/70 backdrop-blur-sm flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div role="dialog" aria-modal="true" aria-label="Registrar desde notificación" onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-surface2 border-t border-white/10 rounded-t-[30px] max-h-[90vh] flex flex-col"
            initial={{ y: 320 }} animate={{ y: 0 }} exit={{ y: 320 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
            <div className="w-10 h-1.5 rounded-full bg-white/15 mx-auto mt-3" />
            <div className="flex items-start justify-between px-5 pt-3 pb-2">
              <div>
                <h2 className="text-white text-lg font-bold">{draft ? 'Revisa y confirma' : 'Desde una notificación'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{draft ? 'Leímos esto. Corrige lo que haga falta.' : 'Pega el texto del banco, Nequi, Daviplata o Bre-B, o sube el pantallazo del comprobante.'}</p>
              </div>
              <button onClick={close} aria-label="Cerrar" className="p-2 -mr-2 text-slate-400"><X size={20} /></button>
            </div>

            <div className="px-5 pb-8 overflow-y-auto">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={readImage} />
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.div key="ok" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} className="w-16 h-16 mx-auto rounded-full bg-brand-lime flex items-center justify-center"><Check size={32} className="text-brand-ink" strokeWidth={3} /></motion.div>
                    <p className="text-white font-bold mt-4">¡Registrado!</p>
                  </motion.div>
                ) : !draft ? (
                  <motion.div key="in" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={pasteClipboard} className="btn-primary !px-3 flex items-center justify-center gap-2"><ClipboardPaste size={18} />Pegar texto</button>
                      <button onClick={() => fileRef.current?.click()} disabled={!!reading} className="py-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                        {reading ? <><Loader2 size={18} className="animate-spin" />{reading}%</> : <><ImageUp size={18} />Comprobante</>}
                      </button>
                    </div>
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder={`Ej: ${EXAMPLE}`}
                      className="input-modern w-full !py-3 text-sm leading-relaxed resize-none" aria-label="Texto de la notificación" />
                    {parsed && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white/[0.05] ring-1 ring-white/10 p-3 text-sm flex items-center gap-3">
                        <Wand2 size={18} className="text-brand-lime shrink-0" />
                        <span className="text-slate-300 min-w-0 truncate">{parsed.type === 'income' ? 'Ingreso' : 'Gasto'} de <strong className="text-white">{formatCOP(parsed.amount)}</strong>{parsed.merchant ? ` en ${parsed.merchant}` : ''}</span>
                      </motion.div>
                    )}
                    <button onClick={() => apply(text)} disabled={!text.trim()} className="w-full py-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold disabled:opacity-40">Continuar</button>
                    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-3">
                      <p className="text-[11px] text-slate-400"><strong className="text-slate-300">Truco:</strong> en Android, con la app instalada, toca <em>Compartir</em> en el mensaje del banco y elige <strong className="text-slate-300">Mi Finanzas</strong>. El texto llega solo.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="ok2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.05] ring-1 ring-white/10" role="radiogroup" aria-label="Tipo">
                      {(['expense', 'income'] as const).map(k => (
                        <button key={k} role="radio" aria-checked={draft.type === k} onClick={() => setDraft({ ...draft, type: k, category: k === 'income' ? 'Otros ingresos' : 'Otros' })}
                          className={`py-2 rounded-xl text-sm font-bold ${draft.type === k ? (k === 'expense' ? 'bg-rose-500 text-white' : 'bg-brand-lime text-brand-ink') : 'text-slate-300'}`}>{k === 'expense' ? 'Gasto' : 'Ingreso'}</button>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Valor</p>
                      <MoneyInput value={draft.amount} onChange={v => setDraft({ ...draft, amount: v })} prefix ariaLabel="Valor" className="input-modern w-full !text-2xl !font-extrabold" />
                    </div>
                    <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="¿Dónde o qué fue?" maxLength={60} className="input-modern w-full" aria-label="Descripción" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} className="input-modern w-full min-w-0" aria-label="Fecha" />
                      <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} className="input-modern w-full" aria-label="Categoría">
                        {cats.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {draft.method && (
                      <p className="text-xs text-slate-300 flex items-center gap-1.5"><CreditCard size={14} className="text-brand-lime" />{describeMethod(draft.method, draft.last4)}</p>
                    )}
                    {dup && (
                      <div className="rounded-2xl bg-amber-500/10 ring-1 ring-amber-400/30 p-3 text-xs text-amber-300 flex gap-2"><AlertTriangle size={16} className="shrink-0" />Ya tienes un movimiento de {formatCOP(draft.amount)} ese día. Revisa que no sea el mismo antes de guardar.</div>
                    )}
                    <button onClick={save} className="btn-primary w-full flex items-center justify-center gap-2"><Check size={18} />Registrar {draft.type === 'income' ? 'ingreso' : 'gasto'}</button>
                    <button onClick={() => setDraft(null)} className="w-full py-2 text-xs text-slate-400">Volver al texto</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
