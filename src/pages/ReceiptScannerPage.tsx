import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, ScanLine, Check, X, Trash2, Plus, Store, CalendarDays, ShieldCheck, FileText, ChevronRight, RotateCcw } from 'lucide-react';
import ModuleHeader from '../components/ui/ModuleHeader';
import MoneyInput from '../components/ui/MoneyInput';
import { usePageTour } from '../components/tour/Tour';
import { scanReceipt, type ScannedItem } from '../services/ocrService';
import { secureStorage } from '../utils/security';
import { db } from '../utils/database';
import { formatCOP, todayISO } from '../utils/format';
import { EXPENSE_CATEGORIES, guessCategory } from '../utils/categories';
import { notify } from '../services/notificationService';

interface Invoice {
  id: string;
  store: string;
  date: string;
  total: number;
  products: { name: string; price: number; quantity: number }[];
  isValid?: boolean;
}

type Step = 'idle' | 'reading' | 'review' | 'done';

const loadInvoices = (): Invoice[] => {
  const saved = secureStorage.getItem('miFinanzasInvoices');
  return Array.isArray(saved) ? saved : [];
};

export default function ReceiptScannerPage() {
  const [step, setStep] = useState<Step>('idle');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [store, setStore] = useState('');
  const [date, setDate] = useState(todayISO());
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [category, setCategory] = useState('Mercado');
  const [recent, setRecent] = useState<Invoice[]>(loadInvoices);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  usePageTour('escaner', [
    { target: 'scan-actions', title: 'Escanea una factura', text: 'Toma una foto o sube una imagen de la factura. La app lee la tienda, la fecha, los productos y el total.' },
    { target: 'scan-privacy', title: 'Todo en tu celular', text: 'La foto se lee dentro de tu celular y no se guarda. Solo guardas los datos que tú confirmes.' },
  ]);

  // La vista previa de la foto se libera al salir para no dejar nada en memoria.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setStep('idle'); setProgress(0); setItems([]); setTotal(0); setStore(''); setDate(todayISO());
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify({ title: 'Ese archivo no es una imagen', message: 'Elige una foto de la factura.', type: 'warning' }); return; }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setStep('reading'); setProgress(2); setStage('Preparando la foto');
    try {
      const r = await scanReceipt(file, (p, s) => { setProgress(p); setStage(s); });
      setStore(r.store === 'Factura' ? '' : r.store);
      setDate(r.date || todayISO());
      setItems(r.items);
      setTotal(r.total);
      setCategory(guessCategory(r.store) || 'Mercado');
      setStep('review');
      if (!r.total && !r.items.length) notify({ title: 'No se pudo leer bien', message: 'Escribe el total a mano o intenta con una foto más nítida y derecha.', type: 'warning' });
    } catch {
      setStep('idle');
      notify({ title: 'No se pudo leer la factura', message: 'Revisa tu conexión la primera vez (se descarga el lector) e intenta con buena luz.', type: 'error' });
    }
  };

  const updateItem = (i: number, patch: Partial<ScannedItem>) => setItems(list => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems(list => list.filter((_, j) => j !== i));
  const addItem = () => setItems(list => [...list, { name: '', price: 0, quantity: 1 }]);
  const itemsSum = items.reduce((a, it) => a + it.price, 0);

  const save = async (asExpense: boolean) => {
    if (total <= 0) { notify({ title: 'Falta el total', message: 'Escribe el valor total de la factura.', type: 'warning' }); return; }
    const name = store.trim() || 'Factura';
    const invoice: Invoice = {
      id: crypto.randomUUID(), store: name, date, total,
      products: items.filter(i => i.name.trim() && i.price > 0).map(i => ({ name: i.name.trim(), price: i.price, quantity: i.quantity || 1 })),
      isValid: true,
    };
    const list = [invoice, ...loadInvoices()].slice(0, 100);
    secureStorage.setItem('miFinanzasInvoices', list);
    setRecent(list);
    if (asExpense) {
      await db.transactions.add({ id: crypto.randomUUID(), date, type: 'expense', amount: total, category, description: `Factura ${name}`, createdAt: Date.now() });
      window.dispatchEvent(new Event('mf:data-changed'));
    }
    notify({ title: asExpense ? 'Gasto registrado' : 'Factura guardada', message: `${name}: ${formatCOP(total)}`, type: 'success' });
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setStep('done');
  };

  return (
    <div className="p-4 pb-28 space-y-4">
      <ModuleHeader module="escaner" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20">
              <motion.div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-lime-300/15 blur-3xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity }} aria-hidden="true" />
              <div className="relative flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center overflow-hidden">
                  <ScanLine className="text-brand-lime" size={30} />
                  <motion.span className="absolute left-2 right-2 h-0.5 bg-brand-lime/80 rounded-full shadow-[0_0_12px_#C6F432]" animate={{ top: ['18%', '82%', '18%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
                </div>
                <div>
                  <p className="text-white font-bold">Escanea tu factura</p>
                  <p className="text-xs text-slate-300 mt-0.5">La app lee la tienda, la fecha, los productos y el total. Tú revisas y guardas.</p>
                </div>
              </div>
              <div data-tour="scan-actions" className="relative grid grid-cols-2 gap-3 mt-5">
                <button onClick={() => cameraRef.current?.click()} className="btn-primary !px-3 flex items-center justify-center gap-2"><Camera size={18} /> Tomar foto</button>
                <button onClick={() => galleryRef.current?.click()} className="py-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"><ImagePlus size={18} /> Subir imagen</button>
              </div>
            </div>

            <div data-tour="scan-privacy" className="flex items-start gap-3 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3.5">
              <ShieldCheck className="text-brand-lime shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-slate-300">La foto se lee dentro de tu celular y no se guarda. Para mejores resultados: buena luz, factura derecha y completa.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Últimas facturas</p>
                <Link to="/historial-facturas" className="text-xs text-slate-300 font-semibold flex items-center">Ver todas <ChevronRight size={14} /></Link>
              </div>
              {recent.length === 0 ? (
                <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-6 text-center">
                  <FileText className="mx-auto text-slate-500" size={30} />
                  <p className="text-sm text-slate-400 mt-2">Aún no has escaneado facturas.</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 divide-y divide-white/5">
                  {recent.slice(0, 4).map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><FileText size={16} className="text-brand-lime" /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">{inv.store}</p>
                        <p className="text-[11px] text-slate-400">{inv.date} · {inv.products.length} productos</p>
                      </div>
                      <p className="text-sm font-bold text-white">{formatCOP(inv.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 'reading' && (
          <motion.div key="reading" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-[28px] p-5 bg-white/[0.04] ring-1 ring-white/10 text-center">
            <div className="relative mx-auto w-44 h-56 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/30">
              {preview && <img src={preview} alt="Factura" className="w-full h-full object-cover opacity-70" />}
              <motion.span className="absolute left-0 right-0 h-1 bg-brand-lime shadow-[0_0_18px_#C6F432]" animate={{ top: ['4%', '94%', '4%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            <p className="text-white font-bold mt-5">{stage}…</p>
            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full bg-brand-lime rounded-full" animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }} />
            </div>
            <p className="text-xs text-slate-400 mt-2">{progress}% · se procesa en tu celular</p>
            <button onClick={reset} className="mt-4 text-xs text-slate-300 underline">Cancelar</button>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-[24px] p-4 bg-white/[0.04] ring-1 ring-white/10 space-y-3">
              <p className="text-white font-bold">Revisa lo que leímos</p>
              <label className="flex items-center gap-2 input-modern !py-2.5">
                <Store size={16} className="text-slate-400 shrink-0" />
                <input value={store} onChange={e => setStore(e.target.value)} placeholder="Tienda (ej: D1, Éxito)" className="bg-transparent outline-none flex-1 text-white" maxLength={40} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 input-modern !py-2.5">
                  <CalendarDays size={16} className="text-slate-400 shrink-0" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent outline-none flex-1 text-white min-w-0" />
                </label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="input-modern !py-2.5">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Total de la factura</p>
                <MoneyInput value={total} onChange={setTotal} prefix ariaLabel="Total de la factura" className="input-modern !text-2xl !font-extrabold !text-brand-lime" />
                {items.length > 0 && Math.abs(itemsSum - total) > 1 && (
                  <button onClick={() => setTotal(itemsSum)} className="mt-1.5 text-[11px] text-slate-300 underline">Usar la suma de productos: {formatCOP(itemsSum)}</button>
                )}
              </div>
            </div>

            <div className="rounded-[24px] p-4 bg-white/[0.04] ring-1 ring-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-bold">Productos <span className="text-slate-400 font-normal text-sm">({items.length})</span></p>
                <button onClick={addItem} className="text-xs text-brand-lime font-bold flex items-center gap-1"><Plus size={14} /> Agregar</button>
              </div>
              {items.length === 0 && <p className="text-xs text-slate-400 py-2">No se detectaron productos. Puedes agregarlos o guardar solo el total.</p>}
              <AnimatePresence initial={false}>
                {items.map((it, i) => (
                  <motion.div key={i} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0 }} className="flex items-center gap-2 py-1.5">
                    <input value={it.name} onChange={e => updateItem(i, { name: e.target.value })} placeholder="Producto" className="input-modern !py-2 !px-3 flex-1 min-w-0 text-sm" />
                    <div className="w-28 shrink-0"><MoneyInput value={it.price} onChange={v => updateItem(i, { price: v })} ariaLabel={`Precio de ${it.name || 'producto'}`} className="input-modern !py-2 !px-3 text-sm" /></div>
                    <button onClick={() => removeItem(i)} aria-label="Quitar producto" className="p-2 text-slate-400 hover:text-rose-300"><Trash2 size={16} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <button onClick={() => save(true)} className="btn-primary w-full flex items-center justify-center gap-2"><Check size={18} /> Registrar como gasto</button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => save(false)} className="py-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white text-sm font-bold">Solo guardar factura</button>
                <button onClick={reset} className="py-3 rounded-xl bg-white/[0.04] ring-1 ring-white/10 text-slate-300 text-sm font-bold flex items-center justify-center gap-1.5"><X size={16} /> Descartar</button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="rounded-[28px] p-6 bg-white/[0.04] ring-1 ring-white/10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} className="w-16 h-16 mx-auto rounded-full bg-brand-lime flex items-center justify-center"><Check size={32} className="text-brand-ink" strokeWidth={3} /></motion.div>
            <p className="text-white font-bold text-lg mt-4">¡Factura guardada!</p>
            <p className="text-sm text-slate-300 mt-1">{store || 'Factura'} · {formatCOP(total)}</p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button onClick={reset} className="btn-primary !px-3 flex items-center justify-center gap-2"><RotateCcw size={16} /> Escanear otra</button>
              <Link to="/historial-facturas" className="py-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white text-sm font-bold flex items-center justify-center">Ver facturas</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
