/**
 * ════════════════════════════════════════════════════════════════════
 * 🛒 PANTALLA MERCADO
 * ────────────────────────────────────────────────────────────────────
 * Pestañas: Lista · Historial · Precios.
 * Lista tiene dos modos:
 *   🏠 Planear   → armar la lista en casa (sin precios) con total aproximado.
 *   🛒 Comprando → en el súper: escribes lo que echas al carrito con su precio,
 *                  si estaba en la lista se tacha solo; si no, sale el aviso
 *                  "Producto adicional" (Sí lo agrega / No lo borra).
 * Datos: services/market/marketStore.ts · Hogar: services/household/householdSync.ts
 * Piezas: components/market/* (ItemSheet, FinishSheet, MarketHistory, TrendBadge, QtyUnit)
 * ════════════════════════════════════════════════════════════════════
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Pencil, ShoppingBasket, Sparkles, ShoppingCart, ClipboardList, History, Tag, Repeat, X, ListChecks, Users } from 'lucide-react';
import ModuleHeader from '../components/ui/ModuleHeader';
import MoneyInput from '../components/ui/MoneyInput';
import { usePageTour } from '../components/tour/Tour';
import { askConfirm } from '../components/ui/ConfirmDialog';
import { notify } from '../services/notificationService';
import { formatCOP } from '../utils/format';
import {
  useMarket, addItem, checkItem, uncheckItem, removeItem, setBudget, matchPending, lastPrice, trendOf, knownProducts,
  estimateList, repeatLastTrip, norm, unitLabel, myName, type ListItem, type Unit, type Trip,
} from '../services/market/marketStore';
import { useHousehold } from '../services/household/householdSync';
import { HouseholdChip, openHousehold } from '../components/household/HouseholdSheet';
import { QtyStepper, UnitPicker, fmtQty } from '../components/market/QtyUnit';
import TrendBadge from '../components/market/TrendBadge';
import ItemSheet from '../components/market/ItemSheet';
import FinishSheet from '../components/market/FinishSheet';
import { TripsHistory, PricesHistory } from '../components/market/MarketHistory';

type Mode = 'plan' | 'shop';
type Tab = 'lista' | 'historial' | 'precios';
const MODE_KEY = 'mf_market_mode';
const BUDGET_PRESETS = [200000, 300000, 500000, 800000];

export default function MarketPage() {
  // ═══ SECCIÓN: Estado de la pantalla ═══
  const { items, trips, budget } = useMarket();
  const { household } = useHousehold();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'lista';
  const setTab = (t: Tab) => setParams(t === 'lista' ? {} : { tab: t }, { replace: true });
  const [mode, setModeState] = useState<Mode>(() => (localStorage.getItem(MODE_KEY) as Mode) || 'plan');
  const setMode = (m: Mode) => { setModeState(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* sin almacenamiento */ } };

  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<Unit>('und');
  const [price, setPrice] = useState(0);
  const [focused, setFocused] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [sheet, setSheet] = useState<{ item: ListItem; mode: 'check' | 'edit' } | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [celebrate, setCelebrate] = useState<Trip | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  usePageTour('mercado2', [
    { target: 'mk-mode', title: 'Dos momentos', text: 'En "Planear" armas la lista en casa, sin precios. En "Comprando" escribes lo que echas al carrito y se tacha solo de la lista.' },
    { target: 'mk-hero', title: 'Total aproximado', text: 'Con los precios de tus mercados anteriores te decimos cuánto costaría la lista. Es un aproximado: los precios cambian.' },
    { target: 'mk-composer', title: 'Agrega productos', text: 'Escribe el producto, la cantidad y la unidad (und, lb, kg…). Al comprar, si algo no estaba en la lista te preguntamos si lo agregas.' },
    { target: 'mk-list', title: 'Precios con flechitas', text: '🔻 verde: bajó frente a la última compra. 🔺 rojo: subió. 🟰 sigue igual.' },
    { target: 'mk-household', title: 'Comparte con tu hogar', text: 'Crea tu hogar y une a tu familia con un QR: la lista se actualiza en vivo en todos los celulares, cifrada.' },
  ]);

  // ═══ SECCIÓN: Cálculos ═══
  const pending = items.filter(i => !i.checked);
  const inCart = items.filter(i => i.checked);
  const cartTotal = inCart.reduce((s, i) => s + (i.paid || 0) * i.qty, 0);
  const extras = inCart.filter(i => i.extra);
  const extrasTotal = extras.reduce((s, i) => s + (i.paid || 0) * i.qty, 0);
  const est = useMemo(() => estimateList(items), [items]);
  const shown = mode === 'shop' ? cartTotal : est.total;
  const pct = budget > 0 ? (shown / budget) * 100 : 0;
  const left = budget - shown;
  const barColor = pct >= 100 ? 'from-rose-500 to-red-500' : pct >= 85 ? 'from-amber-300 to-orange-500' : 'from-lime-300 to-[#C6F432]';
  const known = useMemo(() => knownProducts(), [trips.length]);
  const me = myName();

  // Sugerencias mientras escribe: primero lo que está en la lista (al comprar), luego lo comprado antes.
  const q = norm(name);
  const suggestions = useMemo(() => {
    type Sug = { name: string; price: number | null; unit: Unit; inList?: ListItem };
    if (!q) return [] as Sug[];
    const fromList: Sug[] = mode === 'shop' ? pending.filter(i => norm(i.name).includes(q)).map(i => ({ name: i.name, price: lastPrice(i.name), unit: i.unit, inList: i })) : [];
    const taken = new Set([...items.map(i => norm(i.name))]);
    const fromKnown: Sug[] = known.filter(k => norm(k.name).includes(q) && !taken.has(norm(k.name))).map(k => ({ name: k.name, price: k.price, unit: k.unit }));
    return [...fromList, ...fromKnown].slice(0, 6);
  }, [q, mode, items, known]);
  const frequent = known.filter(k => !items.some(i => norm(i.name) === norm(k.name))).slice(0, 8);

  useEffect(() => { if (fresh) { const t = setTimeout(() => setFresh(null), 1600); return () => clearTimeout(t); } }, [fresh]);

  const reset = () => { setName(''); setQty(1); setUnit('und'); setPrice(0); };
  const pick = (s: { name: string; price: number | null; unit: Unit }) => {
    setName(s.name); setUnit(s.unit);
    if (mode === 'shop' && s.price) setPrice(s.price);
    nameRef.current?.focus();
  };

  // ═══ SECCIÓN: Agregar (planear) / Echar al carrito (comprando) ═══
  const submit = async () => {
    const clean = name.trim();
    if (!clean) { nameRef.current?.focus(); return notify({ title: mode === 'shop' ? '¿Qué echaste al carrito?' : '¿Qué hace falta comprar?', type: 'info', log: false }); }

    if (mode === 'plan') {
      const dup = items.find(i => !i.checked && norm(i.name) === norm(clean));
      if (dup) return notify({ title: `${dup.name} ya está en la lista`, message: `${fmtQty(dup.qty)} ${unitLabel(dup.unit)}. Tócalo para cambiar la cantidad.`, type: 'info', log: false });
      const it = addItem({ name: clean, qty, unit });
      setFresh(it.id); reset(); nameRef.current?.focus();
      return;
    }

    if (!price) return notify({ title: `¿Cuánto costó ${clean}?`, message: `Escribe el precio por ${unitLabel(unit)}.`, type: 'info', log: false });
    const match = matchPending(clean);
    if (match) {
      checkItem(match.id, price, qty, unit);
      const t = trendOf(match.name, price);
      notify({
        title: `${match.name} tachado de la lista`,
        message: `${fmtQty(qty)} ${unitLabel(unit)} × ${formatCOP(price)} = ${formatCOP(price * qty)}${t ? ` · ${t.dir === 'down' ? '↓ bajó' : t.dir === 'up' ? '↑ subió' : '= igual que antes'}${t.dir !== 'same' ? ` ${formatCOP(Math.abs(t.diff))}` : ''}` : ''}`,
        type: 'success', log: false,
      });
      setFresh(match.id); reset(); nameRef.current?.focus();
      return;
    }

    // Producto que no estaba en la lista → aviso bonito
    const subtotal = price * qty;
    const ok = await askConfirm({
      title: 'Producto adicional',
      message: `"${clean}" no estaba en tu lista de mercado. ¿Deseas agregarlo al mercado?`,
      icon: 'cart', confirmText: 'Sí, agregar', cancelText: 'No, quitarlo',
      details: (
        <div className="rounded-2xl bg-white/[0.05] ring-1 ring-white/10 p-3.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold truncate">{clean}</span>
            <span className="text-brand-lime font-extrabold">{formatCOP(subtotal)}</span>
          </div>
          <p className="text-[11px] text-slate-400">{fmtQty(qty)} {unitLabel(unit)} × {formatCOP(price)}</p>
          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1"><Sparkles size={11} className="text-amber-300" /> Antojos de este mercado</span>
            <span className="text-amber-300 font-bold">{formatCOP(extrasTotal)} → {formatCOP(extrasTotal + subtotal)}</span>
          </div>
        </div>
      ),
    });
    if (ok) {
      const it = addItem({ name: clean, qty, unit, checked: true, paid: price, extra: true });
      setFresh(it.id);
      notify({ title: `${clean} agregado como extra`, message: `Antojos: ${formatCOP(extrasTotal + subtotal)}`, type: 'warning', log: false });
    } else {
      notify({ title: 'Producto descartado', message: `${clean} no quedó registrado.`, type: 'info', log: false });
    }
    reset(); nameRef.current?.focus();
  };

  const repeat = () => {
    const n = repeatLastTrip();
    notify(n ? { title: `Agregamos ${n} productos`, message: 'Los de tu último mercado. Quita lo que no necesites.', type: 'success', log: false }
      : { title: 'Ya tienes todo en la lista', message: 'Lo de tu último mercado ya está agregado.', type: 'info', log: false });
  };

  const tapItem = (i: ListItem) => {
    if (i.checked) setSheet({ item: i, mode: 'edit' });
    else if (mode === 'shop') setSheet({ item: i, mode: 'check' });
    else setSheet({ item: i, mode: 'edit' });
  };
  const toggleBox = (i: ListItem) => {
    if (i.checked) { uncheckItem(i.id); return; }
    const p = lastPrice(i.name);
    if (mode === 'shop' || !p) setSheet({ item: i, mode: 'check' });
    else { checkItem(i.id, p); setFresh(i.id); }
  };

  // ═══ SECCIÓN: Fila de producto ═══
  const row = (i: ListItem) => {
    const p = i.checked ? i.paid : lastPrice(i.name);
    const trend = i.checked && i.paid ? trendOf(i.name, i.paid) : null;
    const isFresh = i.id === fresh;
    const other = household && i.addedBy && i.addedBy !== me ? i.addedBy : null;
    return (
      <motion.li key={i.id} layout
        initial={isFresh ? { opacity: 0, y: -24, scale: 0.92 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -120, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={async (_, info) => { if (info.offset.x < -110 && await askConfirm({ title: `¿Quitar ${i.name}?`, icon: 'trash', tone: 'danger', confirmText: 'Sí, quitar' })) removeItem(i.id); }}
        className={`relative flex items-center gap-3 p-3 rounded-2xl border ${i.checked ? (i.extra ? 'bg-amber-400/[0.05] border-amber-400/20' : 'bg-emerald-500/[0.05] border-emerald-500/20') : 'bg-surface border-white/5'} ${isFresh ? 'ring-2 ring-brand-lime/60' : ''}`}>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleBox(i)} aria-label={i.checked ? `Sacar ${i.name} del carrito` : `Tachar ${i.name}`}
          className={`w-9 h-9 shrink-0 rounded-xl border-2 flex items-center justify-center transition-colors ${i.checked ? 'bg-brand-lime border-brand-lime' : 'border-slate-600'}`}>
          <AnimatePresence>{i.checked && <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}><Check size={18} className="text-brand-ink" strokeWidth={3.2} /></motion.span>}</AnimatePresence>
        </motion.button>
        <button className="flex-1 min-w-0 text-left" onClick={() => tapItem(i)}>
          <span className="relative inline-flex max-w-full items-center gap-1.5">
            <span className={`text-white font-semibold truncate transition-opacity ${i.checked ? 'opacity-55' : ''}`}>{i.name}</span>
            {/* Línea animada del tachado */}
            <motion.span aria-hidden="true" className="absolute left-0 top-1/2 h-[2px] bg-brand-lime rounded-full" initial={false} animate={{ width: i.checked ? '100%' : '0%' }} transition={{ duration: 0.35, ease: 'easeOut' }} />
          </span>
          <span className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[11px] text-slate-400">{fmtQty(i.qty)} {unitLabel(i.unit)}{p ? ` · ${i.checked ? '' : '≈ '}${formatCOP(p)} c/u` : ' · sin precio aún'}</span>
            {i.extra && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300">ANTOJO</span>}
            {other && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.07] text-slate-300 flex items-center gap-0.5"><Users size={9} />{other}</span>}
            {trend && <TrendBadge trend={trend} compact />}
          </span>
        </button>
        <div className="text-right shrink-0">
          {p ? <p className={`font-bold text-sm ${i.checked ? 'text-white' : 'text-slate-300'}`}>{i.checked ? '' : '≈ '}{formatCOP(p * i.qty)}</p> : <p className="text-xs text-slate-500">—</p>}
          <button onClick={() => setSheet({ item: i, mode: 'edit' })} aria-label={`Editar ${i.name}`} className="mt-0.5 p-1 text-slate-500"><Pencil size={13} /></button>
        </div>
      </motion.li>
    );
  };

  // ═══ SECCIÓN: Dibujo de la pantalla ═══
  return (
    <div className="pb-44">
      <ModuleHeader module="mercado" right={<span data-tour="mk-household"><HouseholdChip /></span>} />

      {/* Pestañas */}
      <div className="grid grid-cols-3 gap-1 bg-white/[0.04] ring-1 ring-white/10 p-1 rounded-2xl mb-4" role="tablist">
        {([['lista', 'Lista', ClipboardList], ['historial', 'Historial', History], ['precios', 'Precios', Tag]] as const).map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative py-2.5 rounded-xl text-sm font-bold ${tab === id ? 'text-brand-ink' : 'text-slate-300'}`}>
            {tab === id && <motion.span layoutId="mk-tab" className="absolute inset-0 rounded-xl bg-brand-lime" transition={{ type: 'spring', damping: 26, stiffness: 300 }} />}
            <span className="relative flex items-center justify-center gap-1.5"><Icon size={15} />{label}</span>
          </button>
        ))}
      </div>

      {tab === 'historial' && <TripsHistory trips={trips} />}
      {tab === 'precios' && <PricesHistory />}

      {tab === 'lista' && <>
        {/* Modo: Planear / Comprando */}
        <div data-tour="mk-mode" className="grid grid-cols-2 gap-2 mb-3">
          {([['plan', 'Planear', 'En casa, sin precios', ClipboardList], ['shop', 'Comprando', 'En el súper', ShoppingCart]] as const).map(([id, label, sub, Icon]) => (
            <button key={id} onClick={() => setMode(id)} aria-pressed={mode === id}
              className={`flex items-center gap-2.5 p-3 rounded-2xl text-left border transition-colors ${mode === id ? 'bg-brand-lime/10 border-brand-lime/50' : 'bg-surface border-white/5'}`}>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${mode === id ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.06] text-slate-300'}`}><Icon size={18} /></span>
              <span><span className="block text-white text-sm font-bold">{label}</span><span className="block text-[10px] text-slate-400">{sub}</span></span>
            </button>
          ))}
        </div>

        {/* Tarjeta principal */}
        <motion.div data-tour="mk-hero" layout className="theme-dark relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br from-[#232C5A] via-[#141B3D] to-[#0B1026] ring-1 ring-lime-300/20">
          <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-lime-300/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-slate-300 text-sm">{mode === 'shop' ? 'Llevas en el carrito' : 'Este mercado costaría aprox.'}</p>
              <button onClick={() => setEditingBudget(v => !v)} className="flex items-center gap-1 text-xs text-white bg-white/[0.08] ring-1 ring-white/10 rounded-full px-3 py-1.5"><Pencil size={11} /> Presupuesto {formatCOP(budget)}</button>
            </div>
            <motion.p key={`${mode}-${shown}`} initial={{ scale: 1.06, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="text-white text-4xl font-extrabold mt-1 tracking-tight origin-left">
              {mode === 'plan' && est.total > 0 && <span className="text-brand-lime">≈ </span>}{formatCOP(shown)}
            </motion.p>
            <div className="h-2.5 rounded-full bg-white/10 mt-3 overflow-hidden">
              <motion.div className={`h-full rounded-full bg-gradient-to-r ${barColor}`} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ type: 'spring', damping: 20 }} />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className={left < 0 ? 'text-rose-300 font-semibold' : 'text-slate-300'}>{left < 0 ? `Te pasaste ${formatCOP(-left)}` : `Te quedan ${formatCOP(left)}`}</span>
              <span className="text-slate-400">{Math.round(pct)}% del presupuesto</span>
            </div>
            {mode === 'plan' && est.unknown > 0 && items.length > 0 && <p className="text-[11px] text-slate-400 mt-2">{est.unknown} {est.unknown === 1 ? 'producto aún no tiene' : 'productos aún no tienen'} precio conocido. Es un valor aproximado: los precios pueden variar.</p>}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {(mode === 'shop'
                ? [[`${pending.length}`, 'faltan'], [`${inCart.length - extras.length}`, 'de la lista'], [formatCOP(extrasTotal), `antojos${extras.length ? ` (${extras.length})` : ''}`]]
                : [[`${items.length}`, 'productos'], [`${items.length - est.unknown}`, 'con precio'], [`${trips.length}`, trips.length === 1 ? 'mercado' : 'mercados']]
              ).map(([v, l], n) => (
                <div key={n} className="bg-white/[0.06] ring-1 ring-white/10 rounded-2xl py-2 px-1"><p className={`font-bold text-sm truncate ${mode === 'shop' && n === 2 && extras.length ? 'text-amber-300' : 'text-white'}`}>{v}</p><p className="text-[10px] text-slate-400">{l}</p></div>
              ))}
            </div>
            <AnimatePresence>
              {editingBudget && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-4">
                    <MoneyInput value={budget} onChange={setBudget} prefix ariaLabel="Presupuesto del mercado" className="w-full h-12 px-4 rounded-2xl bg-white/[0.07] border border-white/10 text-white text-lg font-bold outline-none focus:border-brand-lime" />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {BUDGET_PRESETS.map(b => <button key={b} onClick={() => setBudget(b)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${budget === b ? 'bg-brand-lime text-brand-ink' : 'bg-white/[0.07] text-slate-200'}`}>{formatCOP(b)}</button>)}
                      <button onClick={() => setEditingBudget(false)} className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold bg-[#fff] text-brand-ink">Listo</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Agregar producto */}
        <motion.div data-tour="mk-composer" className="mt-4 bg-surface border border-white/10 rounded-[28px] p-4 shadow-xl shadow-black/20">
          <p className="text-white font-bold mb-2">{mode === 'shop' ? '¿Qué echaste al carrito?' : '¿Qué hace falta en la casa?'}</p>
          <div className="relative">
            {mode === 'shop' ? <ShoppingCart size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-lime" aria-hidden="true" /> : <ShoppingBasket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-lime" aria-hidden="true" />}
            <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder={mode === 'shop' ? 'Ej: Arroz Diana 500 g' : 'Ej: Arroz, leche, huevos…'} aria-label="Nombre del producto" autoComplete="off" enterKeyHint={mode === 'shop' ? 'next' : 'done'}
              className="w-full h-14 pl-11 pr-10 rounded-2xl bg-white/5 border border-white/10 text-white text-base outline-none focus:border-brand-lime transition-colors" />
            {name && <button onClick={reset} aria-label="Borrar" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"><X size={16} /></button>}
          </div>
          <AnimatePresence>
            {focused && suggestions.length > 0 && (
              <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 divide-y divide-white/5 overflow-hidden">
                {suggestions.map(s => (
                  <li key={s.name}>
                    <button onMouseDown={e => e.preventDefault()} onClick={() => pick(s)} className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left">
                      <span className="flex-1 text-sm text-white truncate">{s.name}</span>
                      {s.inList && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-lime/15 text-brand-lime flex items-center gap-0.5"><ListChecks size={9} />EN TU LISTA</span>}
                      {s.price ? <span className="text-xs text-slate-400">{formatCOP(s.price)}</span> : null}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          <div className="mt-3"><UnitPicker unit={unit} onChange={setUnit} /></div>
          <div className="flex items-stretch gap-2 mt-3">
            <QtyStepper qty={qty} unit={unit} onChange={setQty} />
            {mode === 'shop'
              ? <MoneyInput value={price} onChange={setPrice} prefix placeholder={`Precio por ${unitLabel(unit)}`} ariaLabel="Precio por unidad" className="flex-1 min-w-0 h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-lime" />
              : <div className="flex-1 min-w-0 h-12 px-3 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 flex items-center text-[11px] text-slate-400">{lastPrice(name) ? <>≈ {formatCOP((lastPrice(name) || 0) * qty)} <span className="ml-1 opacity-70">según tu último mercado</span></> : 'El precio lo pones al comprar'}</div>}
            <motion.button whileTap={{ scale: 0.85 }} onClick={submit} aria-label={mode === 'shop' ? 'Echar al carrito' : 'Agregar a la lista'}
              className="w-12 h-12 shrink-0 rounded-2xl bg-brand-lime flex items-center justify-center shadow-lg shadow-lime-400/30">
              {mode === 'shop' ? <Check size={22} className="text-brand-ink" strokeWidth={3} /> : <Plus size={24} className="text-brand-ink" strokeWidth={3} />}
            </motion.button>
          </div>
          {mode === 'shop' && price > 0 && qty !== 1 && <p className="text-[11px] text-slate-400 mt-2">{fmtQty(qty)} × {formatCOP(price)} = <strong className="text-white">{formatCOP(qty * price)}</strong></p>}
          {mode === 'plan' && !name && (frequent.length > 0 || trips.length > 0) && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] text-slate-400 flex items-center gap-1"><Sparkles size={11} className="text-brand-lime" /> Lo que más compras</p>
                {trips.length > 0 && <button onClick={repeat} className="text-[11px] font-bold text-brand-lime flex items-center gap-1"><Repeat size={12} /> Lo de siempre</button>}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {frequent.map(k => (
                  <motion.button whileTap={{ scale: 0.9 }} key={k.name} onClick={() => { const it = addItem({ name: k.name, unit: k.unit }); setFresh(it.id); }} className="shrink-0 px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-left">
                    <span className="block text-white text-xs font-semibold">{k.name}</span>
                    <span className="block text-[10px] text-slate-400">≈ {formatCOP(k.price)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Lista */}
        <div data-tour="mk-list" className="mt-5">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="theme-dark w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#232C5A] to-[#0B1026] ring-1 ring-lime-300/30 flex items-center justify-center shadow-xl">
                <ShoppingBasket size={36} className="text-brand-lime" />
              </motion.div>
              <p className="text-white font-semibold mt-4">Tu lista está vacía</p>
              <p className="text-slate-400 text-sm">Agrega lo que hace falta en la casa.</p>
              {!household && <button onClick={openHousehold} className="mt-4 text-xs font-bold text-brand-lime flex items-center gap-1 mx-auto"><Users size={14} /> Compartir la lista con mi hogar</button>}
            </div>
          ) : (
            <>
              {pending.length > 0 && <p className="text-xs font-bold text-slate-400 mb-2 tracking-wide">POR COMPRAR · {pending.length}</p>}
              <ul className="space-y-2"><AnimatePresence initial={false}>{pending.map(row)}</AnimatePresence></ul>
              {inCart.length > 0 && <p className="text-xs font-bold text-brand-lime mt-5 mb-2 tracking-wide flex items-center gap-1"><Check size={13} /> EN EL CARRITO · {inCart.length}</p>}
              <ul className="space-y-2"><AnimatePresence initial={false}>{inCart.map(row)}</AnimatePresence></ul>
              <p className="text-center text-[10px] text-slate-500 mt-3">Desliza un producto a la izquierda para quitarlo</p>
            </>
          )}
        </div>

        {/* Barra fija para terminar */}
        <AnimatePresence>
          {inCart.length > 0 && (
            <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', damping: 24 }}
              className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 bg-surface2/95 backdrop-blur-xl border border-brand-lime/30 rounded-3xl p-3 flex items-center gap-3 shadow-2xl shadow-black/50">
              <div className="flex-1 pl-2 min-w-0">
                <p className="text-[11px] text-slate-400 truncate">En el carrito · {inCart.length} {pending.length ? `· faltan ${pending.length}` : '· ¡lista completa!'}</p>
                <motion.p key={cartTotal} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-white font-extrabold text-xl">{formatCOP(cartTotal)}</motion.p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFinishing(true)} className="px-5 h-12 rounded-2xl bg-brand-lime text-brand-ink font-bold flex items-center gap-2">
                <Check size={18} strokeWidth={3} /> Terminar
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </>}

      <ItemSheet item={sheet?.item ?? null} mode={sheet?.mode ?? 'edit'} onClose={() => setSheet(null)} />
      <FinishSheet open={finishing} items={items} onClose={() => setFinishing(false)} onDone={t => { setFinishing(false); setCelebrate(t); setMode('plan'); setTimeout(() => setCelebrate(null), 3200); }} />

      {/* Celebración al terminar */}
      <AnimatePresence>
        {celebrate && (
          <motion.div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCelebrate(null)}>
            <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }} className="theme-dark bg-gradient-to-b from-[#1D2550] to-[#0B1026] border border-brand-lime/40 rounded-[32px] p-8 text-center mx-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.15 }} className="w-20 h-20 mx-auto rounded-full bg-brand-lime flex items-center justify-center">
                <Check size={42} className="text-brand-ink" strokeWidth={3} />
              </motion.div>
              <p className="text-white text-xl font-bold mt-4">¡Mercado listo!</p>
              <p className="text-brand-lime text-3xl font-extrabold mt-1">{formatCOP(celebrate.total)}</p>
              <p className="text-slate-300 text-sm mt-2">{celebrate.items.length} productos guardados en tu historial{household ? ' y en el de tu hogar' : ''}.</p>
              {celebrate.missing.length > 0 && <p className="text-slate-400 text-xs mt-1">{celebrate.missing.length} quedaron en la lista para la próxima.</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
