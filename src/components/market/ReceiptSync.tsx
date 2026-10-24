/**
 * ════════════════════════════════════════════════════════════════════
 * 🧾⇄🛒 SINCRONIZAR LA FACTURA CON LA LISTA DEL MERCADO (avisos arriba)
 * ────────────────────────────────────────────────────────────────────
 * Sale sola después de guardar una factura de Mercado si hay productos por comprar.
 * Mismo diseño de tarjeta que los avisos de Préstamos (franja de color + ícono redondo + botones grandes).
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
import { Check, X, Plus, Link2, ListChecks, ShoppingCart } from 'lucide-react';
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
  const pct = total ? Math.round((Math.min(i, total) / total) * 100) : 100;
  // Colores y textos de la franja según el paso
  const head = done
    ? { grad: 'from-lime-200 via-lime-300 to-emerald-500', label: '✅ LISTA SINCRONIZADA', ring: '#C6F432' }
    : step?.kind === 'confirmar'
      ? { grad: 'from-amber-200 via-amber-300 to-orange-500', label: '🧾 ¿ES EL MISMO PRODUCTO?', ring: '#FB923C' }
      : { grad: 'from-sky-200 via-sky-300 to-blue-500', label: '🛒 NO ESTÁ EN TU LISTA', ring: '#7DD3FC' };
  const iconCat = done ? null : step?.kind === 'confirmar' ? categoryOf(step.item.name) : step ? guessCategory(expandReceiptName(step.r.name)) : null;

  return createPortal(
    <AnimatePresence>
      {data && (
        <motion.div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div key={done ? 'fin' : `${i}-${choosing}`} role="dialog" aria-modal="true" aria-labelledby="sync-title"
            initial={{ y: -60, scale: 0.9, opacity: 0, rotate: -2 }} animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 17, stiffness: 240 }}
            className="theme-dark relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[30px] bg-[#121938] border border-white/10 shadow-2xl shadow-black/60">
            {/* Franja de color */}
            <div className={`relative px-5 pt-4 pb-10 bg-gradient-to-br ${head.grad}`}>
              <div aria-hidden="true" className="absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/25 blur-2xl" />
              <div className="relative flex items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold tracking-widest text-[#0B1026]">{head.label}</p>
                <button onClick={onClose} aria-label="Cerrar" className="p-1 text-[#0B1026]/70"><X size={18} /></button>
              </div>
              <div className="relative flex flex-wrap gap-1.5 mt-2">
                {!done && total > 0 && <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#0B1026] text-white">{i + 1} DE {total}</span>}
                {auto.length > 0 && <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white/60 text-[#0B1026]">✓ {auto.length} {auto.length === 1 ? 'SE TACHÓ SOLO' : 'SE TACHARON SOLOS'}</span>}
                {data.store && <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white/40 text-[#0B1026]">{data.store.toUpperCase()}</span>}
              </div>
            </div>

            {/* Ícono redondo con el avance */}
            <div className="relative -mt-9 flex justify-center">
              <motion.div initial={{ rotateY: 180, scale: 0.6 }} animate={{ rotateY: 0, scale: 1 }} transition={{ delay: 0.12, duration: 0.55 }}
                className="w-[76px] h-[76px] rounded-full p-[4px]" style={{ background: `conic-gradient(${head.ring} ${pct * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}>
                <div className="w-full h-full rounded-full bg-[#121938] flex items-center justify-center">
                  {done ? <Check size={34} strokeWidth={3} className="text-brand-lime" /> : iconCat ? <CategoryIcon id={iconCat} size={28} /> : <ShoppingCart size={28} className="text-sky-300" />}
                </div>
              </motion.div>
            </div>

            <div className="px-5 pb-5 pt-2 text-center">
              {/* 1) ¿Es el mismo? */}
              {!done && step?.kind === 'confirmar' && (<>
                <div className="mx-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F4F1E8] text-[#1F1D18] font-mono font-bold text-xs">
                  <span className="opacity-60">FACTURA</span><span className="truncate max-w-[170px]">{step.r.name.toUpperCase()}</span>
                </div>
                <h2 id="sync-title" className="text-white text-lg font-extrabold mt-3">¿Es <span className="text-orange-300">{step.item.name}</span> de tu lista?</h2>
                <p className="text-[34px] font-extrabold leading-tight tracking-tight text-orange-300">{formatCOP(unitOf(step.r))}</p>
                <p className="text-xs text-slate-300">Si dices que sí, se tacha con este precio y la próxima vez lo cruzo solo.</p>
                <div className="mt-5 space-y-2">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => yes(step)} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-500 text-[#1A1200] font-extrabold flex items-center justify-center gap-2"><Check size={19} strokeWidth={3} /> Sí, es el mismo</motion.button>
                  <button onClick={() => no(step)} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold">No, es otro producto</button>
                </div>
              </>)}

              {/* 2) No está en la lista */}
              {!done && step?.kind === 'nuevo' && (<>
                <div className="mx-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F4F1E8] text-[#1F1D18] font-mono font-bold text-xs">
                  <span className="opacity-60">FACTURA</span><span className="truncate max-w-[170px]">{step.r.name.toUpperCase()}</span>
                </div>
                <h2 id="sync-title" className="text-white text-lg font-extrabold mt-3"><span className="text-sky-300">{pretty(expandReceiptName(step.r.name) || step.r.name)}</span> no estaba en tu lista</h2>
                <p className="text-[34px] font-extrabold leading-tight tracking-tight text-sky-300">{formatCOP(unitOf(step.r))}</p>
                <p className="text-xs text-slate-300">Va en {CATEGORIES.find(c => c.id === guessCategory(expandReceiptName(step.r.name)))?.label}</p>
                {!choosing ? (
                  <div className="mt-5 space-y-2">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => incorporate(step.r)} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-300 to-blue-500 text-[#06122B] font-extrabold flex items-center justify-center gap-2"><Plus size={19} strokeWidth={3} /> Incorporar a la lista</motion.button>
                    {pendingNow.length > 0 && <button onClick={() => setChoosing(true)} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold flex items-center justify-center gap-2"><Link2 size={17} /> Es uno de mi lista</button>}
                  </div>
                ) : (
                  <div className="mt-4 text-left">
                    <p className="text-xs text-slate-300 mb-2 text-center">¿A cuál de tu lista corresponde?</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
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
              </>)}

              {/* 3) Resumen */}
              {done && (<>
                <h2 id="sync-title" className="text-white text-xl font-extrabold">¡Tu lista quedó al día!</h2>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[[auto.length + linked, 'tachados', 'text-brand-lime'], [added, 'incorporados', 'text-sky-300'], [pendingNow.length, 'por comprar', 'text-orange-300']].map(([v, l, c]) => (
                    <div key={l as string} className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 py-2.5"><p className={`text-2xl font-extrabold ${c}`}>{v}</p><p className="text-[10px] text-slate-400">{l}</p></div>
                  ))}
                </div>
                {pendingNow.length > 0 && <p className="text-xs text-slate-300 mt-3 flex items-start gap-1.5 text-left"><ListChecks size={14} className="shrink-0 mt-0.5 text-slate-400" /><span><strong className="text-white">Falta comprar:</strong> {pendingNow.slice(0, 6).map(x => x.name).join(', ')}{pendingNow.length > 6 ? '…' : ''}</span></p>}
                <div className="mt-5 space-y-2">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={closeMarket} className="w-full py-3.5 rounded-2xl bg-brand-lime text-brand-ink font-extrabold flex items-center justify-center gap-2"><Check size={19} strokeWidth={3} /> Cerrar y guardar el mercado</motion.button>
                  <button onClick={() => { onClose(); navigate('/mercado'); tick(n => n + 1); }} className="w-full h-12 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 text-white font-bold">Ver mi lista</button>
                </div>
                <p className="text-[10px] text-slate-500 mt-3">Lo que sincronizaste, la app lo recordará en la próxima factura.</p>
              </>)}

              {!done && step?.kind === 'nuevo' && !choosing && <button onClick={next} className="mt-3 text-xs font-bold text-slate-400">Omitir este producto</button>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
