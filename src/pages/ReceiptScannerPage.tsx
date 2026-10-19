/**
 * ════════════════════════════════════════════════════════════════════
 * 📷 PANTALLA ESCÁNER
 * ────────────────────────────────────────────────────────────────────
 * Qué hace: Foto de una factura → lectura con OCR en el celular → revisar y registrar como gasto.
 * Revisión: la foto al lado para comparar, comercio, fecha, medio de pago, total y cada producto
 *           con cantidad × valor unitario = valor de la línea. Un aviso dice si la suma cuadra.
 *           Opcional: guardar los precios en Mercado (para comparar por tienda).
 * Dónde se ve: Menú → Escáner.
 * Si lo cambias: La lectura de la foto está en services/ocrService.ts y lo que significa
 *                cada línea en services/receipt/receiptParser.ts.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, ScanLine, Check, X, Trash2, Plus, CalendarDays, ShieldCheck, FileText, ChevronRight, RotateCcw, CreditCard, AlertTriangle, CheckCircle2, Maximize2, ShoppingBasket, Minus } from 'lucide-react';
import StoreBadge from '../components/market/StoreBadge';
import { addTripFromReceipt, cleanStore } from '../services/market/marketStore';
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
  payment?: string;
  /** price = valor de la línea; unitPrice = valor de cada unidad */
  products: { name: string; price: number; quantity: number; unitPrice?: number }[];
  isValid?: boolean;
}

const PAYMENTS = ['Tarjeta débito', 'Tarjeta crédito', 'Tarjeta', 'Efectivo', 'Nequi', 'Daviplata', 'Bre-B', 'Transferencia', 'QR', 'Otro'];

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
  const [payment, setPayment] = useState('');
  const [toMarket, setToMarket] = useState(true);
  const [zoom, setZoom] = useState(false);
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
    setPreview(null); setStep('idle'); setProgress(0); setItems([]); setTotal(0); setStore(''); setDate(todayISO()); setPayment(''); setZoom(false);
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
      setStore(r.store);
      setDate(r.date || todayISO());
      setItems(r.items);
      setTotal(r.total);
      setPayment(r.payment);
      setCategory(guessCategory(r.store) || 'Mercado');
      setStep('review');
      if (!r.total && !r.items.length) notify({ title: 'No se pudo leer bien', message: 'Escribe el total a mano o intenta con una foto más nítida y derecha.', type: 'warning' });
    } catch {
      setStep('idle');
      notify({ title: 'No se pudo leer la factura', message: 'Revisa tu conexión la primera vez (se descarga el lector) e intenta con buena luz.', type: 'error' });
    }
  };

  /** Al cambiar cantidad o valor unitario, el valor de la línea se recalcula solo. */
  const updateItem = (i: number, patch: Partial<ScannedItem>) => setItems(list => list.map((it, j) => {
    if (j !== i) return it;
    const next = { ...it, ...patch };
    if ('quantity' in patch || 'unitPrice' in patch) next.price = Math.round((next.quantity || 0) * (next.unitPrice || 0));
    return next;
  }));
  const removeItem = (i: number) => setItems(list => list.filter((_, j) => j !== i));
  const addItem = () => setItems(list => [...list, { name: '', price: 0, quantity: 1, unitPrice: 0 }]);
  const itemsSum = items.reduce((a, it) => a + it.price, 0);
  const sumOk = items.length > 0 && Math.abs(itemsSum - total) <= 1;
  const units = items.reduce((a, it) => a + (it.unit === 'kg' || it.unit === 'lb' ? 1 : it.quantity || 0), 0);

  const save = async (asExpense: boolean) => {
    if (total <= 0) { notify({ title: 'Falta el total', message: 'Escribe el valor total de la factura.', type: 'warning' }); return; }
    const name = cleanStore(store) || 'Factura';
    const good = items.filter(i => i.name.trim() && i.price !== 0);
    const invoice: Invoice = {
      id: crypto.randomUUID(), store: name, date, total, payment: payment || undefined,
      products: good.map(i => ({ name: i.name.trim(), price: i.price, quantity: i.quantity || 1, unitPrice: i.unitPrice })),
      isValid: true,
    };
    // Precios al historial del Mercado (comparar tiendas)
    if (toMarket && category === 'Mercado' && good.some(i => i.price > 0)) {
      addTripFromReceipt({ store: name === 'Factura' ? '' : name, date, total, items: good.filter(i => i.price > 0).map(i => ({ name: i.name, qty: i.quantity || 1, unit: i.unit, price: i.unitPrice || Math.round(i.price / (i.quantity || 1)) })) });
    }
    const list = [invoice, ...loadInvoices()].slice(0, 100);
    secureStorage.setItem('miFinanzasInvoices', list);
    setRecent(list);
    if (asExpense) {
      await db.transactions.add({ id: crypto.randomUUID(), date, type: 'expense', amount: total, category, description: `Factura ${name}${payment ? ` · ${payment}` : ''}`, createdAt: Date.now() });
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
            <div className="relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br theme-dark from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20">
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
            {/* ═══ Resumen: foto para comparar + datos principales ═══ */}
            <div className="rounded-[24px] p-4 bg-white/[0.04] ring-1 ring-white/10">
              <div className="flex gap-3">
                {preview && (
                  <button onClick={() => setZoom(true)} aria-label="Ver la foto de la factura" className="relative shrink-0 w-[92px] h-[128px] rounded-2xl overflow-hidden ring-1 ring-white/15 bg-black/30">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 py-1 bg-black/60 text-[10px] text-white font-semibold flex items-center justify-center gap-1"><Maximize2 size={10} /> Comparar</span>
                  </button>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <label className="flex items-center gap-2 input-modern !py-2 !px-2.5">
                    <StoreBadge size={26} />
                    <input value={store} onChange={e => setStore(e.target.value)} placeholder="Comercio (ej: D1)" aria-label="Comercio" className="bg-transparent outline-none flex-1 min-w-0 text-white font-bold" maxLength={40} />
                  </label>
                  <label className="flex items-center gap-2 input-modern !py-2 !px-2.5">
                    <CalendarDays size={16} className="text-slate-400 shrink-0" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Fecha de la factura" className="bg-transparent outline-none flex-1 text-white min-w-0 text-sm" />
                  </label>
                  <label className="flex items-center gap-2 input-modern !py-2 !px-2.5">
                    <CreditCard size={16} className="text-slate-400 shrink-0" />
                    <select value={payment} onChange={e => setPayment(e.target.value)} aria-label="Medio de pago" className="bg-transparent outline-none flex-1 text-white min-w-0 text-sm">
                      <option value="" className="bg-surface">Medio de pago</option>
                      {PAYMENTS.map(p => <option key={p} value={p} className="bg-surface">{p}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Total de la factura</p>
                  <MoneyInput value={total} onChange={setTotal} prefix ariaLabel="Total de la factura" className="input-modern !text-2xl !font-extrabold !text-brand-lime" />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Categoría" className="input-modern !py-3 !w-36 text-sm">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Verificación: ¿la suma de productos cuadra con el total? */}
              {items.length > 0 && (sumOk ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 bg-emerald-500/10 ring-1 ring-emerald-400/30 text-[12px] text-emerald-200">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-300" />
                  <span>Todo cuadra: {items.length} {items.length === 1 ? 'producto' : 'productos'}{units > items.length ? ` (${units} unidades)` : ''} suman {formatCOP(itemsSum)}, igual al total.</span>
                </div>
              ) : (
                <div className="mt-3 rounded-xl px-3 py-2.5 bg-amber-400/10 ring-1 ring-amber-300/30 text-[12px] text-amber-100">
                  <p className="flex items-center gap-2"><AlertTriangle size={16} className="shrink-0 text-amber-300" /> Los productos suman {formatCOP(itemsSum)} y el total dice {formatCOP(total)}. Compáralos con la foto.</p>
                  <button onClick={() => setTotal(itemsSum)} className="mt-1.5 ml-6 text-[11px] font-bold text-amber-300 underline underline-offset-2">Usar la suma como total</button>
                </div>
              ))}
            </div>

            {/* ═══ Productos ═══ */}
            <div className="rounded-[24px] p-4 bg-white/[0.04] ring-1 ring-white/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-bold">Productos <span className="text-slate-400 font-normal text-sm">({items.length})</span></p>
                <button onClick={addItem} className="text-xs text-brand-lime font-bold flex items-center gap-1"><Plus size={14} /> Agregar</button>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Cantidad × valor de cada uno = valor de la línea</p>
              {items.length === 0 && <p className="text-xs text-slate-400 py-2">No se detectaron productos. Puedes agregarlos o guardar solo el total.</p>}
              <AnimatePresence initial={false}>
                {items.map((it, i) => (
                  <motion.div key={i} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0 }}
                    className={`rounded-2xl p-2.5 mb-2 ring-1 ${it.price < 0 ? 'bg-emerald-500/[0.06] ring-emerald-400/20' : 'bg-white/[0.03] ring-white/10'}`}>
                    <div className="flex items-center gap-2">
                      <input value={it.name} onChange={e => updateItem(i, { name: e.target.value })} placeholder="Producto" aria-label="Nombre del producto" className="bg-transparent outline-none flex-1 min-w-0 text-sm text-white font-semibold px-1" />
                      <span className={`shrink-0 text-sm font-extrabold ${it.price < 0 ? 'text-emerald-300' : 'text-white'}`}>{formatCOP(it.price)}</span>
                      <button onClick={() => removeItem(i)} aria-label={`Quitar ${it.name || 'producto'}`} className="p-1.5 text-slate-500 hover:text-rose-300"><Trash2 size={15} /></button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex items-center rounded-xl bg-white/5 ring-1 ring-white/10 h-9 shrink-0">
                        <button onClick={() => updateItem(i, { quantity: Math.max(it.unit === 'kg' ? 0.05 : 1, +(it.quantity - (it.unit === 'kg' ? 0.1 : 1)).toFixed(3)) })} aria-label="Menos" className="w-7 h-9 flex items-center justify-center text-slate-300"><Minus size={13} /></button>
                        <input inputMode="decimal" value={String(it.quantity).replace('.', ',')} onChange={e => { const q = parseFloat(e.target.value.replace(',', '.')); if (!Number.isNaN(q)) updateItem(i, { quantity: q }); }}
                          aria-label="Cantidad" className="w-9 bg-transparent text-center text-sm text-white font-bold outline-none" />
                        <button onClick={() => updateItem(i, { quantity: +(it.quantity + (it.unit === 'kg' ? 0.1 : 1)).toFixed(3) })} aria-label="Más" className="w-7 h-9 flex items-center justify-center text-slate-300"><Plus size={13} /></button>
                      </div>
                      <span className="text-[11px] text-slate-500 w-5 text-center">{it.unit === 'kg' ? 'kg' : it.unit === 'lb' ? 'lb' : '×'}</span>
                      <div className="flex-1 min-w-0"><MoneyInput value={it.unitPrice} onChange={v => updateItem(i, { unitPrice: v })} prefix ariaLabel={`Valor unitario de ${it.name || 'producto'}`} className="input-modern !py-1.5 !px-3 text-sm !h-9 w-full" /></div>
                      <span className="text-[10px] text-slate-500 shrink-0">c/u</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {items.length > 0 && (
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10 text-sm">
                  <span className="text-slate-400">Suma de productos</span>
                  <span className={`font-extrabold ${sumOk ? 'text-emerald-300' : 'text-amber-300'}`}>{formatCOP(itemsSum)}</span>
                </div>
              )}
            </div>

            {category === 'Mercado' && items.length > 0 && (
              <button onClick={() => setToMarket(v => !v)} role="switch" aria-checked={toMarket} className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 text-left">
                <ShoppingBasket size={18} className="text-brand-lime shrink-0" />
                <span className="flex-1"><span className="block text-white text-sm font-semibold">Guardar los precios en Mercado</span><span className="block text-[11px] text-slate-400">Para ver si subieron y comparar entre tiendas</span></span>
                <span className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${toMarket ? 'bg-brand-lime' : 'bg-white/15'}`}><span className={`block w-5 h-5 rounded-full bg-[#fff] shadow transition-transform ${toMarket ? 'translate-x-5' : ''}`} /></span>
              </button>
            )}

            <div className="space-y-2">
              <button onClick={() => save(true)} className="btn-primary w-full flex items-center justify-center gap-2"><Check size={18} /> Registrar como gasto · {formatCOP(total)}</button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => save(false)} className="py-3 rounded-xl bg-white/[0.07] ring-1 ring-white/10 text-white text-sm font-bold">Solo guardar factura</button>
                <button onClick={reset} className="py-3 rounded-xl bg-white/[0.04] ring-1 ring-white/10 text-slate-300 text-sm font-bold flex items-center justify-center gap-1.5"><X size={16} /> Descartar</button>
              </div>
            </div>

            {/* Foto en grande para comparar */}
            <AnimatePresence>
              {zoom && preview && (
                <motion.div className="fixed inset-0 z-[150] bg-black/95 overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur">
                    <p className="text-white text-sm font-bold">Tu factura · Total leído {formatCOP(total)}</p>
                    <button onClick={() => setZoom(false)} aria-label="Cerrar foto" className="p-2 text-white"><X size={22} /></button>
                  </div>
                  <img src={preview} alt="Foto de la factura" className="w-full h-auto" />
                </motion.div>
              )}
            </AnimatePresence>
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
