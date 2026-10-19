/**
 * ════════════════════════════════════════════════════════════════════
 * 🗂️ HISTORIAL DE MERCADOS y 💲 HISTORIAL DE PRECIOS
 * ────────────────────────────────────────────────────────────────────
 * TripsHistory: cada mercado cerrado (fecha, quién, total, antojos, faltantes).
 * PricesHistory: cada producto con su último precio y si 🔻 bajó / 🔺 subió / 🟰 igual,
 *               el precio en cada tienda (la más barata marcada) y la vista "Tiendas"
 *               con el ranking de dónde te sale más barato.
 * Dónde se ve: Mercado → pestañas "Historial" y "Precios".
 * Datos: marketStore.ts (se comparten con el hogar si está creado).
 * ════════════════════════════════════════════════════════════════════
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trash2, Receipt, Search, Sparkles, User, Crown, Store, Package } from 'lucide-react';
import { deleteTrip, knownProducts, norm, priceHistory, pricesByStore, storeRanking, setTripStore, unitLabel, type Trip } from '../../services/market/marketStore';
import StoreBadge from './StoreBadge';
import StorePicker from './StorePicker';
import { formatCOP } from '../../utils/format';
import TrendBadge from './TrendBadge';
import { fmtQty } from './QtyUnit';
import { askConfirm } from '../ui/ConfirmDialog';

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/** Precio de un producto en el mercado anterior a la fecha dada. */
const previousPrice = (name: string, beforeISO: string) => priceHistory(name).find(p => p.date < beforeISO)?.price ?? null;

const Empty = ({ text }: { text: string }) => (
  <div className="text-center py-12">
    <span className="w-16 h-16 mx-auto rounded-3xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center"><Receipt className="text-slate-400" size={28} /></span>
    <p className="text-slate-400 text-sm mt-3 max-w-[16rem] mx-auto">{text}</p>
  </div>
);

// ═══ SECCIÓN: Historial de mercados ═══
export function TripsHistory({ trips }: { trips: Trip[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!trips.length) return <Empty text="Cuando termines tu primer mercado, aquí quedará con todos sus productos y precios." />;
  const months = new Map<string, Trip[]>();
  for (const t of trips) { const k = t.date.slice(0, 7); months.set(k, [...(months.get(k) ?? []), t]); }

  return (
    <div className="space-y-5">
      {[...months].map(([month, list]) => (
        <section key={month}>
          <div className="flex items-baseline justify-between mb-2 px-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">{new Date(month + '-15').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</p>
            <p className="text-xs text-slate-400">{list.length} {list.length === 1 ? 'mercado' : 'mercados'} · <strong className="text-white">{formatCOP(list.reduce((s, t) => s + t.total, 0))}</strong></p>
          </div>
          <ul className="space-y-2">
            {list.map(t => {
              const extras = t.items.filter(i => i.extra);
              const isOpen = open === t.id;
              return (
                <li key={t.id} className="rounded-2xl bg-surface border border-white/5 overflow-hidden">
                  <button onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen} className="w-full flex items-center gap-3 p-3.5 text-left">
                    <span className="relative">
                      <span className="w-11 h-11 shrink-0 rounded-2xl bg-brand-lime/15 ring-1 ring-brand-lime/30 flex flex-col items-center justify-center leading-none">
                        <span className="text-brand-lime font-extrabold text-sm">{new Date(t.date).getDate()}</span>
                        <span className="text-[9px] text-slate-300 uppercase">{new Date(t.date).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
                      </span>
                      {t.store && <StoreBadge name={t.store} size={22} className="!absolute -right-1.5 -bottom-1.5 ring-2 ring-surface" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-white font-bold">{formatCOP(t.total)}</span>
                      <span className="block text-[11px] text-slate-400 truncate">{t.store ? `${t.store} · ` : ''}{t.items.length} productos{extras.length ? ` · ${extras.length} antojo${extras.length > 1 ? 's' : ''}` : ''}{t.by ? ` · ${t.by}` : ''}</span>
                    </span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={18} className="text-slate-500" /></motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-3.5 pb-3.5">
                          <p className="text-[11px] text-slate-400 mb-2 capitalize">{dateLabel(t.date)}{t.by && <> · <User size={10} className="inline -mt-0.5" /> {t.by}</>}</p>
                          <ul className="divide-y divide-white/5">
                            {t.items.map((i, n) => {
                              const prev = previousPrice(i.name, t.date);
                              const trend = prev && i.price ? { dir: i.price < prev ? 'down' : i.price > prev ? 'up' : 'same', diff: i.price - prev, pct: Math.round(Math.abs(i.price - prev) / prev * 100), before: prev } as const : null;
                              return (
                                <li key={n} className="flex items-center gap-2 py-2">
                                  <span className="flex-1 min-w-0">
                                    <span className="text-sm text-white truncate flex items-center gap-1.5">{i.name}{i.extra && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300">ANTOJO</span>}</span>
                                    <span className="block text-[11px] text-slate-400">{fmtQty(i.qty)} {unitLabel(i.unit)} × {formatCOP(i.price)}</span>
                                  </span>
                                  <TrendBadge trend={trend} compact />
                                  <span className="text-sm font-bold text-white w-20 text-right">{formatCOP(i.price * i.qty)}</span>
                                </li>
                              );
                            })}
                          </ul>
                          {t.missing.length > 0 && <p className="text-[11px] text-slate-400 mt-2">Quedó sin comprar: {t.missing.join(', ')}</p>}
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1"><Store size={11} /> {t.store ? 'Tienda (toca para cambiarla)' : '¿Dónde fue este mercado? (para comparar precios)'}</p>
                            <StorePicker value={t.store ?? ''} onChange={s => setTripStore(t.id, s)} />
                          </div>
                          <button onClick={async () => { if (await askConfirm({ title: '¿Borrar este mercado del historial?', message: 'El gasto que ya está en Finanzas no se borra.', icon: 'trash', tone: 'danger', confirmText: 'Sí, borrar' })) deleteTrip(t.id); }}
                            className="mt-3 text-xs text-rose-300 font-semibold flex items-center gap-1"><Trash2 size={13} /> Borrar del historial</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ═══ SECCIÓN: Mini gráfica de precios ═══
const Spark = ({ values }: { values: number[] }) => {
  if (values.length < 2) return null;
  const v = [...values].reverse(); // antiguo → reciente
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1;
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 100},${28 - ((x - min) / span) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 100 32" className="w-full h-10" aria-hidden="true" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#C6F432" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

// ═══ SECCIÓN: Historial de precios ═══
export function PricesHistory() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<'productos' | 'tiendas'>('productos');
  const products = useMemo(() => knownProducts(), []);
  const shown = products.filter(p => norm(p.name).includes(norm(q)));
  if (!products.length) return <Empty text="Aquí verás cómo cambian los precios de lo que compras: 🔻 bajó, 🔺 subió o 🟰 sigue igual." />;

  return (
    <div>
      <div className="grid grid-cols-2 gap-1 bg-white/[0.04] ring-1 ring-white/10 p-1 rounded-2xl mb-3" role="tablist">
        {([['productos', 'Por producto', Package], ['tiendas', 'Por tienda', Store]] as const).map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)} className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${view === id ? 'bg-white/[0.12] text-white' : 'text-slate-400'}`}><Icon size={14} />{label}</button>
        ))}
      </div>
      {view === 'tiendas' ? <StoresView /> : <>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto"
          className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-lime" />
      </div>
      <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1 px-1"><Sparkles size={11} className="text-brand-lime" /> Comparado con la compra anterior de cada producto</p>
      <ul className="space-y-2">
        {shown.map(p => {
          const h = priceHistory(p.name);
          const [now, before] = [h[0]?.price, h[1]?.price];
          const trend = now && before ? { dir: now < before ? 'down' : now > before ? 'up' : 'same', diff: now - before, pct: Math.round(Math.abs(now - before) / before * 100), before } as const : null;
          const isOpen = open === p.name;
          return (
            <li key={p.name} className="rounded-2xl bg-surface border border-white/5">
              <button onClick={() => setOpen(isOpen ? null : p.name)} aria-expanded={isOpen} className="w-full flex items-center gap-3 p-3.5 text-left">
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-semibold truncate">{p.name}</span>
                  <span className="block text-[11px] text-slate-400">Comprado {p.times} {p.times === 1 ? 'vez' : 'veces'}</span>
                </span>
                <span className="text-right">
                  <span className="block text-white font-bold">{formatCOP(now ?? p.price)}</span>
                  <span className="block text-[10px] text-slate-400">por {unitLabel(h[0]?.unit ?? p.unit)}</span>
                </span>
                {trend ? <TrendBadge trend={trend} compact /> : <span className="text-[10px] text-slate-500 w-12 text-center">nuevo</span>}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-3.5 pb-3.5">
                      <ByStore name={p.name} />
                      <Spark values={h.slice(0, 10).map(x => x.price)} />
                      <ul className="mt-1 space-y-1">
                        {h.slice(0, 8).map((x, i) => {
                          const older = h[i + 1]?.price;
                          const t = older ? { dir: x.price < older ? 'down' : x.price > older ? 'up' : 'same', diff: x.price - older, pct: Math.round(Math.abs(x.price - older) / older * 100), before: older } as const : null;
                          return (
                            <li key={i} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 capitalize flex items-center gap-1.5 min-w-0">{x.store && <StoreBadge name={x.store} size={16} />}<span className="truncate">{dateLabel(x.date)}</span></span>
                              <span className="flex items-center gap-2"><TrendBadge trend={t} compact /><span className="text-white font-bold">{formatCOP(x.price)}</span></span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      </>}
    </div>
  );
}

// ═══ SECCIÓN: Precio de un producto en cada tienda ═══
function ByStore({ name }: { name: string }) {
  const list = pricesByStore(name);
  if (!list.length) return null;
  const max = list[list.length - 1].price;
  return (
    <div className="mb-2">
      <p className="text-[11px] text-slate-400 mb-1.5">Último precio en cada tienda</p>
      <ul className="space-y-1.5">
        {list.map((s, i) => (
          <li key={s.store} className={`flex items-center gap-2 p-2 rounded-xl ${i === 0 && list.length > 1 ? 'bg-emerald-500/[0.08] ring-1 ring-emerald-400/25' : 'bg-white/[0.03]'}`}>
            <StoreBadge name={s.store} size={26} />
            <span className="flex-1 min-w-0">
              <span className="text-xs text-white font-semibold flex items-center gap-1 truncate">{s.store}{i === 0 && list.length > 1 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center gap-0.5"><Crown size={9} />MÁS BARATO</span>}</span>
              <span className="block text-[10px] text-slate-500 capitalize">{dateLabel(s.date)}</span>
            </span>
            <span className="text-right">
              <span className="block text-sm font-bold text-white">{formatCOP(s.price)}</span>
              {i === 0 && list.length > 1 && max > s.price && <span className="block text-[10px] text-emerald-300">Ahorras {formatCOP(max - s.price)}</span>}
            </span>
          </li>
        ))}
      </ul>
      {list.length === 1 && <p className="text-[10px] text-slate-500 mt-1.5">Cuando lo compres en otra tienda, te diremos dónde sale más barato.</p>}
    </div>
  );
}

// ═══ SECCIÓN: Ranking de tiendas ═══
function StoresView() {
  const ranking = useMemo(() => storeRanking(), []);
  if (!ranking.length) return <Empty text="Cuando termines un mercado y elijas dónde compraste, aquí verás en qué tienda te sale más barato cada cosa." />;
  const comparable = ranking.some(r => r.compared > 0);
  const best = ranking[0];
  return (
    <div className="space-y-3">
      {comparable && best.wins > 0 && (
        <div className="theme-dark relative overflow-hidden rounded-[24px] p-4 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20">
          <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-lime-300/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <StoreBadge name={best.store} size={52} />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-300 flex items-center gap-1"><Crown size={12} className="text-brand-lime" /> Donde más te rinde la plata</p>
              <p className="text-white text-xl font-extrabold truncate">{best.store}</p>
              <p className="text-[11px] text-slate-300">Más barato en {best.wins} de {best.compared} productos que comparaste</p>
            </div>
          </div>
        </div>
      )}
      {!comparable && <p className="text-[11px] text-slate-400 px-1">Para comparar, compra el mismo producto en al menos dos tiendas distintas.</p>}
      <ul className="space-y-2">
        {ranking.map((r, i) => (
          <li key={r.store} className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-white/5">
            <span className="w-5 text-center text-xs font-bold text-slate-500">{i + 1}</span>
            <StoreBadge name={r.store} size={40} />
            <span className="flex-1 min-w-0">
              <span className="block text-white font-semibold truncate">{r.store}</span>
              <span className="block text-[11px] text-slate-400">{r.trips} {r.trips === 1 ? 'mercado' : 'mercados'} · {formatCOP(r.spent)}</span>
            </span>
            {r.compared > 0 && (
              <span className="text-right">
                <span className="block text-sm font-bold text-emerald-300">{r.wins}/{r.compared}</span>
                <span className="block text-[10px] text-slate-400">más barato</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
