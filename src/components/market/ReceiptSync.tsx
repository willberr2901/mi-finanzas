/**
 * ════════════════════════════════════════════════════════════════════
 * 🧾⇄🛒 SINCRONIZAR LA FACTURA CON LA LISTA DEL MERCADO (avisos arriba)
 * ────────────────────────────────────────────────────────────────────
 * Sale sola después de guardar una factura de Mercado si hay productos por comprar.
 *   1. Lo que coincide seguro se TACHA SOLO con su precio (ej. "HUEVOS AA X30" = Huevos).
 *   2. Aviso arriba por cada duda: "¿Es el mismo producto?" → Sí, sincronizar / No.
 *   3. Aviso por cada producto que no está en la lista:
 *        Incorporar a la lista · Sincronizar con un producto de mi lista · Omitir.
 *   4. Resumen: tachados, incorporados y lo que falta → Cerrar el mercado o seguir.
 * Lo que la persona confirma se recuerda (alias) para que la próxima factura sea automática.
 * Lógica del cruce: services/market/categories.ts → crossReceipt / rememberAlias.
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X, RefreshCw, Plus, Link2, ArrowDown, ListChecks } from 'lucide-react';
import { formatCOP } from '../../utils/format';
import { notify } from '../../services/notificationService';
import { listItems, checkItem, addItem, finishTrip, setCurrentStore, type ListItem } from '../../services/market/marketStore';
import { crossReceipt, rememberAlias, categoryOf, guessCategory, expandReceiptName, CATEGORIES } from '../../services/market/categories';
import CategoryIcon from './CategoryIcon';

export interface SyncReceiptItem { name: string; price: number; quantity: number; unitPrice: number }
type Step = { kind: 'confirmar'; r: SyncReceiptItem; item: ListItem } | { kind: 'nuevo'; r: SyncReceiptItem };

const pretty = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim().replace(/^./, c => c.toUpperCase());
const unitOf = (r: SyncReceiptItem) => r.unitPrice || Math.round(r.price / (r.quantity || 1));

export default function ReceiptSync({ data, onClose }: { data: { store: string; items: SyncReceiptItem[] } | null; onClose: () => void }) {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Step[]>([]);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState<{ r: SyncReceiptItem; item: ListItem }[]>([]);
  const [linked, setLinked] = useState(0);
  const [added, setAdded] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const [, tick] = useState(0);

  // Al llegar una factura: tacha solo lo seguro y arma la fila de avisos.
  useEffect(() => {
    if (!data) return;
    const pending = listItems().filter(x => !x.checked);
    const res = crossReceipt(data.items.filter(x => x.name.trim()), pending);
    const sure = res.pairs.filter(p => p.level === 'seguro');
    for (const p of sure) { checkItem(p.item.id, unitOf(p.receipt), p.receipt.quantity || 1); rememberAlias(p.receipt.name, p.item.name); }
    if (data.store) setCurrentStore(data.store);
    setAuto(sure.map(p => ({ r: p.receipt, item: p.item })));
    setQueue([...res.pairs.filter(p => p.level === 'confirmar').map(p => ({ kind: 'confirmar' as const, r: p.receipt, item: p.item })), ...res.unmatched.map(r => ({ kind: 'nuevo' as const, r }))]);
    setI(0); setLinked(0); setAdded(0); setChoosing(false);
  }, [data]);

  const step = queue[i];
  const done = !!data && i >= queue.length;
  const next = () => { setChoosing(false); setI(n => n + 1); };
  const pendingNow = useMemo(() => (data ? listItems().filter(x => !x.checked) : []), [data, i, linked, added]);

  const yes = (s: Extract<Step, { kind: 'confirmar' }>) => { checkItem(s.item.id, unitOf(s.r), s.r.quantity || 1); rememberAlias(s.r.name, s.item.name); setLinked(n => n + 1); next(); };
  const no = (s: Extract<Step, { kind: 'confirmar' }>) => { setQueue(q => [...q, { kind: 'nuevo', r: s.r }]); next(); };
  const incorporate = (r: SyncReceiptItem) => { addItem({ name: pretty(expandReceiptName(r.name) || r.name), qty: r.quantity || 1, checked: true, paid: unitOf(r), extra: true }); setAdded(n => n + 1); next(); };
  const linkTo = (r: SyncReceiptItem, it: ListItem) => { checkItem(it.id, unitOf(r), r.quantity || 1); rememberAlias(r.name, it.name); setLinked(n => n + 1); next(); };

  const closeMarket = () => {
    const t = finishTrip(data?.store);
    if (t) notify({ title: 'Mercado guardado', message: `${t.items.length} productos · ${formatCOP(t.total)}${t.missing.length ? ` · quedaron ${t.missing.length} en la lista` : ''}`, type: 'success' });
    onClose();
  };

  // Productos de la lista ordenados: primero los de la misma categoría del producto de la factura.
  const options = (r: SyncReceiptItem) => {
    const c = guessCategory(expandReceiptName(r.name));
    return [...pendingNow].sort((a, b) => Number(categoryOf(b.name) === c) - Number(categoryOf(a.name) === c));
  };

  const total = queue.length;
  return createPortal(
    <AnimatePresence>
      {data && (
        <motion.div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-[2px] flex justify-center items-start p-3 pt-[max(12px,env(safe-area-inset-top))]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div key={done ? 'fin' : i} role="dialog" aria-modal="true" aria-labelledby="sync-title"
            initial={{ y: -80, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="theme-dark w-full max-w-md max-h-[88vh] overflow-y-auto rounded-[28px] bg-gradient-to-b from-[#1D2550] to-[#0F1530] border border-brand-lime/30 shadow-2xl shadow-black/60 p-4">
            {/* Encabezado */}
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-brand-lime text-brand-ink flex items-center justify-center"><RefreshCw size={18} strokeWidth={2.6} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-extrabold tracking-widest text-brand-lime">SINCRONIZANDO CON TU LISTA{!done && total > 0 ? ` · ${i + 1} DE ${total}` : ''}</p>
                <p className="text-[11px] text-slate-300 truncate">{auto.length > 0 ? `✓ ${auto.length} ${auto.length === 1 ? 'producto se tachó solo' : 'productos se tacharon solos'}` : 'Revisemos tu factura'}{data.store ? ` · ${data.store}` : ''}</p>
              </div>
              <button onClick={onClose} aria-label="Cerrar" className="p-1.5 text-slate-400"><X size={18} /></button>
            </div>
            {!done && total > 0 && <div className="flex gap-1 mt-3">{queue.map((_, n) => <span key={n} className={`h-1 flex-1 rounded-full ${n < i ? 'bg-brand-lime' : n === i ? 'bg-brand-lime/60' : 'bg-white/15'}`} />)}</div>}

            {/* 1) ¿Es el mismo? */}
            {!done && step?.kind === 'confirmar' && (
              <div className="mt-4">
                <h2 id="sync-title" className="text-white text-lg font-extrabold">¿Es el mismo producto?</h2>
                <div className="mt-3 rounded-2xl bg-[#F4F1E8] text-[#1F1D18] p-3">
                  <p className="text-[10px] font-bold opacity-60">EN LA FACTURA</p>
                  <div className="flex justify-between gap-2 font-mono font-bold text-sm"><span className="truncate">{step.r.name.toUpperCase()}</span><span>{formatCOP(unitOf(step.r))}</span></div>
                </div>
                <div className="flex justify-center my-1.5"><ArrowDown size={18} className="text-slate-400" /></div>
                <div className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-3 flex items-center gap-3">
                  <CategoryIcon id={categoryOf(step.item.name)} size={15} boxed />
                  <div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-slate-400">EN TU LISTA</p><p className="text-white font-bold truncate">{step.item.name}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => no(step)} className="h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold">No es el mismo</motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => yes(step)} className="h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-1.5"><Check size={17} strokeWidth={3} /> Sí, sincronizar</motion.button>
                </div>
              </div>
            )}

            {/* 2) No está en la lista */}
            {!done && step?.kind === 'nuevo' && (
              <div className="mt-4">
                <h2 id="sync-title" className="text-white text-lg font-extrabold">No está en tu lista</h2>
                <div className="mt-3 rounded-2xl bg-[#F4F1E8] text-[#1F1D18] p-3">
                  <p className="text-[10px] font-bold opacity-60">EN LA FACTURA</p>
                  <div className="flex justify-between gap-2 font-mono font-bold text-sm"><span className="truncate">{step.r.name.toUpperCase()}</span><span>{formatCOP(unitOf(step.r))}</span></div>
                  <p className="text-[11px] mt-1 flex items-center gap-1.5 opacity-80"><CategoryIcon id={guessCategory(expandReceiptName(step.r.name))} size={11} /> {CATEGORIES.find(c => c.id === guessCategory(expandReceiptName(step.r.name)))?.label}</p>
                </div>
                {!choosing ? (
                  <div className="space-y-2 mt-4">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => incorporate(step.r)} className="w-full h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-1.5"><Plus size={18} strokeWidth={3} /> Incorporar a la lista</motion.button>
                    {pendingNow.length > 0 && <motion.button whileTap={{ scale: 0.97 }} onClick={() => setChoosing(true)} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-brand-lime/40 text-brand-lime font-bold flex items-center justify-center gap-1.5"><Link2 size={16} /> Sincronizar con un producto de mi lista</motion.button>}
                    <button onClick={next} className="w-full h-10 text-sm text-slate-400 font-semibold">Omitir</button>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-xs text-slate-300 mb-2">¿A cuál de tu lista corresponde?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {options(step.r).map(it => (
                        <motion.button whileTap={{ scale: 0.92 }} key={it.id} onClick={() => linkTo(step.r, it)}
                          className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white/[0.06] ring-1 ring-white/10 text-xs font-bold text-white">
                          <CategoryIcon id={categoryOf(it.name)} size={11} boxed />{it.name}
                        </motion.button>
                      ))}
                    </div>
                    <button onClick={() => setChoosing(false)} className="mt-3 w-full h-10 text-sm text-slate-400 font-semibold">Volver</button>
                  </div>
                )}
              </div>
            )}

            {/* 3) Resumen */}
            {done && (
              <div className="mt-4 text-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="mx-auto w-16 h-16 rounded-full bg-brand-lime flex items-center justify-center"><Check size={34} strokeWidth={3} className="text-brand-ink" /></motion.span>
                <h2 id="sync-title" className="text-white text-xl font-extrabold mt-3">¡Lista sincronizada!</h2>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[[auto.length + linked, 'tachados'], [added, 'incorporados'], [pendingNow.length, 'por comprar']].map(([v, l]) => (
                    <div key={l as string} className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 py-2.5"><p className="text-white text-xl font-extrabold">{v}</p><p className="text-[10px] text-slate-400">{l}</p></div>
                  ))}
                </div>
                {pendingNow.length > 0 && <p className="text-xs text-slate-300 mt-3 flex items-start gap-1.5 text-left"><ListChecks size={14} className="shrink-0 mt-0.5 text-slate-400" /><span><strong className="text-white">Falta comprar:</strong> {pendingNow.slice(0, 6).map(x => x.name).join(', ')}{pendingNow.length > 6 ? '…' : ''}</span></p>}
                <p className="text-[10px] text-slate-500 mt-2">Lo que sincronizaste, la app lo recordará en la próxima factura.</p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => { onClose(); navigate('/mercado'); tick(n => n + 1); }} className="h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold">Ver mi lista</button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={closeMarket} className="h-12 rounded-2xl bg-brand-lime text-brand-ink font-extrabold">Cerrar mercado</motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
