/**
 * ════════════════════════════════════════════════════════════════════
 * 🎙️ DICTAR POR VOZ (hoja con micrófono animado)
 * ────────────────────────────────────────────────────────────────────
 * Dos usos:
 *   kind="market"   → Mercado: "dos libras de arroz, leche y huevos".
 *                     Planear: agrega a la lista (sin repetir lo que ya está).
 *                     Comprando: tacha lo que estaba en la lista con su precio;
 *                     lo que no estaba aparece como ANTOJO y tú decides Sí / No.
 *   kind="movement" → Registro rápido: "gasté 25 mil en almuerzo".
 *                     Llena el formulario para que lo revises y guardes.
 * Siempre puedes corregir el texto a mano antes de confirmar.
 * Entender la frase: services/voice/parseVoice.ts · Micrófono: services/voice/speech.ts
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, X, Sparkles, ListChecks, ShoppingCart, Check, Keyboard, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import BottomSheet from '../ui/BottomSheet';
import MoneyInput from '../ui/MoneyInput';
import { useDictation } from './useDictation';
import { parseMarket, parseMovement, type VoiceItem, type VoiceMovement } from '../../services/voice/parseVoice';
import {
  addItem, checkItem, listItems, matchPending, lastPrice, lastPriceAt, norm, unitLabel, type ListItem,
} from '../../services/market/marketStore';
import { fmtQty } from '../market/QtyUnit';
import { formatCOP } from '../../utils/format';
import { guessCategory } from '../../utils/categories';
import { notify } from '../../services/notificationService';

type Props =
  | { kind: 'market'; open: boolean; onClose: () => void; marketMode: 'plan' | 'shop'; store?: string; onAdded?: (ids: string[]) => void }
  | { kind: 'movement'; open: boolean; onClose: () => void; onMovement: (m: VoiceMovement) => void };

const EXAMPLES = {
  plan: ['dos libras de arroz, leche y huevos', 'media de queso y un paquete de café', 'tres kilos de papa y una docena de huevos'],
  shop: ['leche a 4.500', 'dos libras de carne a 14 mil', 'arroz a 3.200 y pan en 3 mil'],
  movement: ['gasté 25 mil en almuerzo', 'pagué la luz 145.300', 'me pagaron la quincena 1.200.000'],
};

// ═══ SECCIÓN: Micrófono animado ═══
function MicOrb({ listening, onClick, disabled }: { listening: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="relative flex items-center justify-center h-36">
      {listening && [0, 1, 2].map(i => (
        <motion.span key={i} className="absolute w-24 h-24 rounded-full bg-brand-lime/25" aria-hidden="true"
          initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }} />
      ))}
      <motion.button onClick={onClick} disabled={disabled} whileTap={{ scale: 0.9 }} aria-label={listening ? 'Dejar de escuchar' : 'Empezar a dictar'} aria-pressed={listening}
        animate={listening ? { scale: [1, 1.06, 1] } : { scale: 1 }} transition={listening ? { duration: 1.2, repeat: Infinity } : {}}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-colors disabled:opacity-40 ${listening ? 'bg-brand-lime shadow-lime-400/40' : 'bg-gradient-to-br from-[#2A346A] to-[#121A3E] ring-2 ring-brand-lime/50 shadow-black/40'}`}>
        {listening ? <Square size={30} className="text-brand-ink" fill="currentColor" /> : <Mic size={40} className="text-brand-lime" />}
      </motion.button>
    </div>
  );
}

/** Barras que "bailan" mientras escucha. */
const Wave = () => (
  <span className="inline-flex items-end gap-[3px] h-4" aria-hidden="true">
    {[0, 1, 2, 3, 4].map(i => <motion.span key={i} className="w-[3px] rounded-full bg-brand-lime" animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }} />)}
  </span>
);

export default function VoiceSheet(props: Props) {
  const { open, onClose } = props;
  const d = useDictation();
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [skipExtra, setSkipExtra] = useState<Set<number>>(new Set());
  const [prices, setPrices] = useState<Record<number, number>>({});
  const [movType, setMovType] = useState<'expense' | 'income' | null>(null);

  // Al abrir: limpia y empieza a escuchar de una vez.
  useEffect(() => {
    if (!open) { d.reset(); return; }
    setRemoved(new Set()); setSkipExtra(new Set()); setPrices({}); setMovType(null);
    if (d.supported) { const t = setTimeout(d.start, 350); return () => clearTimeout(t); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shop = props.kind === 'market' && props.marketMode === 'shop';
  const store = props.kind === 'market' ? props.store ?? '' : '';
  const examples = props.kind === 'movement' ? EXAMPLES.movement : EXAMPLES[shop ? 'shop' : 'plan'];

  // ═══ SECCIÓN: Lo que entendimos ═══
  type Row = VoiceItem & { idx: number; match: ListItem | null; dup: ListItem | null; suggested: number | null };
  const rows: Row[] = useMemo(() => {
    if (props.kind !== 'market') return [];
    const current = listItems();
    return parseMarket(d.text).map((it, idx) => {
      const match = shop ? matchPending(it.name) : null;
      const dup = !shop ? current.find(i => !i.checked && norm(i.name) === norm(it.name)) ?? null : null;
      const name = match?.name ?? it.name;
      const suggested = lastPriceAt(name, store) ?? lastPrice(name);
      // Al comprar, si no dijiste cantidad ("arroz a 3.200"), usamos la de tu lista (2 lb).
      const fromList = match && !it.said ? { qty: match.qty, unit: match.unit } : {};
      return { ...it, ...fromList, idx, match, dup, suggested };
    });
  }, [d.text, props.kind, shop, store]);
  const visible = rows.filter(r => !removed.has(r.idx));
  const priceOf = (r: Row) => prices[r.idx] ?? r.price ?? 0;

  const movement = useMemo(() => (props.kind === 'movement' ? parseMovement(d.text) : null), [d.text, props.kind]);
  const type = movType ?? movement?.type ?? 'expense';

  // ═══ SECCIÓN: Confirmar ═══
  const confirmMarket = () => {
    if (props.kind !== 'market') return;
    const ids: string[] = [];
    let skipped = 0, extras = 0, noPrice = 0;
    for (const r of visible) {
      if (!shop) {
        if (r.dup) { skipped++; continue; }
        ids.push(addItem({ name: r.name, qty: r.qty, unit: r.unit }).id);
        continue;
      }
      const p = priceOf(r);
      if (!p) { noPrice++; continue; }
      if (r.match) { checkItem(r.match.id, p, r.qty, r.unit); ids.push(r.match.id); }
      else if (!skipExtra.has(r.idx)) { ids.push(addItem({ name: r.name, qty: r.qty, unit: r.unit, checked: true, paid: p, extra: true }).id); extras++; }
    }
    if (!ids.length) {
      return notify({ title: noPrice ? 'Falta el precio' : 'No hay nada nuevo', message: noPrice ? 'Escribe cuánto costó cada producto o dilo así: "leche a 4.500".' : skipped ? 'Eso ya estaba en tu lista.' : 'Dicta o escribe al menos un producto.', type: 'info', log: false });
    }
    notify({
      title: shop ? `${ids.length} ${ids.length === 1 ? 'producto' : 'productos'} al carrito` : `${ids.length} ${ids.length === 1 ? 'producto agregado' : 'productos agregados'}`,
      message: [extras ? `${extras} como antojo` : '', skipped ? `${skipped} ya ${skipped === 1 ? 'estaba' : 'estaban'} en la lista` : '', noPrice ? `${noPrice} sin precio no se agregó` : ''].filter(Boolean).join(' · ') || 'Por voz 🎤',
      type: 'success', log: false,
    });
    props.onAdded?.(ids);
    onClose();
  };

  const confirmMovement = () => {
    if (props.kind !== 'movement' || !movement) return;
    props.onMovement({ ...movement, type });
    onClose();
  };

  // ═══ SECCIÓN: Dibujo ═══
  const title = props.kind === 'movement' ? 'Dictar un movimiento' : shop ? 'Dictar lo que echas al carrito' : 'Dictar la lista';
  return (
    <BottomSheet open={open} onClose={onClose} title={title} subtitle={d.supported ? 'Habla normal, como le dirías a alguien' : 'Escribe o usa el micrófono de tu teclado'} icon={<Mic size={22} />} labelId="mf-voice-title">
      {d.supported && <MicOrb listening={d.listening} onClick={d.toggle} />}
      <p className="text-center text-xs text-slate-400 -mt-1 mb-3 h-4 flex items-center justify-center gap-2" aria-live="polite">
        {d.listening ? <><Wave /> Te escucho… toca el botón para terminar</> : d.supported ? (d.text ? 'Toca el micrófono para seguir dictando' : 'Toca el micrófono y habla') : ''}
      </p>

      {/* Texto dictado (editable) */}
      <div className="relative">
        <textarea value={d.text} onChange={e => d.setText(e.target.value)} rows={2} aria-label="Texto dictado"
          placeholder={`Ej: ${examples[0]}`}
          className="w-full px-4 py-3 pr-10 rounded-2xl bg-white/5 border border-white/10 text-white text-[15px] leading-snug outline-none focus:border-brand-lime resize-none" />
        {d.text && <button onClick={d.reset} aria-label="Borrar texto" className="absolute right-2.5 top-2.5 p-1 text-slate-400"><X size={16} /></button>}
      </div>
      {!d.supported && <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1"><Keyboard size={12} /> En tu teclado toca el ícono 🎤 para dictar aquí.</p>}

      {!d.text && (
        <div className="mt-3">
          <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1"><Sparkles size={11} className="text-brand-lime" /> Puedes decir, por ejemplo:</p>
          <div className="flex flex-wrap gap-1.5">
            {examples.map(e => <span key={e} className="text-[11px] text-slate-200 bg-white/[0.05] ring-1 ring-white/10 rounded-full px-2.5 py-1">"{e}"</span>)}
          </div>
        </div>
      )}

      {/* Vista previa: Mercado */}
      {props.kind === 'market' && visible.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-slate-400 tracking-wide mb-2 flex items-center gap-1"><ListChecks size={13} /> ENTENDIMOS · {visible.length}</p>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {visible.map(r => {
                const extra = shop && !r.match;
                const off = extra && skipExtra.has(r.idx);
                return (
                  <motion.li key={r.idx} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }}
                    className={`p-3 rounded-2xl border ${off ? 'opacity-50 bg-white/[0.02] border-white/5' : extra ? 'bg-amber-400/[0.06] border-amber-400/25' : 'bg-white/[0.04] border-white/10'}`}>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 min-w-0">
                        <span className="text-white font-semibold text-sm flex items-center gap-1.5 truncate">
                          {r.match?.name ?? r.name}
                          {r.match && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-lime/15 text-brand-lime">SE TACHA</span>}
                          {extra && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300">ANTOJO</span>}
                          {r.dup && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300">YA ESTÁ</span>}
                        </span>
                        <span className="block text-[11px] text-slate-400">{fmtQty(r.qty)} {unitLabel(r.unit)}{!shop && r.suggested ? ` · ≈ ${formatCOP(r.suggested * r.qty)}` : ''}</span>
                      </span>
                      <button onClick={() => setRemoved(s => new Set(s).add(r.idx))} aria-label={`Quitar ${r.name}`} className="p-1.5 text-slate-500"><X size={15} /></button>
                    </div>
                    {shop && (
                      <div className="flex items-center gap-2 mt-2">
                        <MoneyInput value={priceOf(r)} onChange={v => setPrices(p => ({ ...p, [r.idx]: v }))} prefix placeholder={r.suggested ? `Antes ${formatCOP(r.suggested)}` : `Precio por ${unitLabel(r.unit)}`}
                          ariaLabel={`Precio de ${r.name}`} className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-brand-lime" />
                        {!priceOf(r) && r.suggested && <button onClick={() => setPrices(p => ({ ...p, [r.idx]: r.suggested! }))} className="shrink-0 px-2.5 h-10 rounded-xl bg-white/[0.06] text-[11px] text-slate-200 font-semibold">Igual que antes</button>}
                      </div>
                    )}
                    {extra && (
                      <div className="flex items-center gap-2 mt-2 text-[11px]">
                        <span className="text-amber-200/90 flex-1">No estaba en tu lista. ¿Lo agregamos?</span>
                        <button onClick={() => setSkipExtra(s => { const n = new Set(s); n.delete(r.idx); return n; })} className={`px-2.5 py-1 rounded-full font-bold ${!off ? 'bg-amber-300 text-brand-ink' : 'bg-white/[0.06] text-slate-300'}`}>Sí</button>
                        <button onClick={() => setSkipExtra(s => new Set(s).add(r.idx))} className={`px-2.5 py-1 rounded-full font-bold ${off ? 'bg-white/80 text-brand-ink' : 'bg-white/[0.06] text-slate-300'}`}>No</button>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {/* Vista previa: Gasto / ingreso */}
      {props.kind === 'movement' && movement && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {([['expense', 'Gasto', ArrowDownCircle, 'bg-rose-500 text-white'], ['income', 'Ingreso', ArrowUpCircle, 'bg-emerald-400 text-brand-ink']] as const).map(([id, label, Icon, on]) => (
              <button key={id} onClick={() => setMovType(id)} aria-pressed={type === id} className={`h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${type === id ? on : 'bg-white/[0.05] text-slate-300'}`}><Icon size={16} />{label}</button>
            ))}
          </div>
          <p className={`text-3xl font-extrabold text-center ${type === 'income' ? 'text-emerald-300' : 'text-white'}`}>{formatCOP(movement.amount)}</p>
          <p className="text-center text-white text-sm mt-1">{movement.description}</p>
          <p className="text-center text-[11px] text-slate-400 mt-0.5">Categoría: {guessCategory(movement.description, type) ?? (type === 'income' ? 'Otros ingresos' : 'Otros')}</p>
        </motion.div>
      )}
      {props.kind === 'movement' && d.text && !movement && !d.listening && (
        <p className="mt-3 text-xs text-amber-200">No encontramos el valor. Dilo así: "gasté 25 mil en almuerzo".</p>
      )}

      {/* Botón final */}
      {d.text && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }}
          onClick={props.kind === 'movement' ? confirmMovement : confirmMarket}
          disabled={props.kind === 'movement' ? !movement : !visible.length}
          className="mt-4 w-full h-14 rounded-2xl bg-brand-lime text-brand-ink font-extrabold text-base flex items-center justify-center gap-2 disabled:opacity-40">
          {props.kind === 'movement' ? <><Check size={20} strokeWidth={3} /> Revisar y guardar</>
            : shop ? <><ShoppingCart size={19} /> Echar al carrito ({visible.filter(r => !skipExtra.has(r.idx) || r.match).length})</>
            : <><ListChecks size={19} /> Agregar a la lista ({visible.filter(r => !r.dup).length})</>}
        </motion.button>
      )}
      <p className="text-[10px] text-slate-500 text-center mt-3">🔒 El audio lo convierte en texto el servicio de voz de tu celular. Mi Finanzas no graba ni guarda tu voz.</p>
    </BottomSheet>
  );
}
